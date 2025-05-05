import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Track, Album } from '../../types';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import ExplicitBadge from '../common/ExplicitBadge';
import { cn } from '../../utils/cn';

interface TrackListProps {
  tracks: Track[];
  album: Album;
  currentTrackId?: string;
  isPlaying: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  album,
  currentTrackId,
  isPlaying,
}) => {
  const { playTrack } = useMusicPlayer();

  const handlePlay = (track: Track) => {
    playTrack(track, album);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 py-2 border-b border-surface-300/30 text-surface-600 text-sm">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-8">TITLE</div>
        <div className="col-span-3 flex items-center justify-end pr-4">
          {/* Duration */}
          <div className="text-sm text-surface-600 pr-4">
            Duration
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="mt-1">
        {tracks.map((track, index) => {
          const isCurrentTrack = track.id === currentTrackId;
          
          return (
            <div 
              key={track.id}
              className={cn(
                'grid grid-cols-12 gap-2 p-2 rounded-md group transition-colors',
                isCurrentTrack ? 'bg-primary-900/30' : 'hover:bg-surface-300/50'
              )}
            >
              {/* Track Number / Play Button */}
              <div className="col-span-1 flex items-center justify-center text-sm">
                <span className={cn(
                  'group-hover:hidden',
                  isCurrentTrack && isPlaying ? 'hidden' : '',
                  isCurrentTrack ? 'text-primary-400' : 'text-surface-600'
                )}>
                  {index + 1}
                </span>
                {isCurrentTrack && isPlaying ? (
                  <div className="equalizer">
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                  </div>
                ) : (
                  <button 
                    className={cn(
                      'hidden group-hover:block text-white',
                      isCurrentTrack ? 'text-primary-400' : ''
                    )}
                    onClick={() => handlePlay(track)}
                    aria-label={currentTrackId === track.id && isPlaying ? 'Pause' : 'Play'}
                  >
                    {currentTrackId === track.id && isPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} />
                    )}
                  </button>
                )}
              </div>

              {/* Track Title */}
              <div className="col-span-8 flex items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={isCurrentTrack ? 'text-primary-400' : ''}>
                      {track.title}
                    </span>
                    {track.explicit && <ExplicitBadge />}
                  </div>
                  {album && (
                    <div className="text-sm text-surface-600">
                      {album.title}
                    </div>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="col-span-3 flex items-center justify-end text-sm text-surface-600 pr-4">
                {track.duration}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackList;