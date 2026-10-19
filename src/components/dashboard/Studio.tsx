import React from 'react';
import { cn } from '../../utils/cn';
import { ScribbleUnderline, ScrollDoodle, type DoodleShape, type UnderlineVariant } from '../doodles/Doodles';
import type { PublishJob } from '../../types/platform';

// Building blocks shared by the studio pages. Kept static on purpose: the
// studio is a workspace, so doodles and underlines render fully drawn.

export const PageHeader: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  underline?: UnderlineVariant;
  doodle?: DoodleShape;
}> = ({ eyebrow, title, description, actions, underline = 'wave', doodle }) => (
  <header className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
    {doodle && (
      <ScrollDoodle
        shape={doodle}
        animate={false}
        strokeWidth={2}
        className="hidden sm:block -top-4 right-0 h-16 w-16 opacity-40"
      />
    )}
    <div className="min-w-0">
      <p className="eyebrow mb-3 text-white/50">{eyebrow}</p>
      <h1 className="text-4xl sm:text-6xl break-words">{title}</h1>
      <ScribbleUnderline variant={underline} animate={false} className="mt-2 max-w-[14rem]" strokeWidth={2.5} />
      {description && <p className="mt-4 max-w-xl text-sm sm:text-base text-white/60">{description}</p>}
    </div>
    {actions && <div className="relative flex flex-wrap gap-3 shrink-0">{actions}</div>}
  </header>
);

// Title row inside a panel: small mono index + brush heading.
export const PanelTitle: React.FC<{
  index?: string;
  children: React.ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
  aside?: React.ReactNode;
}> = ({ index, children, className, tone = 'light', aside }) => (
  <div className={cn('flex items-baseline justify-between gap-3 mb-5', className)}>
    <div className="flex items-baseline gap-3 min-w-0">
      {index && (
        <span className={cn('font-mono text-[10px] tracking-[0.1em]', tone === 'dark' ? 'text-ink/60' : 'text-signal')}>
          {index}
        </span>
      )}
      <h3 className={cn('text-2xl sm:text-3xl truncate', tone === 'dark' && 'text-ink')}>{children}</h3>
    </div>
    {aside}
  </div>
);

const statusStyles: Record<PublishJob['status'], string> = {
  queued: 'border border-white/25 text-white/60',
  processing: 'border border-signal text-signal',
  published: 'bg-signal text-ink',
  failed: 'border border-error-400 text-error-400',
};

export const StatusTag: React.FC<{ status: PublishJob['status']; href?: string | null }> = ({ status, href }) => {
  const className = cn(
    'inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-1 whitespace-nowrap',
    statusStyles[status],
    href && 'hover:bg-white hover:text-ink hover:border-white transition-colors'
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {status} ↗
    </a>
  ) : (
    <span className={className}>{status}</span>
  );
};

// Inline status line (saved, errors, connected…).
export const Notice: React.FC<{ tone?: 'ok' | 'error' | 'warn'; children: React.ReactNode; className?: string }> = ({
  tone = 'ok',
  children,
  className,
}) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'border-l-2 pl-3 py-1 text-sm',
      tone === 'ok' && 'border-signal text-white/80',
      tone === 'error' && 'border-error-400 text-error-300',
      tone === 'warn' && 'border-warning-400 text-warning-200',
      className
    )}
  >
    {children}
  </div>
);
