import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { albums } from '../data/musicData';
import TrackList from '../components/music/TrackList';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import Button from '../components/common/Button';

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying } = useMusicPlayer();

  const album = albums.find(a => a.id === id);

  if (!album) {
    return (
      <div className="container section pt-24">
        <div className="text-center">
          <h1 className="mb-4">Album Not Found</h1>
          <Button onClick={() => navigate('/music')}>
            Back to Music
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section pt-24">
      <Button
        variant="ghost"
        className="mb-8"
        onClick={() => navigate('/music')}
        leftIcon={<ArrowLeft size={16} />}
      >
        Back to Music
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8">
        {/* Album Cover */}
        <div className="aspect-square rounded-xl overflow-hidden">
          <img
            src={album.coverArt}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Album Info */}
        <div>
          <h1 className="mb-2">{album.title}</h1>
          <p className="text-surface-600 mb-6">
            {album.type.charAt(0).toUpperCase() + album.type.slice(1)} • {album.releaseYear}
          </p>

          {/* Track List */}
          <TrackList
            tracks={album.tracks}
            album={album}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
          />
        </div>
      </div>
    </div>
  );
};

export default AlbumPage; 