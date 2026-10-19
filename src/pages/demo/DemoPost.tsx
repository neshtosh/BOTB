import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { targetName } from '../../config/platforms';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import type { ContentItem, PostMetrics, PublishJob } from '../../types/platform';

type JobRow = PublishJob & {
  options: { caption?: string; privacy?: string };
  content_items: ContentItem | null;
  post_metrics: PostMetrics | null;
};

const compact = (n: number | null | undefined) =>
  n === null || n === undefined ? '–' : new Intl.NumberFormat(undefined, { notation: 'compact' }).format(n);

// Demo mode: what a published post would look like on the platform.
const DemoPost: React.FC = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState<JobRow | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('publish_jobs')
        .select('*, content_items(*), post_metrics(*)')
        .eq('id', jobId ?? '')
        .maybeSingle();
      if (!data) return setState('missing');
      const row = data as JobRow;
      setJob(row);
      if (row.content_items) {
        const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(row.content_items.storage_path, 3600);
        setSrc(signed?.signedUrl ?? null);
      }
      setState('ready');
    })();
  }, [jobId]);

  if (state === 'loading') return <div className="container section pt-28 text-white/60">Loading…</div>;
  if (state === 'missing' || !job) {
    return (
      <div className="container section pt-28">
        <h1 className="mb-2">Post not found</h1>
        <p className="text-white/60">It may have been deleted, or it belongs to another account.</p>
      </div>
    );
  }

  const content = job.content_items;
  const caption = job.options?.caption || content?.description || content?.title;
  const vertical = job.target !== 'youtube' && job.target !== 'soundcloud' && job.target !== 'facebook';

  return (
    <div className="container section pt-28 pb-24">
      <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-signal mb-6">
        <ArrowLeft size={16} /> Back to library
      </Link>
      <div className="grid gap-10 lg:grid-cols-[auto_1fr] items-start">
        <div className={vertical ? 'w-72 aspect-[9/16] bg-black border-[6px] border-white/80 rounded-[2rem] overflow-hidden' : 'w-full max-w-2xl bg-black'}>
          {content?.media_type === 'audio' ? (
            <div className="p-6 bg-[#ff5500]/10">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">{targetName(job.target)}</p>
              <p className="text-xl font-bold mb-4">{content.title}</p>
              {src ? <audio src={src} controls className="w-full" /> : <p className="text-sm text-white/50">Audio is still being generated…</p>}
            </div>
          ) : src ? (
            <video src={src} controls playsInline className={vertical ? 'h-full w-full object-cover' : 'w-full aspect-video'} />
          ) : (
            <div className="grid h-full min-h-48 place-items-center text-sm text-white/50 p-6 text-center">Video is still being generated…</div>
          )}
        </div>

        <div>
          <span className="tag-yellow mb-4">Simulated {targetName(job.target)} post</span>
          <h1 className="text-5xl mt-4">{content?.title ?? 'Untitled'}</h1>
          <p className="mt-4 max-w-xl whitespace-pre-line text-white/80">{caption}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/40">
            Posted {new Date(job.created_at).toLocaleString()} · {job.options?.privacy ?? 'public'}
            {content?.parent_id ? ' · clip' : ''}
          </p>

          <div className="mt-8 grid grid-cols-4 max-w-md border border-white/10">
            {[
              [Eye, job.post_metrics?.views],
              [Heart, job.post_metrics?.likes],
              [MessageCircle, job.post_metrics?.comments],
              [Repeat2, job.post_metrics?.shares],
            ].map(([Icon, value], i) => {
              const I = Icon as typeof Eye;
              return (
                <div key={i} className="p-4 border-r border-white/10 last:border-r-0">
                  <I size={16} className="text-signal" />
                  <p className="mt-2 text-xl font-black tabular-nums">{compact(value as number | null)}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-white/50 max-w-md">
            Demo mode: this post wasn't sent anywhere. In live mode, “View post” opens the real post on {targetName(job.target)}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoPost;
