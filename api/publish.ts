import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from './_lib/http.js';
import { isTarget, targetConfig } from './_lib/publishers/index.js';
import type { PublishOptions } from './_lib/publishers/types.js';
import { runJob } from './_lib/runJob.js';
import { admin, HttpError, requireUser } from './_lib/supabaseAdmin.js';

// POST /api/publish { contentId, target, options } -> pushes one content item to one platform.
// The dashboard calls this once per selected platform, in parallel, so each
// upload gets its own function run (and its own time limit).
// With options.scheduledFor in the future, the job is only stored; api/cron/scheduled
// publishes it on release day.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    const user = await requireUser(req);
    const { contentId, target, options = {} } = (req.body ?? {}) as {
      contentId?: string;
      target?: string;
      options?: PublishOptions & { scheduledFor?: string | null };
    };
    if (!contentId) throw new HttpError(400, 'contentId is required.');
    if (!isTarget(target)) throw new HttpError(400, 'Unknown target platform.');

    const db = admin();
    const { data: content } = await db
      .from('content_items')
      .select('id, media_type')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!content) throw new HttpError(404, 'Content not found.');

    const config = targetConfig[target];
    if (!config.accepts.includes(content.media_type)) {
      throw new HttpError(400, `${target} doesn't accept ${content.media_type} files.`);
    }

    const { data: connection } = await db
      .from('platform_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', config.provider)
      .maybeSingle();
    if (!connection) throw new HttpError(400, `Connect your ${target} account first.`);

    const { scheduledFor, ...publishOptions } = options;
    const at = scheduledFor ? new Date(scheduledFor) : null;
    if (at && Number.isNaN(at.getTime())) throw new HttpError(400, 'scheduledFor must be an ISO date.');
    const scheduled = at !== null && at.getTime() > Date.now();

    const { data: job, error: jobError } = await db
      .from('publish_jobs')
      .insert({
        user_id: user.id,
        content_id: contentId,
        target,
        status: scheduled ? 'scheduled' : 'processing',
        scheduled_for: scheduled ? at!.toISOString() : null,
        options: publishOptions,
      })
      .select()
      .single();
    if (jobError || !job) throw new Error(jobError?.message ?? 'Could not create the publish job.');
    if (scheduled) {
      res.status(200).json({ job });
      return;
    }

    const result = await runJob(job);
    if (!result.ok) throw new HttpError(502, result.error);
    res.status(200).json({ job: result.job });
  } catch (err) {
    sendError(res, err);
  }
}
