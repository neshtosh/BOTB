import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { ExternalLink, Mail, UserCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { inputClass } from '../components/dashboard/styles';
import { useNewsletter } from '../hooks/useNewsletter';
import { MEDIA_BUCKET, supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatters';
import { Link, useParams } from 'react-router-dom';
import { formatReleaseDate, isUpcoming, KIND_LABEL } from '../lib/releases';
import type { ContentItem, Profile, Release, TrackItem } from '../types/platform';
import { ScribbleUnderline } from '../components/doodles/Doodles';

type PlayableItem = ContentItem & { src: string | null };

const CreatorPage: React.FC = () => {
  const { handle } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<PlayableItem[]>([]);
  const [releases, setReleases] = useState<(Release & { coverUrl: string | null })[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const newsletter = useNewsletter(profile?.id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: found } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', (handle ?? '').toLowerCase())
        .maybeSingle();
      if (cancelled) return;
      if (!found) {
        setState('missing');
        return;
      }
      setProfile(found as Profile);

      const { data: content } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', found.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      const { data: releaseRows } = await supabase
        .from('releases')
        .select('*')
        .eq('user_id', found.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      const publicReleases = (releaseRows as Release[]) ?? [];
      // Tracks of a release that isn't out yet stay hidden until release day.
      const unreleased = new Set(publicReleases.filter(isUpcoming).map((r) => r.id));
      const list = ((content as TrackItem[]) ?? []).filter((c) => !c.release_id || !unreleased.has(c.release_id));

      // Media is in a private bucket; public items get short-lived playback URLs.
      const covers = publicReleases.map((r) => r.cover_path).filter(Boolean) as string[];
      const paths = [...list.map((c) => c.storage_path), ...covers];
      const { data: signed } = paths.length
        ? await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, 60 * 60)
        : { data: [] };
      if (cancelled) return;
      const urlFor = (path: string | null) => (path ? signed?.find((s) => s.path === path)?.signedUrl ?? null : null);
      setItems(list.map((c) => ({ ...c, src: urlFor(c.storage_path) })));
      setReleases(publicReleases.map((r) => ({ ...r, coverUrl: urlFor(r.cover_path) })));
      setState('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (state === 'loading') {
    return <div className="container section pt-28 text-surface-600">Loading…</div>;
  }
  if (state === 'missing' || !profile) {
    return (
      <div className="container section pt-28 text-center">
        <h1 className="mb-2">Creator not found</h1>
        <p className="text-surface-600">No one is using the handle “{handle}” yet.</p>
      </div>
    );
  }

  return (
    <div className="container section pt-28 pb-24">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-12"
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="w-28 h-28 rounded-full object-cover" />
        ) : (
          <UserCircle size={112} className="text-surface-500" />
        )}
        <div className="flex-1">
          <h1 className="text-5xl sm:text-6xl">{profile.display_name}</h1>
          <ScribbleUnderline variant="wave" className="max-w-xs mt-2" />
          <p className="text-surface-600 mt-1">@{profile.handle}</p>
          {profile.bio && <p className="text-surface-800 mt-3 max-w-2xl whitespace-pre-line">{profile.bio}</p>}
          {profile.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm glass glass-hover rounded-full px-3 py-1">
                  {link.label} <ExternalLink size={12} />
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.header>

      {releases.length > 0 && (
        <section className="mb-12">
          <p className="eyebrow mb-4">Releases</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {releases.map((r) => (
              <li key={r.id}>
                <Link to={`/r/${r.slug}`} className="group block">
                  <div className="relative aspect-square bg-signal overflow-hidden border border-white/10">
                    {r.coverUrl && <img src={r.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    {isUpcoming(r) && <span className="absolute left-2 top-2 tag-yellow">Pre-save</span>}
                  </div>
                  <p className="mt-2 font-medium truncate group-hover:text-signal">{r.title}</p>
                  <p className="font-mono text-[11px] text-white/45">
                    {KIND_LABEL[r.kind]} · {isUpcoming(r) ? `out ${formatReleaseDate(r.release_at)}` : formatReleaseDate(r.release_at ?? r.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 ? (
        <p className="text-surface-600">Nothing posted yet. Check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <article key={item.id} className="glass rounded-2xl overflow-hidden">
              {item.src &&
                (item.media_type === 'video' ? (
                  <video src={item.src} controls preload="metadata" className="w-full aspect-video bg-black" />
                ) : (
                  <div className="p-4 pb-0">
                    <audio src={item.src} controls preload="none" className="w-full" />
                  </div>
                ))}
              <div className="p-4">
                <h5>{item.title}</h5>
                <p className="text-xs text-surface-600 mt-1">{formatDate(item.created_at)}</p>
                {item.description && <p className="text-sm text-surface-700 mt-2 line-clamp-3">{item.description}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="glass rounded-2xl p-6 sm:p-8 mt-16 max-w-xl">
        <h3 className="mb-2">Get updates from {profile.display_name}</h3>
        <p className="text-sm text-surface-600 mb-4">New drops, events and exclusives, straight to your inbox.</p>
        <form onSubmit={newsletter.subscribe} className="flex flex-col sm:flex-row gap-3">
          <input type="email" required placeholder="Your email address" className={inputClass}
            value={newsletter.email} onChange={(e) => newsletter.setEmail(e.target.value)} />
          <Button type="submit" leftIcon={<Mail size={16} />} isLoading={newsletter.status === 'loading'}>
            Subscribe
          </Button>
        </form>
        {newsletter.message && (
          <p className={newsletter.status === 'error' ? 'text-sm text-error-400 mt-2' : 'text-sm text-success-400 mt-2'}>
            {newsletter.message}
          </p>
        )}
      </section>
    </div>
  );
};

export default CreatorPage;
