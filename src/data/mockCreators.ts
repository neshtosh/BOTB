// Fictional example creators used on the landing page. Not real people or
// releases; every number here is illustrative and labelled as such in the UI.

export type CoverStyle = 'sun' | 'stripes' | 'dots' | 'waves';

export interface MockCreator {
  handle: string;
  name: string;
  kind: string;
  city: string;
  release: { title: string; type: 'Single' | 'EP' | 'Video' | 'Episode' };
  cover: { style: CoverStyle; bg: string; fg: string; accent: string };
  stats: { fans: number; posts: number; platforms: number };
}

export const mockCreators: MockCreator[] = [
  {
    handle: 'kasimoto',
    name: 'Kasi Moto',
    kind: 'Afro-house producer',
    city: 'Nairobi',
    release: { title: 'Midnight Matatu', type: 'Single' },
    cover: { style: 'sun', bg: '#f2e600', fg: '#0b0b0c', accent: '#ff4d2e' },
    stats: { fans: 2840, posts: 46, platforms: 5 },
  },
  {
    handle: 'lenarue',
    name: 'Lena Rue',
    kind: 'Bedroom-pop singer',
    city: 'Lisbon',
    release: { title: 'Paper Planes', type: 'EP' },
    cover: { style: 'waves', bg: '#ff7ab6', fg: '#0b0b0c', accent: '#f2e600' },
    stats: { fans: 1215, posts: 31, platforms: 4 },
  },
  {
    handle: 'tobidaze',
    name: 'Tobi Daze',
    kind: 'Skate & travel videos',
    city: 'Lagos',
    release: { title: 'City by Board', type: 'Video' },
    cover: { style: 'stripes', bg: '#3ee6c8', fg: '#0b0b0c', accent: '#f2e600' },
    stats: { fans: 5390, posts: 88, platforms: 4 },
  },
  {
    handle: 'amaniblue',
    name: 'Amani Blue',
    kind: 'Music podcast host',
    city: 'Kampala',
    release: { title: 'Studio Talk 12', type: 'Episode' },
    cover: { style: 'dots', bg: '#7c5cff', fg: '#ffffff', accent: '#f2e600' },
    stats: { fans: 960, posts: 24, platforms: 3 },
  },
];

// The creator featured in the "How it works" demo.
export const demoCreator = mockCreators[0];
