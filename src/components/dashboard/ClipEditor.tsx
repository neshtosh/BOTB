import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Pause, Play, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { analyzeAudio, AudioAnalysis, findHooks, HOP_SECONDS } from '../../lib/clip';
import type { ClipSettings } from '../../lib/publishPlan';
import { labelClass, segmentClass, segmentGroupClass } from './styles';
import type { MediaType } from '../../types/platform';

const CLIP_LENGTHS = [15, 30, 60];

interface ClipEditorProps {
  source: File;
  mediaType: MediaType;
  value: ClipSettings;
  onChange: (next: ClipSettings) => void;
  disabled?: boolean;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const BARS = 120;

const ClipEditor: React.FC<ClipEditorProps> = ({ source, mediaType, value, onChange, disabled }) => {
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<HTMLAudioElement & HTMLVideoElement>(null);
  const sourceUrl = useMemo(() => URL.createObjectURL(source), [source]);
  const coverUrl = useMemo(() => (value.cover ? URL.createObjectURL(value.cover) : null), [value.cover]);

  useEffect(() => () => URL.revokeObjectURL(sourceUrl), [sourceUrl]);
  useEffect(() => () => {
    if (coverUrl) URL.revokeObjectURL(coverUrl);
  }, [coverUrl]);

  useEffect(() => {
    let cancelled = false;
    setAnalysis(null);
    setAnalysisError('');
    analyzeAudio(source)
      .then((a) => !cancelled && setAnalysis(a))
      .catch(() => !cancelled && setAnalysisError("Couldn't analyse this file's audio. You can still pick a start time."));
    return () => {
      cancelled = true;
    };
  }, [source]);

  // A media element reports NaN until its metadata loads.
  const duration = analysis?.duration ?? (Number.isFinite(mediaRef.current?.duration) ? mediaRef.current!.duration : 0);
  const hooks = useMemo(() => (analysis ? findHooks(analysis, value.duration, 3) : []), [analysis, value.duration]);

  // Jump to the best hook the first time analysis finishes.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (hooks.length && !autoPicked.current) {
      autoPicked.current = true;
      onChange({ ...value, start: hooks[0].start });
    }
  }, [hooks, onChange, value]);

  const bars = useMemo(() => {
    if (!analysis) return [];
    const per = Math.max(1, Math.floor(analysis.energy.length / BARS));
    return Array.from({ length: Math.ceil(analysis.energy.length / per) }, (_, i) => {
      const slice = analysis.energy.slice(i * per, (i + 1) * per);
      return Math.max(...slice);
    });
  }, [analysis]);

  const maxStart = Math.max(0, duration - value.duration);
  const setStart = (start: number) => onChange({ ...value, start: Math.min(Math.max(0, start), maxStart) });

  const togglePreview = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      return;
    }
    el.currentTime = value.start;
    el.play().catch(() => undefined);
  };

  const onTimeUpdate = () => {
    const el = mediaRef.current;
    if (el && el.currentTime >= value.start + value.duration) el.pause();
  };

  const startPct = duration ? (value.start / duration) * 100 : 0;
  const widthPct = duration ? (Math.min(value.duration, duration) / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {mediaType === 'video' ? (
        <video ref={mediaRef} src={sourceUrl} className="w-full max-h-64 bg-black border border-white/10" onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)} onTimeUpdate={onTimeUpdate} playsInline />
      ) : (
        <audio ref={mediaRef} src={sourceUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={onTimeUpdate} />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={cn(labelClass, 'mb-0')}>Clip section</span>
          <span className="font-mono text-[11px] text-white/50 tabular-nums">
            {fmt(value.start)} – {fmt(value.start + value.duration)} of {fmt(duration)}
          </span>
        </div>
        <div
          className={cn('relative h-16 bg-white/[0.04] border border-white/10 overflow-hidden', !disabled && 'cursor-pointer')}
          onClick={(e) => {
            if (disabled || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setStart(((e.clientX - rect.left) / rect.width) * duration - value.duration / 2);
          }}
        >
          <div className="absolute inset-0 flex items-center gap-px px-1">
            {bars.length === 0 && <div className="w-full text-center eyebrow text-white/45">{analysisError || 'Analysing audio…'}</div>}
            {bars.map((b, i) => (
              <div key={i} className="flex-1 bg-white/35" style={{ height: `${Math.max(6, b * 100)}%` }} />
            ))}
          </div>
          <div className="absolute inset-y-0 bg-signal/25 border-x-2 border-signal" style={{ left: `${startPct}%`, width: `${widthPct}%` }} />
        </div>
        <input type="range" min={0} max={maxStart} step={HOP_SECONDS} value={value.start} disabled={disabled}
          onChange={(e) => setStart(Number(e.target.value))} className="w-full mt-3 accent-[#f2e600] cursor-pointer" aria-label="Clip start" />
      </div>

      {hooks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 eyebrow text-white/60">
            <Sparkles size={14} className="text-signal" /> Suggested hooks
          </span>
          {hooks.map((h, i) => (
            <button key={h.start} type="button" disabled={disabled} onClick={() => setStart(h.start)}
              className={cn('font-mono text-[11px] px-2.5 py-1 border transition-colors tabular-nums',
                Math.abs(value.start - h.start) < 0.5 ? 'border-signal bg-signal text-ink' : 'border-white/20 text-white/70 hover:border-signal hover:text-signal')}>
              {i === 0 ? 'Best · ' : ''}{fmt(h.start)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={togglePreview} disabled={disabled}
          className="flex items-center gap-2 text-sm border border-white/30 hover:border-signal hover:bg-signal hover:text-ink transition-colors px-4 py-1.5">
          {playing ? <Pause size={14} /> : <Play size={14} />} Preview clip
        </button>
        <div className={segmentGroupClass} role="group" aria-label="Clip length">
          {CLIP_LENGTHS.map((len) => (
            <button key={len} type="button" disabled={disabled} onClick={() => onChange({ ...value, duration: len, start: Math.min(value.start, Math.max(0, duration - len)) })}
              aria-pressed={value.duration === len} className={segmentClass(value.duration === len)}>
              {len}s
            </button>
          ))}
        </div>
      </div>

      {mediaType === 'audio' && (
        <div className="flex items-center gap-3">
          <label className="relative w-16 h-28 overflow-hidden bg-white/[0.04] border border-dashed border-white/25 hover:border-signal transition-colors flex items-center justify-center cursor-pointer shrink-0">
            {coverUrl ? <img src={coverUrl} alt="Clip cover" className="w-full h-full object-cover" /> : <ImagePlus size={20} className="text-white/50" />}
            <input type="file" accept="image/*" className="hidden" disabled={disabled}
              onChange={(e) => onChange({ ...value, cover: e.target.files?.[0] ?? null })} />
          </label>
          <p className="text-xs text-white/50">
            Cover art shown in the video while the clip plays. Without one, we generate a cover with your title.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClipEditor;
