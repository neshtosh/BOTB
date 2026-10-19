import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from './_lib/http.js';
import { metricsFetchers, type JobRef } from './_lib/metrics.js';
import { targetConfig } from './_lib/publishers/index.js';
import type { Target } from './_lib/publishers/types.js';
import { admin, HttpError, requireUser } from './_lib/supabaseAdmin.js';
import { getValidTokens } from './_lib/tokens.js';

// POST /api/analytics -> pulls fresh stats for the creator's recent published posts
// from every platform and stores them in post_metrics. The dashboard reads that table.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    const user = await requireUser(req);
    const db = admin();

    const { data: jobs } = await db
      .from('publish_jobs')
      .select('id, target, external_id, external_url, external_meta')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(200);
    const { data: connections } = await db
      .from('platform_connections')
      .select('id, provider')
      .eq('user_id', user.id);

    const byTarget = new Map<Target, JobRef[]>();
    for (const job of (jobs ?? []) as JobRef[]) {
      byTarget.set(job.target, [...(byTarget.get(job.target) ?? []), job]);
    }

    const errors: Record<string, string> = {};
    let updated = 0;

    // Platforms are independent; one failing (e.g. missing permission) shouldn't block the rest.
    await Promise.all(
      [...byTarget.entries()].map(async ([target, targetJobs]) => {
        const provider = targetConfig[target].provider;
        const connection = connections?.find((c) => c.provider === provider);
        if (!connection) {
          errors[target] = 'Account not connected.';
          return;
        }
        try {
          const tokens = await getValidTokens(connection.id, provider);
          const result = await metricsFetchers[target](targetJobs, tokens);

          const rows = [...result.metrics.entries()].map(([jobId, m]) => ({
            job_id: jobId,
            user_id: user.id,
            views: m.views,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            extra: m.extra ?? {},
            fetched_at: new Date().toISOString(),
          }));
          if (rows.length) {
            const { error } = await db.from('post_metrics').upsert(rows);
            if (error) throw new Error(error.message);
            updated += rows.length;
          }
          for (const [jobId, patch] of result.jobUpdates) {
            await db.from('publish_jobs').update(patch).eq('id', jobId);
          }
        } catch (err) {
          errors[target] = err instanceof Error ? err.message : 'Failed to fetch stats.';
        }
      })
    );

    res.status(200).json({ updated, errors });
  } catch (err) {
    sendError(res, err);
  }
}
