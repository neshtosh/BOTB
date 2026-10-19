import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, BellRing, Check, Disc3 } from 'lucide-react';
import Logo from '../components/common/Logo';
import { inputClass } from '../components/dashboard/styles';
import { targetName } from '../config/platforms';
import { formatReleaseDate, KIND_LABEL } from '../lib/releases';
import { MEDIA_BUCKET, supabase } from '../lib/supabase';
import type { Release, Target } from '../types/platform';

// What public.smart_link() returns (supabase/migrations/0003_releases.sql).
interface SmartLinkData {
  release: Omit<Release, 'splits' | 'user_id'>;
  owner: { handle: string; display_name: string } | null;
  tracks: { id: string; title: string; track_number: number; version: string; explicit: boolean }[];
  links: { target: Target; url: string; track_id: string; from_clip: boolean; published_at: string }[];
}

const VERB: Record<Target, string> = {
  soundcloud: 'Listen',
  youtube: 'Watch',
  tiktok: 'Watch',
  instagram: 'Watch',
  facebook: 'Watch',
};
const ORDER: Target[] = ['soundcloud', 'youtube', 'tiktok', 'instagram', 'facebook'];

function useCountdown(to: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!to) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [to]);
  if (!to) return null;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return null;
  return { days: Math.floor(ms / 86_400_000), hours: Math.floor(ms / 3_600_000) % 24, minutes: Math.floor(ms / 60_000) % 60 };
}

const PresaveForm: React.FC<{ releaseId: string; title: string }> = ({ releaseId, title }) => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('saving');
    const { error } = await supabase.from('release_presaves').insert({ release_id: releaseId, email: email.trim().toLowerCase() });
    if (error && error.code !== '23505') {
      setState('error');
      setMessage('That didn’t work. Check the email and try again.');
      return;
    }
    setState('done');
  };

  if (state === 'done') {
    return (
      <p className="flex items-center justify-center gap-2 bg-signal text-ink px-4 py-3 font-semibold">
        <Check size={18} className="shrink-0" /> You’re on the list for “{title}”. The artist can let you know when it drops.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="email" required aria-label="Your email" placeholder="your@email.com" className={inputClass} value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={state === 'saving'}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-signal text-ink px-5 py-2.5 font-semibold hover:bg-white transition-colors disabled:opacity-60">
          <BellRing size={16} /> Pre-save
        </button>
      </div>
      {state === 'error' && <p className="text-sm text-error-300">{message}</p>}
      <p className="text-xs text-white/40">Your email goes to the artist only, so they can tell you when it’s out.</p>
    </form>
  );
};

const SmartLink: React.FC = () => {
  const { slug = '' } = useParams();
  const [data, setData] = useState<SmartLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('smart_link', { release_slug: slug }).then(async ({ data: result }) => {
      if (cancelled) return;
      const link = (result as SmartLinkData | null) ?? null;
      setData(link);
      setLoading(false);
      if (link?.release.cover_path) {
        const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(link.release.cover_path, 60 * 60);
        if (!cancelled) setCoverUrl(signed?.signedUrl ?? null);
      }
    });
    // Count one visit per browser session.
    try {
      const key = `unsigned:visited:${slug}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        supabase.rpc('track_release_visit', { release_slug: slug });
      }
    } catch {
      supabase.rpc('track_release_visit', { release_slug: slug });
    }
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const release = data?.release;
  const countdown = useCountdown(release?.release_at ?? null);

  // One button per platform: the full-track post of the first track if there is one.
  const buttons = useMemo(() => {
    if (!data) return [];
    const order = (id: string) => data.tracks.find((t) => t.id === id)?.track_number ?? 99;
    return ORDER.flatMap((target) => {
      const links = data.links.filter((l) => l.target === target).sort((a, b) => Number(a.from_clip) - Number(b.from_clip) || order(a.track_id) - order(b.track_id));
      return links.length ? [{ target, url: links[0].url, clip: links[0].from_clip, count: links.length }] : [];
    });
  }, [data]);

  useEffect(() => {
    if (!release) return;
    const previous = document.title;
    document.title = `${release.title} — ${release.artist_name}`;
    return () => {
      document.title = previous;
    };
  }, [release]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-ink"><p className="eyebrow text-white/50">Loading…</p></div>;
  }
  if (!data || !release) {
    return (
      <div className="min-h-screen grid place-items-center bg-ink px-4 text-center">
        <div>
          <h1>Link not found</h1>
          <p className="mt-3 text-white/60">This release isn’t available, or the link has changed.</p>
          <Link to="/" className="mt-6 inline-block eyebrow text-signal">Go to Unsigned →</Link>
        </div>
      </div>
    );
  }

  const upcoming = Boolean(countdown);

  return (
    <div className="relative min-h-screen bg-ink overflow-hidden">
      {coverUrl && (
        <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${coverUrl})` }} />
      )}
      <div aria-hidden className="absolute inset-x-0 top-0 hazard h-1.5" />

      <main className="relative mx-auto max-w-md px-4 py-10 sm:py-14">
        <div className="relative mx-auto aspect-square w-full max-w-[20rem] bg-signal text-ink grid place-items-center shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          {coverUrl ? <img src={coverUrl} alt={`${release.title} cover art`} className="absolute inset-0 h-full w-full object-cover" /> : <Disc3 size={48} />}
        </div>

        <div className="mt-8 text-center">
          <p className="eyebrow text-white/50">
            {KIND_LABEL[release.kind]} · {release.primary_genre}
          </p>
          <h1 className="mt-3 text-5xl sm:text-6xl break-words">{release.title}</h1>
          <p className="mt-2 text-lg text-white/80">{release.artist_name}</p>
        </div>

        {upcoming && countdown ? (
          <section className="mt-8 space-y-5">
            <div className="paper p-5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">Out {formatReleaseDate(release.release_at, true)}</p>
              <div className="mt-3 grid grid-cols-3 divide-x divide-ink/20">
                {(['days', 'hours', 'minutes'] as const).map((unit) => (
                  <div key={unit}>
                    <p className="font-sans font-black text-4xl leading-none tracking-[-0.05em] tabular-nums">{countdown[unit]}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 mt-1">{unit}</p>
                  </div>
                ))}
              </div>
            </div>
            <PresaveForm releaseId={release.id} title={release.title} />
          </section>
        ) : (
          <section className="mt-8">
            {buttons.length ? (
              <ul className="border border-white/15 divide-y divide-white/10 bg-ink/80">
                {buttons.map((b) => (
                  <li key={b.target}>
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 px-4 py-4 hover:bg-white/[0.04]">
                      <span>
                        <span className="block font-semibold">{targetName(b.target)}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                          {b.clip ? 'Clip' : 'Full'}{b.count > 1 ? ` · ${b.count} posts` : ''}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 border border-signal text-signal px-3 py-1.5 text-sm font-semibold group-hover:bg-signal group-hover:text-ink transition-colors">
                        {VERB[b.target]} <ArrowUpRight size={14} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-white/60 border border-dashed border-white/20 px-4 py-6">
                Links to every platform show up here as soon as the posts are live.
              </p>
            )}
          </section>
        )}

        {data.tracks.length > 1 && (
          <section className="mt-8">
            <p className="eyebrow text-white/40 mb-2">Tracklist</p>
            <ol className="border-t border-white/10">
              {data.tracks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5 border-b border-white/10 text-sm">
                  <span className="font-mono text-[11px] text-white/40 w-6">{String(t.track_number).padStart(2, '0')}</span>
                  <span className="flex-1 truncate">{t.title}</span>
                  {t.explicit && <span className="tag border border-white/20">E</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {release.description && <p className="mt-8 text-sm text-white/60 text-center whitespace-pre-line">{release.description}</p>}

        <footer className="mt-10 flex flex-col items-center gap-4">
          {data.owner && (
            <Link to={`/c/${data.owner.handle}`} className="eyebrow text-white/60 hover:text-signal">
              More from {data.owner.display_name} →
            </Link>
          )}
          <Link to="/" aria-label="Made with Unsigned" className="opacity-70 hover:opacity-100">
            <Logo markClassName="h-6 w-6" wordClassName="text-base" />
          </Link>
        </footer>
      </main>
    </div>
  );
};

export default SmartLink;
