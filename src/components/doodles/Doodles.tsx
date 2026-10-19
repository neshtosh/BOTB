import React, { useEffect, useRef, useState } from 'react';
import { motion, MotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';

// Hand-drawn strokes. Paths are drawn on with `pathLength`, driven by scroll
// position, so the doodles sketch themselves in as you move down the page.

// ---------------------------------------------------------------------------
// Underlines (viewBox 0 0 300 30), stretched to the width of the title.
// ---------------------------------------------------------------------------

const UNDERLINES = {
  wave: ['M3 18 C 30 5, 55 28, 85 15 S 140 3, 170 16 S 225 29, 255 13 S 288 9, 297 14'],
  zigzag: ['M3 20 L 21 8 L 39 22 L 58 8 L 77 22 L 96 8 L 115 22 L 134 8 L 153 22 L 172 8 L 191 22 L 210 8 L 229 22 L 248 8 L 267 22 L 286 9 L 297 15'],
  loop: ['M3 20 C 40 21, 60 5, 82 12 C 98 18, 88 30, 76 23 C 64 15, 92 5, 122 14 C 160 25, 200 7, 240 14 C 265 19, 285 10, 297 12'],
  double: ['M5 11 C 80 5, 180 8, 296 9', 'M14 22 C 100 16, 200 21, 288 18'],
  slash: ['M4 22 C 70 12, 150 6, 296 4'],
} as const;

export type UnderlineVariant = keyof typeof UNDERLINES;

export const ScribbleUnderline: React.FC<{
  variant?: UnderlineVariant;
  className?: string;
  color?: string;
  strokeWidth?: number;
}> = ({ variant = 'wave', className, color = '#f2e600', strokeWidth = 3 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  // 0 → 1 as the underline travels from the bottom of the screen to just below the middle.
  const { scrollYProgress } = useScroll({
    target: ref as unknown as React.RefObject<HTMLElement>,
    offset: ['start 0.95', 'start 0.55'],
  });
  const first = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  // A second stroke (double underline) trails the first a little.
  const second = useTransform(first, [0.25, 1], [0, 1]);
  const progress: MotionValue<number>[] | null = reduce ? null : [first, second];
  return (
    <svg
      ref={ref}
      viewBox="0 0 300 30"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('block h-3 sm:h-4 w-full overflow-visible pointer-events-none', className)}
    >
      {UNDERLINES[variant].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={progress ? { pathLength: progress[Math.min(i, 1)] } : undefined}
        />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title with eyebrow + brush heading + scroll-drawn underline
// ---------------------------------------------------------------------------

export const SectionTitle: React.FC<{
  eyebrow?: string;
  children: React.ReactNode;
  as?: 'h1' | 'h2';
  underline?: UnderlineVariant;
  className?: string;
  titleClassName?: string;
  // 'dark' = black ink, for titles sitting on yellow paper.
  tone?: 'light' | 'dark';
}> = ({ eyebrow, children, as = 'h2', underline = 'wave', className, titleClassName, tone = 'light' }) => {
  const Tag = as;
  const dark = tone === 'dark';
  return (
    <div className={cn('inline-block', dark && 'text-ink', className)}>
      {eyebrow && <p className={cn('eyebrow mb-3', dark && 'text-ink/70')}>{eyebrow}</p>}
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -1.5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tag className={titleClassName}>{children}</Tag>
      </motion.div>
      <ScribbleUnderline variant={underline} color={dark ? '#0b0b0c' : '#f2e600'} className="mt-3 -ml-1 w-[105%]" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Floating illustrations (viewBox 0 0 100 100)
// ---------------------------------------------------------------------------

const SHAPES = {
  sparkle: ['M50 6 C 54 36, 64 46, 94 50 C 64 54, 54 64, 50 94 C 46 64, 36 54, 6 50 C 36 46, 46 36, 50 6 Z'],
  notes: [
    'M18 80 C 18 72, 36 70, 37 77 C 38 85, 19 88, 18 80 Z',
    'M37 77 L 37 24 L 80 15 L 80 66',
    'M61 69 C 61 61, 79 59, 80 66 C 81 74, 62 77, 61 69 Z',
    'M37 36 L 80 27',
  ],
  arrow: ['M8 18 C 32 8, 44 40, 26 46 C 10 51, 16 25, 42 30 C 66 35, 70 68, 88 86', 'M70 84 L 88 86 L 86 68'],
  circle: ['M52 8 C 82 8, 96 30, 93 53 C 90 79, 62 95, 39 90 C 14 85, 4 61, 8 39 C 12 17, 36 5, 60 10 C 74 13, 84 21, 90 30'],
  bolt: ['M58 4 L 26 54 L 50 54 L 38 96 L 76 40 L 52 40 L 66 4 Z'],
  spiral: ['M52 50 C 57 45, 62 51, 56 57 C 48 64, 38 55, 42 46 C 48 33, 67 37, 68 53 C 70 71, 50 79, 36 71 C 18 61, 22 34, 41 26 C 63 16, 86 31, 86 53'],
  crown: ['M10 74 L 16 28 L 34 52 L 50 18 L 66 52 L 84 28 L 90 74 Z', 'M10 86 L 90 86'],
  waveform: ['M4 50 L 14 50 L 20 30 L 28 72 L 36 18 L 44 84 L 52 34 L 60 64 L 68 26 L 76 70 L 84 44 L 90 50 L 96 50'],
  heart: ['M50 86 C 18 64, 6 46, 14 28 C 22 12, 44 14, 50 32 C 56 14, 78 12, 86 28 C 94 46, 82 64, 50 86 Z'],
} as const;

export type DoodleShape = keyof typeof SHAPES;

export const ScrollDoodle: React.FC<{
  shape: DoodleShape;
  className?: string;
  color?: string;
  strokeWidth?: number;
  // Parallax distance in px over the element's pass through the viewport.
  drift?: number;
  // Degrees of rotation over that same pass.
  spin?: number;
}> = ({ shape, className, color = '#f2e600', strokeWidth = 2.5, drift = 80, spin = 20 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-spin, spin]);
  const draw = useSpring(useTransform(scrollYProgress, [0.05, 0.45], [0, 1]), { stiffness: 90, damping: 25 });

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none absolute', className)}
      style={reduce ? undefined : { y, rotate }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        {SHAPES[shape].map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={reduce ? undefined : { pathLength: draw }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Page progress: a squiggle across the top of the screen drawn as you read.
// ---------------------------------------------------------------------------

export const ScrollProgressScribble: React.FC = () => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const draw = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  if (reduce) return null;
  return (
    <svg
      viewBox="0 0 1000 12"
      preserveAspectRatio="none"
      aria-hidden
      className="fixed top-0 left-0 z-[60] h-2.5 w-full pointer-events-none"
    >
      <motion.path
        d="M0 6 C 40 1, 60 11, 100 6 S 160 1, 200 6 S 260 11, 300 6 S 360 1, 400 6 S 460 11, 500 6 S 560 1, 600 6 S 660 11, 700 6 S 760 1, 800 6 S 860 11, 900 6 S 960 1, 1000 6"
        fill="none"
        stroke="#f2e600"
        strokeWidth={3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ pathLength: draw }}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Oversized brush wordmark that slides into place as it scrolls into view.
// ---------------------------------------------------------------------------

export const ScrollWordmark: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['-18%', '0%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [-4, 0]);

  // Size the text so it exactly spans the container, whatever the wording.
  useEffect(() => {
    const box = ref.current;
    const el = textRef.current;
    if (!box || !el) return;
    const fit = () => {
      const current = parseFloat(getComputedStyle(el).fontSize);
      const ratio = el.scrollWidth / current; // width in ems
      if (ratio > 0) setFontSize(Math.floor(box.clientWidth / ratio));
    };
    document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={ref} className={cn('overflow-hidden', className)} aria-hidden>
      <motion.p
        ref={textRef}
        className="font-display whitespace-nowrap leading-[0.85] text-[12vw]"
        style={{ ...(fontSize ? { fontSize } : {}), ...(reduce ? {} : { x, rotate }) }}
      >
        {text}
      </motion.p>
    </div>
  );
};
