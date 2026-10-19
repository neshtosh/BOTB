import React from 'react';
import { targets as allTargets } from '../../../config/platforms';
import { formatReleaseDate, KIND_LABEL, kindFor, slugify } from '../../../lib/releases';
import { cn } from '../../../utils/cn';
import { checkboxClass } from '../styles';
import { StepIntro, SummaryRow, type DraftPatch } from './fields';
import { AGREEMENTS, displayTitle, scheduledIso, STEPS, tagList, type AgreementKey, type ReleaseDraft, type StepId } from './draft';

const Edit: React.FC<{ step: StepId; go: (s: StepId) => void }> = ({ step, go }) => (
  <button type="button" onClick={() => go(step)} className="eyebrow text-signal hover:text-white ml-auto shrink-0">
    Edit
  </button>
);

const StepReview: React.FC<{
  index: number;
  draft: ReleaseDraft;
  patch: DraftPatch<ReleaseDraft>;
  go: (step: StepId) => void;
}> = ({ index, draft, patch, go }) => {
  const chosen = draft.targets.filter((t) => draft.destinations[t]);
  const section = (title: string, step: StepId, children: React.ReactNode) => (
    <section className="border border-white/15 p-4 sm:p-5">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[10px] text-signal">{String(STEPS.findIndex((s) => s.id === step) + 1).padStart(2, '0')}</span>
        <h3 className="text-2xl">{title}</h3>
        <Edit step={step} go={go} />
      </div>
      <dl>{children}</dl>
    </section>
  );

  return (
    <div className="space-y-4">
      <StepIntro index={index} title="Review and release">
        <p>Give it one last look. Once posts go out, changes have to be made on each platform.</p>
      </StepIntro>

      {section('Release', 'details', <>
        <SummaryRow label="Title">{draft.title} <span className="tag-yellow ml-2">{KIND_LABEL[kindFor(draft.tracks.length)]}</span></SummaryRow>
        <SummaryRow label="Artist">{draft.artistName}</SummaryRow>
        <SummaryRow label="Genre">{[draft.primaryGenre, draft.secondaryGenre].filter(Boolean).join(' / ')}</SummaryRow>
        <SummaryRow label="Language">{draft.language}</SummaryRow>
        {tagList(draft.tags).length > 0 && <SummaryRow label="Tags">{tagList(draft.tags).map((t) => `#${t}`).join(' ')}</SummaryRow>}
        <SummaryRow label="Cover art">{draft.cover ? draft.cover.name : 'Generated from your title'}</SummaryRow>
        {draft.previouslyReleased && <SummaryRow label="First released">{draft.originalDate}</SummaryRow>}
      </>)}

      {section('Tracks', 'tracks', draft.tracks.map((t, i) => (
        <SummaryRow key={t.key} label={`Track ${String(i + 1).padStart(2, '0')}`}>
          <span className="font-medium">{displayTitle(t)}</span>
          {t.explicit && <span className="tag ml-2 border border-white/20">Explicit</span>}
          {t.isCover && <span className="tag ml-2 border border-white/20">Cover</span>}
          {t.ai && <span className="tag ml-2 border border-white/20">AI</span>}
          <span className="block text-xs text-white/45 mt-0.5">Written by {t.songwriters.filter(Boolean).join(', ')}</span>
        </SummaryRow>
      )))}

      {section('Where it goes', 'destinations', chosen.length ? chosen.map((target) => {
        const dest = draft.destinations[target]!;
        const info = allTargets.find((x) => x.id === target)!;
        return (
          <SummaryRow key={target} label={info.name}>
            {dest.mode === 'clip' ? 'Clip' : 'Full'} · {dest.trackKeys.length} of {draft.tracks.length} track{draft.tracks.length === 1 ? '' : 's'}
          </SummaryRow>
        );
      }) : <SummaryRow label="Platforms">Library and smart link only</SummaryRow>)}

      {section('Release date', 'date', <>
        <SummaryRow label="Goes live">{formatReleaseDate(scheduledIso(draft), true)}</SummaryRow>
        <SummaryRow label="Visibility">{draft.privacy === 'public' ? 'Public' : 'Private'}{draft.showOnPage ? ' · on your fan page' : ''}</SummaryRow>
        <SummaryRow label="Smart link">/r/{draft.slug || slugify(draft.title)}</SummaryRow>
      </>)}

      {section('Splits', 'splits', draft.splits.map((s, i) => (
        <SummaryRow key={i} label={`${s.share}%`}>{s.name} <span className="text-white/45">· {s.role}</span></SummaryRow>
      )))}

      <section className="paper p-4 sm:p-5 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">Before you release</p>
        {(Object.keys(AGREEMENTS) as AgreementKey[]).map((key) => (
          <label key={key} className="flex items-start gap-3 text-sm text-ink cursor-pointer">
            <input type="checkbox" className={cn(checkboxClass, 'mt-0.5 accent-ink')} checked={draft.agreements[key]}
              onChange={(e) => patch({ agreements: { ...draft.agreements, [key]: e.target.checked } })} />
            {AGREEMENTS[key]}
          </label>
        ))}
      </section>
    </div>
  );
};

export default StepReview;
