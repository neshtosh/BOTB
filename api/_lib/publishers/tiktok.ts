import { fetchJson, sleep } from '../http.js';
import { buildCaption, type Publisher } from './types.js';

const API = 'https://open.tiktokapis.com/v2/post/publish';
const MB = 1024 * 1024;

interface TikTokEnvelope<T> {
  data: T;
  error: { code: string; message: string };
}

async function tiktokPost<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetchJson<TikTokEnvelope<T>>(
    `${API}/${path}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(body),
    },
    'TikTok'
  );
  if (res.error?.code && res.error.code !== 'ok') {
    throw new Error(`TikTok error: ${res.error.message || res.error.code}`);
  }
  return res.data;
}

// TikTok wants chunks of 5–64 MB; the last chunk absorbs the remainder.
function chunkPlan(size: number) {
  if (size <= 64 * MB) return { chunkSize: size, count: 1 };
  const chunkSize = 32 * MB;
  return { chunkSize, count: Math.floor(size / chunkSize) };
}

export const publishTikTok: Publisher = async (media, tokens, options) => {
  // TikTok requires checking which privacy levels this creator may use.
  // Unaudited apps only get SELF_ONLY.
  const creator = await tiktokPost<{ privacy_level_options: string[] }>(
    'creator_info/query/',
    tokens.accessToken,
    {}
  );
  const wanted = options.privacy === 'private' ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE';
  const privacy = creator.privacy_level_options.includes(wanted)
    ? wanted
    : creator.privacy_level_options.includes('SELF_ONLY')
      ? 'SELF_ONLY'
      : creator.privacy_level_options[0];

  const { chunkSize, count } = chunkPlan(media.fileSize);
  const caption = buildCaption(media, options).slice(0, 2200);

  const init = await tiktokPost<{ publish_id: string; upload_url: string }>('video/init/', tokens.accessToken, {
    post_info: { title: caption, privacy_level: privacy },
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: media.fileSize,
      chunk_size: chunkSize,
      total_chunk_count: count,
    },
  });

  const bytes = await media.load();
  for (let i = 0; i < count; i++) {
    const start = i * chunkSize;
    const end = i === count - 1 ? bytes.length : start + chunkSize;
    const res = await fetch(init.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': media.mimeType,
        'Content-Range': `bytes ${start}-${end - 1}/${bytes.length}`,
      },
      body: new Uint8Array(bytes.subarray(start, end)),
    });
    if (!res.ok) throw new Error(`TikTok upload failed on chunk ${i + 1}/${count} (${res.status}).`);
  }

  // Processing usually finishes within a minute; stop waiting before the function times out.
  // If it's still processing, analytics refresh picks up the video id later.
  let videoId: string | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const status = await fetchPublishStatus(tokens.accessToken, init.publish_id);
    if (status.status === 'FAILED') throw new Error(`TikTok rejected the video: ${status.fail_reason ?? 'unknown reason'}`);
    if (status.status === 'PUBLISH_COMPLETE') {
      videoId = status.publicaly_available_post_id?.[0] ? String(status.publicaly_available_post_id[0]) : null;
      break;
    }
    await sleep(5000);
  }

  // The post-publish API doesn't return a public link to the video.
  return { externalId: videoId, externalUrl: null, meta: { publishId: init.publish_id } };
};

export interface TikTokPublishStatus {
  status: string;
  fail_reason?: string;
  // (sic) TikTok's field name. Only set once a public post exists.
  publicaly_available_post_id?: (string | number)[];
}

export const fetchPublishStatus = (token: string, publishId: string) =>
  tiktokPost<TikTokPublishStatus>('status/fetch/', token, { publish_id: publishId });
