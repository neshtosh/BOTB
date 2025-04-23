import React, { useState } from 'react';
import { Filter, CalendarClock } from 'lucide-react';
import { events } from '../data/eventsData';
import { Event } from '../types';
import EventCard from '../components/events/EventCard';
import Button from '../components/common/Button';

type EventType = 'all' | 'listening-party' | 'album-launch' | 'live-stream' | 'concert';

const Events: React.FC = () => {
  const [filter, setFilter] = useState<EventType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (type: EventType) => {
    setFilter(type);
  };

  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter(
    event => new Date(event.date) > new Date()
  );

  const pastEvents = filteredEvents.filter(
    event => new Date(event.date) <= new Date()
  );

  return (
    <div className="container section pt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="mb-2">Events</h1>
          <p className="text-surface-600 max-w-2xl">
            Join exclusive listening parties, album launches, and live performances.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
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
          variant={filter === 'listening-party' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('listening-party')}
        >
          Listening Parties
        </Button>
        <Button
          variant={filter === 'album-launch' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('album-launch')}
        >
          Album Launches
        </Button>
        <Button
          variant={filter === 'live-stream' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('live-stream')}
        >
          Live Streams
        </Button>
        <Button
          variant={filter === 'concert' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange('concert')}
        >
          Concerts
        </Button>
      </div>

      {/* No results message */}
      {filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Filter size={48} className="text-surface-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No events found</h3>
          <p className="text-surface-600 text-center max-w-md">
            No events match your current filters. Try adjusting your search or view all events.
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

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-6">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Events;