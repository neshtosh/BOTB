import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Video } from '../types';

interface VideoPlayerContextType {
  isOpen: boolean;
  isMinimized: boolean;
  currentVideo: Video | null;
  openPlayer: (video: Video) => void;
  closePlayer: () => void;
  toggleMinimize: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export const VideoPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  const openPlayer = (video: Video) => {
    setCurrentVideo(video);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closePlayer = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setCurrentVideo(null);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <VideoPlayerContext.Provider
      value={{
        isOpen,
        isMinimized,
        currentVideo,
        openPlayer,
        closePlayer,
        toggleMinimize,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
}; 