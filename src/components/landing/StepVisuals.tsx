import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, FileAudio, Loader2, Pause, Play, Scissors, UploadCloud } from 'lucide-react';
import { cn } from '../../utils/cn';
import { siteConfig } from '../../config/site';
import { demoCreator } from '../../data/mockCreators';
import { analyzeBuffer, findHooks } from '../../lib/clip';
import { renderDemoTrack } from '../../lib/demoTrack';
import CoverArt from './CoverArt';

// Visuals for the "How it works" steps. Everything is mock data: a fictional
// creator, generated cover art, and a demo track synthesised in the browser.

const CLIP_SECONDS = 15;
const BAR_COUNT = 48;
const fileName = `${demoCreator.release.title.toLowerCase().replace(/\s+/g, '-')}.wav`;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const Window: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn('bg-ink border border-white/15 shadow-[0_30px_60px_rgba(0,0,0,0.5)]', className)}>
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
      <span className="h-2.5 w-2.5 rounded-full bg-signal" />
      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// 01 — Upload once
export const UploadVisual: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref}>
      <Window title={`${siteConfig.name} · new release · example`}>
        <div className="border-2 border-dashed border-white/20 p-5 flex items-center gap-4">
          <div className="grid place-items-center h-12 w-12 bg-signal text-ink shrink-0">
            <FileAudio size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{fileName}</p>
            <div className="mt-2 h-1.5 bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-signal"
                initial={{ width: '0%' }}
                animate={inView ? { width: '100%' } : undefined}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">6.0 MB · audio</p>
          </div>
          <UploadCloud size={20} className="text-white/40 shrink-0" />
        </div>
        <div className="mt-5 space-y-3">
          {[
            ['Artist', `${demoCreator.name} (independent)`],
            ['Title', demoCreator.release.title],
            ['Tags', '#afrohouse  #independent  #newmusic'],
          ].map(([label, value], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: 0.6 + i * 0.25, duration: 0.5 }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">{label}</p>
              <p className="mt-1 border-b border-white/15 pb-1.5 text-sm">{value}</p>
            </motion.div>
          ))}
        </div>
      </Window>
    </div>
  );
};

// 02 — Find the hook. Runs the real hook finder on a track generated in the browser.
interface DemoResult {
  buffer: AudioBuffer;
  bars: number[];
  hookStart: number;
  duration: number;
}

export const HookVisual: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [demo, setDemo] = useState<DemoResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timerRef = useRef<number>();

  // Compose + analyse once the panel scrolls into view.
  useEffect(() => {
    if (!inView || demo) return;
    const id = window.setTimeout(() => {
      const buffer = renderDemoTrack();
      const analysis = analyzeBuffer(buffer);
      const [best] = findHooks(analysis, CLIP_SECONDS, 1);
      const per = Math.floor(analysis.energy.length / BAR_COUNT);
      const bars = Array.from({ length: BAR_COUNT }, (_, i) => Math.max(...analysis.energy.slice(i * per, (i + 1) * per)));
      setDemo({ buffer, bars, hookStart: best.start, duration: analysis.duration });
    }, 50);
    return () => window.clearTimeout(id);
  }, [inView, demo]);

  const stop = () => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    window.clearInterval(timerRef.current);
    setPlaying(false);
    setElapsed(0);
  };

  useEffect(
    () => () => {
      sourceRef.current?.stop();
      window.clearInterval(timerRef.current);
      ctxRef.current?.close();
    },
    []
  );

  const toggle = () => {
    if (!demo) return;
    if (playing) return stop();
    const ctx = (ctxRef.current ??= new AudioContext());
    ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = demo.buffer;
    src.connect(ctx.destination);
    src.start(0, demo.hookStart, CLIP_SECONDS);
    src.onended = stop;
    sourceRef.current = src;
    const began = ctx.currentTime;
    timerRef.current = window.setInterval(() => setElapsed(ctx.currentTime - began), 100);
    setPlaying(true);
  };

  const start = demo ? (demo.hookStart / demo.duration) * 100 : 0;
  const width = demo ? (CLIP_SECONDS / demo.duration) * 100 : 0;

  return (
    <div ref={ref} className="grid gap-6 sm:grid-cols-[1fr_auto] items-center">
      <Window title="Hook finder · live demo">
        <div className="relative h-20 flex items-center gap-[2px]">
          {!demo && (
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/50">
              <Loader2 size={14} className="animate-spin" /> Composing a demo track…
            </span>
          )}
          {demo?.bars.map((b, i) => {
            const pos = (i + 0.5) / BAR_COUNT;
            const inHook = pos >= start / 100 && pos <= (start + width) / 100;
            return (
              <motion.span
                key={i}
                className={cn('flex-1 rounded-full', inHook ? 'bg-signal' : 'bg-white/25')}
                initial={{ scaleY: 0.05 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.015, duration: 0.4 }}
                style={{ height: `${Math.max(8, b * 100)}%` }}
              />
            );
          })}
          {demo && (
            <motion.div
              className="absolute inset-y-0 border-x-2 border-signal bg-signal/10"
              style={{ left: `${start}%`, width: `${width}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {playing && (
                <span className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${Math.min(100, (elapsed / CLIP_SECONDS) * 100)}%` }} />
              )}
            </motion.div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={!demo}
            className="inline-flex items-center gap-2 bg-signal text-ink px-4 py-2 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-50"
          >
            {playing ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
            {playing ? 'Stop' : 'Hear the hook'}
          </button>
          {demo && (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/60">
              Found the chorus · {fmt(demo.hookStart)}–{fmt(demo.hookStart + CLIP_SECONDS)}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-white/40">
          This demo track is generated in your browser, and the real hook finder runs on it.
        </p>
      </Window>

      {/* The vertical clip it produces */}
      <motion.div
        className="relative justify-self-center w-32 sm:w-36 aspect-[9/16] rounded-[1.4rem] border-[5px] border-white/80 bg-ink overflow-hidden shadow-2xl rotate-3"
        initial={{ opacity: 0, y: 30, rotate: 10 }}
        animate={inView ? { opacity: 1, y: 0, rotate: 3 } : undefined}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <CoverArt creator={demoCreator} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="tag absolute top-3 right-2 !text-[8px]">
          <Scissors size={9} className="mr-1" /> {CLIP_SECONDS}s
        </span>
        <p className="absolute bottom-3 inset-x-2 text-[9px] leading-tight text-white">
          New single out now 🔥 <span className="text-signal">#independent</span>
        </p>
      </motion.div>
    </div>
  );
};

// 03 — Pick where it goes
const PLATFORMS = [
  { name: 'YouTube', mode: 'Clip · Short', caption: `${demoCreator.release.title} — official clip` },
  { name: 'TikTok', mode: 'Clip', caption: 'when the matatu hits the chorus 🔊' },
  { name: 'Instagram Reels', mode: 'Clip', caption: 'Out now. Self-released. Link in bio.' },
  { name: 'Facebook Page', mode: 'Clip', caption: 'New single — stream it today' },
  { name: 'SoundCloud', mode: 'Full track', caption: `${demoCreator.release.title} (full song)` },
];

export const PlatformsVisual: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref}>
      <Window title="Release to · example">
        <ul className="space-y-2">
          {PLATFORMS.map((p, i) => (
            <motion.li
              key={p.name}
              className="flex items-start gap-3 border border-white/10 px-3 py-2.5"
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.15 * i, duration: 0.45 }}
            >
              <motion.span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-signal"
                animate={inView ? { backgroundColor: '#f2e600' } : undefined}
                transition={{ delay: 0.5 + 0.2 * i }}
              >
                <Check size={13} className="text-ink" />
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={cn(p.mode.startsWith('Full') ? 'tag' : 'tag-yellow', '!text-[9px]')}>{p.mode}</span>
                </div>
                <p className="mt-0.5 text-xs text-white/50 truncate">“{p.caption}”</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </Window>
    </div>
  );
};

// 04 — Watch it land (illustrative numbers)
const STATS = [
  { name: 'TikTok', views: 18400 },
  { name: 'Instagram', views: 11200 },
  { name: 'YouTube', views: 7900 },
  { name: 'SoundCloud', views: 3600 },
  { name: 'Facebook', views: 2100 },
];

export const AnalyticsVisual: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const max = Math.max(...STATS.map((s) => s.views));
  const total = STATS.reduce((n, s) => n + s.views, 0);
  return (
    <div ref={ref}>
      <Window title="Analytics · example data">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">Views, all platforms</p>
            <p className="font-sans font-black text-signal text-5xl tracking-[-0.05em] tabular-nums">{(total / 1000).toFixed(1)}k</p>
          </div>
          <span className="tag">Last 7 days</span>
        </div>
        <div className="space-y-3">
          {STATS.map((s, i) => (
            <div key={s.name} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="text-white/70">{s.name}</span>
              <div className="h-3 bg-white/10">
                <motion.div
                  className="h-full bg-signal"
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${(s.views / max) * 100}%` } : undefined}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-right tabular-nums text-white/70">{(s.views / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </Window>
    </div>
  );
};
