import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Album } from '../../types';
import { useMusicPlayer } from '../../context/MusicPlayerContext';

interface AlbumCardProps {
  album: Album;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const { playTrack } = useMusicPlayer();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0], album);
    }
  };

  return (
    <Link
      to={`/music/${album.id}`}
      className="group block bg-surface-50 rounded-xl overflow-hidden hover:bg-surface-100 transition-colors"
    >
      <div className="relative aspect-square">
        <img
          src={album.coverArt}
          alt={album.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Play album"
        >
          <Play size={48} className="text-white" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-medium mb-1">{album.title}</h3>
        <p className="text-sm text-surface-600">
          {album.type.charAt(0).toUpperCase() + album.type.slice(1)} • {album.releaseYear}
        </p>
      </div>
    </Link>
  );
};

export default AlbumCard;