import React from 'react';
import { cn } from '../../../utils/cn';
import { hintClass, labelClass, segmentClass, segmentGroupClass } from '../styles';

export type DraftPatch<T> = (patch: Partial<T>) => void;

export const Field: React.FC<{
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, optional, className, children }) => (
  <div className={className}>
    <label className={labelClass} htmlFor={htmlFor}>
      {label}
      {optional && <span className="ml-2 text-white/30 normal-case tracking-normal">optional</span>}
    </label>
    {children}
    {hint && <p className={hintClass}>{hint}</p>}
  </div>
);

// A labelled two-way choice, like the distributor form's yes/no questions.
export function Choice<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className={labelClass}>{label}</p>
      <div className={segmentGroupClass} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={segmentClass(value === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const StepIntro: React.FC<{ index: number; title: string; children?: React.ReactNode }> = ({ index, title, children }) => (
  <div className="mb-6">
    <p className="font-mono text-[10px] tracking-[0.1em] text-signal">STEP {String(index + 1).padStart(2, '0')}</p>
    <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
    {children && <div className="mt-3 max-w-2xl text-sm text-white/60 space-y-2">{children}</div>}
  </div>
);

export const SummaryRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn('grid grid-cols-[8rem_minmax(0,1fr)] sm:grid-cols-[11rem_minmax(0,1fr)] gap-3 py-2.5 border-b border-white/10 text-sm', className)}>
    <dt className="eyebrow text-white/40 pt-0.5">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);
