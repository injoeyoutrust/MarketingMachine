'use client';
import { FRAMEWORKS, type ScriptOptions } from '@/lib/scriptFrameworks';
export function ScriptFrameworkSelector({ value, onChange, audience, disabled }: { value: ScriptOptions; onChange: (value: ScriptOptions) => void; audience?: 'cold' | 'warm'; disabled?: boolean }) {
  const cls = 'mt-1 block w-full rounded-lg border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900';
  return <fieldset disabled={disabled} className="my-4 space-y-3 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800 dark:text-neutral-100"><legend className="px-2 font-semibold">Audience & script framework</legend>
    <label className="block">Framework<select className={cls} value={value.framework} onChange={e => onChange({ ...value, framework: e.target.value as ScriptOptions['framework'] })}>{Object.entries(FRAMEWORKS).filter(([key]) => audience === 'cold' ? key !== 'hmspc' : audience === 'warm' ? key === 'hmspc' : true).map(([key, f]) => <option key={key} value={key}>{f.name}</option>)}</select></label>
    {value.framework !== 'hmspc' && <><label className="block">Lead magnet CTA test<select className={cls} value={value.cta} onChange={e => onChange({ ...value, cta: e.target.value as ScriptOptions['cta'] })}><option value="diagnostic">Diagnostic</option><option value="access">Scarcity / access (only when factual)</option><option value="engagement">Comment keyword</option></select></label><p className="text-xs text-neutral-500">Cold traffic sells the observation and leads to a scorecard, PDF, or short training.</p></>}
    {value.framework === 'story' && <label className="block">Story voice<select className={cls} value={value.voice} onChange={e => onChange({ ...value, voice: e.target.value as ScriptOptions['voice'] })}><option value="operator">Operator authority</option><option value="client">Client / testimonial draft</option></select></label>}
  </fieldset>;
}
