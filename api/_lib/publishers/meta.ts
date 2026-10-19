import { graphVersion } from '../env.js';
import { fetchJson, form, sleep } from '../http.js';
import { buildCaption, type Publisher } from './types.js';

const graph = (path: string) => `https://graph.facebook.com/${graphVersion()}/${path}`;

// Facebook pulls the file from our signed URL itself.
export const publishFacebook: Publisher = async (media, tokens, options) => {
  const pageId = tokens.extra?.pageId as string;
  const video = await fetchJson<{ id: string }>(
    `https://graph-video.facebook.com/${graphVersion()}/${pageId}/videos`,
    {
      method: 'POST',
      body: form({
        file_url: media.url,
        title: media.title,
        description: buildCaption(media, options, false),
        access_token: tokens.accessToken,
      }),
    },
    'Facebook'
  );
  return { externalId: video.id, externalUrl: `https://www.facebook.com/${pageId}/videos/${video.id}` };
};

// Instagram Reels: create a container from the URL, wait for processing, then publish.
export const publishInstagram: Publisher = async (media, tokens, options) => {
  const igUserId = tokens.extra?.igUserId as string | null;
  if (!igUserId) {
    throw new Error('No Instagram Business/Creator account is linked to your Facebook Page.');
  }

  const container = await fetchJson<{ id: string }>(
    graph(`${igUserId}/media`),
    {
      method: 'POST',
      body: form({
        media_type: 'REELS',
        video_url: media.url,
        caption: buildCaption(media, options).slice(0, 2200),
        share_to_feed: 'true',
        access_token: tokens.accessToken,
      }),
    },
    'Instagram'
  );

  let ready = false;
  for (let attempt = 0; attempt < 45 && !ready; attempt++) {
    await sleep(5000);
    const status = await fetchJson<{ status_code: string; status?: string }>(
      `${graph(container.id)}?${new URLSearchParams({ fields: 'status_code,status', access_token: tokens.accessToken })}`,
      {},
      'Instagram'
    );
    if (status.status_code === 'ERROR') throw new Error(`Instagram could not process the video: ${status.status ?? ''}`);
    ready = status.status_code === 'FINISHED';
  }
  if (!ready) throw new Error('Instagram is still processing the video. Try publishing again in a few minutes.');

  const published = await fetchJson<{ id: string }>(
    graph(`${igUserId}/media_publish`),
    { method: 'POST', body: form({ creation_id: container.id, access_token: tokens.accessToken }) },
    'Instagram'
  );
  const info = await fetchJson<{ permalink?: string }>(
    `${graph(published.id)}?${new URLSearchParams({ fields: 'permalink', access_token: tokens.accessToken })}`,
    {},
    'Instagram'
  ).catch(() => ({ permalink: undefined }));

  return { externalId: published.id, externalUrl: info.permalink ?? null };
};
