import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UploadCloud } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass } from '../../components/dashboard/styles';
import { PageHeader, PanelTitle, StatusTag } from '../../components/dashboard/Studio';
import { useAuth } from '../../context/AuthContext';
import { useConnections, useLibrary } from '../../hooks/useCreatorData';
import { targetName } from '../../config/platforms';
import { cn } from '../../utils/cn';

const Overview: React.FC = () => {
  const { profile } = useAuth();
  const { connections } = useConnections();
  const { items } = useLibrary();

  const jobs = items
    .flatMap((item) => item.jobs.map((job) => ({ ...job, title: item.title })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const publishedCount = jobs.filter((j) => j.status === 'published').length;

  const stats = [
    { label: 'Uploads', value: items.length },
    { label: 'Posts published', value: publishedCount },
    { label: 'Platforms connected', value: connections.length },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Studio / Overview"
        title={<>Hey {profile?.display_name ?? 'there'}</>}
        description="Upload once and push it everywhere."
        doodle="sparkle"
        actions={
          <Link to="/dashboard/publish">
            <Button leftIcon={<UploadCloud size={16} />}>New upload</Button>
          </Link>
        }
      />

      <div className="paper grid grid-cols-1 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn('px-5 py-5 sm:px-6 sm:py-6', i > 0 && 'border-t sm:border-t-0 sm:border-l border-ink/20')}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">
              {String(i + 1).padStart(2, '0')} · {s.label}
            </p>
            <p className="mt-2 font-sans font-black text-5xl sm:text-6xl leading-none tracking-[-0.05em] tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {connections.length === 0 && (
        <div className={cn(cardClass, 'border-signal/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4')}>
          <div>
            <p className="eyebrow text-signal mb-2">First step</p>
            <h3>Connect your first platform</h3>
            <p className="text-sm text-white/60 mt-2">
              Link YouTube, TikTok, Instagram, Facebook or SoundCloud to start publishing.
            </p>
          </div>
          <Link to="/dashboard/connections" className="shrink-0">
            <Button variant="outline" rightIcon={<ArrowRight size={16} />}>Connect</Button>
          </Link>
        </div>
      )}

      <section className={cardClass}>
        <PanelTitle
          aside={
            jobs.length > 0 && (
              <Link to="/dashboard/library" className="eyebrow text-white/50 hover:text-signal shrink-0">
                Library →
              </Link>
            )
          }
        >
          Recent activity
        </PanelTitle>
        {jobs.length === 0 ? (
          <p className="text-sm text-white/50">Nothing published yet. Your posts will show up here.</p>
        ) : (
          <ul className="divide-y divide-white/10 border-t border-white/10">
            {jobs.slice(0, 10).map((job) => (
              <li key={job.id} className="py-3.5 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{job.title}</p>
                  <p className="font-mono text-[11px] text-white/45 mt-0.5 truncate">
                    {targetName(job.target)} · {new Date(job.created_at).toLocaleString()}
                  </p>
                  {job.error && <p className="text-xs text-error-400 truncate mt-0.5">{job.error}</p>}
                </div>
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
