import { targetConfig } from './publishers/index.js';
import type { PublishOptions, Target } from './publishers/types.js';
import { admin } from './supabaseAdmin.js';
import { getValidTokens } from './tokens.js';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface JobRow {
  id: string;
  user_id: string;
  content_id: string;
  target: Target;
  options: PublishOptions | null;
}

// Uploads one job's file to its platform and records the result on the job.
// Used straight away by POST /api/publish, and on release day by the cron route.
export async function runJob(job: JobRow) {
  const db = admin();
  const config = targetConfig[job.target];
  try {
    const { data: content } = await db
      .from('content_items')
      .select('*, profiles(creator_type)')
      .eq('id', job.content_id)
      .eq('user_id', job.user_id)
      .maybeSingle();
    if (!content) throw new Error('The file for this post was deleted.');

    const { data: connection } = await db
      .from('platform_connections')
      .select('id')
      .eq('user_id', job.user_id)
      .eq('provider', config.provider)
      .maybeSingle();
    if (!connection) throw new Error(`Your ${job.target} account isn't connected any more.`);

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
      job.options ?? {}
    );

    const { data: done } = await db
      .from('publish_jobs')
      .update({
        status: 'published',
        external_id: result.externalId,
        external_url: result.externalUrl,
        external_meta: result.meta ?? {},
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .select()
      .single();
    return { ok: true as const, job: done };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publishing failed.';
    await db
      .from('publish_jobs')
      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
      .eq('id', job.id);
    return { ok: false as const, error: message };
  }
}
