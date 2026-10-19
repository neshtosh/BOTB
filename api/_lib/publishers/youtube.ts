import { fetchJson } from '../http.js';
import type { Publisher } from './types.js';

// Resumable upload: one request to open a session, one PUT with the bytes.
// Note: until the Google Cloud project passes YouTube's API audit, uploads are
// forced to private by YouTube regardless of the privacy we request.
export const publishYouTube: Publisher = async (media, tokens, options) => {
  const metadata = {
    snippet: {
      title: media.title.slice(0, 100),
      description: (options.caption?.trim() || media.description).slice(0, 5000),
      tags: media.tags,
      categoryId: media.creatorType === 'musician' ? '10' : '22', // Music : People & Blogs
    },
    status: {
      privacyStatus: options.privacy ?? 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  const init = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(media.fileSize),
        'X-Upload-Content-Type': media.mimeType,
      },
      body: JSON.stringify(metadata),
    }
  );
  const uploadUrl = init.headers.get('location');
  if (!init.ok || !uploadUrl) {
    throw new Error(`YouTube error (${init.status}): ${(await init.text()).slice(0, 300)}`);
  }

  const video = await fetchJson<{ id: string }>(
    uploadUrl,
    {
      method: 'PUT',
      headers: { 'Content-Type': media.mimeType },
      body: new Uint8Array(await media.load()),
    },
    'YouTube'
  );

  return { externalId: video.id, externalUrl: `https://www.youtube.com/watch?v=${video.id}` };
};
