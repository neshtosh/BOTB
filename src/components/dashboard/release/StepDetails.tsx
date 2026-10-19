import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ImagePlus, X } from 'lucide-react';
import { GENRES, LANGUAGES } from '../../../lib/releases';
import { makeSquareCover } from '../../../lib/covers';
import { cn } from '../../../utils/cn';
import { inputClass, selectClass } from '../styles';
import { Choice, Field, StepIntro, type DraftPatch } from './fields';
import { coverPatch, YES_NO, type ReleaseDraft } from './draft';

const CoverArt: React.FC<{ draft: ReleaseDraft; patch: DraftPatch<ReleaseDraft> }> = ({ draft, patch }) => {
  const [dragging, setDragging] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const uploadedUrl = useMemo(() => (draft.cover ? URL.createObjectURL(draft.cover) : null), [draft.cover]);
  useEffect(() => () => {
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
  }, [uploadedUrl]);

  // Live preview of the cover Unsigned makes when no art is uploaded.
  useEffect(() => {
    if (draft.cover) return;
    let url: string | null = null;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      makeSquareCover(draft.title || 'Untitled', draft.artistName || 'Artist', 600).then((file) => {
        if (cancelled) return;
        url = URL.createObjectURL(file);
        setGenerated(url);
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [draft.cover, draft.title, draft.artistName]);

  const pick = async (file: File | null) => patch(await coverPatch(file));
  const check = draft.coverCheck;

  return (
    <div className="grid sm:grid-cols-[12rem_minmax(0,1fr)] gap-5 items-start">
      <label
        className={cn(
          'relative aspect-square w-full max-w-[12rem] grid place-items-center overflow-hidden border-2 border-dashed cursor-pointer transition-colors',
          dragging ? 'border-signal bg-signal/10' : check && !check.ok ? 'border-error-400' : 'border-white/20 hover:border-signal'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0] ?? null);
        }}
      >
        {uploadedUrl ? (
          <img src={uploadedUrl} alt="Cover art" className="absolute inset-0 h-full w-full object-cover" />
        ) : generated ? (
          <>
            <img src={generated} alt="Generated cover preview" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <span className="relative tag-yellow gap-1"><ImagePlus size={12} /> Upload art</span>
          </>
        ) : (
          <ImagePlus size={28} className="text-white/40" />
        )}
        <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>

      <div className="space-y-3 text-sm min-w-0">
        {!draft.cover ? (
          <>
            <p className="text-white/70">
              No art yet? We’ll use the generated cover shown here. You can replace it any time from the release page.
            </p>
            <ul className="text-xs text-white/45 space-y-1 list-disc pl-4">
              <li>Square, at least 1000×1000 (3000×3000 is ideal), JPG or PNG, under 10 MB</li>
              <li>No website addresses, QR codes, social or streaming logos, or prices</li>
              <li>Sharp and readable: platforms may reject blurry or stretched art</li>
            </ul>
          </>
        ) : (
          <>
            <p className="font-medium break-all">{draft.cover.name}</p>
            {check && (
              <p className="font-mono text-[11px] text-white/45">
                {check.width}×{check.height} · {(draft.cover.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
            {check?.errors.map((e) => (
              <p key={e} className="flex items-start gap-2 text-error-300"><X size={14} className="mt-0.5 shrink-0" /> {e}</p>
            ))}
            {check?.warnings.map((w) => (
              <p key={w} className="flex items-start gap-2 text-warning-200"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {w}</p>
            ))}
            {check?.ok && <p className="flex items-center gap-2 text-white/80"><Check size={14} className="text-signal" /> Looks good.</p>}
            <button type="button" onClick={() => pick(null)} className="eyebrow text-white/50 hover:text-signal">
              Remove and use a generated cover
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const StepDetails: React.FC<{ index: number; draft: ReleaseDraft; patch: DraftPatch<ReleaseDraft> }> = ({ index, draft, patch }) => (
  <div className="space-y-6">
    <StepIntro index={index} title="Release details">
      <p>This is how the release is credited everywhere: on posts, your smart link and your fan page.</p>
    </StepIntro>

    <div className="grid sm:grid-cols-2 gap-5">
      <Field label="Artist / band name" htmlFor="artistName" hint="The main artist on every track.">
        <input id="artistName" className={inputClass} value={draft.artistName} onChange={(e) => patch({ artistName: e.target.value })} />
      </Field>
      <Field label="Release title" htmlFor="releaseTitle" hint="For a single, use the song title.">
        <input id="releaseTitle" className={inputClass} maxLength={100} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="Primary genre" htmlFor="primaryGenre">
        <select id="primaryGenre" className={selectClass} value={draft.primaryGenre} onChange={(e) => patch({ primaryGenre: e.target.value })}>
          <option value="">Choose a genre…</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="Secondary genre" htmlFor="secondaryGenre" optional>
        <select id="secondaryGenre" className={selectClass} value={draft.secondaryGenre} onChange={(e) => patch({ secondaryGenre: e.target.value })}>
          <option value="">None</option>
          {GENRES.filter((g) => g !== draft.primaryGenre).map((g) => <option key={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="Language" htmlFor="language" hint="The main language of the lyrics and titles.">
        <select id="language" className={selectClass} value={draft.language} onChange={(e) => patch({ language: e.target.value })}>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="Tags" htmlFor="tags" optional hint="Comma separated. Added to captions as hashtags.">
        <input id="tags" className={inputClass} placeholder="afrohouse, newmusic, nairobi" value={draft.tags} onChange={(e) => patch({ tags: e.target.value })} />
      </Field>
      <Field label="Description" htmlFor="description" optional className="sm:col-span-2" hint="The starting point for every caption, and shown on your smart link.">
        <textarea id="description" rows={3} className={inputClass} value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
    </div>

    <div className="flex flex-wrap items-end gap-5 border-t border-white/10 pt-5">
      <Choice
        label="Has this been released before?"
        value={draft.previouslyReleased}
        options={YES_NO}
        onChange={(v) => patch({ previouslyReleased: v })}
      />
      {draft.previouslyReleased && (
        <Field label="Original release date" htmlFor="originalDate">
          <input id="originalDate" type="date" className={inputClass} max={new Date().toISOString().slice(0, 10)}
            value={draft.originalDate} onChange={(e) => patch({ originalDate: e.target.value })} />
        </Field>
      )}
    </div>

    <div className="border-t border-white/10 pt-5">
      <p className="eyebrow text-white/60 mb-3">Cover art</p>
      <CoverArt draft={draft} patch={patch} />
    </div>
  </div>
);

export default StepDetails;
