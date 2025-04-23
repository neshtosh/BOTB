export interface Track {
  id: string;
  title: string;
  duration: string;
  audioSrc: string;
  explicit?: boolean;
}

export interface Album {
  id: string;
  title: string;
  type: 'album' | 'single' | 'ep';
  releaseYear: number;
  coverArt: string;
  tracks: Track[];
}

export interface Video {
  id: string;
  title: string;
  type: 'music-video' | 'visualizer' | 'live' | 'documentary';
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  releaseDate: string;
}

export interface Event {
  id: string;
  title: string;
  type: 'listening-party' | 'album-launch' | 'live-stream' | 'concert';
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  description: string;
  registrationUrl?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}