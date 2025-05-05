import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  ListMusic
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { albums } from '../../data/musicData';
import ExplicitBadge from '../common/ExplicitBadge';

interface MusicPlayerProps {
  className?: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ className }) => {
  const {
    currentTrack,
    currentAlbum,
    isPlaying,
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    getAllTracks,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [showPlaylist, setShowPlaylist] = React.useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioSrc;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack || !currentAlbum) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10",
      className
    )}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Album Art */}
          <div className="w-12 h-12 rounded overflow-hidden">
            <img
              src={currentAlbum.coverArt}
              alt={currentAlbum.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">
              {currentTrack.title}
            </h3>
            <p className="text-white/60 text-sm truncate">
              {currentAlbum.title}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={playPrevious}
              className="p-2 rounded-full text-white hover:bg-white/10 hover:text-primary-400 transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>

            <button 
              onClick={togglePlay}
              className="p-2 rounded-full text-white hover:bg-white/10 hover:text-primary-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={playNext}
              className="p-2 rounded-full text-white hover:bg-white/10 hover:text-primary-400 transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full text-white hover:bg-white/10 hover:text-primary-400 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="p-2 rounded-full text-white hover:bg-white/10 hover:text-primary-400 transition-colors"
              aria-label={showPlaylist ? 'Hide playlist' : 'Show playlist'}
            >
              <ListMusic size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-white/60 text-sm">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Playlist */}
        {showPlaylist && (
          <div className="absolute bottom-full left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 max-h-96 overflow-y-auto">
            <div className="container mx-auto px-4 py-2">
              <h3 className="text-white font-medium mb-2">Playlist</h3>
              <div className="space-y-2">
                {getAllTracks().map((track) => {
                  const album = albums.find(a => 
                    a.tracks.some(t => t.id === track.id)
                  );
                  if (!album) return null;
                  
                  return (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track, album)}
                      className={cn(
                        "w-full flex items-center gap-4 p-2 rounded hover:bg-white/10 transition-colors",
                        currentTrack.id === track.id && "bg-white/10"
                      )}
                    >
                      <div className="w-8 h-8 rounded overflow-hidden">
                        <img
                          src={album.coverArt}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white truncate">{track.title}</p>
                        <p className="text-white/60 text-sm truncate">
                          {album.title}
                        </p>
                      </div>
                      <span className="text-white/60 text-sm">
                        {track.duration}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;