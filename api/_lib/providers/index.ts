import { meta } from './meta.js';
import { soundcloud } from './soundcloud.js';
import { tiktok } from './tiktok.js';
import type { Provider, ProviderAdapter } from './types.js';
import { youtube } from './youtube.js';

export const adapters: Record<Provider, ProviderAdapter> = { youtube, tiktok, meta, soundcloud };

export const isProvider = (value: unknown): value is Provider =>
  typeof value === 'string' && value in adapters;
