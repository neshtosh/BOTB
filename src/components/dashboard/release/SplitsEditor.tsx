import React from 'react';
import { Plus, X } from 'lucide-react';
import { SPLIT_ROLES, splitsProblem, splitsTotal } from '../../../lib/releases';
import { cn } from '../../../utils/cn';
import { iconButtonClass, inputClass, selectClass } from '../styles';
import type { Split } from '../../../types/platform';

// Collaborators and their share of a release. Used in the release form and on the release page.
const SplitsEditor: React.FC<{ splits: Split[]; onChange: (splits: Split[]) => void }> = ({ splits, onChange }) => {
  const total = splitsTotal(splits);
  const problem = splitsProblem(splits);
  const set = (i: number, p: Partial<Split>) => onChange(splits.map((s, j) => (j === i ? { ...s, ...p } : s)));

  // New collaborators start with whatever share is left.
  const add = () => {
    const share = Math.max(0, Math.round((100 - total) * 100) / 100);
    onChange([...splits, { name: '', email: '', role: 'Producer', share }]);
  };

  return (
    <div className="space-y-3">
      <div className="hidden sm:grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_9rem_6rem_2.25rem] gap-2 eyebrow text-white/40">
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span>Share</span>
        <span />
      </div>
      {splits.map((s, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_6rem] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_9rem_6rem_2.25rem] gap-2 border-b border-white/10 pb-3 sm:border-0 sm:pb-0">
          <input aria-label="Name" className={cn(inputClass, 'col-span-2 sm:col-span-1')} placeholder="Name" value={s.name} onChange={(e) => set(i, { name: e.target.value })} />
          <input aria-label="Email" type="email" className={cn(inputClass, 'col-span-2 sm:col-span-1')} placeholder="email@example.com" value={s.email}
            onChange={(e) => set(i, { email: e.target.value })} />
          <select aria-label="Role" className={selectClass} value={s.role} onChange={(e) => set(i, { role: e.target.value })}>
            {SPLIT_ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="relative">
            <input aria-label="Share in percent" type="number" min={0} max={100} step={0.5} className={cn(inputClass, 'pr-7 tabular-nums')} value={s.share}
              onChange={(e) => set(i, { share: Number(e.target.value) })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">%</span>
          </div>
          {splits.length > 1 && (
            <button type="button" aria-label="Remove collaborator" className={cn(iconButtonClass, 'h-auto self-stretch col-span-2 sm:col-span-1 w-full sm:w-9')}
              onClick={() => onChange(splits.filter((_, j) => j !== i))}>
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button type="button" className="eyebrow text-signal hover:text-white inline-flex items-center gap-1" onClick={add}>
          <Plus size={12} /> Add a collaborator
        </button>
        <span className={cn('font-mono text-xs tabular-nums', total === 100 ? 'text-signal' : 'text-error-300')}>Total {total}%</span>
      </div>
      {/* Visual bar of the shares. */}
      <div className="flex h-3 border border-white/15 overflow-hidden" aria-hidden>
        {splits.map((s, i) => (
          <span key={i} className={i % 2 ? 'bg-white/60' : 'bg-signal'} style={{ width: `${Math.max(0, Math.min(100, Number(s.share) || 0))}%` }} />
        ))}
      </div>
      {problem && <p className="text-sm text-error-300">{problem}</p>}
    </div>
  );
};

export default SplitsEditor;
