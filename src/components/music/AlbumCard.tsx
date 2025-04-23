import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Disc3 } from 'lucide-react';
import { Album } from '../../types';
import { cn } from '../../utils/cn';

interface AlbumCardProps {
  album: Album;
  variant?: 'default' | 'horizontal' | 'compact';
  className?: string;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ 
  album, 
  variant = 'default',
  className 
}) => {
  const baseClasses = 'album-card relative group overflow-hidden';
  
  const variantClasses = {
    default: 'rounded-xl',
    horizontal: 'rounded-xl flex items-center',
    compact: 'rounded-lg'
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {/* Album Cover */}
      <div 
        className={cn(
          'bg-cover bg-center relative overflow-hidden',
          variant === 'default' && 'aspect-square rounded-xl',
          variant === 'horizontal' && 'w-20 h-20 shrink-0 rounded-xl',
          variant === 'compact' && 'aspect-square rounded-lg'
        )}
        style={{ backgroundImage: `url(${album.coverArt})` }}
      >
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            className="bg-white text-surface-100 rounded-full p-2 transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-opacity-90"
            aria-label={`Play ${album.title}`}
          >
            <Play size={variant === 'compact' ? 16 : 24} className="ml-0.5" />
          </button>
        </div>
      </div>

      {/* Album Info */}
      <div className={cn(
        'mt-3',
        variant === 'horizontal' && 'ml-4 mt-0',
        variant === 'compact' && 'mt-2'
      )}>
        <Link 
          to={`/music/${album.id}`}
          className={cn(
            'font-medium block text-white hover:text-primary-400 transition-colors',
            variant === 'default' && 'text-base',
            variant === 'horizontal' && 'text-base',
            variant === 'compact' && 'text-sm'
          )}
        >
          {album.title}
        </Link>
        <div 
          className={cn(
            'flex items-center mt-1 text-surface-600',
            variant === 'default' && 'text-sm',
            variant === 'horizontal' && 'text-sm',
            variant === 'compact' && 'text-xs'
          )}
        >
          <Disc3
            size={variant === 'compact' ? 12 : 14}
            className="mr-1 inline-block text-surface-500"
          />
          <span className="capitalize">
            {album.type} • {album.releaseYear}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlbumCard;