import type { Provider } from '../providers/types.js';
import { publishFacebook, publishInstagram } from './meta.js';
import { publishSoundCloud } from './soundcloud.js';
import { publishTikTok } from './tiktok.js';
import type { Publisher, Target } from './types.js';
import { publishYouTube } from './youtube.js';

export const targetConfig: Record<Target, { provider: Provider; accepts: ('video' | 'audio')[]; publish: Publisher }> = {
  youtube: { provider: 'youtube', accepts: ['video'], publish: publishYouTube },
  tiktok: { provider: 'tiktok', accepts: ['video'], publish: publishTikTok },
  facebook: { provider: 'meta', accepts: ['video'], publish: publishFacebook },
  instagram: { provider: 'meta', accepts: ['video'], publish: publishInstagram },
  soundcloud: { provider: 'soundcloud', accepts: ['audio'], publish: publishSoundCloud },
};

export const isTarget = (value: unknown): value is Target =>
  typeof value === 'string' && value in targetConfig;
