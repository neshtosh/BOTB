import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Disc3, Eye, Link2, Plus } from 'lucide-react';
import Button from '../../components/common/Button';
import { iconButtonClass, segmentClass, segmentGroupClass } from '../../components/dashboard/styles';
import { HealthBadge, PageHeader } from '../../components/dashboard/Studio';
import { useReleases, type ReleaseWithTracks } from '../../hooks/useCreatorData';
import { formatReleaseDate, isUpcoming, KIND_LABEL, smartLinkUrl } from '../../lib/releases';
import { cn } from '../../utils/cn';
import type { ReleaseHealth } from '../../types/platform';

type Filter = 'all' | ReleaseHealth;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'processing', label: 'Processing' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'draft', label: 'Library only' },
];

export const CoverThumb: React.FC<{ release: Pick<ReleaseWithTracks, 'coverUrl' | 'title'>; className?: string }> = ({ release, className }) => (
  <div className={cn('relative shrink-0 bg-signal text-ink grid place-items-center overflow-hidden', className)}>
    {release.coverUrl ? <img src={release.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Disc3 size={22} />}
  </div>
);

const CopyLink: React.FC<{ slug: string }> = ({ slug }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={iconButtonClass}
      aria-label="Copy smart link"
      title="Copy smart link"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(smartLinkUrl(slug));
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked; the release page shows the link in full.
        }
      }}
    >
      {copied ? <Check size={16} className="text-signal" /> : <Copy size={16} />}
    </button>
  );
};

const Library: React.FC = () => {
  const { releases, loading } = useReleases();
  const [filter, setFilter] = useState<Filter>('all');
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, f.id === 'all' ? releases.length : releases.filter((r) => r.health === f.id).length]));
  const visible = releases.filter((r) => filter === 'all' || r.health === filter);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Studio / My music · ${releases.length} release${releases.length === 1 ? '' : 's'}`}
        title="My music"
        description="Every release, where it’s live, and its smart link. Open one to edit it, post it to more platforms or check its splits."
        underline="double"
        doodle="notes"
        actions={<Link to="/dashboard/publish"><Button leftIcon={<Plus size={16} />}>New release</Button></Link>}
      />

      {releases.length > 0 && (
        <div className={segmentGroupClass} role="group" aria-label="Filter releases">
          {FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0).map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} className={segmentClass(filter === f.id)} onClick={() => setFilter(f.id)}>
              {f.label} <span className="opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <p className="eyebrow text-white/50">Loading…</p>}
      {!loading && releases.length === 0 && (
        <div className="border border-dashed border-white/20 p-8 text-center">
          <h3>No releases yet</h3>
          <p className="text-sm text-white/55 mt-2">Put out a single, EP or album and it lives here.</p>
          <Link to="/dashboard/publish" className="inline-block mt-5"><Button>Start a release</Button></Link>
        </div>
      )}

      <ul className="space-y-3">
        {visible.map((release) => {
          const live = release.jobs.filter((j) => j.status === 'published');
          const platforms = [...new Set(live.map((j) => j.target))].length;
          const upcoming = isUpcoming(release);
          return (
            <li key={release.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-4 border border-white/15 bg-ink p-4 hover:border-white/35 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <CoverThumb release={release} className="h-16 w-16 sm:h-20 sm:w-20" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="tag-yellow">{KIND_LABEL[release.kind]}</span>
                    <HealthBadge health={release.health} />
                  </div>
                  <Link to={`/dashboard/library/${release.id}`} className="block after:absolute after:inset-0">
                    <h3 className="truncate group-hover:text-signal transition-colors">{release.title}</h3>
                  </Link>
                  <p className="font-mono text-[11px] text-white/45 mt-1 truncate">
                    {release.artist_name} · {release.tracks.length} track{release.tracks.length === 1 ? '' : 's'} ·{' '}
                    {upcoming ? `out ${formatReleaseDate(release.release_at, true)}` : formatReleaseDate(release.release_at ?? release.created_at)}
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-4 sm:gap-5 shrink-0 pl-20 sm:pl-0">
                <span className="text-right">
                  <span className="block font-mono text-sm tabular-nums">{platforms}</span>
                  <span className="block eyebrow text-white/40">Platforms</span>
                </span>
                <span className="text-right">
                  <span className="flex items-center justify-end gap-1 font-mono text-sm tabular-nums"><Eye size={12} className="text-white/40" />{release.smart_link_visits}</span>
                  <span className="block eyebrow text-white/40">Visits</span>
                </span>
                <CopyLink slug={release.slug} />
                <a href={`/r/${release.slug}`} target="_blank" rel="noopener noreferrer" className={iconButtonClass} aria-label="Open smart link" title="Open smart link">
                  <Link2 size={16} />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Library;
