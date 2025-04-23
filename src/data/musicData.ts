import { Album } from '../types';

export const albums: Album[] = [
  {
    id: 'a1',
    title: 'Neon Dreams',
    type: 'album',
    releaseYear: 2023,
    coverArt: '/thumbnails/head.jpg',
    tracks: [
      {
        id: 't1',
        title: 'Midnight City',
        duration: '3:24',
        audioSrc: '/media/music/tracks/midnight-city.wav',
        explicit: false,
      },
      {
        id: 't2',
        title: 'Electric Memories',
        duration: '4:18',
        audioSrc: '/media/music/tracks/electric-memories.mp3',
        explicit: true,
      },
      {
        id: 't3',
        title: 'Starlight',
        duration: '3:56',
        audioSrc: '/media/music/tracks/starlight.wav',
        explicit: false,
      },
      {
        id: 't4',
        title: 'Neon Reflections',
        duration: '5:12',
        audioSrc: '/media/music/tracks/neon-reflections.mp3',
        explicit: false,
      },
      {
        id: 't5',
        title: 'Digital Love',
        duration: '3:45',
        audioSrc: '/media/music/tracks/digital-love.wav',
        explicit: false,
      },
    ],
  },
  {
    id: 'a2',
    title: 'Sunset Boulevard',
    type: 'ep',
    releaseYear: 2022,
    coverArt: '/media/music/eps/sunset-boulevard.jpg',
    tracks: [
      {
        id: 't6',
        title: 'Golden Hour',
        duration: '4:02',
        audioSrc: '/media/music/tracks/golden-hour.wav',
        explicit: false,
      },
      {
        id: 't7',
        title: 'Ocean Drive',
        duration: '3:48',
        audioSrc: '/media/music/tracks/ocean-drive.mp3',
        explicit: false,
      },
      {
        id: 't8',
        title: 'Summer Nights',
        duration: '3:22',
        audioSrc: '/media/music/tracks/summer-nights.wav',
        explicit: true,
      },
    ],
  },
  {
    id: 'a3',
    title: 'Euphoria',
    type: 'single',
    releaseYear: 2023,
    coverArt: '/media/thumbnails/head.jpg',
    tracks: [
      {
        id: 't9',
        title: 'Euphoria',
        duration: '3:30',
        audioSrc: '/media/music/singles/head.wav',
        explicit: false,
      },
      {
        id: 't10',
        title: 'Euphoria (Remix)',
        duration: '4:15',
        audioSrc: '/media/music/tracks/euphoria-remix.mp3',
        explicit: true,
      },
    ],
  },
  {
    id: 'a4',
    title: 'Retrograde',
    type: 'album',
    releaseYear: 2021,
    coverArt: '/media/music/albums/retrograde.jpg',
    tracks: [
      {
        id: 't11',
        title: 'Back in Time',
        duration: '3:52',
        audioSrc: '/media/music/tracks/back-in-time.wav',
        explicit: false,
      },
      {
        id: 't12',
        title: 'Nostalgia',
        duration: '4:26',
        audioSrc: '/media/music/tracks/nostalgia.mp3',
        explicit: true,
      },
      {
        id: 't13',
        title: 'Memories',
        duration: '3:18',
        audioSrc: '/media/music/tracks/memories.wav',
        explicit: false,
      },
      {
        id: 't14',
        title: 'Rewind',
        duration: '4:05',
        audioSrc: '/media/music/tracks/rewind.mp3',
        explicit: false,
      },
    ],
  },
];

// Helper functions to get specific types of releases
export const getAlbums = () => albums.filter(album => album.type === 'album');
export const getEPs = () => albums.filter(album => album.type === 'ep');
export const getSingles = () => albums.filter(album => album.type === 'single');

// Get featured and recent releases
export const featuredAlbum = albums[0];
export const recentReleases = albums.slice(0, 3);