// The new-release form's state, its per-step checks, and the submit pipeline:
// cover → release row → each track (upload, save, publish/schedule).

import { MEDIA_BUCKET, supabase } from '../../../lib/supabase';
import { checkCover, makeClipFrame, makeSquareCover, type CoverCheck } from '../../../lib/covers';
import { executePlan, type ClipSettings, type PostMode, type PublishPlan, type TargetProgress } from '../../../lib/publishPlan';
import { kindFor, MAX_TRACKS, slugify, splitsProblem, uniqueSlug } from '../../../lib/releases';
import { modesFor, targets as allTargets } from '../../../config/platforms';
import type { ContentItem, FeaturedArtist, MediaType, Split, Target } from '../../../types/platform';

export interface TrackDraft {
  key: string;
  file: File;
  mediaType: MediaType;
  title: string;
  version: string;
  featured: FeaturedArtist[];
  songwriters: string[];
  isCover: boolean;
  explicit: boolean;
  instrumental: boolean;
  ai: boolean;
  clip: ClipSettings;
  // The hook has been picked (automatically or by hand), so re-opening keeps it.
  hookSet?: boolean;
}

export interface DestinationDraft {
  mode: PostMode;
  caption: string;
  trackKeys: string[];
}

export const AGREEMENTS = {
  rights: 'I own or control the rights to all the audio, artwork and lyrics in this release.',
  names: 'Songwriter names are real names, and I’m allowed to use every artist name on it.',
  noFakes: 'I won’t use bots or paid services to fake plays, views or followers.',
  platformRules: 'I understand each platform can mute, limit or remove posts under its own rules.',
} as const;
export type AgreementKey = keyof typeof AGREEMENTS;

export interface ReleaseDraft {
  targets: Target[];
  artistName: string;
  title: string;
  primaryGenre: string;
  secondaryGenre: string;
  language: string;
  description: string;
  tags: string;
  previouslyReleased: boolean;
  originalDate: string;
  cover: File | null;
  coverCheck: CoverCheck | null;
  tracks: TrackDraft[];
  destinations: Partial<Record<Target, DestinationDraft>>;
  timing: 'now' | 'scheduled';
  // <input type="datetime-local"> value, in the creator's own time zone.
  releaseAt: string;
  privacy: 'public' | 'private';
  showOnPage: boolean;
  slug: string;
  splits: Split[];
  agreements: Record<AgreementKey, boolean>;
}

export const STEPS = [
  { id: 'platforms', label: 'Platforms' },
  { id: 'details', label: 'Release details' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'destinations', label: 'Where it goes' },
  { id: 'date', label: 'Release date' },
  { id: 'splits', label: 'Splits' },
  { id: 'review', label: 'Review' },
] as const;
export type StepId = (typeof STEPS)[number]['id'];

// datetime-local value for a Date, in local time.
export const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function emptyDraft(artistName: string, email: string): ReleaseDraft {
  // Default schedule: two weeks out at midday, enough time to collect pre-saves.
  const later = new Date();
  later.setDate(later.getDate() + 14);
  later.setHours(12, 0, 0, 0);
  return {
    targets: [],
    artistName,
    title: '',
    primaryGenre: '',
    secondaryGenre: '',
    language: 'English',
    description: '',
    tags: '',
    previouslyReleased: false,
    originalDate: '',
    cover: null,
    coverCheck: null,
    tracks: [],
    destinations: {},
    timing: 'now',
    releaseAt: toLocalInput(later),
    privacy: 'public',
    showOnPage: true,
    slug: '',
    splits: [{ name: artistName, email, role: 'Artist', share: 100 }],
    agreements: { rights: false, names: false, noFakes: false, platformRules: false },
  };
}

export const mediaTypeOf = (file: File): MediaType | null =>
  file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;

export const newTrack = (file: File, mediaType: MediaType, songwriter: string): TrackDraft => ({
  key: crypto.randomUUID(),
  file,
  mediaType,
  title: file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim(),
  version: '',
  featured: [],
  songwriters: songwriter ? [songwriter] : [''],
  isCover: false,
  explicit: false,
  instrumental: false,
  ai: false,
  clip: { start: 0, duration: 30, cover: null },
});

export const releaseMediaType = (draft: ReleaseDraft): MediaType | null => draft.tracks[0]?.mediaType ?? null;

export const tagList = (tags: string) => tags.split(',').map((t) => t.trim()).filter(Boolean);

// "Title (Live) [feat. X]" as platforms show it.
export function displayTitle(track: Pick<TrackDraft, 'title' | 'version' | 'featured'>) {
  const feat = track.featured.filter((f) => f.name.trim() && f.role === 'featured').map((f) => f.name.trim());
  const remix = track.featured.filter((f) => f.name.trim() && f.role === 'remixer').map((f) => f.name.trim());
  let title = track.title.trim();
  if (feat.length) title += ` (feat. ${feat.join(' & ')})`;
  if (remix.length) title += ` (${remix.join(' & ')} Remix)`;
  else if (track.version.trim()) title += ` (${track.version.trim()})`;
  return title;
}

export function defaultCaptionTemplate(draft: ReleaseDraft) {
  const hashtags = tagList(draft.tags).map((t) => `#${t.replace(/\s+/g, '')}`).join(' ');
  const timing = draft.timing === 'scheduled' ? 'Out now' : 'New music';
  return [`{title} — {artist}. ${timing}.`, draft.description.trim(), hashtags].filter(Boolean).join('\n\n');
}

export const expandCaption = (template: string, track: TrackDraft, artist: string) =>
  template.replace(/\{title\}/g, displayTitle(track)).replace(/\{artist\}/g, artist.trim());

// Platforms that can take this release, with the default post per platform.
// Social platforms get one clip of the first track; full-file platforms get every track.
export function defaultDestinations(draft: ReleaseDraft): ReleaseDraft['destinations'] {
  const mediaType = releaseMediaType(draft);
  if (!mediaType) return {};
  const caption = defaultCaptionTemplate(draft);
  const next: ReleaseDraft['destinations'] = {};
  for (const target of draft.targets) {
    const modes = modesFor(target, mediaType);
    if (!modes.length) continue;
    const existing = draft.destinations[target];
    const keys = draft.tracks.map((t) => t.key);
    if (existing) {
      // Keep the creator's choices, dropping tracks that were removed.
      const trackKeys = existing.trackKeys.filter((k) => keys.includes(k));
      next[target] = { ...existing, trackKeys: trackKeys.length ? trackKeys : keys.slice(0, 1) };
      continue;
    }
    const mode = modes[0];
    next[target] = { mode, caption, trackKeys: mode === 'clip' ? keys.slice(0, 1) : keys };
  }
  return next;
}

export const scheduledIso = (draft: ReleaseDraft) =>
  draft.timing === 'scheduled' && draft.releaseAt ? new Date(draft.releaseAt).toISOString() : null;

// Problems that stop the creator leaving a step. Empty = good to go.
export function stepProblems(step: StepId, draft: ReleaseDraft): string[] {
  const p: string[] = [];
  switch (step) {
    case 'details':
      if (!draft.artistName.trim()) p.push('Add the artist or band name.');
      if (!draft.title.trim()) p.push('Give the release a title.');
      if (!draft.primaryGenre) p.push('Pick a primary genre.');
      if (draft.previouslyReleased && !draft.originalDate) p.push('Add the original release date.');
      if (draft.cover && draft.coverCheck && !draft.coverCheck.ok) p.push('Fix the cover art, or remove it to use a generated cover.');
      break;
    case 'tracks':
      if (draft.tracks.length === 0) p.push('Add at least one track.');
      if (draft.tracks.length > MAX_TRACKS) p.push(`A release can have up to ${MAX_TRACKS} tracks.`);
      draft.tracks.forEach((t, i) => {
        if (!t.title.trim()) p.push(`Track ${i + 1} needs a title.`);
        if (!t.songwriters.some((s) => s.trim())) p.push(`Track ${i + 1}: add the songwriter’s real name.`);
      });
      break;
    case 'destinations':
      for (const target of draft.targets) {
        const dest = draft.destinations[target];
        const info = allTargets.find((t) => t.id === target)!;
        if (!dest) continue;
        if (dest.trackKeys.length === 0) p.push(`${info.name}: choose at least one track, or untick it in Platforms.`);
        const longest = Math.max(
          0,
          ...draft.tracks.filter((t) => dest.trackKeys.includes(t.key)).map((t) => expandCaption(dest.caption, t, draft.artistName).length)
        );
        if (longest > info.captionLimit) p.push(`${info.name}: caption is over ${info.captionLimit} characters.`);
      }
      break;
    case 'date':
      if (draft.timing === 'scheduled') {
        const at = new Date(draft.releaseAt).getTime();
        if (!draft.releaseAt || Number.isNaN(at)) p.push('Pick a release date and time.');
        else if (at < Date.now() + 10 * 60_000) p.push('Pick a time at least 10 minutes from now.');
      }
      if (draft.slug && !/^[a-z0-9][a-z0-9-]{1,59}$/.test(draft.slug)) p.push('Smart link: use lowercase letters, numbers and dashes.');
      break;
    case 'splits': {
      const problem = splitsProblem(draft.splits);
      if (problem) p.push(problem);
      break;
    }
    case 'review':
      (Object.keys(AGREEMENTS) as AgreementKey[]).forEach((k) => {
        if (!draft.agreements[k]) p.push('Tick every box to confirm.');
      });
      return [...new Set(p)];
  }
  return p;
}

export async function coverPatch(file: File | null): Promise<Partial<ReleaseDraft>> {
  return { cover: file, coverCheck: file ? await checkCover(file) : null };
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export type SubmitStage = { label: string; done: number; total: number };

interface SubmitContext {
  userId: string;
  handle?: string;
  onStage: (stage: SubmitStage) => void;
  onProgress: (trackKey: string, target: Target, progress: TargetProgress) => void;
}

const extOf = (file: File) => file.name.split('.').pop()?.toLowerCase() || 'bin';

async function upload(path: string, file: Blob, contentType: string) {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

export async function submitRelease(draft: ReleaseDraft, ctx: SubmitContext): Promise<{ id: string; slug: string }> {
  const mediaType = releaseMediaType(draft)!;
  const total = draft.tracks.length + 2;
  const artist = draft.artistName.trim();

  ctx.onStage({ label: 'Preparing cover art', done: 0, total });
  const coverFile = draft.cover ?? (await makeSquareCover(draft.title, artist));
  const coverPath = `${ctx.userId}/covers/${crypto.randomUUID()}.${coverFile.type === 'image/png' ? 'png' : 'jpg'}`;
  await upload(coverPath, coverFile, coverFile.type || 'image/jpeg');

  ctx.onStage({ label: 'Creating the release', done: 1, total });
  const slug = await uniqueSlug(draft.slug || slugify(draft.title), ctx.handle);
  const releaseAt = scheduledIso(draft);
  const { data: release, error } = await supabase
    .from('releases')
    .insert({
      user_id: ctx.userId,
      slug,
      title: draft.title.trim(),
      artist_name: artist,
      kind: kindFor(draft.tracks.length),
      primary_genre: draft.primaryGenre,
      secondary_genre: draft.secondaryGenre || null,
      language: draft.language,
      description: draft.description.trim(),
      tags: tagList(draft.tags),
      previously_released: draft.previouslyReleased,
      original_release_date: draft.previouslyReleased ? draft.originalDate : null,
      release_at: releaseAt,
      cover_path: coverPath,
      is_public: true,
      splits: draft.splits.map((s) => ({ ...s, name: s.name.trim(), email: s.email.trim(), share: Number(s.share) })),
    })
    .select()
    .single();
  if (error || !release) throw new Error(`Could not save the release: ${error?.message}`);

  for (const [i, track] of draft.tracks.entries()) {
    ctx.onStage({ label: `Uploading track ${i + 1} of ${draft.tracks.length}: ${track.title}`, done: i + 2, total });
    const path = `${ctx.userId}/${crypto.randomUUID()}.${extOf(track.file)}`;
    await upload(path, track.file, track.file.type);
    const { data: item, error: itemError } = await supabase
      .from('content_items')
      .insert({
        user_id: ctx.userId,
        release_id: release.id,
        track_number: i + 1,
        title: displayTitle(track),
        description: draft.description.trim(),
        tags: tagList(draft.tags),
        media_type: mediaType,
        storage_path: path,
        mime_type: track.file.type,
        file_size: track.file.size,
        is_public: draft.showOnPage,
        version: track.version.trim(),
        featured_artists: track.featured.filter((f) => f.name.trim()),
        songwriters: track.songwriters.map((s) => s.trim()).filter(Boolean),
        is_cover: track.isCover,
        explicit: track.explicit,
        instrumental: track.instrumental,
        ai_generated: track.ai,
        hook_start: track.clip.start,
      })
      .select()
      .single();
    if (itemError || !item) throw new Error(`Could not save ${track.title}: ${itemError?.message}`);

    const trackTargets = draft.targets.filter((t) => draft.destinations[t]?.trackKeys.includes(track.key));
    if (!trackTargets.length) continue;
    const plan: PublishPlan = {
      targets: trackTargets,
      perTarget: Object.fromEntries(
        trackTargets.map((t) => [t, { mode: draft.destinations[t]!.mode, caption: expandCaption(draft.destinations[t]!.caption, track, artist) }])
      ),
      clip: {
        ...track.clip,
        // Audio clips show the release's square art framed for vertical video.
        cover:
          mediaType === 'audio' && trackTargets.some((t) => draft.destinations[t]!.mode === 'clip')
            ? new File([await makeClipFrame(coverFile, displayTitle(track), artist)], 'frame.jpg', { type: 'image/jpeg' })
            : null,
      },
      privacy: draft.privacy,
      scheduledFor: releaseAt,
    };
    await executePlan({
      plan,
      item: item as ContentItem,
      mediaType,
      getSource: async () => track.file,
      creatorName: artist,
      onProgress: (target, progress) => ctx.onProgress(track.key, target, progress),
    });
  }

  ctx.onStage({ label: 'Done', done: total, total });
  return { id: release.id as string, slug };
}

export const YES_NO = [
  { value: false, label: 'No' },
  { value: true, label: 'Yes' },
];
