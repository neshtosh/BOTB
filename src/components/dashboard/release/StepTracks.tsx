import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, FileAudio, FileVideo, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { KIND_LABEL, kindFor, MAX_TRACKS, VERSIONS } from '../../../lib/releases';
import { formatBytes } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';
import { iconButtonClass, inputClass, selectClass } from '../styles';
import { Choice, Field, StepIntro, type DraftPatch } from './fields';
import { displayTitle, mediaTypeOf, newTrack, releaseMediaType, YES_NO, type ReleaseDraft, type TrackDraft } from './draft';
import { Notice } from '../Studio';
import type { FeaturedArtist } from '../../../types/platform';

const ROLES: { value: FeaturedArtist['role']; label: string }[] = [
  { value: 'featured', label: 'Featured artist' },
  { value: 'remixer', label: 'Remixer' },
  { value: 'primary', label: 'Additional main artist' },
];

const TrackEditor: React.FC<{
  track: TrackDraft;
  index: number;
  update: (patch: Partial<TrackDraft>) => void;
  // Copies these songwriters to every track (only offered on multi-track releases).
  applyToAll?: (songwriters: string[]) => void;
}> = ({
  track,
  index,
  update,
  applyToAll,
}) => {
  const id = (name: string) => `track-${index}-${name}`;
  return (
    <div className="border-t border-white/10 px-4 py-5 space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Song title" htmlFor={id('title')} hint="Just the title: versions and featured artists go below.">
          <input id={id('title')} className={inputClass} maxLength={100} value={track.title} onChange={(e) => update({ title: e.target.value })} />
        </Field>
        <Field label="Version" htmlFor={id('version')} optional hint="Shown in brackets, e.g. “(Acoustic)”.">
          <input id={id('version')} list="release-versions" className={inputClass} placeholder="Original" value={track.version}
            onChange={(e) => update({ version: e.target.value })} />
        </Field>
      </div>

      <div>
        <p className="eyebrow text-white/60 mb-2">Other artists <span className="ml-2 text-white/30 normal-case tracking-normal">optional</span></p>
        <div className="space-y-2">
          {track.featured.map((f, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[12rem_minmax(0,1fr)_auto] gap-2">
              <select aria-label="Role" className={cn(selectClass, 'col-span-2 sm:col-span-1')} value={f.role}
                onChange={(e) => update({ featured: track.featured.map((x, j) => (j === i ? { ...x, role: e.target.value as FeaturedArtist['role'] } : x)) })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <input aria-label="Artist name" className={inputClass} placeholder="Artist name" value={f.name}
                onChange={(e) => update({ featured: track.featured.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <button type="button" aria-label="Remove artist" className={cn(iconButtonClass, 'h-auto self-stretch')}
                onClick={() => update({ featured: track.featured.filter((_, j) => j !== i) })}>
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="eyebrow text-signal hover:text-white inline-flex items-center gap-1"
            onClick={() => update({ featured: [...track.featured, { name: '', role: 'featured' }] })}>
            <Plus size={12} /> Add an artist
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <Choice label="Songwriting" value={track.isCover}
          options={[{ value: false, label: 'My original song' }, { value: true, label: 'A cover' }]}
          onChange={(v) => update({ isCover: v })} />
        <Choice label="Explicit lyrics?" value={track.explicit} options={YES_NO} onChange={(v) => update({ explicit: v })} />
        <Choice label="Instrumental?" value={track.instrumental} options={YES_NO} onChange={(v) => update({ instrumental: v })} />
        <Choice label="Made with AI tools?" value={track.ai} options={YES_NO} onChange={(v) => update({ ai: v })} />
      </div>
      {track.isCover && (
        <Notice tone="warn">
          Make sure you have the rights to post this cover. Platforms can mute or claim covers, and Unsigned doesn’t sell cover licences.
        </Notice>
      )}
      {track.ai && (
        <Notice tone="warn">Thanks for saying so. Some platforms label AI-made music, and you’re still responsible for the rights to it.</Notice>
      )}

      <div>
        <p className="eyebrow text-white/60 mb-2">{track.isCover ? 'Original songwriter(s)' : 'Songwriter(s)'} — real names</p>
        <div className="space-y-2">
          {track.songwriters.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label={`Songwriter ${i + 1}`} className={inputClass} placeholder="First and last name" value={s}
                onChange={(e) => update({ songwriters: track.songwriters.map((x, j) => (j === i ? e.target.value : x)) })} />
              {track.songwriters.length > 1 && (
                <button type="button" aria-label="Remove songwriter" className={cn(iconButtonClass, 'h-auto self-stretch')}
                  onClick={() => update({ songwriters: track.songwriters.filter((_, j) => j !== i) })}>
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="eyebrow text-signal hover:text-white inline-flex items-center gap-1"
            onClick={() => update({ songwriters: [...track.songwriters, ''] })}>
            <Plus size={12} /> Add a songwriter
          </button>
          {applyToAll && track.songwriters.some((s) => s.trim()) && (
            <button type="button" className="eyebrow text-white/50 hover:text-signal ml-5"
              onClick={() => applyToAll(track.songwriters.filter((s) => s.trim()))}>
              Use for every track
            </button>
          )}
        </div>
        <p className="text-xs text-white/40 mt-2">Real names, not stage names: credits are matched to people, so royalties and credits reach the right person.</p>
      </div>
    </div>
  );
};

const StepTracks: React.FC<{
  index: number;
  draft: ReleaseDraft;
  patch: DraftPatch<ReleaseDraft>;
  songwriter: string;
}> = ({ index, draft, patch, songwriter }) => {
  const [open, setOpen] = useState<string | null>(draft.tracks[0]?.key ?? null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const mediaType = releaseMediaType(draft);

  const add = (files: FileList | File[]) => {
    setError('');
    const list = [...files];
    const accepted: TrackDraft[] = [];
    for (const file of list) {
      const type = mediaTypeOf(file);
      if (!type) {
        setError(`${file.name} isn’t an audio or video file.`);
        continue;
      }
      const expected = mediaType ?? accepted[0]?.mediaType ?? type;
      if (type !== expected) {
        setError('Keep a release to one kind of file: all audio, or all video.');
        continue;
      }
      accepted.push(newTrack(file, type, songwriter));
    }
    const tracks = [...draft.tracks, ...accepted].slice(0, MAX_TRACKS);
    if (draft.tracks.length + accepted.length > MAX_TRACKS) setError(`A release can have up to ${MAX_TRACKS} tracks.`);
    // A single's title usually matches its song.
    const title = draft.title || (tracks.length === 1 ? tracks[0].title : draft.title);
    patch({ tracks, title });
    if (!open && accepted[0]) setOpen(accepted[0].key);
  };

  const update = (key: string, p: Partial<TrackDraft>) =>
    patch({ tracks: draft.tracks.map((t) => (t.key === key ? { ...t, ...p } : t)) });
  const move = (i: number, by: number) => {
    const tracks = [...draft.tracks];
    const [t] = tracks.splice(i, 1);
    tracks.splice(i + by, 0, t);
    patch({ tracks });
  };

  const kind = kindFor(Math.max(1, draft.tracks.length));

  return (
    <div>
      <datalist id="release-versions">{VERSIONS.map((v) => <option key={v} value={v} />)}</datalist>
      <StepIntro index={index} title="Tracks">
        <p>
          Add every song in the order you want it. 1–3 tracks is a single, 4–6 an EP and 7 or more an album, up to {MAX_TRACKS}.
          WAV or FLAC sound best; MP3, M4A, AIFF and video files work too.
        </p>
      </StepIntro>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="tag-yellow">{KIND_LABEL[kind]}</span>
        <span className="eyebrow text-white/40">{draft.tracks.length} track{draft.tracks.length === 1 ? '' : 's'}</span>
      </div>

      <div className="space-y-2">
        {draft.tracks.map((track, i) => {
          const isOpen = open === track.key;
          return (
            <div key={track.key} className={cn('border', isOpen ? 'border-signal/60' : 'border-white/15')}>
              <div className="flex items-center gap-3 px-3 sm:px-4 py-3">
                <span className="font-mono text-xs text-white/40 w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="grid place-items-center h-9 w-9 bg-signal text-ink shrink-0">
                  {track.mediaType === 'video' ? <FileVideo size={16} /> : <FileAudio size={16} />}
                </span>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : track.key)} aria-expanded={isOpen}>
                  <span className="block truncate font-medium">{displayTitle(track) || 'Untitled'}{track.explicit && <span className="tag ml-2 border border-white/20">E</span>}</span>
                  <span className="block font-mono text-[11px] text-white/40 truncate">{track.file.name} · {formatBytes(track.file.size)}</span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" className={cn(iconButtonClass, 'hidden sm:inline-grid')} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" className={cn(iconButtonClass, 'hidden sm:inline-grid')} aria-label="Move down" disabled={i === draft.tracks.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" className={cn(iconButtonClass, 'hover:!border-error-400 hover:!text-error-400')} aria-label="Remove track"
                    onClick={() => patch({ tracks: draft.tracks.filter((t) => t.key !== track.key) })}>
                    <Trash2 size={14} />
                  </button>
                  <button type="button" className={iconButtonClass} aria-label={isOpen ? 'Collapse' : 'Edit details'} onClick={() => setOpen(isOpen ? null : track.key)}>
                    <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                  </button>
                </div>
              </div>
              {isOpen && (
                <TrackEditor track={track} index={i} update={(p) => update(track.key, p)}
                  applyToAll={draft.tracks.length > 1 ? (songwriters) => patch({ tracks: draft.tracks.map((t) => ({ ...t, songwriters: [...songwriters] })) }) : undefined} />
              )}
            </div>
          );
        })}
      </div>

      {draft.tracks.length < MAX_TRACKS && (
        <label
          className={cn(
            'mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed py-8 px-4 text-center cursor-pointer transition-colors',
            dragging ? 'border-signal bg-signal/10' : 'border-white/20 hover:border-signal'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add(e.dataTransfer.files);
          }}
        >
          <UploadCloud size={24} className="text-signal" />
          <span className="font-medium">{draft.tracks.length ? 'Add more tracks' : 'Drop your tracks here, or click to browse'}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/45">
            {mediaType === 'video' ? 'Video files' : mediaType === 'audio' ? 'Audio files' : 'Audio or video · several at once is fine'}
          </span>
          <input
            type="file"
            multiple
            accept={mediaType === 'video' ? 'video/*' : mediaType === 'audio' ? 'audio/*' : 'audio/*,video/*'}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) add(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </div>
  );
};

export default StepTracks;
