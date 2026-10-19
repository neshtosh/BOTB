import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, FileAudio, FileVideo, Send, Trash2, UploadCloud } from 'lucide-react';
import Button from '../../components/common/Button';
import PublishComposer from '../../components/dashboard/PublishComposer';
import { cardClass, iconButtonClass, labelClass, selectClass } from '../../components/dashboard/styles';
import { PageHeader } from '../../components/dashboard/Studio';
import { targetName } from '../../config/platforms';
import { cn } from '../../utils/cn';
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
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Studio / Library · ${items.length} upload${items.length === 1 ? '' : 's'}`}
        title="Library"
        description="Everything you've uploaded. Push any item, or a clip of it, to more platforms."
        underline="double"
        doodle="notes"
        actions={<Link to="/dashboard/publish"><Button leftIcon={<UploadCloud size={16} />}>New upload</Button></Link>}
      />

      {loading && <p className="eyebrow text-white/50">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="border border-dashed border-white/20 p-8 text-center">
          <h3>No uploads yet</h3>
          <p className="text-sm text-white/55 mt-2">Drop in a track or video and it will live here.</p>
          <Link to="/dashboard/publish" className="inline-block mt-5"><Button>Upload something</Button></Link>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const published = item.jobs.filter((j) => j.status === 'published');
          const open = openId === item.id;
          return (
            <div key={item.id} className={cn(cardClass, open && 'border-signal/60')}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-signal text-ink grid place-items-center shrink-0">
                    {item.media_type === 'video' ? <FileVideo size={22} /> : <FileAudio size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate">{item.title}</h3>
                    <p className="font-mono text-[11px] text-white/45 mt-1">
                      {formatDate(item.created_at)} · {formatBytes(item.file_size)} · {published.length} post
                      {published.length === 1 ? '' : 's'}
                      {item.clips.length > 0 && ` · ${item.clips.length} clip${item.clips.length === 1 ? '' : 's'}`}
                      {!item.is_public && ' · hidden from page'}
                    </p>
                    {published.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {published.map((job) => {
                          const label = `${targetName(job.target)}${job.fromClip ? ' · clip' : ''}`;
                          return job.external_url ? (
                            <a key={job.id} href={job.external_url} target="_blank" rel="noopener noreferrer"
                              className="tag-yellow hover:bg-white transition-colors">
                              {label} ↗
                            </a>
                          ) : (
                            <span key={job.id} className="tag-yellow">{label}</span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:pl-0 pl-16">
                  <button onClick={() => togglePublic(item)} className={iconButtonClass}
                    aria-label={item.is_public ? 'Hide from my page' : 'Show on my page'}
                    title={item.is_public ? 'Shown on your page (click to hide)' : 'Hidden from your page (click to show)'}>
                    {item.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => remove(item)} className={cn(iconButtonClass, 'hover:!border-error-400 hover:!text-error-400')}
                    aria-label="Delete" title="Delete">
                    <Trash2 size={16} />
                  </button>
                  <Button size="sm" variant={open ? 'primary' : 'outline'} className="h-9"
                    onClick={() => setOpenId(open ? null : item.id)} leftIcon={open ? undefined : <Send size={14} />}>
                    {open ? 'Close' : 'Publish'}
                  </Button>
                </div>
              </div>
              {open && <PublishPanel item={item} connections={connections} onDone={reload} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Library;
