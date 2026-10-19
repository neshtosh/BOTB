import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileAudio, FileVideo, UploadCloud } from 'lucide-react';
import Button from '../../components/common/Button';
import PublishComposer from '../../components/dashboard/PublishComposer';
import { cardClass, inputClass, labelClass } from '../../components/dashboard/styles';
import { useAuth } from '../../context/AuthContext';
import { useConnections } from '../../hooks/useCreatorData';
import { defaultCaption, emptyPlan, executePlan, needsClip, PublishPlan, TargetProgress } from '../../lib/publishPlan';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import { formatBytes } from '../../utils/formatters';
import type { ContentItem, MediaType, Target } from '../../types/platform';

const mediaTypeOf = (file: File): MediaType | null =>
  file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;

const Publish: React.FC = () => {
  const { user, profile } = useAuth();
  const { connections } = useConnections();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [showOnPage, setShowOnPage] = useState(true);
  const [plan, setPlan] = useState<PublishPlan>(emptyPlan);
  const [progress, setProgress] = useState<Partial<Record<Target, TargetProgress>>>({});
  const [phase, setPhase] = useState<'edit' | 'uploading' | 'publishing' | 'done'>('edit');
  const [error, setError] = useState('');

  const mediaType = useMemo(() => (file ? mediaTypeOf(file) : null), [file]);
  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

  const pickFile = (next: File | null) => {
    setError('');
    if (next && !mediaTypeOf(next)) {
      setError('Please choose a video or audio file.');
      return;
    }
    setFile(next);
    setPlan(emptyPlan());
    if (next && !title) setTitle(next.name.replace(/\.[^.]+$/, ''));
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setTags('');
    setPlan(emptyPlan());
    setProgress({});
    setPhase('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !mediaType || !user) return;
    setError('');
    setPhase('uploading');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setPhase('edit');
      return;
    }

    const { data: item, error: insertError } = await supabase
      .from('content_items')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        tags: tagList,
        media_type: mediaType,
        storage_path: path,
        mime_type: file.type,
        file_size: file.size,
        is_public: showOnPage,
      })
      .select()
      .single();
    if (insertError || !item) {
      await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      setError(`Could not save: ${insertError?.message}`);
      setPhase('edit');
      return;
    }

    setPhase('publishing');
    await executePlan({
      plan,
      item: item as ContentItem,
      mediaType,
      getSource: async () => file,
      creatorName: profile?.display_name ?? '',
      onProgress: (target, p) => setProgress((prev) => ({ ...prev, [target]: p })),
    });
    setPhase('done');
  };

  const busy = phase === 'uploading' || phase === 'publishing';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Upload & Publish</h1>
        <p className="text-surface-600 mt-1">
          Add your file once, then choose what each platform gets: the full file or a clip, with its own caption.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClass}>
            <label
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-surface-400 rounded-xl py-10 px-4 text-center cursor-pointer hover:border-primary-500 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy) pickFile(e.dataTransfer.files[0] ?? null);
              }}
            >
              {file ? (
                <>
                  {mediaType === 'video' ? <FileVideo size={36} className="text-primary-400" /> : <FileAudio size={36} className="text-primary-400" />}
                  <span className="font-medium break-all">{file.name}</span>
                  <span className="text-xs text-surface-600">{formatBytes(file.size)} · click to change</span>
                </>
              ) : (
                <>
                  <UploadCloud size={36} className="text-surface-600" />
                  <span className="font-medium">Drop a video or audio file, or click to browse</span>
                  <span className="text-xs text-surface-600">MP4, MOV, MP3, WAV and more</span>
                </>
              )}
              <input
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className={`${cardClass} space-y-4`}>
            <div>
              <label className={labelClass} htmlFor="title">Title</label>
              <input id="title" required maxLength={100} className={inputClass} value={title} disabled={busy}
                onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="description">Description</label>
              <textarea id="description" rows={4} className={inputClass} value={description} disabled={busy}
                onChange={(e) => setDescription(e.target.value)} />
              <p className="text-xs text-surface-600 mt-1">Used as the starting caption for each platform.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="tags">Tags</label>
              <input id="tags" className={inputClass} placeholder="afrobeats, new music, live" value={tags} disabled={busy}
                onChange={(e) => setTags(e.target.value)} />
              <p className="text-xs text-surface-600 mt-1">Comma separated. Added as hashtags to captions.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-primary-500" checked={showOnPage} disabled={busy}
                onChange={(e) => setShowOnPage(e.target.checked)} />
              Show on my public creator page
            </label>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className={`${cardClass} space-y-4`}>
            <h4>Publish to</h4>
            {!file || !mediaType ? (
              <p className="text-sm text-surface-600">Choose a file to see matching platforms.</p>
            ) : (
              <PublishComposer
                mediaType={mediaType}
                connections={connections}
                plan={plan}
                onChange={setPlan}
                defaultCaption={defaultCaption(description, tagList)}
                source={file}
                progress={progress}
                disabled={busy || phase === 'done'}
              />
            )}
            <div>
              <label className={labelClass} htmlFor="privacy">Visibility on platforms</label>
              <select id="privacy" className={inputClass} value={plan.privacy} disabled={busy}
                onChange={(e) => setPlan({ ...plan, privacy: e.target.value as 'public' | 'private' })}>
                <option value="public">Public</option>
                <option value="private">Private (review before going live)</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-error-400">{error}</p>}

          {phase === 'done' ? (
            <div className="space-y-3">
              <p className="text-sm text-success-400">Done. Results are shown next to each platform above.</p>
              <div className="flex gap-3">
                <Button type="button" onClick={reset}>Upload another</Button>
                <Link to="/dashboard/library"><Button type="button" variant="outline">Go to library</Button></Link>
              </div>
            </div>
          ) : (
            <Button type="submit" size="lg" fullWidth isLoading={busy} disabled={!file || !title.trim()}>
              {plan.targets.length > 0 ? `Upload & publish to ${plan.targets.length}` : 'Upload to library'}
            </Button>
          )}
          {phase === 'uploading' && <p className="text-xs text-surface-600">Uploading your file…</p>}
          {phase === 'publishing' && (
            <p className="text-xs text-surface-600">
              {needsClip(plan) ? 'Rendering your clip in the browser, then publishing. ' : 'Publishing… '}
              This can take a few minutes. Keep this tab open.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Publish;
