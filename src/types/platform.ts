export type CreatorType = 'musician' | 'video' | 'podcaster' | 'photographer' | 'other';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  creator_type: CreatorType;
  bio: string;
  avatar_url: string | null;
  links: { label: string; url: string }[];
  created_at: string;
}

export type MediaType = 'video' | 'audio';

export interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  tags: string[];
  media_type: MediaType;
  storage_path: string;
  mime_type: string;
  file_size: number;
  is_public: boolean;
  parent_id: string | null;
  clip_start: number | null;
  clip_duration: number | null;
  created_at: string;
}

// An account the creator links (one OAuth login)...
export type Provider = 'youtube' | 'tiktok' | 'meta' | 'soundcloud';
// ...and the places content can be pushed to. One Meta login covers Facebook and Instagram.
export type Target = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'soundcloud';

export interface PlatformConnection {
  id: string;
  provider: Provider;
  account_name: string;
  account_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type JobStatus = 'queued' | 'processing' | 'published' | 'failed';

export interface PublishJob {
  id: string;
  content_id: string;
  target: Target;
  status: JobStatus;
  external_id: string | null;
  external_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostMetrics {
  job_id: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  extra: Record<string, number | null>;
  fetched_at: string;
}
