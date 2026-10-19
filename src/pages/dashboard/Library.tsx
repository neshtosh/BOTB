import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, FileAudio, FileVideo, Send, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import PublishComposer from '../../components/dashboard/PublishComposer';
import { cardClass, inputClass, labelClass } from '../../components/dashboard/styles';
import { useAuth } from '../../context/AuthContext';
import { LibraryItem, useConnections, useLibrary } from '../../hooks/useCreatorData';
import {
  defaultCaption,
  downloadSource,
  emptyPlan,
  executePlan,
  needsClip,
  PublishPlan,
  TargetProgress,
} from '../../lib/publishPlan';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import { formatBytes, formatDate } from '../../utils/formatters';
import type { PlatformConnection, Target } from '../../types/platform';

const PublishPanel: React.FC<{
  item: LibraryItem;
  connections: PlatformConnection[];
  onDone: () => void;
}> = ({ item, connections, onDone }) => {
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
    await executePlan({
      plan,
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
    <div className="mt-4 pt-4 border-t border-surface-300/40 space-y-4">
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
          <select id={`privacy-${item.id}`} className={inputClass} value={plan.privacy} disabled={busy}
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

const Library: React.FC = () => {
  const { items, loading, reload } = useLibrary();
  const { connections } = useConnections();
  const [openId, setOpenId] = useState<string | null>(null);

  const togglePublic = async (item: LibraryItem) => {
    await supabase.from('content_items').update({ is_public: !item.is_public }).eq('id', item.id);
    reload();
  };

  const remove = async (item: LibraryItem) => {
    if (!window.confirm(`Delete "${item.title}" and its clips from your library? Posts already on other platforms stay there.`)) return;
    await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path, ...item.clips.map((c) => c.storage_path)]);
    await supabase.from('content_items').delete().eq('id', item.id);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Library</h1>
          <p className="text-surface-600 mt-1">Everything you've uploaded. Push any item, or a clip of it, to more platforms.</p>
        </div>
        <Link to="/dashboard/publish"><Button>New upload</Button></Link>
      </div>

      {loading && <p className="text-surface-600">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className={cardClass}>
          <p className="text-surface-600">No uploads yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const published = item.jobs.filter((j) => j.status === 'published');
          return (
            <div key={item.id} className={cardClass}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-300 flex items-center justify-center shrink-0">
                  {item.media_type === 'video' ? <FileVideo size={22} /> : <FileAudio size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="truncate">{item.title}</h5>
                  <p className="text-xs text-surface-600">
                    {formatDate(item.created_at)} · {formatBytes(item.file_size)} · {published.length} post
                    {published.length === 1 ? '' : 's'}
                    {item.clips.length > 0 && ` · ${item.clips.length} clip${item.clips.length === 1 ? '' : 's'}`}
                  </p>
                  {published.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {published.map((job) => {
                        const label = `${job.target}${job.fromClip ? ' (clip)' : ''}`;
                        return job.external_url ? (
                          <a key={job.id} href={job.external_url} target="_blank" rel="noopener noreferrer"
                            className="text-2xs bg-success-500/20 text-success-300 rounded-full px-2 py-0.5 hover:bg-success-500/30">
                            {label} ↗
                          </a>
                        ) : (
                          <span key={job.id} className="text-2xs bg-success-500/20 text-success-300 rounded-full px-2 py-0.5">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePublic(item)} className="p-2 rounded-lg hover:bg-surface-300 text-surface-700"
                    title={item.is_public ? 'Shown on your page (click to hide)' : 'Hidden from your page (click to show)'}>
                    {item.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => remove(item)} className="p-2 rounded-lg hover:bg-surface-300 text-surface-700" title="Delete">
                    <Trash2 size={18} />
                  </button>
                  <Button size="sm" variant="outline" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                    {openId === item.id ? 'Close' : 'Publish'}
                  </Button>
                </div>
              </div>
              {openId === item.id && <PublishPanel item={item} connections={connections} onDone={reload} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Library;
