import React from 'react';
import { CalendarClock, MapPin } from 'lucide-react';
import { Event } from '../../types';
import { cn } from '../../utils/cn';
import { formatDate, formatTime } from '../../utils/formatters';
import Button from '../common/Button';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'featured';
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  variant = 'default',
  className 
}) => {
  const baseClasses = 'rounded-xl overflow-hidden group';
  
  const variantClasses = {
    default: 'bg-surface-200 border border-surface-300/30 hover:border-surface-400/50 transition-colors',
    featured: 'relative'
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {/* Event Image */}
      <div 
        className={cn(
          'bg-cover bg-center',
          variant === 'default' && 'h-48',
          variant === 'featured' && 'h-72 sm:h-96'
        )}
        style={{ backgroundImage: `url(${event.imageUrl})` }}
      >
        {variant === 'featured' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        )}
      </div>

      {/* Event Info */}
      <div className={cn(
        variant === 'default' && 'p-4',
        variant === 'featured' && 'absolute bottom-0 left-0 right-0 p-6'
      )}>
        {/* Event type badge */}
        <div 
          className={cn(
            'inline-block text-xs font-medium rounded-full px-2.5 py-1 mb-3 capitalize',
            event.type === 'listening-party' && 'bg-primary-900/60 text-primary-300',
            event.type === 'album-launch' && 'bg-accent-900/60 text-accent-300',
            event.type === 'live-stream' && 'bg-secondary-900/60 text-secondary-300',
            event.type === 'concert' && 'bg-success-900/60 text-success-300'
          )}
        >
          {event.type.replace('-', ' ')}
        </div>

        <h3 
          className={cn(
            'font-semibold',
            variant === 'default' && 'text-lg',
            variant === 'featured' && 'text-2xl sm:text-3xl'
          )}
        >
          {event.title}
        </h3>
        
        <div 
          className={cn(
            'mt-3 space-y-2',
            variant === 'featured' && 'text-surface-300'
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock size={16} className="text-surface-500" />
            <span>{formatDate(event.date)} at {formatTime(event.time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-surface-500" />
            <span>{event.location}</span>
          </div>
        </div>

        {variant === 'featured' ? (
          <div className="mt-6">
            <p className="text-surface-400 mb-4 max-w-2xl">{event.description}</p>
            <Button 
              variant="primary" 
              size="lg"
              className="mt-2"
            >
              Register Now
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full"
            >
              More Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;