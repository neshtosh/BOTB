import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Download, ExternalLink, ImagePlus, Pencil, Send, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass, inputClass, selectClass } from '../../components/dashboard/styles';
import { HealthBadge, Notice, PanelTitle, StatusTag } from '../../components/dashboard/Studio';
import SplitsEditor from '../../components/dashboard/release/SplitsEditor';
import TrackPublishPanel from '../../components/dashboard/release/TrackPublishPanel';
import { Field, SummaryRow } from '../../components/dashboard/release/fields';
import { toLocalInput } from '../../components/dashboard/release/draft';
import { CoverThumb } from './Library';
import { useConnections, useReleases, type LibraryItem, type ReleaseWithTracks } from '../../hooks/useCreatorData';
import { targetName, targets as allTargets } from '../../config/platforms';
import { checkCover, makeClipFrame } from '../../lib/covers';
import {
  downloadCsv,
  formatReleaseDate,
  GENRES,
  isUpcoming,
  KIND_LABEL,
  LANGUAGES,
  smartLinkUrl,
  splitsProblem,
} from '../../lib/releases';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import type { Presave, PublishJob, Split, Target } from '../../types/platform';

// Latest attempt for one track on one platform (posts of the track or its clips).
const latestJob = (track: LibraryItem, target: Target): PublishJob | undefined =>
  track.jobs.filter((j) => j.target === target).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

const StatusGrid: React.FC<{ release: ReleaseWithTracks }> = ({ release }) => {
  const used = allTargets.filter((t) => release.jobs.some((j) => j.target === t.id)).map((t) => t.id);
  if (!used.length) {
    return <p className="text-sm text-white/50">Not posted anywhere yet. Use “Post to more platforms” on a track below.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 border-b border-white/15">
            <th className="font-normal py-2.5 pr-4">Track</th>
            {used.map((t) => <th key={t} className="font-normal py-2.5 px-2">{targetName(t)}</th>)}
          </tr>
        </thead>
        <tbody>
          {release.tracks.map((track) => (
            <tr key={track.id} className="border-b border-white/10 last:border-0 align-top">
              <td className="py-3 pr-4 font-medium max-w-[14rem] truncate">{track.title}</td>
              {used.map((t) => {
                const job = latestJob(track, t);
                return (
                  <td key={t} className="py-3 px-2">
                    {job ? (
                      <div className="space-y-1">
                        <StatusTag status={job.status} href={job.external_url} />
                        {job.status === 'scheduled' && job.scheduled_for && (
                          <p className="font-mono text-[10px] text-white/40">{formatReleaseDate(job.scheduled_for, true)}</p>
                        )}
                        {job.error && <p className="text-[11px] text-error-300 max-w-[12rem]">{job.error}</p>}
                      </div>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SmartLinkPanel: React.FC<{ release: ReleaseWithTracks }> = ({ release }) => {
  const [presaves, setPresaves] = useState<Presave[]>([]);
  const [copied, setCopied] = useState(false);
  const url = smartLinkUrl(release.slug);

  useEffect(() => {
    supabase
      .from('release_presaves')
      .select('*')
      .eq('release_id', release.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPresaves((data as Presave[]) ?? []));
  }, [release.id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked; the link is shown in full.
    }
  };

  return (
    <section className="paper p-5 sm:p-6">
      <PanelTitle index="03" tone="dark">Smart link</PanelTitle>
      <div className="flex items-stretch">
        <span className="flex-1 min-w-0 truncate bg-ink/10 border border-ink/30 px-3 py-2 font-mono text-xs text-ink">{url}</span>
        <button type="button" onClick={copy} className="shrink-0 bg-ink text-signal px-3 inline-flex items-center gap-2 text-xs font-semibold hover:bg-ink/85">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 border-t border-ink/20">
        <div className="pt-4 pr-4">
          <p className="font-sans font-black text-4xl leading-none tracking-[-0.05em] tabular-nums">{release.smart_link_visits}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 mt-1">Visits</p>
        </div>
        <div className="pt-4 pl-4 border-l border-ink/20">
          <p className="font-sans font-black text-4xl leading-none tracking-[-0.05em] tabular-nums">{presaves.length}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60 mt-1">Pre-saves</p>
        </div>
      </div>
      {presaves.length > 0 && (
        <div className="mt-5 border-t border-ink/20 pt-4">
          <ul className="space-y-1 text-sm text-ink/80">
            {presaves.slice(0, 4).map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="truncate">{p.email}</span>
                <span className="font-mono text-[11px] text-ink/50 shrink-0">{formatDate(p.created_at)}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink underline underline-offset-4 hover:no-underline"
            onClick={() => downloadCsv(`${release.slug}-presaves.csv`, [['email', 'pre-saved at'], ...presaves.map((p) => [p.email, p.created_at])])}
          >
            <Download size={12} /> Export all as CSV
          </button>
        </div>
      )}
      <a href={`/r/${release.slug}`} target="_blank" rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 font-semibold text-ink hover:underline underline-offset-4">
        Open smart link <ExternalLink size={14} />
      </a>
    </section>
  );
};

const SplitsPanel: React.FC<{ release: ReleaseWithTracks; onSaved: () => void }> = ({ release, onSaved }) => {
  const [splits, setSplits] = useState<Split[]>(release.splits.length ? release.splits : [{ name: release.artist_name, email: '', role: 'Artist', share: 100 }]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const problem = splitsProblem(splits);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('releases').update({ splits, updated_at: new Date().toISOString() }).eq('id', release.id);
    setSaving(false);
    setMessage(error ? `Could not save: ${error.message}` : 'Saved. Collaborators with an email get the updated split.');
    if (!error) {
      setEditing(false);
      onSaved();
    }
  };

  const sheet = () =>
    downloadCsv(`${release.slug}-split-sheet.csv`, [
      ['release', 'artist', 'collaborator', 'email', 'role', 'share %'],
      ...splits.map((s) => [release.title, release.artist_name, s.name, s.email, s.role, s.share]),
    ]);

  return (
    <section className={cardClass}>
      <PanelTitle
        index="04"
        aside={!editing && (
          <button type="button" onClick={() => setEditing(true)} className="eyebrow text-signal hover:text-white shrink-0">Edit</button>
        )}
      >
        Splits
      </PanelTitle>
      {editing ? (
        <div className="space-y-4">
          <SplitsEditor splits={splits} onChange={setSplits} />
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={save} isLoading={saving} disabled={Boolean(problem)}>Save splits</Button>
            <Button size="sm" variant="ghost" onClick={() => { setSplits(release.splits); setEditing(false); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <dl>
            {splits.map((s, i) => (
              <SummaryRow key={i} label={`${s.share}%`}>
                {s.name} <span className="text-white/45">· {s.role}{s.email && ` · ${s.email}`}</span>
              </SummaryRow>
            ))}
          </dl>
          <button type="button" onClick={sheet} className="mt-4 inline-flex items-center gap-2 eyebrow text-white/60 hover:text-signal">
            <Download size={12} /> Download split sheet
          </button>
        </>
      )}
      {message && <Notice className="mt-4" tone={message.startsWith('Could not') ? 'error' : 'ok'}>{message}</Notice>}
      <p className="text-xs text-white/40 mt-4">A record of who’s owed what. Platforms pay the account that posts; Unsigned doesn’t pay out splits.</p>
    </section>
  );
};

const EditDetails: React.FC<{ release: ReleaseWithTracks; onClose: () => void; onSaved: () => void }> = ({ release, onClose, onSaved }) => {
  const upcoming = isUpcoming(release);
  const [form, setForm] = useState({
    title: release.title,
    artist_name: release.artist_name,
    primary_genre: release.primary_genre,
    secondary_genre: release.secondary_genre ?? '',
    language: release.language,
    description: release.description,
    releaseAt: release.release_at ? toLocalInput(new Date(release.release_at)) : '',
    is_public: release.is_public,
  });
  const [cover, setCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const pickCover = async (file: File | null) => {
    setCoverError('');
    setCover(null);
    if (!file) return;
    const check = await checkCover(file);
    if (!check.ok) setCoverError(check.errors.join(' '));
    else setCover(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.artist_name.trim()) return setError('Title and artist are required.');
    const releaseAt = upcoming && form.releaseAt ? new Date(form.releaseAt).toISOString() : release.release_at;
    if (upcoming && releaseAt && new Date(releaseAt).getTime() < Date.now() + 10 * 60_000) return setError('Pick a release time at least 10 minutes from now.');
    setSaving(true);
    let coverPath = release.cover_path;
    if (cover) {
      coverPath = `${release.user_id}/covers/${crypto.randomUUID()}.${cover.type === 'image/png' ? 'png' : 'jpg'}`;
      const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(coverPath, cover, { contentType: cover.type });
      if (upErr) {
        setSaving(false);
        return setError(`Cover upload failed: ${upErr.message}`);
      }
    }
    const { error: updErr } = await supabase
      .from('releases')
      .update({
        title: form.title.trim(),
        artist_name: form.artist_name.trim(),
        primary_genre: form.primary_genre,
        secondary_genre: form.secondary_genre || null,
        language: form.language,
        description: form.description.trim(),
        release_at: releaseAt,
        cover_path: coverPath,
        is_public: form.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', release.id);
    if (!updErr && cover && release.cover_path) await supabase.storage.from(MEDIA_BUCKET).remove([release.cover_path]);
    // Moving the release date moves every post still waiting for it.
    if (!updErr && upcoming && releaseAt !== release.release_at) {
      const waiting = release.jobs.filter((j) => j.status === 'scheduled');
      await Promise.all(waiting.map((j) => supabase.from('publish_jobs').update({ scheduled_for: releaseAt }).eq('id', j.id)));
    }
    setSaving(false);
    if (updErr) return setError(`Could not save: ${updErr.message}`);
    onSaved();
    onClose();
  };

  return (
    <form onSubmit={save} className={cn(cardClass, 'border-signal/60 space-y-5')}>
      <PanelTitle>Edit release</PanelTitle>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Release title" htmlFor="e-title">
          <input id="e-title" className={inputClass} value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Artist / band name" htmlFor="e-artist">
          <input id="e-artist" className={inputClass} value={form.artist_name} onChange={(e) => set({ artist_name: e.target.value })} />
        </Field>
        <Field label="Primary genre" htmlFor="e-genre">
          <select id="e-genre" className={selectClass} value={form.primary_genre} onChange={(e) => set({ primary_genre: e.target.value })}>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Secondary genre" htmlFor="e-genre2" optional>
          <select id="e-genre2" className={selectClass} value={form.secondary_genre} onChange={(e) => set({ secondary_genre: e.target.value })}>
            <option value="">None</option>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Language" htmlFor="e-lang">
          <select id="e-lang" className={selectClass} value={form.language} onChange={(e) => set({ language: e.target.value })}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        {upcoming && (
          <Field label="Release date and time" htmlFor="e-date" hint="Scheduled posts move with it.">
            <input id="e-date" type="datetime-local" className={cn(inputClass, '[color-scheme:dark]')} value={form.releaseAt}
              onChange={(e) => set({ releaseAt: e.target.value })} />
          </Field>
        )}
        <Field label="Cover art" htmlFor="e-cover" hint={coverError || 'Square JPG or PNG, at least 1000×1000.'}>
          <label className="flex items-center gap-3 border border-dashed border-white/25 px-3 py-2.5 text-sm cursor-pointer hover:border-signal">
            <ImagePlus size={16} className="text-signal" /> {cover ? cover.name : 'Replace cover art'}
            <input id="e-cover" type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => pickCover(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
        <Field label="Description" htmlFor="e-desc" optional className="sm:col-span-2">
          <textarea id="e-desc" rows={3} className={inputClass} value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" className="h-4 w-4 accent-[#f2e600]" checked={form.is_public} onChange={(e) => set({ is_public: e.target.checked })} />
        Smart link is public
      </label>
      <p className="text-xs text-white/45">Changes update Unsigned and your smart link. Posts already on a platform keep their title and caption; edit those on the platform.</p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={saving}>Save changes</Button>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
};

const ReleaseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { releases, loading, reload } = useReleases();
  const { connections } = useConnections();
  const [editing, setEditing] = useState(false);
  const [pushing, setPushing] = useState<string | null>(null);
  const release = useMemo(() => releases.find((r) => r.id === id), [releases, id]);

  // Scheduled posts can go live while this page is open (demo scheduler / cron).
  useEffect(() => {
    if (!release || !release.jobs.some((j) => j.status === 'scheduled' || j.status === 'processing')) return;
    const timer = window.setInterval(reload, 15_000);
    return () => window.clearInterval(timer);
  }, [release, reload]);

  if (loading && !release) return <p className="eyebrow text-white/50">Loading…</p>;
  if (!release) {
    return (
      <div className="space-y-4">
        <p className="text-white/70">This release doesn’t exist, or it was deleted.</p>
        <Link to="/dashboard/library" className="eyebrow text-signal">← My music</Link>
      </div>
    );
  }

  const upcoming = isUpcoming(release);

  const remove = async () => {
    if (!window.confirm(`Delete “${release.title}” from Unsigned? Its smart link stops working. Posts already on platforms stay there.`)) return;
    const paths = [
      ...release.tracks.flatMap((t) => [t.storage_path, ...t.clips.map((c) => c.storage_path)]),
      ...(release.cover_path ? [release.cover_path] : []),
    ];
    await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    await supabase.from('releases').delete().eq('id', release.id);
    navigate('/dashboard/library');
  };

  const clipCover = (track: LibraryItem) => async () => {
    if (!release.cover_path) return null;
    const { data } = await supabase.storage.from(MEDIA_BUCKET).download(release.cover_path);
    return data ? makeClipFrame(data, track.title, release.artist_name) : null;
  };

  return (
    <div className="space-y-8">
      <Link to="/dashboard/library" className="inline-flex items-center gap-2 eyebrow text-white/50 hover:text-signal">
        <ArrowLeft size={12} /> My music
      </Link>

      <header className="flex flex-col sm:flex-row gap-6 sm:items-end">
        <CoverThumb release={release} className="h-40 w-40 sm:h-48 sm:w-48 border border-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="tag-yellow">{KIND_LABEL[release.kind]}</span>
            <span className="eyebrow text-white/50">{[release.primary_genre, release.secondary_genre].filter(Boolean).join(' / ')}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl break-words">{release.title}</h1>
          <p className="mt-2 text-white/70">{release.artist_name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <HealthBadge health={release.health} />
            <span className="font-mono text-[11px] text-white/45">
              {upcoming ? `Out ${formatReleaseDate(release.release_at, true)}` : `Released ${formatReleaseDate(release.release_at ?? release.created_at)}`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setEditing((v) => !v)}>Edit</Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={remove} className="hover:!text-error-300">Delete</Button>
        </div>
      </header>

      {editing && <EditDetails release={release} onClose={() => setEditing(false)} onSaved={reload} />}
      {release.health === 'attention' && (
        <Notice tone="error">Some posts failed. Check the reason under each one, fix it (often reconnecting the account), then post that track again.</Notice>
      )}

      <section className={cardClass}>
        <PanelTitle index="01">Where it’s live</PanelTitle>
        <StatusGrid release={release} />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <section className={cardClass}>
          <PanelTitle index="02" aside={<span className="eyebrow text-white/40 shrink-0">{release.tracks.length} track{release.tracks.length === 1 ? '' : 's'}</span>}>
            Tracks
          </PanelTitle>
          <ol className="divide-y divide-white/10 border-t border-white/10">
            {release.tracks.map((track, i) => (
              <li key={track.id} className="py-4">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-white/40 w-6 pt-1 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {track.title}
                      {track.explicit && <span className="tag ml-2 border border-white/20">E</span>}
                      {track.is_cover && <span className="tag ml-2 border border-white/20">Cover</span>}
                      {track.ai_generated && <span className="tag ml-2 border border-white/20">AI</span>}
                    </p>
                    <p className="text-xs text-white/45 mt-1">
                      {track.songwriters?.length ? `Written by ${track.songwriters.join(', ')}` : 'No songwriter credits'}
                      {track.instrumental && ' · Instrumental'}
                      {track.hook_start != null && ` · Hook at ${Math.floor(track.hook_start / 60)}:${String(Math.floor(track.hook_start % 60)).padStart(2, '0')}`}
                    </p>
                  </div>
                  <Button size="sm" variant={pushing === track.id ? 'primary' : 'outline'} className="shrink-0"
                    leftIcon={pushing === track.id ? undefined : <Send size={13} />}
                    onClick={() => setPushing(pushing === track.id ? null : track.id)}>
                    <span className="hidden sm:inline">{pushing === track.id ? 'Close' : 'Post to more'}</span>
                    <span className="sm:hidden">{pushing === track.id ? 'Close' : 'Post'}</span>
                  </Button>
                </div>
                {pushing === track.id && (
                  <TrackPublishPanel item={track} connections={connections} onDone={reload} clipCover={clipCover(track)} />
                )}
              </li>
            ))}
          </ol>
          <dl className="mt-5">
            <SummaryRow label="Language">{release.language}</SummaryRow>
            {release.previously_released && release.original_release_date && (
              <SummaryRow label="First released">{formatDate(release.original_release_date)}</SummaryRow>
            )}
            {release.tags.length > 0 && <SummaryRow label="Tags">{release.tags.map((t) => `#${t}`).join(' ')}</SummaryRow>}
            {release.description && <SummaryRow label="Description">{release.description}</SummaryRow>}
          </dl>
        </section>

        <div className="space-y-6">
          <SmartLinkPanel release={release} />
          <SplitsPanel key={release.updated_at} release={release} onSaved={reload} />
        </div>
      </div>
    </div>
  );
};

export default ReleaseDetail;
