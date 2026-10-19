import React, { useState } from 'react';
import { ChevronDown, Scissors } from 'lucide-react';
import ClipEditor from '../ClipEditor';
import { modesFor, targets as allTargets } from '../../../config/platforms';
import { cn } from '../../../utils/cn';
import { checkboxClass, inputClass, labelClass, segmentClass, segmentGroupClass } from '../styles';
import { StepIntro, type DraftPatch } from './fields';
import { displayTitle, expandCaption, releaseMediaType, type DestinationDraft, type ReleaseDraft } from './draft';
import type { Target } from '../../../types/platform';

const StepDestinations: React.FC<{ index: number; draft: ReleaseDraft; patch: DraftPatch<ReleaseDraft> }> = ({
  index,
  draft,
  patch,
}) => {
  const mediaType = releaseMediaType(draft)!;
  const [openClip, setOpenClip] = useState<string | null>(null);
  const setDest = (target: Target, p: Partial<DestinationDraft>) =>
    patch({ destinations: { ...draft.destinations, [target]: { ...draft.destinations[target]!, ...p } } });

  const chosen = draft.targets.filter((t) => draft.destinations[t]);
  const skipped = draft.targets.filter((t) => !modesFor(t, mediaType).length);
  const clipTracks = draft.tracks.filter((track) =>
    chosen.some((t) => draft.destinations[t]!.mode === 'clip' && draft.destinations[t]!.trackKeys.includes(track.key))
  );
  const firstClip = openClip ?? clipTracks[0]?.key ?? null;

  return (
    <div className="space-y-6">
      <StepIntro index={index} title="Where it goes">
        <p>
          Decide what each platform gets. Songs only go to social platforms as a clip of the hook; full tracks go to
          SoundCloud. In captions, <code className="font-mono text-signal">{'{title}'}</code> and{' '}
          <code className="font-mono text-signal">{'{artist}'}</code> are filled in for each track.
        </p>
      </StepIntro>

      {chosen.length === 0 && (
        <p className="text-sm text-white/55 border border-dashed border-white/15 px-4 py-6 text-center">
          No platforms selected. The release will be saved to your library and smart link only.
        </p>
      )}

      {chosen.map((target) => {
        const info = allTargets.find((t) => t.id === target)!;
        const dest = draft.destinations[target]!;
        const modes = modesFor(target, mediaType);
        const sample = draft.tracks.find((t) => dest.trackKeys.includes(t.key)) ?? draft.tracks[0];
        const length = sample ? expandCaption(dest.caption, sample, draft.artistName).length : dest.caption.length;
        return (
          <section key={target} className="border border-white/15 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl">{info.name}</h3>
              {modes.length > 1 ? (
                <div className={segmentGroupClass} role="group" aria-label={`${info.name} format`}>
                  {modes.map((mode) => (
                    <button key={mode} type="button" aria-pressed={dest.mode === mode} className={segmentClass(dest.mode === mode)}
                      onClick={() => setDest(target, { mode })}>
                      {mode === 'full' ? 'Full video' : 'Clip'}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="tag border border-signal/50">{modes[0] === 'clip' ? 'Clip of the hook' : 'Full track'}</span>
              )}
            </div>
            {info.note && <p className="text-xs text-white/45">{info.note}</p>}

            {draft.tracks.length > 1 && (
              <div>
                <p className={labelClass}>Tracks to post</p>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {draft.tracks.map((track, i) => (
                    <label key={track.key} className="flex items-center gap-3 text-sm border border-white/10 px-3 py-2 cursor-pointer hover:border-white/30">
                      <input type="checkbox" className={checkboxClass} checked={dest.trackKeys.includes(track.key)}
                        onChange={() =>
                          setDest(target, {
                            trackKeys: dest.trackKeys.includes(track.key)
                              ? dest.trackKeys.filter((k) => k !== track.key)
                              : draft.tracks.filter((t) => t.key === track.key || dest.trackKeys.includes(t.key)).map((t) => t.key),
                          })
                        } />
                      <span className="font-mono text-[11px] text-white/40">{String(i + 1).padStart(2, '0')}</span>
                      <span className="truncate">{displayTitle(track)}</span>
                    </label>
                  ))}
                </div>
                {dest.mode === 'clip' && dest.trackKeys.length > 2 && (
                  <p className="text-xs text-white/45 mt-2">Tip: one or two focus tracks usually do better than a burst of clips on the same day.</p>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between gap-3">
                <label className={labelClass} htmlFor={`caption-${target}`}>{target === 'youtube' || target === 'soundcloud' ? 'Description' : 'Caption'}</label>
                <span className={cn('font-mono text-[11px]', length > info.captionLimit ? 'text-error-400' : 'text-white/40')}>
                  {length}/{info.captionLimit}
                </span>
              </div>
              <textarea id={`caption-${target}`} rows={4} className={inputClass} value={dest.caption}
                onChange={(e) => setDest(target, { caption: e.target.value })} />
              {sample && (
                <p className="mt-2 text-xs text-white/40 whitespace-pre-line line-clamp-3">
                  <span className="eyebrow text-white/30 mr-2">Preview</span>
                  {expandCaption(dest.caption, sample, draft.artistName)}
                </p>
              )}
            </div>
          </section>
        );
      })}

      {skipped.length > 0 && (
        <p className="text-xs text-white/45">
          {skipped.map((t) => allTargets.find((x) => x.id === t)!.name).join(', ')} can’t take {mediaType} files, so{' '}
          {skipped.length === 1 ? 'it’s' : 'they’re'} skipped for this release.
        </p>
      )}

      {clipTracks.length > 0 && (
        <section className="border border-signal/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 bg-signal text-ink"><Scissors size={14} /></span>
            <h3 className="text-2xl">Hook clips</h3>
          </div>
          <p className="text-xs text-white/50">
            We pick the catchiest part of each song. Move it if you know better. {mediaType === 'audio' && 'Clips show your cover art.'}
          </p>
          {clipTracks.map((track) => {
            const isOpen = firstClip === track.key;
            return (
              <div key={track.key} className="border border-white/15">
                <button type="button" className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={isOpen}
                  onClick={() => setOpenClip(isOpen ? '' : track.key)}>
                  <span className="truncate font-medium">{displayTitle(track)}</span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-white/45">{track.clip.duration}s</span>
                    <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-white/10 p-4">
                    <ClipEditor
                      source={track.file}
                      mediaType={mediaType}
                      value={track.clip}
                      onChange={(clip) => patch({ tracks: draft.tracks.map((t) => (t.key === track.key ? { ...t, clip, hookSet: true } : t)) })}
                      autoPick={!track.hookSet}
                      hideCover
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default StepDestinations;
