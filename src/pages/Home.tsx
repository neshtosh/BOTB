import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { albums, featuredAlbum, recentReleases } from '../data/musicData';
import { videos, featuredVideo, recentVideos } from '../data/videoData';
import { upcomingEvents } from '../data/eventsData';
import AlbumCard from '../components/music/AlbumCard';
import VideoCard from '../components/videos/VideoCard';
import EventCard from '../components/events/EventCard';
import Button from '../components/common/Button';
import { cn } from '../utils/cn';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const Home: React.FC = () => {
  const featuredRef = useRef<HTMLDivElement>(null);
  const releasesRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  const featuredVisible = useScrollAnimation(featuredRef, { threshold: 0.2 });
  const releasesVisible = useScrollAnimation(releasesRef, { threshold: 0.2 });
  const videosVisible = useScrollAnimation(videosRef, { threshold: 0.2 });
  const eventsVisible = useScrollAnimation(eventsRef, { threshold: 0.2 });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${featuredAlbum.coverArt})`,
            filter: 'brightness(0.4)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface-100 via-transparent to-transparent" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="inline-block bg-primary-500/20 text-primary-300 text-sm font-medium rounded-full px-3 py-1 mb-6">
                New Album Out Now
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4">
                {featuredAlbum.title}
              </h1>
              <p className="text-xl sm:text-2xl text-surface-300 mb-8 max-w-2xl">
                Stream the latest album featuring chart-topping singles and exclusive content
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  rightIcon={<ChevronRight size={18} />}
                >
                  Listen Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                >
                  Watch Videos
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Releases */}
      <section 
        ref={releasesRef} 
        className="section container"
      >
        <div className="flex items-center justify-between mb-8">
          <h2>Latest Releases</h2>
          <Link to="/music" className="text-sm text-surface-600 hover:text-white flex items-center gap-1 group transition-colors">
            View All
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recentReleases.map((album, index) => (
            <motion.div
              key={album.id}
              variants={fadeInUp}
              initial="hidden"
              animate={releasesVisible ? "visible" : "hidden"}
              transition={{ delay: index * 0.1 }}
            >
              <AlbumCard album={album} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Video */}
      <section 
        ref={featuredRef}
        className="section bg-surface-50 border-y border-surface-300/30"
      >
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2>Featured Video</h2>
            <Link to="/videos" className="text-sm text-surface-600 hover:text-white flex items-center gap-1 group transition-colors">
              All Videos
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={featuredVisible ? "visible" : "hidden"}
          >
            <VideoCard video={featuredVideo} variant="featured" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {recentVideos.slice(1, 4).map((video, index) => (
              <motion.div
                key={video.id}
                variants={fadeInUp}
                initial="hidden"
                animate={featuredVisible ? "visible" : "hidden"}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section 
        ref={eventsRef}
        className="section container"
      >
        <div className="flex items-center justify-between mb-8">
          <h2>Upcoming Events</h2>
          <Link to="/events" className="text-sm text-surface-600 hover:text-white flex items-center gap-1 group transition-colors">
            All Events
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-6">
          {upcomingEvents.length > 0 && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate={eventsVisible ? "visible" : "hidden"}
            >
              <EventCard event={upcomingEvents[0]} variant="featured" />
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {upcomingEvents.slice(1).map((event, index) => (
              <motion.div
                key={event.id}
                variants={fadeInUp}
                initial="hidden"
                animate={eventsVisible ? "visible" : "hidden"}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section 
        ref={videosRef}
        className={cn(
          "relative py-20 my-12 overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-radial before:from-primary-900/40 before:to-surface-100 before:z-0"
        )}
      >
        <div className="container relative z-10">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="hidden"
            animate={videosVisible ? "visible" : "hidden"}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Stay in the Loop</h2>
            <p className="text-surface-400 mb-8">
              Subscribe to get exclusive updates on new releases, tickets, merchandise, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 bg-surface-200 border border-surface-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <Button>Subscribe</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;