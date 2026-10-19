import React from 'react';
import { cn } from '../../utils/cn';

// Unsigned mark: a "U" drawn in one stroke that breaks out into an arrow —
// independent, and releasing outward. Ink on a yellow tile.
export const LogoMark: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg
    viewBox="0 0 64 64"
    className={cn('h-8 w-8', className)}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <rect width="64" height="64" rx="14" fill="#f2e600" />
    <g fill="none" stroke="#0b0b0c" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16 V34 a13 13 0 0 0 26 0 V30 L50 16" />
      <path d="M38.5 15.5 H50.5 V27.5" />
    </g>
  </svg>
);

const Logo: React.FC<{ className?: string; markClassName?: string; wordClassName?: string }> = ({
  className,
  markClassName,
  wordClassName,
}) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <LogoMark className={markClassName} />
    <span className={cn('text-2xl font-black tracking-[-0.06em] leading-none', wordClassName)}>
      unsigned<span className="text-signal">.</span>
    </span>
  </span>
);

export default Logo;
