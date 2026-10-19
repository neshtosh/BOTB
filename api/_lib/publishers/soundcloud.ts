import { fetchJson } from '../http.js';
import type { Publisher } from './types.js';

export const publishSoundCloud: Publisher = async (media, tokens, options) => {
  const body = new FormData();
  body.append('track[title]', media.title);
  body.append('track[description]', media.description);
  // SoundCloud tag_list is space separated; multi-word tags must be quoted.
  body.append('track[tag_list]', media.tags.map((t) => (t.includes(' ') ? `"${t}"` : t)).join(' '));
  body.append('track[sharing]', options.privacy === 'private' ? 'private' : 'public');
  body.append(
    'track[asset_data]',
    new Blob([new Uint8Array(await media.load())], { type: media.mimeType }),
    media.fileName
  );

  const track = await fetchJson<{ id: number; permalink_url: string }>(
    'https://api.soundcloud.com/tracks',
    {
      method: 'POST',
      headers: { Authorization: `OAuth ${tokens.accessToken}`, Accept: 'application/json' },
      body,
    },
    'SoundCloud'
  );
  return { externalId: String(track.id), externalUrl: track.permalink_url };
};
