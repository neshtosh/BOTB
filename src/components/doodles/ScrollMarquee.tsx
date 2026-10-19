import React, { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { cn } from '../../utils/cn';

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

// A tilted band of brush lettering that drifts on its own, speeds up with
// scroll velocity and flips direction when you scroll back up.
const ScrollMarquee: React.FC<{
  items: string[];
  baseVelocity?: number;
  className?: string;
  tilt?: number;
}> = ({ items, baseVelocity = -2, className, tilt = -2 }) => {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  // Four copies so the loop never shows a gap; we wrap after one copy (25%).
  const row = (
    <span className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <span>{item}</span>
          <svg viewBox="0 0 100 100" className="h-[0.6em] w-[0.6em] shrink-0" aria-hidden>
            <path d="M50 6 C 54 36, 64 46, 94 50 C 64 54, 54 64, 50 94 C 46 64, 36 54, 6 50 C 36 46, 46 36, 50 6 Z" fill="currentColor" />
          </svg>
        </React.Fragment>
      ))}
    </span>
  );

  return (
    <div
      className={cn('relative overflow-hidden whitespace-nowrap py-3 sm:py-4', className)}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-label={items.join(', ')}
      role="marquee"
    >
      <motion.div className="flex w-max font-display text-3xl sm:text-5xl leading-none" style={{ x }} aria-hidden>
        {row}
        {row}
        {row}
        {row}
      </motion.div>
    </div>
  );
};

export default ScrollMarquee;
