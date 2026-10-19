import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass, inputClass, labelClass } from '../../components/dashboard/styles';
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
  const [message, setMessage] = useState('');

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
    setMessage('');
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
    setMessage(error ? `Could not save: ${error.message}` : 'Saved.');
    if (!error) refreshProfile();
  };

  const updateLink = (i: number, key: 'label' | 'url', value: string) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Profile</h1>
        <p className="text-surface-600 mt-1">
          This is what fans see at{' '}
          <Link to={`/c/${profile.handle}`} className="text-primary-400 hover:text-primary-300">/c/{profile.handle}</Link>.
          {subscriberCount !== null && ` ${subscriberCount} newsletter subscriber${subscriberCount === 1 ? '' : 's'}.`}
        </p>
      </div>

      <form onSubmit={save} className={`${cardClass} space-y-4 max-w-2xl`}>
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
        </div>
        <div>
          <span className={labelClass}>Links</span>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder="Label (e.g. Spotify)" value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)} />
                <input className={inputClass} type="url" placeholder="https://…" value={link.url} onChange={(e) => updateLink(i, 'url', e.target.value)} />
                <button type="button" className="p-2 text-surface-600 hover:text-white" aria-label="Remove link"
                  onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
                  <X size={18} />
                </button>
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" leftIcon={<Plus size={14} />}
              onClick={() => setLinks([...links, { label: '', url: '' }])}>
              Add link
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" isLoading={saving}>Save profile</Button>
          {message && <span className="text-sm text-surface-700">{message}</span>}
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
