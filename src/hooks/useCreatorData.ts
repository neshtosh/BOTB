import { useCallback, useEffect, useState } from 'react';
import { MEDIA_BUCKET, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { releaseHealth } from '../lib/releases';
import type { ContentItem, PlatformConnection, PublishJob, Release, ReleaseHealth, TrackItem } from '../types/platform';

export function useConnections() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase.from('platform_connections').select('*').order('created_at');
    setConnections((data as PlatformConnection[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { connections, loading, reload };
}

export interface PostedJob extends PublishJob {
  // True when this post used a clip cut from the upload rather than the full file.
  fromClip: boolean;
}

export interface LibraryItem extends TrackItem {
  clips: ContentItem[];
  // Posts of the upload itself plus posts of any clip made from it.
  jobs: PostedJob[];
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id;

  const reload = useCallback(async () => {
    if (!userId) return;
    // Filter by owner explicitly: RLS also lets everyone read *public* items,
    // which must not show up in someone else's studio.
    const { data } = await supabase
      .from('content_items')
      .select('*, publish_jobs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    const rows = (data as (ContentItem & { publish_jobs: PublishJob[] })[]) ?? [];

    const top = rows.filter((r) => !r.parent_id);
    setItems(
      top.map(({ publish_jobs, ...item }) => {
        const clips = rows.filter((r) => r.parent_id === item.id);
        const jobs: PostedJob[] = [
          ...publish_jobs.map((j) => ({ ...j, fromClip: false })),
          ...clips.flatMap((c) => c.publish_jobs.map((j) => ({ ...j, fromClip: true }))),
        ].sort((a, b) => b.created_at.localeCompare(a.created_at));
        return { ...item, clips, jobs };
      })
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

export interface ReleaseWithTracks extends Release {
  tracks: LibraryItem[];
  jobs: PostedJob[];
  health: ReleaseHealth;
  coverUrl: string | null;
}

// Releases with their tracks, each track's clips and every post made from them.
export function useReleases() {
  const { items, loading: itemsLoading, reload: reloadItems } = useLibrary();
  const [releases, setReleases] = useState<Release[]>([]);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id;

  const reloadReleases = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('releases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    const rows = (data as Release[]) ?? [];
    setReleases(rows);
    const paths = [...new Set(rows.map((r) => r.cover_path).filter(Boolean) as string[])];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, 60 * 60);
      setCovers(Object.fromEntries((signed ?? []).map((s) => [s.path, s.signedUrl])));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    reloadReleases();
  }, [reloadReleases]);

  const reload = useCallback(async () => {
    await Promise.all([reloadReleases(), reloadItems()]);
  }, [reloadReleases, reloadItems]);

  const withTracks: ReleaseWithTracks[] = releases.map((release) => {
    const tracks = items
      .filter((i) => i.release_id === release.id)
      .sort((a, b) => (a.track_number ?? 0) - (b.track_number ?? 0));
    const jobs = tracks.flatMap((t) => t.jobs).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return {
      ...release,
      tracks,
      jobs,
      health: releaseHealth(jobs),
      coverUrl: release.cover_path ? covers[release.cover_path] ?? null : null,
    };
  });

  return { releases: withTracks, loading: loading || itemsLoading, reload };
}
