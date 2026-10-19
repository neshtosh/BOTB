import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Send } from 'lucide-react';
import Button from '../../components/common/Button';
import { ProgressIcon } from '../../components/dashboard/PublishComposer';
import { cardClass } from '../../components/dashboard/styles';
import { Notice, PageHeader } from '../../components/dashboard/Studio';
import {
  defaultDestinations,
  displayTitle,
  emptyDraft,
  scheduledIso,
  stepProblems,
  STEPS,
  submitRelease,
  type ReleaseDraft,
  type StepId,
  type SubmitStage,
} from '../../components/dashboard/release/draft';
import StepPlatforms from '../../components/dashboard/release/StepPlatforms';
import StepDetails from '../../components/dashboard/release/StepDetails';
import StepTracks from '../../components/dashboard/release/StepTracks';
import StepDestinations from '../../components/dashboard/release/StepDestinations';
import StepSchedule from '../../components/dashboard/release/StepSchedule';
import SplitsEditor from '../../components/dashboard/release/SplitsEditor';
import StepReview from '../../components/dashboard/release/StepReview';
import { StepIntro } from '../../components/dashboard/release/fields';
import { useAuth } from '../../context/AuthContext';
import { useConnections } from '../../hooks/useCreatorData';
import { targetName } from '../../config/platforms';
import { formatReleaseDate, smartLinkUrl } from '../../lib/releases';
import type { TargetProgress } from '../../lib/publishPlan';
import { cn } from '../../utils/cn';
import type { Target } from '../../types/platform';

type Progress = Record<string, Partial<Record<Target, TargetProgress>>>;

const progressLabel = (p?: TargetProgress) => {
  if (!p) return 'Waiting';
  switch (p.status) {
    case 'rendering':
      return `Cutting clip ${Math.round(p.fraction * 100)}%`;
    case 'processing':
      return 'Posting…';
    case 'scheduled':
      return 'Scheduled';
    case 'published':
      return 'Live';
    case 'failed':
      return p.error;
  }
};

const NewRelease: React.FC = () => {
  const { user, profile } = useAuth();
  const { connections } = useConnections();
  const [draft, setDraft] = useState<ReleaseDraft>(() => emptyDraft(profile?.display_name ?? '', user?.email ?? ''));
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [phase, setPhase] = useState<'edit' | 'submitting' | 'done'>('edit');
  const [stage, setStage] = useState<SubmitStage | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [result, setResult] = useState<{ id: string; slug: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const patch = useCallback((p: Partial<ReleaseDraft>) => setDraft((d) => ({ ...d, ...p })), []);

  // The profile can arrive after the first render.
  useEffect(() => {
    if (!profile) return;
    setDraft((d) =>
      d.artistName
        ? d
        : { ...d, artistName: profile.display_name, splits: d.splits.map((s, i) => (i === 0 && !s.name ? { ...s, name: profile.display_name } : s)) }
    );
  }, [profile]);

  // Warn before leaving with an unfinished release.
  useEffect(() => {
    if (phase !== 'edit' || draft.tracks.length === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase, draft.tracks.length]);

  const stepId = STEPS[step].id;
  const stepsRef = useRef<HTMLOListElement>(null);

  // On phones the step list scrolls sideways; keep the current step in view.
  useEffect(() => {
    const list = stepsRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (list && current && list.scrollWidth > list.clientWidth) list.scrollTo({ left: current.offsetLeft - 16 });
  }, [step]);

  const goTo = (next: number) => {
    setProblems([]);
    if (STEPS[next].id === 'destinations') patch({ destinations: defaultDestinations(draft) });
    setStep(next);
    setReached((r) => Math.max(r, next));
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    const found = stepProblems(stepId, draft);
    if (found.length) {
      setProblems(found);
      return;
    }
    if (step < STEPS.length - 1) goTo(step + 1);
  };

  const submit = async () => {
    // Re-check everything: earlier steps can be edited from Review.
    for (const [i, s] of STEPS.entries()) {
      const found = stepProblems(s.id, draft);
      if (found.length) {
        if (i !== step) goTo(i);
        setProblems(found);
        return;
      }
    }
    if (!user) return;
    setError('');
    setPhase('submitting');
    try {
      const res = await submitRelease(draft, {
        userId: user.id,
        handle: profile?.handle,
        onStage: setStage,
        onProgress: (trackKey, target, p) => setProgress((prev) => ({ ...prev, [trackKey]: { ...prev[trackKey], [target]: p } })),
      });
      setResult(res);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setPhase('done');
    }
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(smartLinkUrl(result.slug));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is visible to copy by hand.
    }
  };

  const goToId = (id: StepId) => goTo(STEPS.findIndex((s) => s.id === id));

  if (phase !== 'edit') {
    const chosen = draft.targets.filter((t) => draft.destinations[t]);
    const scheduled = scheduledIso(draft);
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Studio / New release" title={draft.title} description={`${draft.artistName} · ${draft.tracks.length} track${draft.tracks.length === 1 ? '' : 's'}`} />

        {phase === 'submitting' && stage && (
          <div className="space-y-2">
            <p className="eyebrow text-white/60">{stage.label}</p>
            <div className="h-2 bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={stage.total} aria-valuenow={stage.done}>
              <div className="h-full bg-signal transition-[width] duration-500" style={{ width: `${(stage.done / stage.total) * 100}%` }} />
            </div>
            <p className="text-xs text-white/45">Keep this tab open. Clips are cut in your browser, which can take a minute per track.</p>
          </div>
        )}

        {chosen.length > 0 && (
          <div className={cn(cardClass, 'overflow-x-auto')}>
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 border-b border-white/15">
                  <th className="font-normal py-2.5 pr-4">Track</th>
                  {chosen.map((t) => <th key={t} className="font-normal py-2.5 px-2">{targetName(t)}</th>)}
                </tr>
              </thead>
              <tbody>
                {draft.tracks.map((track) => (
                  <tr key={track.key} className="border-b border-white/10 last:border-0">
                    <td className="py-3 pr-4 font-medium max-w-[14rem] truncate">{displayTitle(track)}</td>
                    {chosen.map((t) => {
                      const included = draft.destinations[t]!.trackKeys.includes(track.key);
                      const p = progress[track.key]?.[t];
                      return (
                        <td key={t} className="py-3 px-2">
                          {included ? (
                            <span className={cn('inline-flex items-center gap-2 text-xs', p?.status === 'failed' ? 'text-error-300' : 'text-white/70')}>
                              <ProgressIcon state={p} /> <span className="truncate max-w-[10rem]">{progressLabel(p)}</span>
                            </span>
                          ) : (
                            <span className="text-white/25">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        {phase === 'done' && result && (
          <div className="paper p-5 sm:p-6 space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">{scheduled ? 'Scheduled' : 'Released'}</p>
              <h2 className="text-ink mt-1 text-4xl">{scheduled ? `Out ${formatReleaseDate(scheduled, true)}` : 'It’s out there.'}</h2>
              <p className="text-sm text-ink/75 mt-2">
                {scheduled
                  ? 'Share your smart link now to collect pre-saves. Posts go live automatically on release day.'
                  : 'Share your smart link: it points fans to every platform this release is on.'}
              </p>
            </div>
            <div className="flex items-stretch max-w-xl">
              <span className="flex-1 min-w-0 truncate bg-ink/10 border border-ink/30 px-3 py-2 font-mono text-xs text-ink">{smartLinkUrl(result.slug)}</span>
              <button type="button" onClick={copyLink} className="shrink-0 bg-ink text-signal px-3 inline-flex items-center gap-2 text-xs font-semibold hover:bg-ink/85">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/dashboard/library/${result.id}`}>
                <Button className="!bg-ink !text-signal hover:!bg-ink/85">View release</Button>
              </Link>
              <a href={`/r/${result.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="!text-ink !border-ink hover:!bg-ink hover:!text-signal" rightIcon={<ExternalLink size={14} />}>
                  Open smart link
                </Button>
              </a>
              <Button variant="ghost" className="!text-ink hover:!bg-ink/10" onClick={() => window.location.reload()}>
                Start another
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Studio / New release"
        title="New release"
        underline="zigzag"
        doodle="arrow"
        description="A single, EP or album: add it once, choose what every platform gets, and release now or on a date."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)] gap-6 items-start">
        <nav aria-label="Release steps" className="lg:sticky lg:top-8">
          <ol ref={stepsRef} className="relative flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              const clickable = i <= reached && phase === 'edit';
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => goTo(i)}
                    aria-current={current ? 'step' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-sm border whitespace-nowrap transition-colors',
                      current ? 'border-signal bg-signal text-ink font-semibold' : 'border-transparent',
                      !current && clickable && 'text-white/70 hover:border-white/20',
                      !clickable && 'text-white/30'
                    )}
                  >
                    <span className={cn('grid place-items-center h-5 w-5 font-mono text-[10px] border', current ? 'border-ink' : done ? 'border-signal bg-signal text-ink' : 'border-white/20')}>
                      {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 space-y-5">
          <div className={cardClass}>
            {stepId === 'platforms' && <StepPlatforms index={step} draft={draft} patch={patch} connections={connections} />}
            {stepId === 'details' && <StepDetails index={step} draft={draft} patch={patch} />}
            {stepId === 'tracks' && <StepTracks index={step} draft={draft} patch={patch} songwriter="" />}
            {stepId === 'destinations' && <StepDestinations index={step} draft={draft} patch={patch} />}
            {stepId === 'date' && <StepSchedule index={step} draft={draft} patch={patch} />}
            {stepId === 'splits' && (
              <div>
                <StepIntro index={step} title="Splits">
                  <p>
                    Record who’s owed what share of this release: producers, featured artists, bandmates. Collaborators get a copy by email.
                  </p>
                  <p>
                    Platforms pay the account that posts, so Unsigned doesn’t pay anyone out for you. Download the split sheet from the
                    release page to settle up. Leave it at 100% if it’s all yours.
                  </p>
                </StepIntro>
                <SplitsEditor splits={draft.splits} onChange={(splits) => patch({ splits })} />
              </div>
            )}
            {stepId === 'review' && <StepReview index={step} draft={draft} patch={patch} go={goToId} />}
          </div>

          {problems.length > 0 && (
            <Notice tone="error" className="space-y-1">
              {problems.map((p) => <p key={p}>{p}</p>)}
            </Notice>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} disabled={step === 0} onClick={() => goTo(step - 1)}>
              Back
            </Button>
            {stepId === 'review' ? (
              <Button size="lg" leftIcon={<Send size={16} />} onClick={submit}>
                {draft.timing === 'scheduled' ? 'Schedule release' : 'Release it'}
              </Button>
            ) : (
              <Button rightIcon={<ArrowRight size={16} />} onClick={next}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewRelease;
