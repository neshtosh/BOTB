import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ContentItem, PlatformConnection, PublishJob } from '../types/platform';

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

export interface LibraryItem extends ContentItem {
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
