import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Plus } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass } from '../../components/dashboard/styles';
import { HealthBadge, PageHeader, PanelTitle, StatusTag } from '../../components/dashboard/Studio';
import { CoverThumb } from './Library';
import { useAuth } from '../../context/AuthContext';
import { useConnections, useReleases } from '../../hooks/useCreatorData';
import { targetName } from '../../config/platforms';
import { formatReleaseDate, isUpcoming, KIND_LABEL } from '../../lib/releases';
import { cn } from '../../utils/cn';

const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

const Overview: React.FC = () => {
  const { profile } = useAuth();
  const { connections } = useConnections();
  const { releases } = useReleases();

  const jobs = releases
    .flatMap((r) => r.tracks.flatMap((t) => t.jobs.map((job) => ({ ...job, title: t.title, releaseId: r.id }))))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const live = jobs.filter((j) => j.status === 'published').length;
  const upcoming = releases.filter(isUpcoming).sort((a, b) => a.release_at!.localeCompare(b.release_at!));
  const attention = releases.filter((r) => r.health === 'attention');

  const stats = [
    { label: 'Releases', value: releases.length },
    { label: 'Posts live', value: live },
    { label: 'Smart-link visits', value: releases.reduce((sum, r) => sum + r.smart_link_visits, 0) },
    { label: 'Platforms connected', value: connections.length },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Studio / Overview"
        title={<>Hey {profile?.display_name ?? 'there'}</>}
        description="Put out a single, EP or album, and push it everywhere."
        doodle="sparkle"
        actions={
          <Link to="/dashboard/publish">
            <Button leftIcon={<Plus size={16} />}>New release</Button>
          </Link>
        }
      />

      <div className="paper grid grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              'px-5 py-5 sm:px-6 sm:py-6',
              i % 2 === 1 && 'border-l border-ink/20',
              i >= 2 && 'border-t lg:border-t-0 border-ink/20',
              i === 2 && 'lg:border-l'
            )}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">
              {String(i + 1).padStart(2, '0')} · {s.label}
            </p>
            <p className="mt-2 font-sans font-black text-4xl sm:text-6xl leading-none tracking-[-0.05em] tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {connections.length === 0 && (
        <div className={cn(cardClass, 'border-signal/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4')}>
          <div>
            <p className="eyebrow text-signal mb-2">First step</p>
            <h3>Connect your first platform</h3>
            <p className="text-sm text-white/60 mt-2">Link YouTube, TikTok, Instagram, Facebook or SoundCloud to start releasing.</p>
          </div>
          <Link to="/dashboard/connections" className="shrink-0">
            <Button variant="outline" rightIcon={<ArrowRight size={16} />}>Connect</Button>
          </Link>
        </div>
      )}

      {attention.map((r) => (
        <Link key={r.id} to={`/dashboard/library/${r.id}`}
          className="flex items-center justify-between gap-4 border border-error-400/60 px-4 py-3 hover:bg-error-400/5">
          <span className="min-w-0">
            <HealthBadge health="attention" />
            <span className="block mt-1 truncate font-medium">{r.title}: some posts failed</span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-error-300" />
        </Link>
      ))}

      {upcoming.length > 0 && (
        <section className={cardClass}>
          <PanelTitle aside={<CalendarClock size={18} className="text-signal shrink-0" />}>Coming up</PanelTitle>
          <ul className="space-y-3">
            {upcoming.map((r) => (
              <li key={r.id}>
                <Link to={`/dashboard/library/${r.id}`} className="group flex items-center gap-4 border border-white/10 p-3 hover:border-signal/60">
                  <CoverThumb release={r} className="h-14 w-14" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium group-hover:text-signal">{r.title}</span>
                    <span className="block font-mono text-[11px] text-white/45 truncate">
                      {KIND_LABEL[r.kind]} · {formatReleaseDate(r.release_at, true)}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-sans font-black text-3xl leading-none tabular-nums text-signal">{daysUntil(r.release_at!)}</span>
                    <span className="block eyebrow text-white/40">days to go</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/45 mt-4">Share each release’s smart link now: it collects pre-saves until release day.</p>
        </section>
      )}

      <section className={cardClass}>
        <PanelTitle
          aside={
            releases.length > 0 && (
              <Link to="/dashboard/library" className="eyebrow text-white/50 hover:text-signal shrink-0">
                My music →
              </Link>
            )
          }
        >
          Recent activity
        </PanelTitle>
        {jobs.length === 0 ? (
          <p className="text-sm text-white/50">Nothing posted yet. Your posts will show up here.</p>
        ) : (
          <ul className="divide-y divide-white/10 border-t border-white/10">
            {jobs.slice(0, 10).map((job) => (
              <li key={job.id} className="py-3.5 flex items-center justify-between gap-4 text-sm">
                <Link to={`/dashboard/library/${job.releaseId}`} className="min-w-0 hover:text-signal">
                  <p className="truncate font-medium">{job.title}</p>
                  <p className="font-mono text-[11px] text-white/45 mt-0.5 truncate">
                    {targetName(job.target)} ·{' '}
                    {job.status === 'scheduled' && job.scheduled_for
                      ? `goes live ${formatReleaseDate(job.scheduled_for, true)}`
                      : new Date(job.updated_at).toLocaleString()}
                  </p>
                  {job.error && <p className="text-xs text-error-400 truncate mt-0.5">{job.error}</p>}
                </Link>
                <StatusTag status={job.status} href={job.external_url} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Overview;
