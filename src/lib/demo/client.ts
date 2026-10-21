// A small stand-in for the parts of supabase-js this app uses, backed by the
// demo database (db.ts) and browser file store (blobStore.ts).

import { canRead, canWrite, cascadeDelete, getState, now, Row, save, table, uid } from './db';
import { deleteFile, fileUrl, forgetUrl, getFile, putFile } from './blobStore';
import { ensureSeedFile, isQuickSeedFile } from './seed';

type DemoError = { message: string; code?: string } | null;
interface Result<T = unknown> {
  data: T;
  error: DemoError;
  count?: number | null;
}

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

type Listener = (event: string, session: DemoSession | null) => void;
const listeners = new Set<Listener>();

export interface DemoSession {
  access_token: string;
  user: { id: string; email: string; user_metadata: Record<string, unknown> };
}

function currentSession(): DemoSession | null {
  const s = getState();
  const user = s.users.find((u) => u.id === s.sessionUserId);
  if (!user) return null;
  return {
    access_token: `demo-${user.id}`,
    user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
  };
}

export const currentUserId = () => getState().sessionUserId;

function emit(event: string) {
  const session = currentSession();
  listeners.forEach((l) => l(event, session));
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const auth = {
  async getSession() {
    return { data: { session: currentSession() }, error: null };
  },
  async getUser() {
    return { data: { user: currentSession()?.user ?? null }, error: null };
  },
  onAuthStateChange(cb: Listener) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    await delay();
    const s = getState();
    const user = s.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } };
    }
    s.sessionUserId = user.id;
    save();
    emit('SIGNED_IN');
    return { data: { session: currentSession(), user: currentSession()?.user ?? null }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    await delay();
    const s = getState();
    const clean = email.trim().toLowerCase();
    if (s.users.some((u) => u.email === clean)) {
      return { data: { session: null, user: null }, error: { message: 'User already registered' } };
    }
    const meta = options?.data ?? {};
    const handle = String(meta.handle ?? '').toLowerCase();
    if (table('profiles').some((p) => p.handle === handle)) {
      return { data: { session: null, user: null }, error: { message: 'That handle is already taken.' } };
    }
    const user = { id: uid(), email: clean, password, user_metadata: meta };
    s.users.push(user);
    // Same as the handle_new_user() trigger in the real schema.
    table('profiles').push({
      id: user.id,
      handle,
      display_name: String(meta.display_name || handle),
      creator_type: String(meta.creator_type ?? 'musician'),
      bio: '',
      avatar_url: null,
      links: [],
      created_at: now(),
    });
    // Demo accounts are confirmed straight away.
    s.sessionUserId = user.id;
    save();
    emit('SIGNED_IN');
    return { data: { session: currentSession(), user: currentSession()?.user ?? null }, error: null };
  },
  async signOut() {
    getState().sessionUserId = null;
    save();
    emit('SIGNED_OUT');
    return { error: null };
  },
};

// --------------------------------------------------------------------------
// Tables
// --------------------------------------------------------------------------

const DEFAULTS: Record<string, () => Row> = {
  content_items: () => ({
    description: '',
    tags: [],
    is_public: true,
    parent_id: null,
    clip_start: null,
    clip_duration: null,
    release_id: null,
    track_number: null,
    version: '',
    featured_artists: [],
    songwriters: [],
    is_cover: false,
    explicit: false,
    instrumental: false,
    ai_generated: false,
    hook_start: null,
    created_at: now(),
  }),
  releases: () => ({
    secondary_genre: null,
    language: 'English',
    description: '',
    tags: [],
    previously_released: false,
    original_release_date: null,
    release_at: null,
    cover_path: null,
    is_public: true,
    splits: [],
    smart_link_visits: 0,
    created_at: now(),
    updated_at: now(),
  }),
  release_presaves: () => ({ created_at: now() }),
  platform_connections: () => ({ metadata: {}, created_at: now() }),
  publish_jobs: () => ({
    status: 'queued',
    options: {},
    external_id: null,
    external_url: null,
    external_meta: {},
    error: null,
    scheduled_for: null,
    created_at: now(),
    updated_at: now(),
  }),
  post_metrics: () => ({ extra: {}, fetched_at: now() }),
  newsletter_subscribers: () => ({ created_at: now() }),
};

// Embedded relations used by the app's selects.
const RELATIONS: Record<string, Record<string, { table: string; many: boolean; match: (parent: Row, child: Row) => boolean }>> = {
  content_items: {
    publish_jobs: { table: 'publish_jobs', many: true, match: (p, c) => c.content_id === p.id },
  },
  publish_jobs: {
    content_items: { table: 'content_items', many: false, match: (p, c) => c.id === p.content_id },
    post_metrics: { table: 'post_metrics', many: false, match: (p, c) => c.job_id === p.id },
  },
};

function splitTopLevel(cols: string) {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of cols) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function project(name: string, row: Row, cols: string, userId: string | null): Row {
  const out: Row = {};
  for (const part of splitTopLevel(cols)) {
    const rel = part.match(/^(\w+)\((.*)\)$/);
    if (rel) {
      const def = RELATIONS[name]?.[rel[1]];
      if (!def) continue;
      const related = table(def.table).filter((c) => def.match(row, c) && canRead(def.table, c, userId));
      const shaped = related.map((c) => project(def.table, c, rel[2] || '*', userId));
      out[rel[1]] = def.many ? shaped : shaped[0] ?? null;
    } else if (part === '*') {
      Object.assign(out, row);
    } else {
      out[part] = row[part];
    }
  }
  return out;
}

type Op = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

class Query implements PromiseLike<Result> {
  private op: Op = 'select';
  private cols = '*';
  private returning = false;
  private filters: [string, unknown][] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private payload: Row | Row[] | null = null;
  private onConflict: string[] = ['id'];
  private head = false;
  private wantCount = false;

  constructor(private name: string) {}

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    if (this.op === 'select') {
      this.cols = cols;
      this.head = Boolean(opts?.head);
      this.wantCount = Boolean(opts?.count);
    } else {
      this.returning = true;
      this.cols = cols;
    }
    return this;
  }
  insert(row: Row | Row[]) {
    this.op = 'insert';
    this.payload = row;
    return this;
  }
  upsert(row: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = row;
    if (opts?.onConflict) this.onConflict = opts.onConflict.split(',').map((c) => c.trim());
    return this;
  }
  update(patch: Row) {
    this.op = 'update';
    this.payload = patch;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(col: string, value: unknown) {
    this.filters.push([col, value]);
    return this;
  }
  is(col: string, value: unknown) {
    return this.eq(col, value);
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, asc: opts?.ascending ?? true };
    return this;
  }
  limit() {
    return this;
  }
  single() {
    this.mode = 'single';
    return this;
  }
  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }

  then<A = Result, B = never>(onfulfilled?: ((v: Result) => A | PromiseLike<A>) | null, onrejected?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.exec().then(onfulfilled, onrejected);
  }

  private matches(row: Row) {
    return this.filters.every(([c, v]) => (row[c] ?? null) === (v ?? null));
  }

  private finish(rows: Row[], userId: string | null): Result {
    let shaped = rows.map((r) => project(this.name, r, this.cols, userId));
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      shaped = [...shaped].sort((a, b) => {
        const av = String(a[col] ?? '');
        const bv = String(b[col] ?? '');
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (this.mode === 'single') {
      return shaped.length === 1
        ? { data: shaped[0], error: null }
        : { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
    }
    if (this.mode === 'maybe') return { data: shaped[0] ?? null, error: null };
    return { data: shaped, error: null };
  }

  private async exec(): Promise<Result> {
    await delay(60);
    const userId = getState().sessionUserId;
    const rows = table(this.name);

    if (this.op === 'select') {
      const visible = rows.filter((r) => canRead(this.name, r, userId) && this.matches(r));
      if (this.head) return { data: null, error: null, count: visible.length };
      const result = this.finish(visible, userId);
      return this.wantCount ? { ...result, count: visible.length } : result;
    }

    if (this.op === 'insert' || this.op === 'upsert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const written: Row[] = [];
      for (const input of list) {
        const row: Row = { ...(DEFAULTS[this.name]?.() ?? { created_at: now() }), ...input };
        if (this.name !== 'post_metrics') row.id ??= uid();
        if (!canWrite(this.name, row, userId)) return { data: null, error: { message: 'Permission denied (demo RLS)', code: '42501' } };
        const duplicate =
          (this.name === 'newsletter_subscribers' && rows.some((r) => r.email === row.email && (r.creator_id ?? null) === (row.creator_id ?? null))) ||
          (this.name === 'release_presaves' && rows.some((r) => r.email === row.email && r.release_id === row.release_id)) ||
          (this.name === 'releases' && rows.some((r) => r.slug === row.slug));
        if (duplicate) {
          return { data: null, error: { message: 'duplicate key value', code: '23505' } };
        }
        const keys = this.op === 'upsert' ? (this.name === 'post_metrics' ? ['job_id'] : this.name === 'platform_tokens' ? ['connection_id'] : this.onConflict) : null;
        const existing = keys ? rows.find((r) => keys.every((k) => r[k] === row[k])) : undefined;
        if (existing) {
          Object.assign(existing, input, { updated_at: now() });
          written.push(existing);
        } else {
          rows.push(row);
          written.push(row);
        }
      }
      save();
      if (!this.returning) return { data: null, error: null };
      return this.finish(written, userId);
    }

    const targets = rows.filter((r) => this.matches(r) && canWrite(this.name, r, userId));
    if (this.op === 'update') {
      targets.forEach((r) => Object.assign(r, this.payload));
      save();
      return this.returning ? this.finish(targets, userId) : { data: null, error: null };
    }

    // delete
    const ids = targets.map((r) => r.id as string);
    const s = getState();
    s.tables[this.name] = rows.filter((r) => !targets.includes(r));
    cascadeDelete(this.name, ids);
    save();
    return this.returning ? this.finish(targets, userId) : { data: null, error: null };
  }
}

// --------------------------------------------------------------------------
// Storage
// --------------------------------------------------------------------------

// Seed media is made lazily (seed.ts). A missing seed audio file or cover is made
// now; a seed video takes seconds to record, so that's started without waiting.
async function prepare(path: string) {
  if (isQuickSeedFile(path)) await ensureSeedFile(path);
  else void ensureSeedFile(path);
}

const storage = {
  from() {
    return {
      async upload(path: string, file: Blob) {
        try {
          await putFile(path, file);
          return { data: { path }, error: null };
        } catch (err) {
          return { data: null, error: { message: err instanceof Error ? err.message : 'Upload failed' } };
        }
      },
      async remove(paths: string[]) {
        await Promise.all(paths.map((p) => (forgetUrl(p), deleteFile(p))));
        return { data: null, error: null };
      },
      async download(path: string) {
        await prepare(path);
        const blob = await getFile(path);
        return blob ? { data: blob, error: null } : { data: null, error: { message: 'Object not found' } };
      },
      async createSignedUrl(path: string) {
        await prepare(path);
        const url = await fileUrl(path);
        return url ? { data: { signedUrl: url }, error: null } : { data: null, error: { message: 'Object not found' } };
      },
      async createSignedUrls(paths: string[]) {
        const data = await Promise.all(
          paths.map(async (path) => {
            await prepare(path);
            return { path, signedUrl: (await fileUrl(path)) ?? '' };
          })
        );
        return { data, error: null };
      },
    };
  },
};

// --------------------------------------------------------------------------
// Database functions (supabase/migrations/0003_releases.sql)
// --------------------------------------------------------------------------

// Same shape as public.smart_link(): what a smart-link visitor may see.
function smartLink(slug: string) {
  const release = table('releases').find((r) => r.slug === slug && r.is_public === true);
  if (!release) return null;
  const owner = table('profiles').find((p) => p.id === release.user_id);
  const items = table('content_items');
  const tracks = items
    .filter((c) => c.release_id === release.id)
    .sort((a, b) => Number(a.track_number) - Number(b.track_number));
  const releaseOf = (c: Row) => (c.parent_id ? items.find((p) => p.id === c.parent_id)?.release_id : c.release_id);
  const links = table('publish_jobs')
    .filter((j) => j.status === 'published' && j.external_url)
    .filter((j) => ((j.options as Row)?.privacy ?? 'public') === 'public')
    .flatMap((j) => {
      const c = items.find((i) => i.id === j.content_id);
      if (!c || releaseOf(c) !== release.id) return [];
      return [{ target: j.target, url: j.external_url, track_id: c.parent_id ?? c.id, from_clip: Boolean(c.parent_id), published_at: j.updated_at }];
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { splits, user_id, ...publicFields } = release;
  return {
    release: publicFields,
    owner: owner ? { handle: owner.handle, display_name: owner.display_name } : null,
    tracks: tracks.map((c) => ({ id: c.id, title: c.title, track_number: c.track_number, version: c.version, explicit: c.explicit })),
    links,
  };
}

async function rpc(name: string, args: Record<string, unknown>): Promise<Result> {
  await delay(80);
  if (name === 'smart_link') return { data: smartLink(String(args.release_slug)), error: null };
  if (name === 'track_release_visit') {
    const release = table('releases').find((r) => r.slug === args.release_slug && r.is_public === true);
    if (release) {
      release.smart_link_visits = Number(release.smart_link_visits ?? 0) + 1;
      save();
    }
    return { data: null, error: null };
  }
  return { data: null, error: { message: `Unknown function ${name}` } };
}

export const demoClient = {
  rpc,
  auth,
  from: (name: string) => new Query(name),
  storage,
};
