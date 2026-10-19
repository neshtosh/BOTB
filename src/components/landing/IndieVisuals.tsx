import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Clock3 } from 'lucide-react';
import { mockCreators, demoCreator } from '../../data/mockCreators';
import CoverArt from './CoverArt';

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

// A self-managed creator's "control room": everything a label would normally
// handle, run by the artist. All values are illustrative.
export const ControlRoom: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const releases = mockCreators.slice(0, 3).map((c, i) => ({
    creator: c,
    status: i === 0 ? 'Live on 5 platforms' : i === 1 ? 'Clip scheduled' : 'Draft',
    done: i === 0,
  }));

  return (
    <div ref={ref} className="bg-ink border border-white/15 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <CoverArt creator={demoCreator} showText={false} className="h-8 w-8 rounded-full" />
          <div>
            <p className="text-sm font-semibold leading-none">{demoCreator.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/50 mt-1">Independent · {demoCreator.city}</p>
          </div>
        </div>
        <span className="tag-yellow">Example</span>
      </div>

      <div className="grid grid-cols-3 border-b border-white/10">
        {[
          ['Fans on your list', compact(demoCreator.stats.fans)],
          ['Posts released', String(demoCreator.stats.posts)],
          ['Platforms', String(demoCreator.stats.platforms)],
        ].map(([label, value], i) => (
          <motion.div
            key={label}
            className="p-4 sm:p-5 border-r border-white/10 last:border-r-0"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.1 * i }}
          >
            <p className="font-sans font-black text-signal text-3xl sm:text-4xl tracking-[-0.05em] tabular-nums">{value}</p>
            <p className="mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.08em] text-white/50">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">Your releases</p>
        <ul className="space-y-2">
          {releases.map(({ creator, status, done }, i) => (
            <motion.li
              key={creator.handle}
              className="flex items-center gap-3 border border-white/10 p-2.5"
              initial={{ opacity: 0, x: 16 }}
              animate={inView ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: 0.3 + 0.15 * i }}
            >
              <CoverArt creator={creator} showText={false} className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{creator.release.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/40">{creator.release.type}</p>
              </div>
              <span className={done ? 'flex items-center gap-1 text-xs text-signal' : 'flex items-center gap-1 text-xs text-white/50'}>
                {done ? <CheckCircle2 size={14} /> : <Clock3 size={14} />} {status}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Strip of fictional indie creators that drifts sideways as you scroll.
export const CreatorStrip: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['4%', '-8%']);

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div className="flex gap-5 w-max pl-4 sm:pl-6" style={reduce ? undefined : { x }}>
        {mockCreators.map((c, i) => (
          <motion.article
            key={c.handle}
            className="group w-64 sm:w-72 shrink-0 bg-ink border border-white/10 hover:border-signal/60 transition-colors"
            initial={{ opacity: 0, y: 30, rotate: i % 2 ? 2 : -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: i % 2 ? 1 : -1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
          >
            <CoverArt creator={c} className="aspect-square w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-3xl text-signal">{c.name}</h3>
                  <p className="text-sm text-white/70">{c.kind}</p>
                </div>
                <ArrowUpRight size={18} className="text-white/40 group-hover:text-signal transition-colors" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-white/40">
                {c.city} · {c.stats.platforms} platforms · {compact(c.stats.fans)} fans
              </p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
};
