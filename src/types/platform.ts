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

// A content item that belongs to a release.
export type TrackItem = ContentItem & Partial<TrackFields>;

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

export type JobStatus = 'queued' | 'scheduled' | 'processing' | 'published' | 'failed';

export interface PublishJob {
  id: string;
  content_id: string;
  target: Target;
  status: JobStatus;
  external_id: string | null;
  external_url: string | null;
  error: string | null;
  // Set when the post waits for the release date.
  scheduled_for?: string | null;
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

// ---------------------------------------------------------------------------
// Releases: a single, EP or album made of one or more tracks (content items).
// ---------------------------------------------------------------------------

export type ReleaseKind = 'single' | 'ep' | 'album';

export interface Split {
  name: string;
  email: string;
  role: string;
  share: number; // percent, all shares add up to 100
}

export interface Release {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  artist_name: string;
  kind: ReleaseKind;
  primary_genre: string;
  secondary_genre: string | null;
  language: string;
  description: string;
  tags: string[];
  previously_released: boolean;
  original_release_date: string | null;
  // null = go out as soon as it's processed.
  release_at: string | null;
  cover_path: string | null;
  is_public: boolean;
  splits: Split[];
  smart_link_visits: number;
  created_at: string;
  updated_at: string;
}

export interface FeaturedArtist {
  name: string;
  role: 'featured' | 'remixer' | 'primary';
}

// Track-level fields stored on a release's content items.
export interface TrackFields {
  release_id: string | null;
  track_number: number | null;
  version: string;
  featured_artists: FeaturedArtist[];
  songwriters: string[];
  is_cover: boolean;
  explicit: boolean;
  instrumental: boolean;
  ai_generated: boolean;
  hook_start: number | null;
}

export interface Presave {
  id: string;
  release_id: string;
  email: string;
  created_at: string;
}

// Release health: green = live, yellow = processing or scheduled, red = needs attention.
export type ReleaseHealth = 'live' | 'scheduled' | 'processing' | 'attention' | 'draft';
