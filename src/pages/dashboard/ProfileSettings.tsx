import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass, hintClass, iconButtonClass, inputClass, labelClass } from '../../components/dashboard/styles';
import { Notice, PageHeader, PanelTitle } from '../../components/dashboard/Studio';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/platform';

const ProfileSettings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [links, setLinks] = useState<Profile['links']>([]);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setBio(profile.bio);
    setAvatarUrl(profile.avatar_url ?? '');
    setLinks(profile.links ?? []);
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', profile.id)
      .then(({ count }) => setSubscriberCount(count ?? 0));
  }, [profile]);

  if (!profile) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || null,
        links: links.filter((l) => l.label.trim() && l.url.trim()),
      })
      .eq('id', profile.id);
    setSaving(false);
    setMessage(error ? { tone: 'error', text: `Could not save: ${error.message}` } : { tone: 'ok', text: 'Saved.' });
    if (!error) refreshProfile();
  };

  const updateLink = (i: number, key: 'label' | 'url', value: string) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));

  const visibleLinks = links.filter((l) => l.label.trim());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Studio / Profile"
        title="Profile"
        underline="loop"
        description={
          <>
            This is what fans see at{' '}
            <Link to={`/c/${profile.handle}`} className="text-signal underline underline-offset-4 hover:text-white">
              /c/{profile.handle}
            </Link>
            .
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_17rem] gap-6 items-start">
        <form onSubmit={save} className={`${cardClass} space-y-5`}>
          <PanelTitle index="01">Your details</PanelTitle>
          <div>
            <label className={labelClass} htmlFor="displayName">Display name</label>
            <input id="displayName" required className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="bio">Bio</label>
            <textarea id="bio" rows={5} className={inputClass} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="avatar">Profile image URL</label>
            <input id="avatar" type="url" className={inputClass} placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            <p className={hintClass}>A square image works best.</p>
          </div>
          <div>
            <span className={labelClass}>Links</span>
            <div className="space-y-3">
              {links.map((link, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2">
                  <input className={inputClass} placeholder="Label (e.g. Spotify)" aria-label={`Link ${i + 1} label`}
                    value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)} />
                  <button type="button" className={`${iconButtonClass} h-auto self-stretch sm:order-last`}
                    aria-label="Remove link" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                    <X size={16} />
                  </button>
                  <input className={`${inputClass} col-span-2 sm:col-span-1`} type="url" placeholder="https://…"
                    aria-label={`Link ${i + 1} URL`} value={link.url} onChange={(e) => updateLink(i, 'url', e.target.value)} />
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" leftIcon={<Plus size={14} />}
                onClick={() => setLinks([...links, { label: '', url: '' }])}>
                Add link
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
            <Button type="submit" isLoading={saving}>Save profile</Button>
            {message && <Notice tone={message.tone}>{message.text}</Notice>}
          </div>
        </form>

        <aside className="paper p-5 lg:sticky lg:top-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">Fan page preview</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 bg-ink overflow-hidden grid place-items-center">
              {avatarUrl.trim() ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover grayscale contrast-125" />
              ) : (
                <span className="font-display text-2xl text-signal">{(displayName || '?').slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none text-ink truncate">{displayName || 'Your name'}</p>
              <p className="font-mono text-[11px] text-ink/60 truncate mt-1">/c/{profile.handle}</p>
            </div>
          </div>
          {bio.trim() && <p className="mt-4 text-sm text-ink/80 line-clamp-4 break-words">{bio}</p>}
          {visibleLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {visibleLinks.map((l, i) => (
                <span key={i} className="tag max-w-full truncate">{l.label}</span>
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-ink/20 pt-4 flex items-end justify-between gap-3">
            <div>
              <p className="font-sans font-black text-4xl leading-none tracking-[-0.05em] tabular-nums">
                {subscriberCount ?? '–'}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 mt-1">
                Newsletter subscriber{subscriberCount === 1 ? '' : 's'}
              </p>
            </div>
            <Link to={`/c/${profile.handle}`} aria-label="Open my fan page"
              className="inline-grid place-items-center h-10 w-10 rounded-full border border-ink hover:bg-ink hover:text-signal transition-colors">
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfileSettings;
