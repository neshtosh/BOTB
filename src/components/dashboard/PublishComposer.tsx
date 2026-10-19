import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ExternalLink, Loader2, Scissors, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { distributionOnly, modesFor, targetsFor } from '../../config/platforms';
import { needsClip, PublishPlan, TargetProgress, toggleTarget } from '../../lib/publishPlan';
import ClipEditor from './ClipEditor';
import { checkboxClass, inputClass, labelClass, segmentClass, segmentGroupClass } from './styles';
import type { MediaType, PlatformConnection, Target } from '../../types/platform';

interface PublishComposerProps {
  mediaType: MediaType;
  connections: PlatformConnection[];
  plan: PublishPlan;
  onChange: (next: PublishPlan) => void;
  defaultCaption: string;
  // The original file, needed for clipping. null while it is still loading.
  source: File | null;
  sourceError?: string;
  progress?: Partial<Record<Target, TargetProgress>>;
  alreadyPublished?: Target[];
  disabled?: boolean;
}

export const ProgressIcon: React.FC<{ state?: TargetProgress }> = ({ state }) => {
  if (!state) return null;
  switch (state.status) {
    case 'rendering':
      return (
        <span className="flex items-center gap-1 font-mono text-[11px] text-signal">
          <Scissors size={14} /> {Math.round(state.fraction * 100)}%
        </span>
      );
    case 'processing':
      return <Loader2 size={18} className="animate-spin text-signal" />;
    case 'scheduled':
      return <CalendarClock size={18} className="text-signal" aria-label="Scheduled" />;
    case 'failed':
      return <XCircle size={18} className="text-error-400" />;
    case 'published':
      return state.url ? (
        <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-signal hover:text-white" aria-label="View post">
          <ExternalLink size={18} />
        </a>
      ) : (
        <CheckCircle2 size={18} className="text-signal" />
      );
  }
};

const PublishComposer: React.FC<PublishComposerProps> = ({
  mediaType,
  connections,
  plan,
  onChange,
  defaultCaption,
  source,
  sourceError,
  progress = {},
  alreadyPublished = [],
  disabled,
}) => {
  const connectedProviders = new Set(connections.map((c) => c.provider));

  const setTargetPlan = (target: Target, patch: Partial<NonNullable<PublishPlan['perTarget'][Target]>>) =>
    onChange({
      ...plan,
      perTarget: { ...plan.perTarget, [target]: { ...plan.perTarget[target]!, ...patch } },
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {targetsFor(mediaType).map((target) => {
          const connected = connectedProviders.has(target.provider);
          const selected = plan.targets.includes(target.id);
          const settings = plan.perTarget[target.id];
          const modes = modesFor(target.id, mediaType);
          const state = progress[target.id];
          return (
            <div
              key={target.id}
              className={cn(
                'border transition-colors',
                selected ? 'border-signal bg-signal/[0.04]' : 'border-white/15 hover:border-white/30',
                !connected && 'border-dashed'
              )}
            >
              <label className={cn('flex items-start gap-3 px-4 py-3', connected && !disabled && 'cursor-pointer')}>
                <input
                  type="checkbox"
                  className={cn(checkboxClass, 'mt-0.5')}
                  checked={selected}
                  disabled={!connected || disabled}
                  onChange={() => onChange(toggleTarget(plan, target.id, mediaType, defaultCaption))}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-medium', !connected && 'text-white/50')}>{target.name}</span>
                    {mediaType === 'audio' && target.social && (
                      <span className="tag border border-signal/50">Clip only</span>
                    )}
                    {alreadyPublished.includes(target.id) && (
                      <span className="tag-yellow">Published</span>
                    )}
                    {!connected && (
                      <Link to="/dashboard/connections" className="eyebrow text-signal hover:text-white underline underline-offset-4">
                        Connect account
                      </Link>
                    )}
                  </div>
                  {target.note && <p className="text-xs text-white/45 mt-1">{target.note}</p>}
                  {state?.status === 'failed' && <p className="text-xs text-error-400 mt-1 break-words">{state.error}</p>}
                </div>
                <span className="shrink-0 mt-0.5">
                  <ProgressIcon state={state} />
                </span>
              </label>

              {selected && settings && (
                <div className="mx-4 pb-4 pt-4 space-y-4 border-t border-signal/20">
                  {modes.length > 1 && (
                    <div className={segmentGroupClass} role="group" aria-label={`${target.name} format`}>
                      {modes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          disabled={disabled}
                          aria-pressed={settings.mode === mode}
                          onClick={() => setTargetPlan(target.id, { mode })}
                          className={segmentClass(settings.mode === mode)}
                        >
                          {mode === 'full' ? 'Full video' : 'Clip'}
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between">
                      <label className={labelClass} htmlFor={`caption-${target.id}`}>
                        {target.id === 'youtube' || target.id === 'soundcloud' ? 'Description' : 'Caption'}
                      </label>
                      <span className={cn('text-xs', settings.caption.length > target.captionLimit ? 'text-error-400' : 'text-white/40')}>
                        {settings.caption.length}/{target.captionLimit}
                      </span>
                    </div>
                    <textarea
                      id={`caption-${target.id}`}
                      rows={3}
                      maxLength={target.captionLimit}
                      className={inputClass}
                      disabled={disabled}
                      value={settings.caption}
                      onChange={(e) => setTargetPlan(target.id, { caption: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {needsClip(plan) && (
        <div className="border border-signal/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 bg-signal text-ink"><Scissors size={14} /></span>
            <h3 className="text-2xl">Clip for social</h3>
          </div>
          <p className="text-xs text-white/50">
            One vertical clip is made and shared by every platform set to “Clip”.
          </p>
          {source ? (
            <ClipEditor
              source={source}
              mediaType={mediaType}
              value={plan.clip}
              onChange={(clip) => onChange({ ...plan, clip })}
              disabled={disabled}
            />
          ) : (
            <p className="text-sm text-white/50">{sourceError || 'Loading the original file…'}</p>
          )}
        </div>
      )}

      {mediaType === 'audio' && (
        <div className="border border-dashed border-white/15 px-4 py-3 text-xs text-white/45 space-y-1">
          {distributionOnly.map((d) => (
            <p key={d.name}>
              <span className="text-white/75 font-medium">{d.name}:</span> {d.reason} Distributor integration is
              coming soon.
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublishComposer;
