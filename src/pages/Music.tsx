import React, { useState } from 'react';
import { Disc3, Filter } from 'lucide-react';
import { albums } from '../data/musicData';
import { Album } from '../types';
import AlbumCard from '../components/music/AlbumCard';
import Button from '../components/common/Button';

type AlbumType = 'all' | 'album' | 'ep' | 'single';

const Music: React.FC = () => {
  const [filter, setFilter] = useState<AlbumType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (type: AlbumType) => {
    setFilter(type);
  };

  const filteredAlbums = albums.filter((album) => {
    const matchesFilter = filter === 'all' || album.type === filter;
    const matchesSearch = album.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container section pt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="mb-2">Music Library</h1>
          <p className="text-surface-600 max-w-2xl">
            Browse through all albums, EPs, and singles. Click on any release to explore tracks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search music..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 md:w-64 bg-surface-200 border border-surface-400 rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-surface-600">
            <Disc3 size={16} />
            <span>{filteredAlbums.length} releases</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'album' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('album')}
        >
          Albums
        </Button>
        <Button
          variant={filter === 'ep' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('ep')}
        >
          EPs
        </Button>
        <Button
          variant={filter === 'single' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('single')}
        >
          Singles
        </Button>
      </div>

      {/* Albums Grid */}
      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Filter size={48} className="text-surface-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-surface-600 text-center max-w-md">
            No music matches your current filters. Try adjusting your search or view all music.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Music;