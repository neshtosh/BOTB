import type { TokenSet } from '../providers/types.js';

export type Target = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'soundcloud';

export interface PublishOptions {
  // 'public' | 'private' (| 'unlisted' on YouTube). Each publisher maps it.
  privacy?: 'public' | 'private' | 'unlisted';
  // Platform-specific caption written by the creator. Replaces the default
  // caption built from description + tags.
  caption?: string;
}

// Default caption: title, description and tags as hashtags.
export const buildCaption = (media: MediaSource, options: PublishOptions, includeTitle = true) =>
  options.caption?.trim() ||
  [includeTitle ? media.title : '', media.description, media.tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')]
    .filter(Boolean)
    .join('\n\n');

export interface MediaSource {
  title: string;
  description: string;
  tags: string[];
  mimeType: string;
  fileSize: number;
  fileName: string;
  creatorType: string;
  // Short-lived signed URL; platforms that pull from a URL (Meta) use it directly.
  url: string;
  // Lazily downloads the whole file for platforms that need the bytes pushed to them.
  load: () => Promise<Buffer>;
}

export interface PublishResult {
  externalId: string | null;
  externalUrl: string | null;
  meta?: Record<string, unknown>;
}

export type Publisher = (media: MediaSource, tokens: TokenSet, options: PublishOptions) => Promise<PublishResult>;
