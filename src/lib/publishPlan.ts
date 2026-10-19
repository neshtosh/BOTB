import { apiFetch, MEDIA_BUCKET, supabase } from './supabase';
import { makeCoverImage, renderClip } from './clip';
import { modesFor } from '../config/platforms';
import type { ContentItem, MediaType, PublishJob, Target } from '../types/platform';

export type PostMode = 'full' | 'clip';

export interface TargetPlan {
  mode: PostMode;
  caption: string;
}

export interface ClipSettings {
  start: number;
  duration: number;
  cover: File | null;
}

export interface PublishPlan {
  targets: Target[];
  perTarget: Partial<Record<Target, TargetPlan>>;
  clip: ClipSettings;
  privacy: 'public' | 'private';
}

export const emptyPlan = (): PublishPlan => ({
  targets: [],
  perTarget: {},
  clip: { start: 0, duration: 30, cover: null },
  privacy: 'public',
});

export const defaultCaption = (description: string, tags: string[]) =>
  [description.trim(), tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')].filter(Boolean).join('\n\n');

// Adds/removes a target, giving new ones the default mode and caption.
export function toggleTarget(plan: PublishPlan, target: Target, mediaType: MediaType, caption: string): PublishPlan {
  if (plan.targets.includes(target)) {
    return { ...plan, targets: plan.targets.filter((t) => t !== target) };
  }
  const perTarget = plan.perTarget[target]
    ? plan.perTarget
    : { ...plan.perTarget, [target]: { mode: modesFor(target, mediaType)[0], caption } };
  return { ...plan, targets: [...plan.targets, target], perTarget };
}

export const needsClip = (plan: PublishPlan) => plan.targets.some((t) => plan.perTarget[t]?.mode === 'clip');

export type TargetProgress =
  | { status: 'rendering'; fraction: number }
  | { status: 'processing' }
  | { status: 'published'; url: string | null }
  | { status: 'failed'; error: string };

interface ExecuteArgs {
  plan: PublishPlan;
  item: ContentItem;
  mediaType: MediaType;
  getSource: () => Promise<File>;
  creatorName: string;
  onProgress: (target: Target, progress: TargetProgress) => void;
}

async function publishOne(contentId: string, target: Target, plan: PublishPlan, onProgress: ExecuteArgs['onProgress']) {
  onProgress(target, { status: 'processing' });
  try {
    const { job } = await apiFetch<{ job: PublishJob }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({
        contentId,
        target,
        options: { privacy: plan.privacy, caption: plan.perTarget[target]?.caption },
      }),
    });
    onProgress(target, { status: 'published', url: job.external_url });
  } catch (err) {
    onProgress(target, { status: 'failed', error: err instanceof Error ? err.message : 'Failed' });
  }
}

// Full-file targets start straight away; clip targets wait for one shared render + upload.
export async function executePlan({ plan, item, mediaType, getSource, creatorName, onProgress }: ExecuteArgs) {
  const fullTargets = plan.targets.filter((t) => plan.perTarget[t]?.mode !== 'clip');
  const clipTargets = plan.targets.filter((t) => plan.perTarget[t]?.mode === 'clip');

  const clipRun = async () => {
    if (clipTargets.length === 0) return;
    const fail = (error: string) => clipTargets.forEach((t) => onProgress(t, { status: 'failed', error }));
    try {
      clipTargets.forEach((t) => onProgress(t, { status: 'rendering', fraction: 0 }));
      const source = await getSource();
      const cover =
        mediaType === 'audio' ? plan.clip.cover ?? (await makeCoverImage(item.title, creatorName)) : undefined;
      const clipFile = await renderClip({
        source,
        sourceName: source.name,
        mediaType,
        start: plan.clip.start,
        duration: plan.clip.duration,
        cover,
        onProgress: (fraction) => clipTargets.forEach((t) => onProgress(t, { status: 'rendering', fraction })),
      });

      const path = `${item.user_id}/${crypto.randomUUID()}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, clipFile, { contentType: 'video/mp4' });
      if (uploadError) throw new Error(`Clip upload failed: ${uploadError.message}`);

      const { data: clipItem, error } = await supabase
        .from('content_items')
        .insert({
          user_id: item.user_id,
          parent_id: item.id,
          title: item.title,
          description: item.description,
          tags: item.tags,
          media_type: 'video',
          storage_path: path,
          mime_type: 'video/mp4',
          file_size: clipFile.size,
          is_public: false,
          clip_start: plan.clip.start,
          clip_duration: plan.clip.duration,
        })
        .select()
        .single();
      if (error || !clipItem) throw new Error(`Could not save clip: ${error?.message}`);

      await Promise.all(clipTargets.map((t) => publishOne(clipItem.id, t, plan, onProgress)));
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Clip failed');
    }
  };

  await Promise.all([...fullTargets.map((t) => publishOne(item.id, t, plan, onProgress)), clipRun()]);
}

// Downloads a library item's original file (for clipping something uploaded earlier).
export async function downloadSource(item: ContentItem): Promise<File> {
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).download(item.storage_path);
  if (error || !data) throw new Error('Could not load the original file.');
  const name = item.storage_path.split('/').pop() ?? 'source';
  return new File([data], name, { type: item.mime_type });
}
