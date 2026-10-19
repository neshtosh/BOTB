import React, { useEffect, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/.';

// Text that "decodes" from random glyphs into the final string, left to right.
const ScrambleText: React.FC<{ text: string; delay?: number; duration?: number; className?: string }> = ({
  text,
  delay = 0,
  duration = 1200,
  className,
}) => {
  const [output, setOutput] = useState(() => text.replace(/[^\s.]/g, ' '));

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOutput(text);
      return;
    }
    let frame = 0;
    let start = 0;
    const timeout = window.setTimeout(() => {
      const tick = (now: number) => {
        start ||= now;
        const progress = Math.min(1, (now - start) / duration);
        const revealed = Math.floor(progress * text.length);
        setOutput(
          text
            .split('')
            .map((ch, i) => (i < revealed || ch === ' ' || ch === '.' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join('')
        );
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [text, delay, duration]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{output}</span>
    </span>
  );
};

export default ScrambleText;
