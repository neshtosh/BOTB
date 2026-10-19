import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../../common/Button';
import PublishComposer from '../PublishComposer';
import { labelClass, selectClass } from '../styles';
import { useAuth } from '../../../context/AuthContext';
import type { LibraryItem } from '../../../hooks/useCreatorData';
import {
  defaultCaption,
  downloadSource,
  emptyPlan,
  executePlan,
  needsClip,
  PublishPlan,
  TargetProgress,
} from '../../../lib/publishPlan';
import type { PlatformConnection, Target } from '../../../types/platform';

// Post one existing track (or a clip of it) to more platforms.
const TrackPublishPanel: React.FC<{
  item: LibraryItem;
  connections: PlatformConnection[];
  onDone: () => void;
  // Frame for audio clips (the release's cover art); without it a cover is generated.
  clipCover?: () => Promise<Blob | null>;
}> = ({ item, connections, onDone, clipCover }) => {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PublishPlan>(emptyPlan);
  const [progress, setProgress] = useState<Partial<Record<Target, TargetProgress>>>({});
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<File | null>(null);
  const [sourceError, setSourceError] = useState('');
  const published = item.jobs.filter((j) => j.status === 'published').map((j) => j.target);
  const wantsClip = needsClip(plan);

  // Only download the original when the creator actually asks for a clip.
  useEffect(() => {
    if (!wantsClip || source || sourceError) return;
    downloadSource(item)
      .then(setSource)
      .catch((err) => setSourceError(err instanceof Error ? err.message : 'Could not load the file.'));
  }, [wantsClip, source, sourceError, item]);

  const publish = async () => {
    setBusy(true);
    setProgress({});
    const cover = item.media_type === 'audio' && wantsClip && !plan.clip.cover && clipCover ? await clipCover().catch(() => null) : null;
    await executePlan({
      plan: cover ? { ...plan, clip: { ...plan.clip, cover: new File([cover], 'frame.jpg', { type: 'image/jpeg' }) } } : plan,
      item,
      mediaType: item.media_type,
      getSource: async () => source ?? downloadSource(item),
      creatorName: profile?.display_name ?? '',
      onProgress: (target, p) => setProgress((prev) => ({ ...prev, [target]: p })),
    });
    setBusy(false);
    setPlan((p) => ({ ...p, targets: [] }));
    onDone();
  };

  return (
    <div className="mt-5 pt-5 border-t border-dashed border-white/15 space-y-5">
      <p className="eyebrow text-signal">Publish “{item.title}” to more platforms</p>
      <PublishComposer
        mediaType={item.media_type}
        connections={connections}
        plan={plan}
        onChange={setPlan}
        defaultCaption={defaultCaption(item.description, item.tags)}
        source={source}
        sourceError={sourceError}
        progress={progress}
        alreadyPublished={published}
        disabled={busy}
      />
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className={labelClass} htmlFor={`privacy-${item.id}`}>Visibility</label>
          <select id={`privacy-${item.id}`} className={selectClass} value={plan.privacy} disabled={busy}
            onChange={(e) => setPlan({ ...plan, privacy: e.target.value as 'public' | 'private' })}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <Button onClick={publish} isLoading={busy} disabled={plan.targets.length === 0 || (wantsClip && !source)}
          leftIcon={<Send size={16} />}>
          Publish
        </Button>
      </div>
    </div>
  );
};

export default TrackPublishPanel;
