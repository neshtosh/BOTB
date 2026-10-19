import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass } from '../../components/dashboard/styles';
import { targetName, targets } from '../../config/platforms';
import { apiFetch, supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/formatters';
import type { PostMetrics, PublishJob, Target } from '../../types/platform';

interface PostRow extends PublishJob {
  content_items: { title: string; parent_id: string | null } | null;
  // One-to-one embed; PostgREST may return it as an object or a 1-item array.
  post_metrics: PostMetrics | PostMetrics[] | null;
}

type MetricKey = 'views' | 'likes' | 'comments' | 'shares';
const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'views', label: 'Views / plays' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
];

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const show = (n: number | null | undefined) => (n === null || n === undefined ? '–' : compact.format(n));
const metricsOf = (row: PostRow) => (Array.isArray(row.post_metrics) ? row.post_metrics[0] : row.post_metrics) ?? null;

const Analytics: React.FC = () => {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Target | 'all'>('all');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('publish_jobs')
      .select('*, content_items(title, parent_id), post_metrics(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    setRows((data as PostRow[]) ?? []);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch<{ errors: Record<string, string> }>('/api/analytics', { method: 'POST' });
      setErrors(res.errors);
    } catch (err) {
      setErrors({ all: err instanceof Error ? err.message : 'Could not refresh stats.' });
    }
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => rows.filter((r) => filter === 'all' || r.target === filter), [rows, filter]);

  const totals = useMemo(() => {
    const sum = (key: MetricKey) => visible.reduce((acc, r) => acc + (metricsOf(r)?.[key] ?? 0), 0);
    return Object.fromEntries(METRICS.map((m) => [m.key, sum(m.key)])) as Record<MetricKey, number>;
  }, [visible]);

  const byPlatform = useMemo(() => {
    const list = targets
      .map((t) => ({
        id: t.id,
        name: t.name,
        posts: rows.filter((r) => r.target === t.id).length,
        views: rows.filter((r) => r.target === t.id).reduce((acc, r) => acc + (metricsOf(r)?.views ?? 0), 0),
      }))
      .filter((p) => p.posts > 0);
    const max = Math.max(1, ...list.map((p) => p.views));
    return list.map((p) => ({ ...p, pct: (p.views / max) * 100 }));
  }, [rows]);

  const lastFetched = rows
    .map((r) => metricsOf(r)?.fetched_at)
    .filter(Boolean)
    .sort()
    .pop();

  const sorted = [...visible].sort((a, b) => (metricsOf(b)?.views ?? -1) - (metricsOf(a)?.views ?? -1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Analytics</h1>
          <p className="text-surface-600 mt-1">
            How your posts are doing on every platform.
            {lastFetched && ` Updated ${new Date(lastFetched).toLocaleString()}.`}
          </p>
        </div>
        <Button onClick={refresh} isLoading={refreshing} leftIcon={<RefreshCw size={16} />} disabled={rows.length === 0}>
          Refresh stats
        </Button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-warning-300 space-y-1">
          {Object.entries(errors).map(([target, message]) => (
            <p key={target}>
              <span className="font-medium">{target === 'all' ? 'Error' : targetName(target as Target)}:</span> {message}
            </p>
          ))}
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <div className={`${cardClass} flex flex-col items-center text-center py-12`}>
          <BarChart3 size={40} className="text-surface-500 mb-3" />
          <h4>No published posts yet</h4>
          <p className="text-sm text-surface-600 mt-1">Publish something and its stats will show up here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', ...byPlatform.map((p) => p.id)] as (Target | 'all')[]).map((id) => (
              <Button key={id} size="sm" variant={filter === id ? 'primary' : 'ghost'} onClick={() => setFilter(id)}>
                {id === 'all' ? 'All platforms' : targetName(id)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <div key={m.key} className={cardClass}>
                <p className="text-sm text-surface-600">{m.label}</p>
                <p className="text-3xl font-bold mt-1 tabular-nums">{show(totals[m.key])}</p>
              </div>
            ))}
          </div>

          {filter === 'all' && byPlatform.length > 0 && (
            <div className={cardClass}>
              <h4 className="mb-4">Views by platform</h4>
              <div className="space-y-3" role="list">
                {byPlatform.map((p) => (
                  <div key={p.id} role="listitem" className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 group"
                    title={`${p.name}: ${p.views.toLocaleString()} views across ${p.posts} post${p.posts === 1 ? '' : 's'}`}>
                    <span className="text-sm text-surface-800 truncate">{p.name}</span>
                    <div className="h-3 rounded-full bg-surface-200">
                      <div className="h-full rounded-full bg-primary-500 group-hover:bg-primary-400 transition-colors"
                        style={{ width: `${Math.max(p.pct, p.views ? 2 : 0)}%` }} />
                    </div>
                    <span className="text-sm text-surface-800 text-right tabular-nums">{show(p.views)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${cardClass} overflow-x-auto`}>
            <h4 className="mb-4">Posts</h4>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-surface-600 border-b border-surface-300/40">
                  <th className="font-medium py-2 pr-4">Post</th>
                  <th className="font-medium py-2 pr-4">Platform</th>
                  {METRICS.map((m) => (
                    <th key={m.key} className="font-medium py-2 px-2 text-right">{m.label.split(' ')[0]}</th>
                  ))}
                  <th className="py-2 pl-2" aria-label="Link" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const m = metricsOf(row);
                  return (
                    <tr key={row.id} className="border-b border-surface-300/20 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium truncate max-w-[16rem]">{row.content_items?.title ?? 'Untitled'}</p>
                        <p className="text-xs text-surface-600">{formatDate(row.created_at)}</p>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {targetName(row.target)}
                        {row.content_items?.parent_id && <span className="text-xs text-surface-600"> · clip</span>}
                      </td>
                      {METRICS.map((metric) => (
                        <td key={metric.key} className="py-2.5 px-2 text-right tabular-nums">{show(m?.[metric.key])}</td>
                      ))}
                      <td className="py-2.5 pl-2 text-right">
                        {row.external_url && (
                          <a href={row.external_url} target="_blank" rel="noopener noreferrer" aria-label="Open post"
                            className="text-surface-600 hover:text-white inline-flex">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-surface-600 mt-3">
              “–” means the platform hasn't reported that number (or the stat needs extra permissions; reconnect the account).
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
