import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UploadCloud } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass } from '../../components/dashboard/styles';
import { useAuth } from '../../context/AuthContext';
import { useConnections, useLibrary } from '../../hooks/useCreatorData';
import { targetName } from '../../config/platforms';
import { cn } from '../../utils/cn';

const statusStyles = {
  queued: 'text-surface-600',
  processing: 'text-primary-400',
  published: 'text-success-400',
  failed: 'text-error-400',
};

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
    { label: 'Connected platforms', value: connections.length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Hey {profile?.display_name ?? 'there'} 👋</h1>
          <p className="text-surface-600 mt-1">Upload once and push it everywhere.</p>
        </div>
        <Link to="/dashboard/publish">
          <Button leftIcon={<UploadCloud size={16} />}>New upload</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={cardClass}>
            <p className="text-sm text-surface-600">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {connections.length === 0 && (
        <div className={cn(cardClass, 'flex flex-col sm:flex-row sm:items-center justify-between gap-4')}>
          <div>
            <h4>Connect your first platform</h4>
            <p className="text-sm text-surface-600">Link YouTube, TikTok, Instagram, Facebook or SoundCloud to start publishing.</p>
          </div>
          <Link to="/dashboard/connections">
            <Button variant="outline" rightIcon={<ArrowRight size={16} />}>Connect</Button>
          </Link>
        </div>
      )}

      <div className={cardClass}>
        <h4 className="mb-4">Recent activity</h4>
        {jobs.length === 0 ? (
          <p className="text-sm text-surface-600">Nothing published yet.</p>
        ) : (
          <ul className="divide-y divide-surface-300/40">
            {jobs.slice(0, 10).map((job) => (
              <li key={job.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{job.title}</p>
                  <p className="text-surface-600">
                    {targetName(job.target)} · {new Date(job.created_at).toLocaleString()}
                  </p>
                  {job.error && <p className="text-xs text-error-400 truncate">{job.error}</p>}
                </div>
                {job.external_url ? (
                  <a href={job.external_url} target="_blank" rel="noopener noreferrer" className={statusStyles[job.status]}>
                    {job.status} ↗
                  </a>
                ) : (
                  <span className={statusStyles[job.status]}>{job.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Overview;
