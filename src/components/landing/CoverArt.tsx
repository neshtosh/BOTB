import React from 'react';
import { cn } from '../../utils/cn';
import type { MockCreator } from '../../data/mockCreators';

// Release artwork drawn in SVG from a creator's palette — no image files.
const CoverArt: React.FC<{ creator: MockCreator; className?: string; showText?: boolean }> = ({
  creator,
  className,
  showText = true,
}) => {
  const { style, bg, fg, accent } = creator.cover;
  const id = `cover-${creator.handle}`;

  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className={cn('block', className)} aria-hidden>
      <defs>
        <pattern id={`${id}-dots`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="3.2" fill={fg} />
        </pattern>
        <filter id={`${id}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      <rect width="300" height="300" fill={bg} />

      {style === 'sun' && (
        <>
          <circle cx="150" cy="128" r="92" fill={accent} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x="0" y={150 + i * 14} width="300" height="7" fill={bg} />
          ))}
          <rect x="0" y="230" width="300" height="70" fill={fg} />
        </>
      )}

      {style === 'waves' &&
        Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${70 + i * 30} C 60 ${40 + i * 30}, 110 ${100 + i * 30}, 160 ${70 + i * 30} S 260 ${40 + i * 30}, 320 ${70 + i * 30}`}
            fill="none"
            stroke={i % 2 ? accent : fg}
            strokeWidth="11"
            strokeLinecap="round"
          />
        ))}

      {style === 'stripes' && (
        <g transform="rotate(-24 150 150)">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="-80" y={-60 + i * 40} width="460" height="18" fill={i % 3 === 0 ? accent : fg} />
          ))}
        </g>
      )}

      {style === 'dots' && (
        <>
          <circle cx="150" cy="140" r="110" fill={`url(#${id}-dots)`} />
          <circle cx="150" cy="140" r="54" fill={accent} />
          <circle cx="150" cy="140" r="12" fill={bg} />
        </>
      )}

      <rect width="300" height="300" fill={fg} filter={`url(#${id}-grain)`} opacity="0.5" />

      {showText && (
        <>
          {/* Solid band so the title reads over any pattern */}
          {style !== 'sun' && <rect x="0" y="236" width="300" height="64" fill="#0b0b0c" />}
          <text
            x="18"
            y="280"
            fill={accent}
            style={{ fontFamily: 'Dracutaz, sans-serif', fontSize: 34 }}
          >
            {creator.release.title.toUpperCase()}
          </text>
          <text x="18" y="30" fill={style === 'sun' ? fg : fg} style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12, letterSpacing: 1.5 }}>
            {creator.name.toUpperCase()}
          </text>
        </>
      )}
    </svg>
  );
};

export default CoverArt;
