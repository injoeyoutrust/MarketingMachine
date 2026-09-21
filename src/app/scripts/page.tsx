'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ScriptFrameworkSelector } from '@/components/ScriptFrameworkSelector';
import { CopyField } from '@/components/CopyField';
import { DEFAULT_SCRIPT_OPTIONS, FRAMEWORKS, SCRIPT_KEYS, scriptBeats, validScriptOptions, type ScriptOptions, type ScriptFramework } from '@/lib/scriptFrameworks';
import type { VideoScript } from '@/lib/types';
const empty = (): VideoScript => ({ hook: '', mirror: '', shift: '', proof: '', cta: '' });
const hints: Record<ScriptFramework, string[]> = {
  hmspc: ['Open with the sentence your warm audience is already thinking.', 'Describe their exact situation in their own words.', 'Write the reframe that changes how they see the problem.', 'Add relevant, verified evidence.', 'Give one clear next action.'],
  insider: ['Why are you credible? One matter-of-fact line from your actual experience.', 'What common belief does your observation contradict?', 'Name the real, specific pattern you have observed.', 'Turn the insight into a personal question for the viewer.', 'Invite them to your lead magnet using the chosen CTA test.'],
  story: ['Drop into a real client result, with verified numbers. No setup.', 'What obvious explanation was NOT responsible? Only use known facts.', 'What specific lever produced the change?', 'Show how the lesson applies to the viewer.', 'Continue the story with the same worksheet or process, if accurate.'],
};
interface Draft { script: VideoScript; result?: { script: VideoScript; notes: string[] }; options: ScriptOptions; context: string }
const fresh = (framework: ScriptFramework): Draft => ({ script: empty(), options: { ...DEFAULT_SCRIPT_OPTIONS, framework }, context: '' });
const initial = () => ({ insider: fresh('insider'), story: fresh('story'), hmspc: fresh('hmspc') });
export default function ScriptWorkshop() {
  const [drafts, setDrafts] = useState(initial);
  const [framework, setFramework] = useState<ScriptFramework>('insider');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const lock = useRef(false);
  const draft = drafts[framework];
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('script-workshop-v1') || 'null');
        if (stored) {
          const restored = initial();
          for (const key of ['insider', 'story', 'hmspc'] as const) {
            const d = stored[key];
            if (d && validScriptOptions(d.options) && d.options.framework === key && typeof d.context === 'string' && SCRIPT_KEYS.every(k => typeof d.script?.[k] === 'string')) {
              restored[key] = { script: d.script, options: d.options, context: d.context };
              if (d.result && SCRIPT_KEYS.every(k => typeof d.result.script?.[k] === 'string') && Array.isArray(d.result.notes) && d.result.notes.every((n: unknown) => typeof n === 'string')) restored[key].result = d.result;
            }
          }
          setDrafts(restored);
        }
      } catch { setError('Could not restore the browser draft.'); }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    Promise.resolve().then(() => {
    try { localStorage.setItem('script-workshop-v1', JSON.stringify(drafts)); setSaved('Draft saved in this browser'); }
    catch { setSaved('Browser saving unavailable — copy your draft before leaving.'); }
    });
  }, [drafts, loaded]);
  function update(patch: Partial<Draft>) { setDrafts(prev => ({ ...prev, [framework]: { ...prev[framework], ...patch, result: undefined } })); }
  async function polish() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const res = await fetch('/api/scripts/polish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft: draft.script, options: draft.options, context: draft.context }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setDrafts(prev => ({ ...prev, [framework]: { ...prev[framework], result } }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not polish your script.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"><div className="mx-auto max-w-6xl space-y-5">
    <Link href="/" className="text-sm text-orange-600">← Campaign kits</Link><h1 className="text-2xl font-bold">Script Workshop</h1><p>Choose a framework, write each beat, then let AI edit and polish your words.</p>
    <fieldset disabled={busy || !loaded}>
      <ScriptFrameworkSelector value={draft.options} onChange={options => { if (options.framework !== framework) setFramework(options.framework); else update({ options }); }} />
      <p className="text-xs text-neutral-500">Each framework keeps a separate draft. {saved}. Drafts are not synced to Supabase.</p>
      <label className="mt-4 block text-sm">Brand, offer, proof, and lead magnet context (optional)<textarea rows={4} value={draft.context} onChange={e => update({ context: e.target.value })} className="mt-2 w-full rounded-lg border border-neutral-300 p-3 dark:border-neutral-700 dark:bg-neutral-900" placeholder="Paste your existing brand voice, verified proof, Bridge / Zero Gap Dispatch offer details, and lead magnet here. AI will not invent missing facts." /></label>
      <div className="mt-6 grid gap-8 lg:grid-cols-2"><section><h2 className="font-bold">Your draft · {FRAMEWORKS[framework].runtime}</h2>{scriptBeats(draft.script, framework).map((beat, i) => <label key={beat.key} className="mt-5 block text-sm font-semibold">{i + 1}. {beat.label}<span className="mt-1 block text-xs font-normal text-neutral-500">{hints[framework][i]}</span><textarea rows={4} className="mt-2 w-full rounded-lg border border-neutral-300 p-3 font-normal dark:border-neutral-700 dark:bg-neutral-900" value={beat.value} onChange={e => update({ script: { ...draft.script, [beat.key]: e.target.value } })} /></label>)}</section>
      <section><h2 className="font-bold">Polished script</h2>{draft.result ? <>{scriptBeats(draft.result.script, framework).map(beat => <CopyField key={beat.key} label={beat.label} value={beat.value} />)}<h3 className="mt-5 font-semibold">Editing notes & checks</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{draft.result.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></> : <p className="mt-3 text-sm text-neutral-500">Your polished version will appear here. Your original stays unchanged.</p>}</section></div>
      <button onClick={polish} disabled={busy || !loaded || SCRIPT_KEYS.some(key => !draft.script[key].trim())} className="mt-6 rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Polishing your script…' : 'Edit & polish my script'}</button>
    </fieldset>{error && <p role="alert" className="text-red-600">{error}</p>}
  </div></main>;
}
