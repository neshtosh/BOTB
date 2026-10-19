import { supabase } from './supabase';
import type { PublishJob, Release, ReleaseHealth, ReleaseKind, Split } from '../types/platform';

export const MAX_TRACKS = 30;

// How stores and platforms usually label a release by track count.
export function kindFor(trackCount: number): ReleaseKind {
  if (trackCount >= 7) return 'album';
  if (trackCount >= 4) return 'ep';
  return 'single';
}

export const KIND_LABEL: Record<ReleaseKind, string> = { single: 'Single', ep: 'EP', album: 'Album' };

export const GENRES = [
  'Afrobeats',
  'Afro House',
  'Alternative',
  'Amapiano',
  'Bongo Flava',
  'Blues',
  "Children's Music",
  'Classical',
  'Comedy',
  'Country',
  'Dance',
  'Dancehall',
  'Electronic',
  'Folk',
  'Gengetone',
  'Gospel',
  'Hip Hop/Rap',
  'Indie',
  'Jazz',
  'Latin',
  'Metal',
  'Pop',
  'Punk',
  'R&B/Soul',
  'Reggae',
  'Rock',
  'Singer/Songwriter',
  'Soundtrack',
  'Spoken Word',
  'World',
];

export const LANGUAGES = [
  'English',
  'Swahili',
  'Instrumental (no lyrics)',
  'Amharic',
  'Arabic',
  'French',
  'Hausa',
  'Igbo',
  'Kinyarwanda',
  'Lingala',
  'Luganda',
  'Portuguese',
  'Sheng',
  'Somali',
  'Spanish',
  'Twi',
  'Yoruba',
  'Zulu',
  'Other',
];

export const VERSIONS = ['Live', 'Acoustic', 'Radio Edit', 'Remix', 'Instrumental', 'Sped Up', 'Slowed', 'Extended Mix', 'Visualizer'];

export const SPLIT_ROLES = ['Artist', 'Producer', 'Songwriter', 'Featured artist', 'Engineer', 'Manager', 'Band member', 'Other'];

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'release';

// Picks a free smart-link slug: "paper-cuts", then "paper-cuts-kasimoto", then "paper-cuts-2"…
export async function uniqueSlug(base: string, handle?: string) {
  const candidates = [base, handle ? `${base}-${handle}` : null].filter(Boolean) as string[];
  for (let i = 2; candidates.length < 12; i++) candidates.push(`${base}-${i}`);
  for (const slug of candidates) {
    const { data } = await supabase.from('releases').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export const smartLinkUrl = (slug: string) => `${window.location.origin}/r/${slug}`;

export const isUpcoming = (release: Pick<Release, 'release_at'>) =>
  Boolean(release.release_at && new Date(release.release_at).getTime() > Date.now());

// The latest attempt per track + platform decides the release's colour.
export function releaseHealth(jobs: PublishJob[]): ReleaseHealth {
  const latest = new Map<string, PublishJob>();
  for (const job of [...jobs].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    latest.set(`${job.content_id}:${job.target}`, job);
  }
  const statuses = [...latest.values()].map((j) => j.status);
  if (statuses.length === 0) return 'draft';
  if (statuses.includes('failed')) return 'attention';
  if (statuses.some((s) => s === 'processing' || s === 'queued')) return 'processing';
  if (statuses.includes('scheduled')) return 'scheduled';
  return 'live';
}

export const splitsTotal = (splits: Split[]) => Math.round(splits.reduce((sum, s) => sum + (Number(s.share) || 0), 0) * 100) / 100;

export function splitsProblem(splits: Split[]): string | null {
  if (splits.length === 0) return null;
  if (splits.some((s) => !s.name.trim())) return 'Every collaborator needs a name.';
  if (splits.some((s) => s.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email.trim()))) return 'Check the email addresses.';
  if (splits.some((s) => !(Number(s.share) > 0))) return 'Every share must be more than 0%.';
  const total = splitsTotal(splits);
  if (total !== 100) return `Shares add up to ${total}%, not 100%.`;
  return null;
}

// Spreadsheet export (pre-save emails, split sheets).
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(escape).join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const formatReleaseDate = (iso: string | null, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : 'As soon as it’s processed';
