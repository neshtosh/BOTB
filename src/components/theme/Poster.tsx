import React, { useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';
import { ScribbleUnderline, ScrollDoodle, type DoodleShape, type UnderlineVariant } from '../doodles/Doodles';

// Poster-style building blocks: torn yellow paper, caution tape, hollow type.

// Small seeded PRNG so torn edges look random but stay identical between renders.
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// clip-path polygon for a ripped edge. `side` is where the tear is.
function tornPolygon(seed: number, side: 'top' | 'bottom') {
  const rand = seeded(seed);
  const pts: string[] = [];
  let x = 0;
  while (x < 100) {
    // Mostly small jitter, sometimes a deeper bite out of the paper.
    const deep = rand() < 0.12;
    const y = deep ? 35 + rand() * 60 : 5 + rand() * 30;
    pts.push(`${x.toFixed(2)}% ${(side === 'top' ? y : 100 - y).toFixed(2)}%`);
    x += 0.6 + rand() * 2.4;
  }
  pts.push(`100% ${side === 'top' ? 20 : 80}%`);
  return side === 'top'
    ? `polygon(0% 100%, ${pts.join(', ')}, 100% 100%)`
    : `polygon(0% 0%, ${pts.join(', ')}, 100% 0%)`;
}

const TornEdge: React.FC<{ side: 'top' | 'bottom'; seed: number }> = ({ side, seed }) => {
  const clipPath = useMemo(() => tornPolygon(seed, side), [seed, side]);
  return (
    <div
      aria-hidden
      className={cn('paper absolute left-0 right-0 h-10 sm:h-14', side === 'top' ? 'bottom-full -mb-px' : 'top-full -mt-px')}
      style={{ clipPath }}
    />
  );
};

// A full-width sheet of yellow paper with torn edges. It tilts a little as it
// scrolls through the viewport, like a poster peeling off a wall.
export const PaperPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  seed?: number;
  tilt?: number;
  edges?: 'both' | 'top' | 'bottom';
}> = ({ children, className, innerClassName, seed = 7, tilt = 1.5, edges = 'both' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-tilt, tilt]);

  return (
    <motion.section
      ref={ref}
      className={cn('relative my-14 sm:my-20', className)}
      style={reduce ? undefined : { rotate }}
    >
      {/* Slightly wider than the screen so the tilt never shows a gap at the sides. */}
      <div className={cn('paper relative -mx-[3vw] px-[3vw]', innerClassName)}>
        {(edges === 'both' || edges === 'top') && <TornEdge side="top" seed={seed} />}
        {children}
        {(edges === 'both' || edges === 'bottom') && <TornEdge side="bottom" seed={seed * 3 + 1} />}
      </div>
    </motion.section>
  );
};

// Two strips of caution tape crossing in an X; each slides opposite ways with scroll.
export const CautionTapes: React.FC<{ text: string; className?: string; children?: React.ReactNode }> = ({
  text,
  className,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const xA = useTransform(scrollYProgress, [0, 1], ['0%', '-22%']);
  const xB = useTransform(scrollYProgress, [0, 1], ['-22%', '0%']);
  const words = Array.from({ length: 14 }, () => text);

  const strip = (x: typeof xA, rotate: number, top: string) => (
    <div
      className="absolute -left-[15%] w-[130%] bg-signal text-ink shadow-[0_12px_30px_rgba(0,0,0,0.55)] border-y-2 border-ink/80"
      style={{ top, transform: `rotate(${rotate}deg)` }}
    >
      <motion.div
        className="flex whitespace-nowrap py-2 sm:py-3 font-sans font-black uppercase italic tracking-[-0.03em] text-2xl sm:text-4xl"
        style={reduce ? undefined : { x }}
      >
        {words.map((w, i) => (
          <span key={i} className="px-3">
            {w}
          </span>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)} aria-label={text} role="img">
      {children}
      <div aria-hidden>
        {strip(xA, -7, '30%')}
        {strip(xB, 6, '42%')}
      </div>
    </div>
  );
};

// Huge hollow word that slides sideways as you scroll past.
export const OutlineScroll: React.FC<{ text: string; className?: string; reverse?: boolean }> = ({
  text,
  className,
  reverse,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], reverse ? ['-12%', '6%'] : ['6%', '-12%']);
  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none select-none overflow-hidden', className)}>
      <motion.p className="outline-type whitespace-nowrap text-[22vw] sm:text-[16vw]" style={reduce ? undefined : { x }}>
        {text}
      </motion.p>
    </div>
  );
};

// Top-of-page header for inner pages: a torn yellow sheet with the page title.
export const PageHero: React.FC<{
  eyebrow: string;
  title: string;
  description?: string;
  underline?: UnderlineVariant;
  doodles?: { shape: DoodleShape; className: string }[];
  children?: React.ReactNode;
  seed?: number;
}> = ({ eyebrow, title, description, underline = 'wave', doodles = [], children, seed = 11 }) => (
  <PaperPanel seed={seed} tilt={1} edges="bottom" className="mt-0 mb-16 sm:mb-20" innerClassName="pt-16 sm:pt-20 pb-10 sm:pb-14">
    <div className="container relative">
      {doodles.map((d, i) => (
        <ScrollDoodle key={i} shape={d.shape} className={d.className} color="#0b0b0c" />
      ))}
      <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.1em] text-ink/70 mb-3">{eyebrow}</p>
      <motion.h1
        className="text-ink text-6xl sm:text-8xl"
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h1>
      <ScribbleUnderline variant={underline} color="#0b0b0c" className="mt-2 max-w-sm" />
      {description && <p className="mt-5 max-w-xl text-ink/80 font-medium">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  </PaperPanel>
);

// Big yellow number with a small label, as on the poster ("60%").
export const BigStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  >
    <p className="font-sans font-black text-signal text-6xl sm:text-8xl leading-none tracking-[-0.05em] tabular-nums">{value}</p>
    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60">{label}</p>
  </motion.div>
);
