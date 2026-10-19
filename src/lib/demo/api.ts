// Demo-mode stand-ins for the Vercel API routes (api/*.ts). They follow the
// same rules as the real server, but simulate the platforms instead of
// calling them.

import { getState, now, Row, save, table, uid } from './db';

type Target = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'soundcloud';
const TARGETS: Record<Target, { provider: string; accepts: string[]; seconds: [number, number] }> = {
  youtube: { provider: 'youtube', accepts: ['video'], seconds: [2, 4] },
  tiktok: { provider: 'tiktok', accepts: ['video'], seconds: [2.5, 4.5] },
  facebook: { provider: 'meta', accepts: ['video'], seconds: [1.5, 3] },
  instagram: { provider: 'meta', accepts: ['video'], seconds: [3, 5] },
  soundcloud: { provider: 'soundcloud', accepts: ['audio'], seconds: [1.5, 3] },
};

class ApiError extends Error {}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function requireUser() {
  const id = getState().sessionUserId;
  if (!id) throw new ApiError('Not signed in.');
  return id;
}

// Deterministic 0..1 from a string, so a post's numbers are stable between refreshes.
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

async function connect(provider: string) {
  requireUser();
  return { url: `/demo/connect/${provider}` };
}

async function publish(body: { contentId?: string; target?: string; options?: Record<string, unknown> }) {
  const userId = requireUser();
  const target = body.target as Target;
  if (!body.contentId) throw new ApiError('contentId is required.');
  if (!TARGETS[target]) throw new ApiError('Unknown target platform.');
  const content = table('content_items').find((c) => c.id === body.contentId && c.user_id === userId);
  if (!content) throw new ApiError('Content not found.');
  const config = TARGETS[target];
  if (!config.accepts.includes(content.media_type as string)) {
    throw new ApiError(`${target} doesn't accept ${content.media_type} files.`);
  }
  const connection = table('platform_connections').find((c) => c.user_id === userId && c.provider === config.provider);
  if (!connection) throw new ApiError(`Connect your ${target} account first.`);

  const job: Row = {
    id: uid(),
    user_id: userId,
    content_id: content.id,
    target,
    status: 'processing',
    options: body.options ?? {},
    external_id: null,
    external_url: null,
    external_meta: { demo: true },
    error: null,
    created_at: now(),
    updated_at: now(),
  };
  table('publish_jobs').push(job);
  save();

  // Simulated upload + platform processing time.
  const [min, max] = config.seconds;
  await wait((min + Math.random() * (max - min)) * 1000);

  const meta = (connection.metadata ?? {}) as Record<string, unknown>;
  if (target === 'instagram' && meta.hasInstagram === false) {
    Object.assign(job, { status: 'failed', error: 'No Instagram Business/Creator account is linked to your Facebook Page.', updated_at: now() });
    save();
    throw new ApiError(job.error as string);
  }

  const externalId = `demo_${(job.id as string).slice(0, 8)}`;
  Object.assign(job, {
    status: 'published',
    external_id: externalId,
    external_url: `/demo/post/${job.id}`,
    updated_at: now(),
  });
  save();
  return { job };
}

// Views grow quickly at first and level off, scaled per platform and per post.
const REACH: Record<Target, number> = { tiktok: 26000, instagram: 15000, youtube: 9000, facebook: 3500, soundcloud: 4200 };

export function metricsFor(job: Row, at = Date.now()) {
  const target = job.target as Target;
  const hours = Math.max(0.05, (at - new Date(job.created_at as string).getTime()) / 3_600_000);
  const luck = 0.35 + hash01(job.id as string) * 1.3;
  const views = Math.round(REACH[target] * luck * (1 - Math.exp(-hours / 30)) + hours * 3);
  const r = hash01(`${job.id}x`);
  return {
    views,
    likes: Math.round(views * (0.05 + r * 0.06)),
    comments: Math.round(views * (0.003 + r * 0.006)),
    shares: target === 'youtube' || target === 'facebook' ? null : Math.round(views * (0.006 + r * 0.012)),
    extra: target === 'instagram' ? { reach: Math.round(views * 0.8), saved: Math.round(views * 0.02) } : {},
  };
}

async function analytics() {
  const userId = requireUser();
  await wait(900);
  const jobs = table('publish_jobs').filter((j) => j.user_id === userId && j.status === 'published');
  const metrics = table('post_metrics');
  for (const job of jobs) {
    const m = { job_id: job.id, user_id: userId, ...metricsFor(job), fetched_at: now() };
    const existing = metrics.find((r) => r.job_id === job.id);
    if (existing) Object.assign(existing, m);
    else metrics.push(m);
  }
  save();
  return { updated: jobs.length, errors: {} };
}

export async function demoApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const body = init.body ? JSON.parse(String(init.body)) : {};
  try {
    const connectMatch = path.match(/^\/api\/connect\/(\w+)/);
    if (connectMatch) return (await connect(connectMatch[1])) as T;
    if (path === '/api/publish') return (await publish(body)) as T;
    if (path === '/api/analytics') return (await analytics()) as T;
    throw new ApiError(`Demo API has no route for ${path}`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Request failed');
  }
}
