import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { videos } from '../data/videoData';
import { Video } from '../types';
import VideoCard from '../components/videos/VideoCard';
import Button from '../components/common/Button';

type VideoType = 'all' | 'music-video' | 'visualizer' | 'live' | 'documentary';

const Videos: React.FC = () => {
  const [filter, setFilter] = useState<VideoType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (type: VideoType) => {
    setFilter(type);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesFilter = filter === 'all' || video.type === filter;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container section pt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="mb-2">Videos</h1>
          <p className="text-surface-600 max-w-2xl">
            Official music videos, visualizers, live performances and more.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 md:w-64 bg-surface-200 border border-surface-400 rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
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
          variant={filter === 'music-video' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('music-video')}
        >
          Music Videos
        </Button>
        <Button
          variant={filter === 'visualizer' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('visualizer')}
        >
          Visualizers
        </Button>
        <Button
          variant={filter === 'live' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('live')}
        >
          Live
        </Button>
        <Button
          variant={filter === 'documentary' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('documentary')}
        >
          Documentary
        </Button>
      </div>

      {/* Featured Video */}
      {filteredVideos.length > 0 && filter === 'all' && searchTerm === '' && (
        <div className="mb-8">
          <VideoCard video={filteredVideos[0]} variant="featured" />
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filter === 'all' && searchTerm === '' 
            ? filteredVideos.slice(1) 
            : filteredVideos
          ).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Filter size={48} className="text-surface-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-surface-600 text-center max-w-md">
            No videos match your current filters. Try adjusting your search or view all videos.
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

export default Videos;