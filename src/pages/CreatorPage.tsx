import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Mail } from 'lucide-react';
import { cardClass, inputClass } from '../components/dashboard/styles';
import { PaperPanel } from '../components/theme/Poster';
import { useNewsletter } from '../hooks/useNewsletter';
import { MEDIA_BUCKET, supabase } from '../lib/supabase';
import { cn } from '../utils/cn';
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
    return (
      <div className="container section pt-28">
        <p className="eyebrow text-white/50">Loading…</p>
      </div>
    );
  }
  if (state === 'missing' || !profile) {
    return (
      <div className="container section pt-28 text-center">
        <h1>Creator not found</h1>
        <p className="mt-3 text-white/60">No one is using the handle “{handle}” yet.</p>
        <Link to="/" className="mt-6 inline-block eyebrow text-signal">Go to Unsigned →</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PaperPanel seed={23} tilt={1} edges="bottom" className="mt-0 mb-16 sm:mb-20" innerClassName="pt-16 sm:pt-20 pb-10 sm:pb-14">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-end"
        >
          <div className="shrink-0 w-28 h-28 sm:w-40 sm:h-40 bg-ink border-4 border-ink -rotate-2 shadow-[6px_6px_0_rgba(11,11,12,0.25)]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden className="grid h-full w-full place-items-center font-display text-6xl sm:text-7xl text-signal">
                {profile.display_name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.1em] text-ink/70 mb-3">Artist · @{profile.handle}</p>
            <h1 className="text-ink text-5xl sm:text-7xl break-words">{profile.display_name}</h1>
            <ScribbleUnderline variant="wave" color="#0b0b0c" animate={false} className="mt-2 max-w-xs" />
            {profile.bio && <p className="mt-5 max-w-2xl text-ink/80 font-medium whitespace-pre-line">{profile.bio}</p>}
            {profile.links.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-5">
                {profile.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-ink text-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:text-signal"
                    >
                      {link.label} <ArrowUpRight size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.header>
      </PaperPanel>

      <div className="container">
        {releases.length > 0 && (
          <section className="mb-16">
            <p className="eyebrow mb-2">Discography</p>
            <h2>Releases</h2>
            <ScribbleUnderline variant="slash" className="mt-2 mb-6 max-w-[10rem]" />
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

        <section>
          <p className="eyebrow mb-2">Listen &amp; watch</p>
          <h2>Latest</h2>
          <ScribbleUnderline variant="zigzag" className="mt-2 mb-6 max-w-[10rem]" />
          {items.length === 0 ? (
            <p className="text-white/60 border border-dashed border-white/20 px-4 py-6">Nothing posted yet. Check back soon.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <article key={item.id} className={cn(cardClass, 'flex flex-col gap-4')}>
                  {item.src &&
                    (item.media_type === 'video' ? (
                      <video src={item.src} controls preload="metadata" className="w-full aspect-video bg-black" />
                    ) : (
                      <audio src={item.src} controls preload="none" className="w-full" />
                    ))}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="tag border border-white/15">{item.media_type === 'video' ? 'Video' : 'Audio'}</span>
                      <span className="font-mono text-[11px] text-white/45">{formatDate(item.created_at)}</span>
                    </div>
                    <h3 className="break-words">{item.title}</h3>
                    {item.description && <p className="text-sm text-white/60 mt-2 line-clamp-3">{item.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="paper mt-16 max-w-xl p-6 sm:p-8 -rotate-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 mb-2">Newsletter</p>
          <h3 className="text-ink text-3xl sm:text-4xl break-words">Get updates from {profile.display_name}</h3>
          <p className="text-sm text-ink/75 font-medium mt-2 mb-5">New drops, events and exclusives, straight to your inbox.</p>
          {newsletter.status === 'success' ? (
            <p role="status" className="flex items-center gap-2 bg-ink text-signal px-4 py-3 font-semibold">
              <Check size={18} className="shrink-0" /> {newsletter.message}
            </p>
          ) : (
            <form onSubmit={newsletter.subscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                aria-label="Your email"
                placeholder="your@email.com"
                className={cn(inputClass, 'bg-ink border-ink hover:border-ink focus:bg-ink')}
                value={newsletter.email}
                onChange={(e) => newsletter.setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={newsletter.status === 'loading'}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-ink text-signal px-5 py-2.5 font-semibold border-2 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-60"
              >
                <Mail size={16} /> {newsletter.status === 'loading' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}
          {newsletter.status === 'error' && <p className="text-sm font-semibold text-error-700 mt-2">{newsletter.message}</p>}
        </section>
      </div>
    </div>
  );
};

export default CreatorPage;
