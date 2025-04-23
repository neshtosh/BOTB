import React from 'react';
import { Play, Calendar } from 'lucide-react';
import { Video } from '../../types';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/formatters';
import { useVideoPlayer } from '../../context/VideoPlayerContext';

interface VideoCardProps {
  video: Video;
  variant?: 'default' | 'featured';
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  variant = 'default',
  className 
}) => {
  const { openPlayer } = useVideoPlayer();
  const baseClasses = 'group relative overflow-hidden';
  
  const variantClasses = {
    default: 'rounded-xl',
    featured: 'rounded-xl aspect-video'
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={() => openPlayer(video)}
    >
      {/* Thumbnail */}
      <div 
        className={cn(
          'bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105',
          variant === 'default' && 'aspect-video rounded-xl',
          variant === 'featured' && 'w-full h-full rounded-xl'
        )}
        style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
      >
        {/* Video type badge */}
        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs py-1 px-2 rounded-full capitalize">
          {video.type.replace('-', ' ')}
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs py-1 px-2 rounded-full">
          {video.duration}
        </div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white text-surface-100 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-opacity-90">
            <Play size={variant === 'default' ? 24 : 32} className="ml-0.5" />
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className={cn(
        'mt-3',
        variant === 'featured' && 'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent mt-0'
      )}>
        <h3 
          className={cn(
            'font-medium text-white',
            variant === 'default' && 'text-base',
            variant === 'featured' && 'text-xl'
          )}
        >
          {video.title}
        </h3>
        <div 
          className={cn(
            'flex items-center mt-1 text-surface-600',
            variant === 'default' && 'text-sm',
            variant === 'featured' && 'text-sm text-surface-400'
          )}
        >
          <Calendar
            size={14}
            className="mr-1 inline-block"
          />
          <span>
            {formatDate(video.releaseDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;