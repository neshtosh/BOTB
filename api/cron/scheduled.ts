import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from '../_lib/http.js';
import { requireEnv } from '../_lib/env.js';
import { runJob, type JobRow } from '../_lib/runJob.js';
import { admin, HttpError } from '../_lib/supabaseAdmin.js';

// How many due posts one run takes on; the rest wait for the next run.
const BATCH = 10;

// GET /api/cron/scheduled — publishes scheduled posts whose release time has passed.
// Meant to run every few minutes, but no cron calls it yet: Vercel's Hobby plan only
// allows daily crons. Add one to vercel.json (or call it from an external scheduler)
// when the app moves off demo data.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Vercel sends "Authorization: Bearer <CRON_SECRET>" to cron routes.
    if (req.headers.authorization !== `Bearer ${requireEnv('CRON_SECRET')}`) throw new HttpError(401, 'Unauthorized.');
    const db = admin();
    const { data: due, error } = await db
      .from('publish_jobs')
      .select('id, user_id, content_id, target, options')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for')
      .limit(BATCH);
    if (error) throw new Error(error.message);

    // Claim each job first so overlapping runs don't post it twice.
    const claimed: JobRow[] = [];
    for (const job of due ?? []) {
      const { data } = await db
        .from('publish_jobs')
        .update({ status: 'processing', created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', job.id)
        .eq('status', 'scheduled')
        .select('id')
        .maybeSingle();
      if (data) claimed.push(job as JobRow);
    }

    const results = await Promise.all(claimed.map((job) => runJob(job)));
    res.status(200).json({
      published: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    });
  } catch (err) {
    sendError(res, err);
  }
}
