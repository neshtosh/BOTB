import React from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Loader2, Minimize } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useVideoPlayer } from '../../context/VideoPlayerContext';

interface VideoPlayerProps {
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ className }) => {
  const { isOpen, isMinimized, currentVideo, closePlayer, toggleMinimize } = useVideoPlayer();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    console.error('Error loading video');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !currentVideo) return null;

  return (
    <div className={cn(
      "fixed z-50 bg-black/90 transition-all duration-300",
      isMinimized 
        ? "bottom-4 right-4 w-80 rounded-xl overflow-hidden" 
        : "inset-0 flex items-center justify-center",
      className
    )}>
      <div className={cn(
        "relative bg-black overflow-hidden",
        isMinimized ? "aspect-video" : "w-full max-w-6xl aspect-video rounded-xl"
      )}>
        {/* Close button */}
        <button
          onClick={closePlayer}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Minimize button */}
        <button
          onClick={toggleMinimize}
          className="absolute top-4 right-16 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <Minimize size={24} />
        </button>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={48} className="text-white animate-spin" />
          </div>
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          src={currentVideo.videoUrl}
          className="w-full h-full object-cover"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          preload="metadata"
        />

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Time display */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume control */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Fullscreen toggle - only show when not minimized */}
            {!isMinimized && (
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 