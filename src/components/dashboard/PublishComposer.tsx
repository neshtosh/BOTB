import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Loader2, Scissors, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { distributionOnly, modesFor, targetsFor } from '../../config/platforms';
import { needsClip, PublishPlan, TargetProgress, toggleTarget } from '../../lib/publishPlan';
import ClipEditor from './ClipEditor';
import { inputClass, labelClass } from './styles';
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

const ProgressIcon: React.FC<{ state?: TargetProgress }> = ({ state }) => {
  if (!state) return null;
  switch (state.status) {
    case 'rendering':
      return (
        <span className="flex items-center gap-1 text-xs text-accent-300">
          <Scissors size={14} /> {Math.round(state.fraction * 100)}%
        </span>
      );
    case 'processing':
      return <Loader2 size={18} className="animate-spin text-primary-400" />;
    case 'failed':
      return <XCircle size={18} className="text-error-400" />;
    case 'published':
      return state.url ? (
        <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-success-400" aria-label="View post">
          <ExternalLink size={18} />
        </a>
      ) : (
        <CheckCircle2 size={18} className="text-success-400" />
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
                'rounded-xl border transition-colors',
                selected ? 'border-primary-500 bg-primary-500/5' : 'border-surface-300',
                !connected && 'opacity-70'
              )}
            >
              <label className={cn('flex items-start gap-3 px-4 py-3', connected && !disabled && 'cursor-pointer')}>
                <input
                  type="checkbox"
                  className="mt-1 accent-primary-500"
                  checked={selected}
                  disabled={!connected || disabled}
                  onChange={() => onChange(toggleTarget(plan, target.id, mediaType, defaultCaption))}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{target.name}</span>
                    {mediaType === 'audio' && target.social && (
                      <span className="text-2xs bg-accent-500/20 text-accent-300 rounded-full px-2 py-0.5">Clip only</span>
                    )}
                    {alreadyPublished.includes(target.id) && (
                      <span className="text-2xs bg-success-500/20 text-success-300 rounded-full px-2 py-0.5">Published</span>
                    )}
                    {!connected && (
                      <Link to="/dashboard/connections" className="text-xs text-primary-400 hover:text-primary-300">
                        Connect account
                      </Link>
                    )}
                  </div>
                  {target.note && <p className="text-xs text-surface-600 mt-0.5">{target.note}</p>}
                  {state?.status === 'failed' && <p className="text-xs text-error-400 mt-1 break-words">{state.error}</p>}
                </div>
                <span className="shrink-0 mt-0.5">
                  <ProgressIcon state={state} />
                </span>
              </label>

              {selected && settings && (
                <div className="px-4 pb-4 space-y-3">
                  {modes.length > 1 && (
                    <div className="flex rounded-full bg-surface-200 p-0.5 w-fit">
                      {modes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          disabled={disabled}
                          onClick={() => setTargetPlan(target.id, { mode })}
                          className={cn(
                            'text-xs rounded-full px-3 py-1',
                            settings.mode === mode ? 'bg-signal text-ink font-semibold' : 'text-surface-700'
                          )}
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
                      <span className={cn('text-xs', settings.caption.length > target.captionLimit ? 'text-error-400' : 'text-surface-600')}>
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
        <div className="rounded-xl border border-accent-500/40 bg-accent-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Scissors size={16} className="text-accent-300" />
            <h5 className="text-base">Clip for social</h5>
          </div>
          <p className="text-xs text-surface-600">
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
            <p className="text-sm text-surface-600">{sourceError || 'Loading the original file…'}</p>
          )}
        </div>
      )}

      {mediaType === 'audio' && (
        <div className="rounded-xl border border-dashed border-surface-400 px-4 py-3 text-xs text-surface-600">
          {distributionOnly.map((d) => (
            <p key={d.name}>
              <span className="text-surface-800 font-medium">{d.name}:</span> {d.reason} Distributor integration is
              coming soon.
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublishComposer;
