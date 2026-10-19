import React from 'react';
import { Link } from 'react-router-dom';
import { distributionOnly, targets } from '../../../config/platforms';
import { cn } from '../../../utils/cn';
import { checkboxClass } from '../styles';
import { StepIntro, type DraftPatch } from './fields';
import type { ReleaseDraft } from './draft';
import type { PlatformConnection, Target } from '../../../types/platform';

const ACCEPTS: Record<Target, string> = {
  youtube: 'Full videos, or Shorts clips of songs',
  tiktok: 'Clips of songs, or full short videos',
  instagram: 'Reels: clips of songs, or full short videos',
  facebook: 'Page videos: clips of songs, or full videos',
  soundcloud: 'Full tracks (audio only)',
};

const StepPlatforms: React.FC<{
  index: number;
  draft: ReleaseDraft;
  patch: DraftPatch<ReleaseDraft>;
  connections: PlatformConnection[];
}> = ({ index, draft, patch, connections }) => {
  const connected = new Set(connections.map((c) => c.provider));
  const available = targets.filter((t) => connected.has(t.provider)).map((t) => t.id);
  const toggle = (id: Target) =>
    patch({ targets: draft.targets.includes(id) ? draft.targets.filter((t) => t !== id) : [...draft.targets, id] });

  return (
    <div>
      <StepIntro index={index} title="Where should it go?">
        <p>Pick the platforms for this release. You choose exactly what each one gets in “Where it goes”.</p>
      </StepIntro>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <span className="eyebrow text-white/40">
          {draft.targets.length} of {available.length} connected selected
        </span>
        {available.length > 0 && (
          <button
            type="button"
            className="eyebrow text-signal hover:text-white"
            onClick={() => patch({ targets: draft.targets.length === available.length ? [] : available })}
          >
            {draft.targets.length === available.length ? 'Clear all' : 'Select all connected'}
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {targets.map((t) => {
          const isConnected = connected.has(t.provider);
          const selected = draft.targets.includes(t.id);
          return (
            <label
              key={t.id}
              className={cn(
                'flex items-start gap-3 border px-4 py-3.5 transition-colors',
                selected ? 'border-signal bg-signal/[0.05]' : 'border-white/15',
                isConnected ? 'cursor-pointer hover:border-white/35' : 'border-dashed'
              )}
            >
              <input
                type="checkbox"
                className={cn(checkboxClass, 'mt-0.5')}
                checked={selected}
                disabled={!isConnected}
                onChange={() => toggle(t.id)}
              />
              <span className="min-w-0 flex-1">
                <span className={cn('block font-medium', !isConnected && 'text-white/45')}>{t.name}</span>
                <span className="block text-xs text-white/45 mt-0.5">{ACCEPTS[t.id]}</span>
                {!isConnected && (
                  <Link to="/dashboard/connections" className="eyebrow text-signal underline underline-offset-4 hover:text-white mt-2 inline-block">
                    Connect account
                  </Link>
                )}
              </span>
            </label>
          );
        })}
        {distributionOnly.map((d) => (
          <div key={d.name} className="flex items-start gap-3 border border-dashed border-white/10 px-4 py-3.5 opacity-70">
            <span className="h-4 w-4 mt-0.5 border border-white/20 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-medium text-white/50">
                {d.name} <span className="tag !bg-white/10 !text-white/50">Coming soon</span>
              </span>
              <span className="block text-xs text-white/40 mt-0.5">{d.reason}</span>
            </span>
          </div>
        ))}
      </div>

      {draft.targets.length === 0 && (
        <p className="mt-4 text-sm text-white/50 border-l-2 border-white/20 pl-3">
          No platforms selected: the release is saved to your library and smart link only. You can post it later.
        </p>
      )}
    </div>
  );
};

export default StepPlatforms;
