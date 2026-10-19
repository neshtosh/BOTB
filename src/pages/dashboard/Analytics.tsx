import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass, segmentClass, segmentGroupClass } from '../../components/dashboard/styles';
import { Notice, PageHeader, PanelTitle } from '../../components/dashboard/Studio';
import { cn } from '../../utils/cn';
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Studio / Analytics"
        title="Analytics"
        underline="slash"
        doodle="waveform"
        description={
          <>
            How your posts are doing on every platform.
            {lastFetched && (
              <span className="block mt-1 font-mono text-[11px] text-white/40">
                Updated {new Date(lastFetched).toLocaleString()}
              </span>
            )}
          </>
        }
        actions={
          <Button onClick={refresh} isLoading={refreshing} leftIcon={<RefreshCw size={16} />} disabled={rows.length === 0}>
            Refresh stats
          </Button>
        }
      />

      {Object.keys(errors).length > 0 && (
        <Notice tone="warn" className="space-y-1">
          {Object.entries(errors).map(([target, message]) => (
            <p key={target}>
              <span className="font-medium">{target === 'all' ? 'Error' : targetName(target as Target)}:</span> {message}
            </p>
          ))}
        </Notice>
      )}

      {!loading && rows.length === 0 ? (
        <div className="border border-dashed border-white/20 flex flex-col items-center text-center py-12 px-6">
          <BarChart3 size={36} className="text-signal mb-4" />
          <h3>No published posts yet</h3>
          <p className="text-sm text-white/55 mt-2">Publish something and its stats will show up here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-white/40">Filter</span>
            <div className={segmentGroupClass} role="group" aria-label="Filter by platform">
              {(['all', ...byPlatform.map((p) => p.id)] as (Target | 'all')[]).map((id) => (
                <button key={id} type="button" aria-pressed={filter === id} className={segmentClass(filter === id)}
                  onClick={() => setFilter(id)}>
                  {id === 'all' ? 'All platforms' : targetName(id)}
                </button>
              ))}
            </div>
          </div>

          <div className="paper grid grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <div
                key={m.key}
                className={cn(
                  'px-5 py-5 sm:px-6',
                  i % 2 === 1 && 'border-l border-ink/20',
                  i >= 2 && 'border-t lg:border-t-0 border-ink/20',
                  i === 2 && 'lg:border-l'
                )}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">{m.label}</p>
                <p className="mt-2 font-sans font-black text-4xl sm:text-5xl leading-none tracking-[-0.05em] tabular-nums">
                  {show(totals[m.key])}
                </p>
              </div>
            ))}
          </div>

          {filter === 'all' && byPlatform.length > 0 && (
            <section className={cardClass}>
              <PanelTitle index="01">Views by platform</PanelTitle>
              <div className="space-y-4" role="list">
                {byPlatform.map((p) => (
                  <div key={p.id} role="listitem" className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] sm:grid-cols-[8rem_minmax(0,1fr)_4rem] items-center gap-3 group"
                    title={`${p.name}: ${p.views.toLocaleString()} views across ${p.posts} post${p.posts === 1 ? '' : 's'}`}>
                    <span className="text-sm text-white/75 truncate">{p.name}</span>
                    <div className="h-4 bg-white/[0.06] border border-white/10">
                      <div className="h-full bg-signal group-hover:bg-white transition-colors"
                        style={{ width: `${Math.max(p.pct, p.views ? 2 : 0)}%` }} />
                    </div>
                    <span className="font-mono text-sm text-white/80 text-right tabular-nums">{show(p.views)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={cardClass}>
            <PanelTitle index={filter === 'all' && byPlatform.length > 0 ? '02' : '01'}
              aside={<span className="eyebrow text-white/40 shrink-0">{sorted.length} post{sorted.length === 1 ? '' : 's'}</span>}>
              Posts
            </PanelTitle>
            <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 border-b border-white/15">
                    <th className="font-normal py-2.5 pr-4">Post</th>
                    <th className="font-normal py-2.5 pr-4">Platform</th>
                    {METRICS.map((m) => (
                      <th key={m.key} className="font-normal py-2.5 px-2 text-right">{m.label.split(' ')[0]}</th>
                    ))}
                    <th className="py-2.5 pl-2" aria-label="Link" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => {
                    const m = metricsOf(row);
                    return (
                      <tr key={row.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium truncate max-w-[16rem]">{row.content_items?.title ?? 'Untitled'}</p>
                          <p className="font-mono text-[11px] text-white/40 mt-0.5">{formatDate(row.created_at)}</p>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {targetName(row.target)}
                          {row.content_items?.parent_id && <span className="tag !py-0.5 ml-2 border border-white/15 !text-white/60">clip</span>}
                        </td>
                        {METRICS.map((metric) => (
                          <td key={metric.key} className="py-3 px-2 text-right font-mono tabular-nums">{show(m?.[metric.key])}</td>
                        ))}
                        <td className="py-3 pl-2 text-right">
                          {row.external_url && (
                            <a href={row.external_url} target="_blank" rel="noopener noreferrer" aria-label="Open post"
                              className="text-white/50 hover:text-signal inline-flex">
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/40 mt-4">
              “–” means the platform hasn't reported that number (or the stat needs extra permissions; reconnect the account).
            </p>
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;
