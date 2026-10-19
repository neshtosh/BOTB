// Demo-mode database: the same tables as supabase/migrations, persisted to
// localStorage. Only used when Supabase isn't configured.

export type Row = Record<string, unknown> & { id?: string };

export interface DemoUser {
  id: string;
  email: string;
  password: string; // demo only — plain text, never leaves this browser
  user_metadata: Record<string, unknown>;
}

export interface DemoState {
  version: number;
  users: DemoUser[];
  sessionUserId: string | null;
  tables: Record<string, Row[]>;
}

export const TABLES = [
  'profiles',
  'content_items',
  'platform_connections',
  'publish_jobs',
  'post_metrics',
  'newsletter_subscribers',
] as const;
export type TableName = (typeof TABLES)[number];

const KEY = 'unsigned-demo-db';
const VERSION = 1;

let state: DemoState | null = null;

export function emptyState(): DemoState {
  return {
    version: VERSION,
    users: [],
    sessionUserId: null,
    tables: Object.fromEntries(TABLES.map((t) => [t, []])),
  };
}

export function getState(): DemoState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    state = parsed && parsed.version === VERSION ? parsed : null;
  } catch {
    state = null;
  }
  return state ?? (state = emptyState());
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(getState()));
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
}

export function replaceState(next: DemoState) {
  state = next;
  save();
}

export const table = (name: string): Row[] => {
  const s = getState();
  return (s.tables[name] ??= []);
};

export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

// Row visibility, mirroring the RLS policies in the real schema.
export function canRead(name: string, row: Row, userId: string | null): boolean {
  switch (name) {
    case 'profiles':
      return true;
    case 'content_items':
      return row.user_id === userId || row.is_public === true;
    case 'newsletter_subscribers':
      return row.creator_id === userId && userId !== null;
    default:
      return row.user_id === userId && userId !== null;
  }
}

export function canWrite(name: string, row: Row, userId: string | null): boolean {
  if (name === 'newsletter_subscribers') return true; // anyone can subscribe
  if (name === 'profiles') return row.id === userId;
  return row.user_id === userId && userId !== null;
}

// Cascades from the schema's ON DELETE CASCADE foreign keys.
export function cascadeDelete(name: string, ids: string[]) {
  const s = getState();
  if (!ids.length) return;
  const drop = (t: string, pred: (r: Row) => boolean) => {
    const removed = (s.tables[t] ?? []).filter(pred);
    s.tables[t] = (s.tables[t] ?? []).filter((r) => !pred(r));
    return removed;
  };
  if (name === 'content_items') {
    const children = drop('content_items', (r) => ids.includes(r.parent_id as string));
    const allIds = [...ids, ...children.map((c) => c.id as string)];
    const jobs = drop('publish_jobs', (r) => allIds.includes(r.content_id as string));
    drop('post_metrics', (r) => jobs.some((j) => j.id === r.job_id));
  }
  if (name === 'publish_jobs') drop('post_metrics', (r) => ids.includes(r.job_id as string));
}
