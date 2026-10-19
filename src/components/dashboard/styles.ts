// Shared class strings for the creator studio. Squared edges, ink panels,
// mono labels and signal-yellow focus, to match the poster theme.

export const inputClass =
  'w-full min-w-0 rounded-none bg-white/[0.03] border border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 ' +
  'transition-colors hover:border-white/40 focus:outline-none focus:border-signal focus:bg-white/[0.06] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

// Native select keeps its arrow; options get an ink background so the open list isn't white.
export const selectClass = `${inputClass} cursor-pointer [&>option]:bg-ink [&>option]:text-white`;

export const labelClass = 'block font-mono text-[10px] uppercase tracking-[0.1em] text-white/60 mb-2';

// Helper text under a field.
export const hintClass = 'text-xs text-white/45 mt-1.5';

// Ink panel with a hairline border. The default container for studio content.
export const cardClass = 'relative bg-ink border border-white/15 p-5 sm:p-6';

// Yellow paper panel for the one thing on a page that should stand out.
export const paperCardClass = 'relative paper p-5 sm:p-6';

// Segmented control (Full video / Clip, 15s / 30s / 60s, filters).
export const segmentGroupClass = 'inline-flex flex-wrap border border-white/20';
export const segmentClass = (active: boolean) =>
  [
    'font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 transition-colors disabled:cursor-not-allowed',
    active ? 'bg-signal text-ink' : 'text-white/60 hover:text-white hover:bg-white/5',
  ].join(' ');

// Small square icon button (hide, delete, remove link).
export const iconButtonClass =
  'inline-grid place-items-center h-9 w-9 border border-white/15 text-white/60 transition-colors ' +
  'hover:border-signal hover:text-signal disabled:opacity-40';

export const checkboxClass = 'h-4 w-4 shrink-0 accent-[#f2e600] cursor-pointer disabled:cursor-not-allowed';
