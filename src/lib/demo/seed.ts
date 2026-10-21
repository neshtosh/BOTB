// Seeds the demo database with a ready-to-explore creator account. Media is
// generated in the browser (synthesised audio, a canvas-recorded visualizer),
// so there are still no media files in the repo.

import { getState, Row, save, table } from './db';
import { getFile, putFile } from './blobStore';
import { metricsFor } from './api';
import { synthesizeDemo } from '../demoTrack';
import { makeSquareCover } from '../covers';
import { mockCreators } from '../../data/mockCreators';
import { nextIdle } from '../../utils/idle';

export const DEMO_EMAIL = 'demo@unsigned.app';
export const DEMO_PASSWORD = 'unsigned-demo';
const DEMO_USER_ID = '00000000-0000-4000-8000-00000000de00';

const daysAgo = (d: number, h = 0) => new Date(Date.now() - (d * 24 + h) * 3_600_000).toISOString();
// Midnight local time, n days from now (the upcoming release).
const daysAhead = (d: number) => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + d);
  return t.toISOString();
};

const RELEASES = {
  matatu: 'r0000000-0000-4000-8000-000000000001',
  visualizer: 'r0000000-0000-4000-8000-000000000002',
  paperCuts: 'r0000000-0000-4000-8000-000000000003',
};

const FILES = {
  matatu: `${DEMO_USER_ID}/seed-midnight-matatu.wav`,
  paperCuts: `${DEMO_USER_ID}/seed-paper-cuts.wav`,
  visualizer: `${DEMO_USER_ID}/seed-matatu-visualizer.webm`,
  clip: `${DEMO_USER_ID}/seed-matatu-clip.webm`,
  matatuCover: `${DEMO_USER_ID}/covers/seed-midnight-matatu.jpg`,
  paperCutsCover: `${DEMO_USER_ID}/covers/seed-paper-cuts.jpg`,
};

export function seedIfEmpty() {
  const s = getState();
  if (s.users.length) return;

  s.users.push({
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    user_metadata: { handle: 'kasimoto', display_name: 'Kasi Moto', creator_type: 'musician' },
  });

  // Profiles: the demo account plus the other fictional creators (public pages).
  table('profiles').push(
    {
      id: DEMO_USER_ID,
      handle: 'kasimoto',
      display_name: 'Kasi Moto',
      creator_type: 'musician',
      bio: 'Independent Afro-house producer from Nairobi. No label, no manager — just records.\n(Fictional demo profile.)',
      avatar_url: null,
      links: [
        { label: 'SoundCloud', url: 'https://soundcloud.com' },
        { label: 'YouTube', url: 'https://youtube.com' },
      ],
      created_at: daysAgo(40),
    },
    ...mockCreators.slice(1).map((c, i) => ({
      id: `00000000-0000-4000-8000-00000000c${String(i).padStart(3, '0')}`,
      handle: c.handle,
      display_name: c.name,
      creator_type: c.kind.includes('podcast') ? 'podcaster' : c.kind.includes('video') ? 'video' : 'musician',
      bio: `${c.kind} from ${c.city}. (Fictional demo profile.)`,
      avatar_url: null,
      links: [],
      created_at: daysAgo(30 + i),
    }))
  );

  const release = (id: string, fields: Row): Row => ({
    id,
    user_id: DEMO_USER_ID,
    artist_name: 'Kasi Moto',
    kind: 'single',
    primary_genre: 'Dance',
    secondary_genre: 'Afro House',
    language: 'English',
    description: '',
    tags: [],
    previously_released: false,
    original_release_date: null,
    release_at: null,
    cover_path: null,
    is_public: true,
    splits: [],
    smart_link_visits: 0,
    ...fields,
    updated_at: fields.created_at,
  });

  table('releases').push(
    release(RELEASES.matatu, {
      slug: 'midnight-matatu',
      title: 'Midnight Matatu',
      description: 'New single. Self-released, mixed in my bedroom, built for the matatu speakers.',
      tags: ['afrohouse', 'independent', 'newmusic'],
      cover_path: FILES.matatuCover,
      splits: [
        { name: 'Kasi Moto', email: DEMO_EMAIL, role: 'Artist', share: 70 },
        { name: 'Saka Beats', email: 'saka@example.com', role: 'Producer', share: 30 },
      ],
      smart_link_visits: 412,
      created_at: daysAgo(6),
    }),
    release(RELEASES.visualizer, {
      slug: 'midnight-matatu-visualizer',
      title: 'Midnight Matatu (Visualizer)',
      description: 'Visualizer for the new single.',
      tags: ['visualizer', 'afrohouse'],
      cover_path: FILES.matatuCover,
      smart_link_visits: 96,
      created_at: daysAgo(3),
    }),
    release(RELEASES.paperCuts, {
      slug: 'paper-cuts',
      title: 'Paper Cuts',
      description: 'Next single. Out soon — pre-save it.',
      tags: ['afrohouse', 'comingsoon'],
      release_at: daysAhead(9),
      cover_path: FILES.paperCutsCover,
      smart_link_visits: 57,
      created_at: daysAgo(1),
    })
  );

  const item = (id: string, fields: Row): Row => ({
    id,
    user_id: DEMO_USER_ID,
    description: '',
    tags: [],
    is_public: true,
    parent_id: null,
    clip_start: null,
    clip_duration: null,
    release_id: null,
    track_number: null,
    version: '',
    featured_artists: [],
    songwriters: [],
    is_cover: false,
    explicit: false,
    instrumental: false,
    ai_generated: false,
    hook_start: null,
    ...fields,
  });
  const track = (releaseId: string, fields: Row) => ({
    release_id: releaseId,
    track_number: 1,
    songwriters: ['Kasimir Moto'],
    ...fields,
  });

  table('content_items').push(
    item('c0000000-0000-4000-8000-000000000001', {
      ...track(RELEASES.matatu, { hook_start: 24, featured_artists: [{ name: 'Saka Beats', role: 'featured' }] }),
      title: 'Midnight Matatu',
      description: 'New single. Self-released, mixed in my bedroom, built for the matatu speakers.',
      tags: ['afrohouse', 'independent', 'newmusic'],
      media_type: 'audio',
      storage_path: FILES.matatu,
      mime_type: 'audio/wav',
      file_size: 3_000_044,
      created_at: daysAgo(6),
    }),
    item('c0000000-0000-4000-8000-000000000002', {
      parent_id: 'c0000000-0000-4000-8000-000000000001',
      title: 'Midnight Matatu',
      description: 'New single out now.',
      tags: ['afrohouse', 'independent'],
      media_type: 'video',
      storage_path: FILES.clip,
      mime_type: 'video/webm',
      file_size: 900_000,
      is_public: false,
      clip_start: 24,
      clip_duration: 15,
      created_at: daysAgo(6, -1),
    }),
    item('c0000000-0000-4000-8000-000000000003', {
      ...track(RELEASES.visualizer, { version: 'Visualizer' }),
      title: 'Midnight Matatu (Visualizer)',
      description: 'Visualizer for the new single.',
      tags: ['visualizer', 'afrohouse'],
      media_type: 'video',
      storage_path: FILES.visualizer,
      mime_type: 'video/webm',
      file_size: 1_400_000,
      created_at: daysAgo(3),
    }),
    item('c0000000-0000-4000-8000-000000000004', {
      ...track(RELEASES.paperCuts, { hook_start: 30 }),
      title: 'Paper Cuts',
      description: 'Next single. Out soon — pre-save it.',
      tags: ['afrohouse', 'comingsoon'],
      media_type: 'audio',
      storage_path: FILES.paperCuts,
      mime_type: 'audio/wav',
      file_size: 2_800_044,
      is_public: false,
      created_at: daysAgo(1),
    })
  );

  table('platform_connections').push(
    { id: 'p0000000-0000-4000-8000-000000000001', user_id: DEMO_USER_ID, provider: 'youtube', account_name: 'Kasi Moto', account_id: 'UC-demo-kasimoto', metadata: {}, created_at: daysAgo(20) },
    { id: 'p0000000-0000-4000-8000-000000000002', user_id: DEMO_USER_ID, provider: 'meta', account_name: 'Kasi Moto Music', account_id: 'page-demo', metadata: { pageName: 'Kasi Moto Music', instagramUsername: 'kasimoto', hasInstagram: true }, created_at: daysAgo(20) },
    { id: 'p0000000-0000-4000-8000-000000000003', user_id: DEMO_USER_ID, provider: 'soundcloud', account_name: 'kasimoto', account_id: 'sc-demo', metadata: {}, created_at: daysAgo(19) }
  );

  const job = (n: number, contentId: string, target: string, created: string, caption: string): Row => ({
    id: `j0000000-0000-4000-8000-00000000000${n}`,
    user_id: DEMO_USER_ID,
    content_id: contentId,
    target,
    status: 'published',
    options: { privacy: 'public', caption },
    external_id: `demo_seed_${n}`,
    external_url: `/demo/post/j0000000-0000-4000-8000-00000000000${n}`,
    external_meta: { demo: true },
    error: null,
    created_at: created,
    updated_at: created,
  });
  const jobs = [
    job(1, 'c0000000-0000-4000-8000-000000000001', 'soundcloud', daysAgo(6), 'Midnight Matatu — out now, self-released.'),
    job(2, 'c0000000-0000-4000-8000-000000000002', 'youtube', daysAgo(6, -1), 'Midnight Matatu — official clip'),
    job(3, 'c0000000-0000-4000-8000-000000000002', 'instagram', daysAgo(6, -1), 'Out now. Self-released. Link in bio.'),
    job(4, 'c0000000-0000-4000-8000-000000000002', 'facebook', daysAgo(6, -1), 'New single — stream it today'),
    job(5, 'c0000000-0000-4000-8000-000000000003', 'youtube', daysAgo(3), 'Midnight Matatu (Visualizer)'),
  ];
  table('publish_jobs').push(...jobs, {
    // Paper Cuts is waiting for release day.
    ...job(6, 'c0000000-0000-4000-8000-000000000004', 'soundcloud', daysAgo(1), 'Paper Cuts — out now.'),
    status: 'scheduled',
    scheduled_for: daysAhead(9),
    external_id: null,
    external_url: null,
  });

  // Fans who pre-saved Paper Cuts from its smart link.
  const fans = ['halima', 'brian', 'ciku', 'dan', 'eve', 'fatma', 'gitau', 'hana', 'ivy', 'juma', 'kemi', 'lulu'];
  fans.forEach((name, i) =>
    table('release_presaves').push({
      id: `s0000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      release_id: RELEASES.paperCuts,
      email: `${name}@example.com`,
      created_at: daysAgo(0, 20 - i),
    })
  );
  const fetched = Date.now() - 2 * 3_600_000;
  table('post_metrics').push(...jobs.map((j) => ({ job_id: j.id, user_id: DEMO_USER_ID, ...metricsFor(j, fetched), fetched_at: new Date(fetched).toISOString() })));

  const names = ['amina', 'jay', 'wanjiru', 'otis', 'njeri', 'leo', 'zawadi', 'tomas', 'imani', 'kofi'];
  for (let i = 0; i < 38; i++) {
    table('newsletter_subscribers').push({
      id: `n0000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      email: `${names[i % names.length]}${i}@example.com`,
      creator_id: DEMO_USER_ID,
      created_at: daysAgo(i % 20),
    });
  }
  save();
}

// ---------------------------------------------------------------------------
// Media generation
// ---------------------------------------------------------------------------

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new Blob([buffer], { type: 'audio/wav' });
}

// A few seconds of animated "visualizer" recorded from a canvas.
async function recordVisualizer(seconds: number, vertical: boolean): Promise<Blob | null> {
  if (typeof MediaRecorder === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = vertical ? 360 : 640;
  canvas.height = vertical ? 640 : 360;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(24);
  const type = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) return null;
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 900_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => (recorder.onstop = () => resolve(new Blob(chunks, { type: type.split(';')[0] }))));

  const { width: w, height: h } = canvas;
  const start = performance.now();
  let frame = 0;
  const draw = () => {
    const t = (performance.now() - start) / 1000;
    ctx.fillStyle = '#f2e600';
    ctx.fillRect(0, 0, w, h);
    const beat = Math.abs(Math.sin(t * Math.PI * 2));
    ctx.fillStyle = '#ff4d2e';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.42, Math.min(w, h) * (0.26 + beat * 0.04), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2e600';
    for (let i = 0; i < 8; i++) ctx.fillRect(0, h * 0.45 + i * h * 0.025 + ((t * 40) % (h * 0.025)), w, h * 0.011);
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    for (let i = 0; i < 24; i++) {
      const bh = (0.2 + Math.abs(Math.sin(t * 6 + i))) * h * 0.08;
      ctx.fillStyle = '#f2e600';
      ctx.fillRect((i / 24) * w + 4, h * 0.88 - bh, w / 24 - 6, bh);
    }
    ctx.fillStyle = '#ff4d2e';
    ctx.font = `${Math.round(h * 0.07)}px Dracutaz, sans-serif`;
    ctx.fillText('MIDNIGHT MATATU', w * 0.06, h * 0.82);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(h * 0.03)}px "Geist Mono", monospace`;
    ctx.fillText('KASI MOTO · DEMO', w * 0.06, h * 0.95);
    frame++;
    if (t < seconds) requestAnimationFrame(draw);
    else recorder.stop();
  };
  recorder.start(250);
  requestAnimationFrame(draw);
  return Promise.race([done, new Promise<null>((r) => setTimeout(() => r(null), (seconds + 6) * 1000))]).then((b) => (frame ? b : null));
}

// How each seed file is made. Audio and covers take a fraction of a second; the
// videos are recorded from a canvas in real time, several seconds each.
const MAKERS: Record<string, () => Promise<Blob | null>> = {
  [FILES.matatu]: async () => encodeWav(synthesizeDemo(), 22050),
  // Same track, played back higher and faster — a different-sounding demo.
  [FILES.paperCuts]: async () => encodeWav(synthesizeDemo(), 26000),
  [FILES.matatuCover]: () => makeSquareCover('Midnight Matatu', 'Kasi Moto'),
  [FILES.paperCutsCover]: () => makeSquareCover('Paper Cuts', 'Kasi Moto'),
  [FILES.visualizer]: () => recordVisualizer(6, false),
  [FILES.clip]: () => recordVisualizer(5, true),
};
const RECORDED = new Set([FILES.visualizer, FILES.clip]);

// Seed files quick enough to make on the spot when a page asks for one.
export const isQuickSeedFile = (path: string) => path in MAKERS && !RECORDED.has(path);

const making = new Map<string, Promise<void>>();

// Makes one seed file if it isn't in the file store yet.
export function ensureSeedFile(path: string): Promise<void> {
  const make = MAKERS[path];
  if (!make) return Promise.resolve();
  let pending = making.get(path);
  if (!pending) {
    pending = (async () => {
      if (await getFile(path).catch(() => undefined)) return;
      const blob = await make();
      if (blob) await putFile(path, blob);
    })().catch(() => {
      making.delete(path);
    });
    making.set(path, pending);
  }
  return pending;
}

let started = false;

// Makes the rest of the seed media in the background: a few seconds after load,
// one file per idle moment, so it stays clear of the page's first paint and intro.
// Pages that need an audio file or cover before then make it on the spot
// (see storage in client.ts).
export function ensureSeedMedia(delayMs = 5000) {
  if (started) return;
  started = true;
  window.setTimeout(async () => {
    for (const path of Object.keys(MAKERS)) {
      await nextIdle(2000);
      await ensureSeedFile(path);
    }
  }, delayMs);
}
