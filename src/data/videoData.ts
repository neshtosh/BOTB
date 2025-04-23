import { Video } from '../types';

export const videos: Video[] = [
  {
    id: 'v1',
    title: 'Case',
    type: 'music-video',
    thumbnailUrl: '/media/thumbnails/case.jpg',
    videoUrl: '/media/videos/case.mp4',
    duration: '2:25',
    releaseDate: '2023-11-15',
  },
  {
    id: 'v2',
    title: 'Invasion',
    type: 'visualizer',
    thumbnailUrl: '/media/thumbnails/invasion.jpg',
    videoUrl: '/media/videos/invasion.mp4',
    duration: '3:56',
    releaseDate: '2023-10-28',
  },
  {
    id: 'v3',
    title: 'My Woman',
    type: 'music-video',
    thumbnailUrl: '/media/thumbnails/my-woman.jpg',
    videoUrl: '/media/videos/my-woman.mp4',
    duration: '4:18',
    releaseDate: '2023-09-22',
  },
  {
    id: 'v4',
    title: 'Golden Hour (Live at Sunset Boulevard)',
    type: 'live',
    thumbnailUrl: '/media/thumbnails/golden-hour.jpg',
    videoUrl: '/media/videos/golden-hour.mp4',
    duration: '4:22',
    releaseDate: '2023-08-14',
  },
  {
    id: 'v5',
    title: 'Euphoria (Visualizer)',
    type: 'visualizer',
    thumbnailUrl: '/media/thumbnails/euphoria.jpg',
    videoUrl: '/media/videos/euphoria.mp4',
    duration: '3:30',
    releaseDate: '2023-07-28',
  },
  {
    id: 'v6',
    title: 'In the Studio: Making of Neon Dreams',
    type: 'documentary',
    thumbnailUrl: '/media/thumbnails/studio.jpg',
    videoUrl: '/media/videos/studio.mp4',
    duration: '18:42',
    releaseDate: '2023-06-30',
  },
];

export const featuredVideo = videos[0];
export const recentVideos = videos.slice(0, 3);