import type { MediaType, Provider, Target } from '../types/platform';
import type { PostMode } from '../lib/publishPlan';

export interface TargetInfo {
  id: Target;
  name: string;
  provider: Provider;
  // Social video platforms take audio too, but only as a clip rendered to video.
  social: boolean;
  captionLimit: number;
  note?: string;
}

export const targets: TargetInfo[] = [
  { id: 'youtube', name: 'YouTube', provider: 'youtube', social: true, captionLimit: 5000 },
  {
    id: 'tiktok',
    name: 'TikTok',
    provider: 'tiktok',
    social: true,
    captionLimit: 2200,
    note: 'Posts are private (only you) until the TikTok app passes audit.',
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    provider: 'meta',
    social: true,
    captionLimit: 2200,
    note: 'Needs an Instagram Business or Creator account linked to a Facebook Page.',
  },
  { id: 'facebook', name: 'Facebook Page', provider: 'meta', social: true, captionLimit: 5000 },
  { id: 'soundcloud', name: 'SoundCloud', provider: 'soundcloud', social: false, captionLimit: 4000 },
];

// What a creator may post to each platform. Full songs never go to social
// platforms; they get a clip instead. SoundCloud takes the full track only.
export function modesFor(target: Target, mediaType: MediaType): PostMode[] {
  const info = targets.find((t) => t.id === target)!;
  if (!info.social) return mediaType === 'audio' ? ['full'] : [];
  return mediaType === 'audio' ? ['clip'] : ['full', 'clip'];
}

export const targetsFor = (mediaType: MediaType) => targets.filter((t) => modesFor(t.id, mediaType).length > 0);

export const providers: { id: Provider; name: string; description: string }[] = [
  { id: 'youtube', name: 'YouTube', description: 'Upload videos and Shorts to your channel.' },
  { id: 'tiktok', name: 'TikTok', description: 'Post videos and song clips to your TikTok account.' },
  {
    id: 'meta',
    name: 'Facebook & Instagram',
    description: 'Publish to your Facebook Page and its linked Instagram account.',
  },
  { id: 'soundcloud', name: 'SoundCloud', description: 'Upload tracks to your SoundCloud profile.' },
];

// Shown in the UI so creators understand why these aren't one-click.
export const distributionOnly = [
  { name: 'Spotify', reason: 'Spotify only accepts music through a distributor.' },
  { name: 'Apple Music', reason: 'Apple Music only accepts music through a distributor.' },
];

export const targetName = (id: Target) => targets.find((t) => t.id === id)?.name ?? id;
