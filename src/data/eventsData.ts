import { Event } from '../types';

export const events: Event[] = [
  {
    id: 'e1',
    title: 'Neon Dreams World Premiere',
    type: 'listening-party',
    date: '2025-06-15',
    time: '8:00 PM',
    location: 'Online',
    imageUrl: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Join us for the exclusive first listen of the new album "Neon Dreams" with a live Q&A session afterward.',
    registrationUrl: '#',
  },
  {
    id: 'e2',
    title: 'Summer Vibes EP Launch',
    type: 'album-launch',
    date: '2025-07-22',
    time: '7:30 PM',
    location: 'Skylight Studios, Los Angeles',
    imageUrl: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Be among the first to experience the new EP with an intimate live performance and exclusive merchandise.',
    registrationUrl: '#',
  },
  {
    id: 'e3',
    title: 'Acoustic Sessions',
    type: 'live-stream',
    date: '2025-08-10',
    time: '6:00 PM',
    location: 'YouTube Live',
    imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'A special acoustic performance streaming live with fan-requested songs and behind-the-scenes stories.',
    registrationUrl: '#',
  },
  {
    id: 'e4',
    title: 'Visualizer Marathon',
    type: 'live-stream',
    date: '2025-09-05',
    time: '9:00 PM',
    location: 'Instagram Live',
    imageUrl: 'https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Join for an evening of visual storytelling as we premiere all visualizers from the new album.',
    registrationUrl: '#',
  },
];

export const upcomingEvents = events.filter(
  event => new Date(event.date) > new Date()
);