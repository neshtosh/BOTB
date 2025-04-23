import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Album, Track } from '../types';
import { albums } from '../data/musicData';

interface MusicPlayerContextType {
  currentTrack: Track | null;
  currentAlbum: Album | null;
  isPlaying: boolean;
  playTrack: (track: Track, album: Album) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  getNextTrack: () => Track | null;
  getPreviousTrack: () => Track | null;
  getAllTracks: () => Track[];
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track, album: Album) => {
    setCurrentTrack(track);
    setCurrentAlbum(album);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const getAllTracks = () => {
    return albums.flatMap(album => album.tracks);
  };

  const getNextTrack = () => {
    if (!currentTrack || !currentAlbum) return null;
    
    const allTracks = getAllTracks();
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    
    if (currentIndex === -1 || currentIndex === allTracks.length - 1) {
      return allTracks[0]; // Loop to first track
    }
    
    return allTracks[currentIndex + 1];
  };

  const getPreviousTrack = () => {
    if (!currentTrack || !currentAlbum) return null;
    
    const allTracks = getAllTracks();
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    
    if (currentIndex === -1) return null;
    if (currentIndex === 0) {
      return allTracks[allTracks.length - 1]; // Loop to last track
    }
    
    return allTracks[currentIndex - 1];
  };

  const playNext = () => {
    const nextTrack = getNextTrack();
    if (nextTrack) {
      const nextAlbum = albums.find(album => 
        album.tracks.some(track => track.id === nextTrack.id)
      );
      if (nextAlbum) {
        playTrack(nextTrack, nextAlbum);
      }
    }
  };

  const playPrevious = () => {
    const previousTrack = getPreviousTrack();
    if (previousTrack) {
      const previousAlbum = albums.find(album => 
        album.tracks.some(track => track.id === previousTrack.id)
      );
      if (previousAlbum) {
        playTrack(previousTrack, previousAlbum);
      }
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        currentAlbum,
        isPlaying,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        getNextTrack,
        getPreviousTrack,
        getAllTracks,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}; 