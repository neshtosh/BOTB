import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError } from './_lib/http.js';
import { isTarget, targetConfig } from './_lib/publishers/index.js';
import type { PublishOptions } from './_lib/publishers/types.js';
import { admin, HttpError, requireUser } from './_lib/supabaseAdmin.js';
import { getValidTokens } from './_lib/tokens.js';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

// POST /api/publish { contentId, target, options } -> pushes one content item to one platform.
// The dashboard calls this once per selected platform, in parallel, so each
// upload gets its own function run (and its own time limit).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
    const user = await requireUser(req);
    const { contentId, target, options = {} } = (req.body ?? {}) as {
      contentId?: string;
      target?: string;
      options?: PublishOptions;
    };
    if (!contentId) throw new HttpError(400, 'contentId is required.');
    if (!isTarget(target)) throw new HttpError(400, 'Unknown target platform.');

    const db = admin();
    const { data: content } = await db
      .from('content_items')
      .select('*, profiles(creator_type)')
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

    const { data: job, error: jobError } = await db
      .from('publish_jobs')
      .insert({ user_id: user.id, content_id: contentId, target, status: 'processing', options })
      .select()
      .single();
    if (jobError || !job) throw new Error(jobError?.message ?? 'Could not create the publish job.');

    try {
      const tokens = await getValidTokens(connection.id, config.provider);
      const { data: signed, error: signError } = await db.storage
        .from('media')
        .createSignedUrl(content.storage_path, SIGNED_URL_TTL_SECONDS);
      if (signError || !signed) throw new Error('Could not read the uploaded file.');

      const result = await config.publish(
        {
          title: content.title,
          description: content.description,
          tags: content.tags,
          mimeType: content.mime_type,
          fileSize: content.file_size,
          fileName: content.storage_path.split('/').pop() ?? 'upload',
          creatorType: content.profiles?.creator_type ?? 'other',
          url: signed.signedUrl,
          load: async () => {
            const file = await fetch(signed.signedUrl);
            if (!file.ok) throw new Error('Could not download the uploaded file.');
            return Buffer.from(await file.arrayBuffer());
          },
        },
        tokens,
        options
      );

      const { data: done } = await db
        .from('publish_jobs')
        .update({
          status: 'published',
          external_id: result.externalId,
          external_url: result.externalUrl,
          external_meta: result.meta ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .select()
        .single();
      res.status(200).json({ job: done });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publishing failed.';
      await db
        .from('publish_jobs')
        .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
        .eq('id', job.id);
      throw new HttpError(502, message);
    }
  } catch (err) {
    sendError(res, err);
  }
}
