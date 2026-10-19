import { graphVersion } from './env.js';
import { fetchJson } from './http.js';
import type { TokenSet } from './providers/types.js';
import { fetchPublishStatus } from './publishers/tiktok.js';
import type { Target } from './publishers/types.js';

export interface JobRef {
  id: string;
  target: Target;
  external_id: string | null;
  external_url: string | null;
  external_meta: Record<string, unknown>;
}

export interface Metrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  extra?: Record<string, unknown>;
}

export interface MetricsResult {
  metrics: Map<string, Metrics>;
  // Jobs whose platform id / link we only learned now (TikTok finishes processing after publish).
  jobUpdates: Map<string, { external_id?: string; external_url?: string }>;
}

type Fetcher = (jobs: JobRef[], tokens: TokenSet) => Promise<MetricsResult>;

const num = (v: unknown) => (v === undefined || v === null || v === '' ? null : Number(v));
const chunk = <T>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));
const empty = (): MetricsResult => ({ metrics: new Map(), jobUpdates: new Map() });

const youtube: Fetcher = async (jobs, tokens) => {
  const out = empty();
  const byVideo = new Map(jobs.filter((j) => j.external_id).map((j) => [j.external_id as string, j.id]));
  for (const ids of chunk([...byVideo.keys()], 50)) {
    const res = await fetchJson<{ items: { id: string; statistics: Record<string, string> }[] }>(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}`,
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
      'YouTube'
    );
    for (const item of res.items) {
      out.metrics.set(byVideo.get(item.id)!, {
        views: num(item.statistics.viewCount),
        likes: num(item.statistics.likeCount),
        comments: num(item.statistics.commentCount),
        shares: null,
      });
    }
  }
  return out;
};

interface TikTokVideo {
  id: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  share_url?: string;
}

const tiktok: Fetcher = async (jobs, tokens) => {
  const out = empty();
  const byVideo = new Map<string, string>();
  for (const job of jobs) {
    let videoId = job.external_id;
    const publishId = job.external_meta.publishId as string | undefined;
    if (!videoId && publishId) {
      const status = await fetchPublishStatus(tokens.accessToken, publishId).catch(() => null);
      const id = status?.publicaly_available_post_id?.[0];
      if (id) {
        videoId = String(id);
        out.jobUpdates.set(job.id, { external_id: videoId });
      }
    }
    if (videoId) byVideo.set(videoId, job.id);
  }

  for (const ids of chunk([...byVideo.keys()], 20)) {
    const res = await fetchJson<{ data: { videos: TikTokVideo[] }; error: { code: string; message: string } }>(
      'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count,share_url',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { video_ids: ids } }),
      },
      'TikTok'
    );
    if (res.error?.code && res.error.code !== 'ok') throw new Error(`TikTok error: ${res.error.message}`);
    for (const v of res.data.videos) {
      const jobId = byVideo.get(String(v.id))!;
      out.metrics.set(jobId, {
        views: num(v.view_count),
        likes: num(v.like_count),
        comments: num(v.comment_count),
        shares: num(v.share_count),
      });
      const existing = jobs.find((j) => j.id === jobId);
      if (v.share_url && !existing?.external_url) {
        out.jobUpdates.set(jobId, { ...out.jobUpdates.get(jobId), external_url: v.share_url });
      }
    }
  }
  return out;
};

const graph = (path: string, params: Record<string, string>) =>
  `https://graph.facebook.com/${graphVersion()}/${path}?${new URLSearchParams(params)}`;

const instagram: Fetcher = async (jobs, tokens) => {
  const out = empty();
  for (const job of jobs.filter((j) => j.external_id)) {
    const id = job.external_id as string;
    const basic = await fetchJson<{ like_count?: number; comments_count?: number }>(
      graph(id, { fields: 'like_count,comments_count', access_token: tokens.accessToken }),
      {},
      'Instagram'
    );
    // Insights need the instagram_manage_insights permission; counts above work without it.
    const insights = await fetchJson<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(
      graph(`${id}/insights`, { metric: 'views,reach,shares,saved', access_token: tokens.accessToken }),
      {},
      'Instagram'
    ).catch(() => ({ data: [] }));
    const metric = (name: string) => {
      const m = insights.data.find((d) => d.name === name);
      return num(m?.total_value?.value ?? m?.values?.[0]?.value);
    };
    out.metrics.set(job.id, {
      views: metric('views'),
      likes: num(basic.like_count),
      comments: num(basic.comments_count),
      shares: metric('shares'),
      extra: { reach: metric('reach'), saved: metric('saved') },
    });
  }
  return out;
};

const facebook: Fetcher = async (jobs, tokens) => {
  const out = empty();
  for (const job of jobs.filter((j) => j.external_id)) {
    const id = job.external_id as string;
    const counts = await fetchJson<{
      likes?: { summary?: { total_count: number } };
      comments?: { summary?: { total_count: number } };
    }>(
      graph(id, {
        fields: 'likes.summary(true).limit(0),comments.summary(true).limit(0)',
        access_token: tokens.accessToken,
      }),
      {},
      'Facebook'
    );
    const views = await fetchJson<{ data: { values: { value: number }[] }[] }>(
      graph(`${id}/video_insights`, { metric: 'total_video_views', access_token: tokens.accessToken }),
      {},
      'Facebook'
    ).catch(() => ({ data: [] }));
    out.metrics.set(job.id, {
      views: num(views.data[0]?.values?.[0]?.value),
      likes: num(counts.likes?.summary?.total_count),
      comments: num(counts.comments?.summary?.total_count),
      shares: null,
    });
  }
  return out;
};

const soundcloud: Fetcher = async (jobs, tokens) => {
  const out = empty();
  for (const job of jobs.filter((j) => j.external_id)) {
    const track = await fetchJson<Record<string, number>>(
      `https://api.soundcloud.com/tracks/${job.external_id}`,
      { headers: { Authorization: `OAuth ${tokens.accessToken}`, Accept: 'application/json' } },
      'SoundCloud'
    );
    out.metrics.set(job.id, {
      views: num(track.playback_count),
      likes: num(track.likes_count ?? track.favoritings_count),
      comments: num(track.comment_count),
      shares: num(track.reposts_count),
    });
  }
  return out;
};

export const metricsFetchers: Record<Target, Fetcher> = { youtube, tiktok, instagram, facebook, soundcloud };
