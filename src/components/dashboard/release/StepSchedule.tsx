import React from 'react';
import { CalendarClock, Zap } from 'lucide-react';
import { slugify } from '../../../lib/releases';
import { cn } from '../../../utils/cn';
import { checkboxClass, inputClass, selectClass } from '../styles';
import { Field, StepIntro, type DraftPatch } from './fields';
import { toLocalInput, type ReleaseDraft } from './draft';

const StepSchedule: React.FC<{ index: number; draft: ReleaseDraft; patch: DraftPatch<ReleaseDraft> }> = ({ index, draft, patch }) => {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const options = [
    { value: 'now' as const, icon: Zap, title: 'As soon as possible', text: 'Posts go out as soon as each platform has processed them.' },
    {
      value: 'scheduled' as const,
      icon: CalendarClock,
      title: 'Pick a release date',
      text: 'Everything goes live together. Until then your smart link collects pre-saves.',
    },
  ];

  return (
    <div className="space-y-6">
      <StepIntro index={index} title="Release date">
        <p>Uploading 2–4 weeks early gives you time to share the smart link and build up pre-saves before release day.</p>
      </StepIntro>

      <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label="When should it go out?">
        {options.map(({ value, icon: Icon, title, text }) => {
          const active = draft.timing === value;
          return (
            <button key={value} type="button" role="radio" aria-checked={active} onClick={() => patch({ timing: value })}
              className={cn('flex items-start gap-3 border p-4 text-left transition-colors', active ? 'border-signal bg-signal/[0.06]' : 'border-white/15 hover:border-white/35')}>
              <span className={cn('grid place-items-center h-9 w-9 shrink-0', active ? 'bg-signal text-ink' : 'border border-white/20 text-white/60')}>
                <Icon size={16} />
              </span>
              <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-xs text-white/50 mt-1">{text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {draft.timing === 'scheduled' && (
        <Field label="Release date and time" htmlFor="releaseAt" hint={`Your time zone: ${zone}. Clips are rendered now, so the posts are ready to go.`}>
          <input id="releaseAt" type="datetime-local" className={cn(inputClass, 'sm:max-w-xs [color-scheme:dark]')}
            min={toLocalInput(new Date(Date.now() + 15 * 60_000))} value={draft.releaseAt}
            onChange={(e) => patch({ releaseAt: e.target.value })} />
        </Field>
      )}

      <div className="grid sm:grid-cols-2 gap-5 border-t border-white/10 pt-5">
        <Field label="Visibility on platforms" htmlFor="privacy" hint="Private posts let you check them before fans see them.">
          <select id="privacy" className={selectClass} value={draft.privacy} onChange={(e) => patch({ privacy: e.target.value as ReleaseDraft['privacy'] })}>
            <option value="public">Public</option>
            <option value="private">Private (review before going live)</option>
          </select>
        </Field>
        <Field label="Smart link" htmlFor="slug" hint="One link for every platform. You can share it before release day.">
          <div className="flex items-stretch">
            <span className="grid place-items-center border border-r-0 border-white/20 bg-white/[0.06] px-3 font-mono text-xs text-white/50">/r/</span>
            <input id="slug" className={inputClass} placeholder={slugify(draft.title || 'your-release')} value={draft.slug}
              onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
          </div>
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" className={checkboxClass} checked={draft.showOnPage} onChange={(e) => patch({ showOnPage: e.target.checked })} />
        Show the tracks on my public creator page
      </label>
    </div>
  );
};

export default StepSchedule;
