'use client';

import { ScriptFrameworkSelector } from '@/components/ScriptFrameworkSelector';
import { DEFAULT_SCRIPT_OPTIONS, scriptBeats, type ScriptOptions } from '@/lib/scriptFrameworks';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { INTAKE_SECTIONS, emptyIntakeFields, composeIntakeText } from '@/lib/intakeFields';
import { FUNNEL_STAGES, STAGE_DESCRIPTIONS, STAGE_LABELS, emptyStageBriefs, type FunnelProject, type FunnelContribution, type FunnelStage } from '@/lib/funnels';
import { CopyField } from '@/components/CopyField';
import type { SavedRun } from '@/lib/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { angleColor } from '@/lib/angleColors';
import { assignRun } from '@/lib/storage';

const inputClass = 'mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900';
const buttonClass = 'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50';
async function api(path: string, body?: unknown) {
  const res = await fetch(`/api/funnels${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed. Please retry.');
  return data;
}

export default function Home() {
  const [coldScript, setColdScript] = useState<ScriptOptions>(DEFAULT_SCRIPT_OPTIONS);
  const [funnelSets, setFunnelSets] = useState<FunnelProject[]>([]);
  const [project, setProject] = useState<FunnelProject | null>(null);
  const [contributions, setContributions] = useState<FunnelContribution[]>([]);
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState(emptyIntakeFields);
  const [briefs, setBriefs] = useState(emptyStageBriefs);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<FunnelStage>('TOFO');
  const [tab, setTab] = useState<'ads' | 'sms' | 'email'>('ads');
  const [mode, setMode] = useState<'quick' | 'push'>('quick');
  const [idea, setIdea] = useState('');
  const [importKind, setImportKind] = useState<'campaign' | 'paste'>('campaign');
  const [allAds, setAllAds] = useState<SavedRun[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [assignAdId, setAssignAdId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [importNotice, setImportNotice] = useState('');
  const importRequests = useRef(new Map<string, string>());
  const [importDraft, setImportDraft] = useState({ label: '', headline: '', primaryText: '', sms: '', subject: '', email: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const pending = useRef<{ key: string; id: string } | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  async function work(message: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(message); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please retry.'); }
    finally { lock.current = false; setBusy(''); }
  }
  async function loadAds() {
    const res = await fetch('/api/runs');
    if (res.ok) setAllAds((await res.json()).runs);
  }
  useEffect(() => {
    let cancelled = false;
    api('').then(data => { if (!cancelled) setFunnelSets(data.projects); }).catch(e => { if (!cancelled) setError(e.message); });
    fetch('/api/runs').then(res => res.json()).then(data => { if (!cancelled) setAllAds(data.runs); }).catch(() => {});
    Promise.resolve().then(() => {
    if (cancelled) return;
    try {
      const draft = JSON.parse(localStorage.getItem('funnel-project-draft') || 'null');
      if (draft) { setLabel(draft.label || ''); setFields({ ...emptyIntakeFields(), ...draft.fields }); setBriefs({ ...emptyStageBriefs(), ...draft.briefs }); }
    } catch { /* A damaged local draft must not prevent loading saved funnel sets. */ }
    });
    return () => { cancelled = true; };
  }, []);
  function saveDraft() {
    try { localStorage.setItem('funnel-project-draft', JSON.stringify({ label, fields, briefs })); }
    catch { setError('This browser could not save the draft. Keep this page open until the funnel set is saved.'); }
  }
  async function openProject(id: string) {
    await work('Loading funnel set…', async () => {
      const data = await api(`/${id}`);
      setProject(data.project); setContributions(data.contributions); setIdea(''); setStage('TOFO'); setTab('ads'); setSelectedRunIds([]); setImportNotice(''); setExpandedEntries(new Set()); setAssignAdId('');
    });
  }
  function mergeContribution(entry: FunnelContribution) {
    setContributions(prev => prev.some(e => e.id === entry.id) ? prev : [...prev, entry]);
    setExpandedEntries(prev => new Set(prev).add(entry.id));
  }
  async function saveContributionField(contributionId: string, path: string, newValue: string) {
    if (!project) return;
    try {
      const res = await fetch(`/api/funnels/${project.id}/contributions/${contributionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save that edit.');
      setContributions(prev => prev.map(c => (c.id === contributionId ? { ...c, copy: data.contribution.copy } : c)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save that edit.'); }
  }
  function toggleEntry(id: string) {
    setExpandedEntries(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  async function assignExistingAd() {
    if (!project || !assignAdId) return;
    setAssigning(true);
    try {
      const res = await assignRun(assignAdId, project.id, stage);
      if (!res) throw new Error('Could not assign that ad.');
      await loadAds();
      setAssignAdId('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not assign that ad.'); }
    finally { setAssigning(false); }
  }
  async function unassignAd(id: string) {
    setAssigning(true);
    try { await assignRun(id, null, null); await loadAds(); }
    finally { setAssigning(false); }
  }
  async function generateBase() {
    if (!project) return;
    await work('Generating base copy…', async () => {
      for (const level of FUNNEL_STAGES) {
        if (contributions.some(c => c.stage === level && c.mode === 'base')) continue;
        setBusy(`Generating ${STAGE_LABELS[level]} base ad, SMS and email…`);
        const data = await api(`/${project.id}/generate`, { scriptOptions: level === 'TOFO' ? coldScript : { ...DEFAULT_SCRIPT_OPTIONS, framework: 'hmspc' }, stage: level, mode: 'base', idea: '', requestId: crypto.randomUUID() });
        mergeContribution(data.contribution);
      }
    });
  }
  async function addConcept() {
    if (!project) return;
    await work(`Developing ${STAGE_LABELS[stage]} concept and nurture copy…`, async () => {
      const key = JSON.stringify([project.id, stage, mode, idea, coldScript]);
      if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
      const data = await api(`/${project.id}/generate`, { scriptOptions: stage === 'TOFO' ? coldScript : { ...DEFAULT_SCRIPT_OPTIONS, framework: 'hmspc' }, stage, mode, idea, requestId: pending.current.id });
      mergeContribution(data.contribution); setIdea(''); pending.current = null;
    });
  }
  async function importCopy() {
    if (!project) return;
    setImportNotice('');
    await work(`Importing into ${STAGE_LABELS[stage]}…`, async () => {
      if (importKind === 'campaign') {
        let completed = 0;
        for (const runId of selectedRunIds) {
          setBusy(`Importing ad ${completed + 1} of ${selectedRunIds.length} into ${STAGE_LABELS[stage]}…`);
          const key = JSON.stringify([project.id, stage, runId]);
          const requestId = importRequests.current.get(key) || crypto.randomUUID();
          importRequests.current.set(key, requestId);
          const data = await api(`/${project.id}/import`, { runId, stage, requestId });
          mergeContribution(data.contribution);
          importRequests.current.delete(key);
          setSelectedRunIds(prev => prev.filter(id => id !== runId));
          completed++;
          setImportNotice(`${completed} ad${completed === 1 ? '' : 's'} added to ${STAGE_LABELS[stage]}. You can select more ads and import again.`);
        }
        return;
      }
      const payload = {
        label: importDraft.label,
        copy: {
          adSets: [{ angle: importDraft.label, headline: importDraft.headline, primaryText: importDraft.primaryText, description: '', videoScript: { hook: '', mirror: '', shift: '', proof: '', cta: '' } }],
          sms: importDraft.sms.split('\n').filter(line => line.trim()).map((message, i) => ({ day: i, message })),
          email: importDraft.email.trim() ? [{ day: 0, subject: importDraft.subject, body: importDraft.email }] : [], flags: [],
        },
      };
      const key = JSON.stringify(['import', project.id, stage, payload]);
      if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
      const data = await api(`/${project.id}/import`, { ...payload, stage, requestId: pending.current.id });
      mergeContribution(data.contribution); pending.current = null;
      setImportDraft({ label: '', headline: '', primaryText: '', sms: '', subject: '', email: '' });
      setImportNotice(`Concept added to ${STAGE_LABELS[stage]}. Paste another concept to keep growing this pool.`);
    });
  }
  const ready = FUNNEL_STAGES.every(s => contributions.some(c => c.stage === s && c.mode === 'base'));
  const stageCopy = contributions.filter(c => c.stage === stage);
  const counts = { ads: stageCopy.reduce((n, c) => n + c.copy.adSets.length, 0), sms: stageCopy.reduce((n, c) => n + c.copy.sms.length, 0), email: stageCopy.reduce((n, c) => n + c.copy.email.length, 0) };
  const adsInStage = project ? allAds.filter(a => a.funnelSetId === project.id && a.stage === stage) : [];
  const unassignedAds = allAds.filter(a => !a.funnelSetId);

  return <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
      <h1 className="text-xl font-bold">Funnel Sets</h1><Link href="/ads" className="text-sm text-orange-600">Ad pool →</Link><Link href="/scripts" className="text-sm text-orange-600">Write & polish a script →</Link><ThemeToggle />
    </header>
    <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[240px_1fr] md:p-6">
      <aside className="space-y-3">
        <button className={`${buttonClass} w-full`} disabled={!!busy} onClick={() => { setProject(null); setContributions([]); setStep(0); setError(''); }}>+ New funnel set</button>
        <p className="text-xs text-neutral-500">Saved funnel sets</p>
        {funnelSets.map(p => <button key={p.id} disabled={!!busy} onClick={() => openProject(p.id)} className={`block w-full rounded-lg border p-3 text-left text-sm ${project?.id === p.id ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-200 dark:border-neutral-800'}`}>{p.label}</button>)}
      </aside>
      <main className="min-w-0">
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-400 p-3 text-sm text-red-600">{error}<button className="ml-3 underline" disabled={!!busy} onClick={() => work('Reloading funnel sets…', async () => { setFunnelSets((await api('')).projects); })}>Reload list</button></div>}
        {busy && <p role="status" className="mb-4 rounded-lg bg-orange-500/10 p-3 text-sm">{busy} This may take a minute. Keep this page open.</p>}
        {!project ? <fieldset disabled={!!busy} className="space-y-6">
          <div><h2 className="text-2xl font-bold">Build the journey, then grow the ideas.</h2><p className="mt-2 text-sm text-neutral-500">One master intake. Three campaigns — TOFU, MOFU, BOFU. Ads live inside each one, plus an expanding SMS and email library.</p></div>
          <nav className="flex gap-4 text-sm" aria-label="Funnel set setup"><button className={step === 0 ? 'font-bold text-orange-600' : ''} onClick={() => { saveDraft(); setStep(0); }}>1. Master intake</button><button className={step === 1 ? 'font-bold text-orange-600' : ''} onClick={() => { saveDraft(); setStep(1); }}>2. Funnel direction</button><span className="text-neutral-500">3. Ads &amp; nurture pools</span></nav>
          {step === 0 ? <>
            <label className="block text-sm font-semibold">Funnel set name<input className={inputClass} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Dispatching — owner operator journey" /></label>
            {INTAKE_SECTIONS.map(section => <section key={section.title} className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"><h3 className="mb-4 font-semibold text-orange-600">{section.title}</h3><div className="space-y-4">{section.fields.map(f => <label key={f.key} className="block text-sm">{f.question}{f.hint && <span className="mt-1 block text-xs text-neutral-500">{f.hint}</span>}{f.type === 'input' ? <input className={inputClass} value={fields[f.key] || ''} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} /> : <textarea className={inputClass} rows={3} value={fields[f.key] || ''} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} />}</label>)}</div></section>)}
            <button className={buttonClass} onClick={() => { saveDraft(); setStep(1); window.scrollTo(0, 0); }}>Next: funnel direction →</button>
          </> : <>
            {FUNNEL_STAGES.map(level => <section key={level} className="space-y-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"><div><h3 className="text-lg font-bold">{STAGE_LABELS[level]}</h3><p className="text-sm text-neutral-500">{STAGE_DESCRIPTIONS[level]}</p></div>{(['idea', 'tone', 'adTypes'] as const).map(key => <label key={key} className="block text-sm">{{ idea: 'General idea, audience mindset, and desired shift', tone: 'Tone and emotional direction', adTypes: 'Kinds of ads to explore (optional)' }[key]}<textarea className={inputClass} rows={key === 'idea' ? 3 : 2} value={briefs[level][key]} onChange={e => setBriefs({ ...briefs, [level]: { ...briefs[level], [key]: e.target.value } })} placeholder={key === 'adTypes' ? 'e.g. Myth buster, customer story, objection response' : undefined} /></label>)}</section>)}
            <button className={buttonClass} onClick={() => { saveDraft(); if (!label.trim() || composeIntakeText(fields).length < 20 || FUNNEL_STAGES.some(s => !briefs[s].idea.trim() || !briefs[s].tone.trim())) { setError('Add a funnel set name, master intake answers, and an idea and tone for each campaign.'); return; } void work('Saving funnel set…', async () => { const data = await api('', { label, fields, stages: briefs }); setFunnelSets(prev => [data.project, ...prev]); setProject(data.project); setContributions([]); setLabel(''); setFields(emptyIntakeFields()); setBriefs(emptyStageBriefs()); try { localStorage.removeItem('funnel-project-draft'); } catch {} }); }}>Create funnel set →</button>
          </>}
          <button className="ml-4 text-sm underline" onClick={saveDraft}>Save setup draft in this browser</button>
        </fieldset> : <div className="space-y-6">
          <div><h2 className="text-2xl font-bold">{project.label}</h2><p className="mt-1 text-sm text-neutral-500">Base copy + individual ads = growing nurture pools. Copy is for planning; nothing is sent automatically.</p></div>
          <details className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"><summary className="cursor-pointer text-sm font-semibold">Master intake and funnel direction</summary><pre className="mt-3 whitespace-pre-wrap font-sans text-sm">{composeIntakeText(project.fields)}</pre>{FUNNEL_STAGES.map(s => <div key={s} className="mt-4 text-sm"><strong>{STAGE_LABELS[s]}</strong><p>{project.stages[s].idea}</p><p>Tone: {project.stages[s].tone}</p><p>Ad types: {project.stages[s].adTypes || 'Open to ideas'}</p></div>)}</details>
          <ScriptFrameworkSelector value={coldScript} onChange={setColdScript} audience="cold" disabled={!!busy} />
          <p className="text-xs text-neutral-500">Applies to new TOFU copy. MOFU and BOFU use warm HMSPC. Existing copy stays unchanged.</p>
          {!ready && <div className="rounded-xl border border-orange-300 p-5"><h3 className="font-semibold">Start with the full funnel foundation</h3><p className="my-2 text-sm">Generate a base ad, SMS and email copy for all three campaigns. Completed campaigns are preserved when you retry.</p><button disabled={!!busy} className={buttonClass} onClick={generateBase}>{contributions.length ? 'Finish base copy' : 'Generate initial funnel copy'}</button></div>}
          <div className="grid grid-cols-3 gap-2">{FUNNEL_STAGES.map(s => <button key={s} disabled={!!busy} onClick={() => { setStage(s); setIdea(''); setSelectedRunIds([]); setImportNotice(''); setAssignAdId(''); }} className={`rounded-xl border p-4 text-left ${stage === s ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-200 dark:border-neutral-800'}`}><strong>{STAGE_LABELS[s]}</strong><span className="mt-1 block text-xs text-neutral-500">{allAds.filter(a => a.funnelSetId === project.id && a.stage === s).length} ads · {contributions.some(c => c.stage === s && c.mode === 'base') ? 'Base ready' : 'Base pending'}</span></button>)}</div>
          <div><h3 className="font-semibold">{STAGE_LABELS[stage]}: {project.stages[stage].tone}</h3><p className="mt-1 text-sm text-neutral-500">{project.stages[stage].idea}</p></div>

          <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Ads in {STAGE_LABELS[stage]}</h3>
              <Link href={`/ads?assignTo=${project.id}:${stage}`} className="text-sm text-orange-600 underline">+ New ad in this campaign →</Link>
            </div>
            {adsInStage.length === 0 && <p className="mt-2 text-sm text-neutral-500">No ads assigned to {STAGE_LABELS[stage]} yet.</p>}
            <div className="mt-3 space-y-2">
              {adsInStage.map(ad => <div key={ad.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ad.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">{ad.adAngleNames.map((name, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${angleColor(name).badge}`}>{name}</span>)}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/ads?open=${ad.id}`} className="text-sm text-orange-600 underline">Open</Link>
                  <button disabled={assigning} onClick={() => unassignAd(ad.id)} className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300">Remove</button>
                </div>
              </div>)}
            </div>
            {unassignedAds.length > 0 && <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <label className="text-sm">Assign an existing ad from the pool
                <select className="mt-1 block rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={assignAdId} onChange={e => setAssignAdId(e.target.value)}>
                  <option value="">Select an ad…</option>
                  {unassignedAds.map(ad => <option key={ad.id} value={ad.id}>{ad.label}</option>)}
                </select>
              </label>
              <button disabled={!assignAdId || assigning} className={buttonClass} onClick={assignExistingAd}>{assigning ? 'Assigning…' : 'Assign'}</button>
            </div>}
          </section>

          <details className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
            <summary className="cursor-pointer font-semibold">Import a premade concept or ad&apos;s copy into {STAGE_LABELS[stage]}&apos;s nurture pool</summary>
            <fieldset disabled={!!busy} className="mt-4 space-y-3">
              <p className="text-sm text-neutral-500">Copy is preserved as supplied. Included SMS and emails join this campaign’s pools. Review imported copy for stage fit before use.</p>
              <div className="flex gap-3"><button aria-pressed={importKind === 'campaign'} className={importKind === 'campaign' ? 'font-semibold text-orange-600' : ''} onClick={() => setImportKind('campaign')}>Saved ad</button><button aria-pressed={importKind === 'paste'} className={importKind === 'paste' ? 'font-semibold text-orange-600' : ''} onClick={() => setImportKind('paste')}>Paste premade concept</button></div>
              {importKind === 'campaign' ? <>
                <button className="text-sm underline" onClick={() => work('Loading ads…', async () => { await loadAds(); if (!allAds.length) throw new Error('No saved ads yet. Use Paste premade concept to import your copy.'); })}>Load saved ads</button>
                {allAds.length > 0 && <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>{selectedRunIds.length} ads selected</span><button className="text-orange-600 underline" onClick={() => setSelectedRunIds(selectedRunIds.length === allAds.length ? [] : allAds.map(run => run.id))}>{selectedRunIds.length === allAds.length ? 'Clear selection' : 'Select all'}</button></div>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">{allAds.map(run => <label key={run.id} className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-orange-500/10"><input type="checkbox" className="mt-1" checked={selectedRunIds.includes(run.id)} onChange={e => setSelectedRunIds(prev => e.target.checked ? [...prev, run.id] : prev.filter(id => id !== run.id))} /><span className="text-sm">{run.label}<span className="block text-xs text-neutral-500">{run.kit.adSets.length} angles · {run.kit.sms.length} SMS · {run.kit.email.length} emails</span></span></label>)}</div>
                </div>}
                <p className="text-xs text-neutral-500">Imports all angles, SMS and emails from the ad’s current saved copy, including your edits. This copies the content into this campaign’s nurture pool — it does not move the ad itself (use the assign control above for that).</p>
              </> : <>
                {(['label', 'headline', 'primaryText', 'sms', 'subject', 'email'] as const).map(key => <label key={key} className="block text-sm">{{ label: 'Concept name', headline: 'Ad headline (optional)', primaryText: 'Premade ad / concept copy', sms: 'SMS copy (optional, one message per line)', subject: 'Email subject (optional)', email: 'Email body (optional)' }[key]}<textarea rows={key === 'primaryText' || key === 'email' ? 4 : 2} className={inputClass} value={importDraft[key]} onChange={e => setImportDraft({ ...importDraft, [key]: e.target.value })} /></label>)}
                <p className="text-xs text-neutral-500">Only supplied messages are added. Use Quick Idea or Pure Push above to develop additional nurture copy.</p>
              </>}
              <button className={buttonClass} disabled={!!busy || (importKind === 'campaign' ? selectedRunIds.length === 0 : !importDraft.label.trim() || !importDraft.primaryText.trim())} onClick={importCopy}>{importKind === 'campaign' ? `Import ${selectedRunIds.length} ad${selectedRunIds.length === 1 ? '' : 's'} into ${STAGE_LABELS[stage]}` : `Add concept to ${STAGE_LABELS[stage]}`}</button>
              {importNotice && <p role="status" className="text-sm text-green-700 dark:text-green-400">{importNotice}</p>}
            </fieldset>
          </details>
          {ready && <fieldset disabled={!!busy} className="space-y-3 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"><legend className="px-2 font-semibold">Add a nurture concept to {STAGE_LABELS[stage]}</legend><div className="flex gap-2">{(['quick', 'push'] as const).map(m => <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`rounded-lg border px-4 py-2 text-sm ${mode === m ? 'border-orange-500 text-orange-600' : 'border-neutral-300 dark:border-neutral-700'}`}>{m === 'quick' ? 'Quick Idea' : 'Pure Push'}</button>)}</div><p className="text-xs text-neutral-500">{mode === 'quick' ? 'Develop a rough idea using the master intake and this campaign’s direction.' : 'Execute your exact concept in the selected script framework.'} Each concept adds its own SMS and emails to this campaign’s pools.</p><label className="block text-sm">Idea<textarea className={inputClass} rows={4} value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe the next nurture concept you want to create…" /></label><button disabled={!!busy || idea.trim().length < 10} className={buttonClass} onClick={addConcept}>Generate concept + add to pools</button></fieldset>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800">
            <div className="flex gap-4">{(['ads', 'sms', 'email'] as const).map(t => <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`text-sm ${tab === t ? 'font-bold text-orange-600' : ''}`}>{{ ads: 'Concept copy', sms: 'SMS pool', email: 'Email pool' }[t]} ({counts[t]})</button>)}</div>
            {stageCopy.length > 0 && <div className="flex gap-3 text-xs">
              <button className="text-orange-600 underline" onClick={() => setExpandedEntries(new Set(stageCopy.map(e => e.id)))}>Expand all</button>
              <button className="text-orange-600 underline" onClick={() => setExpandedEntries(new Set())}>Condense all</button>
            </div>}
          </div>
          {stageCopy.length === 0 && <p className="text-sm text-neutral-500">Generate the foundation to start this campaign’s nurture pools.</p>}
          {stageCopy.map(entry => {
            const isOpen = expandedEntries.has(entry.id);
            const angles = entry.copy.adSets.map(ad => ad.angle).filter(Boolean);
            return <section key={entry.id} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <button type="button" onClick={() => toggleEntry(entry.id)} className="flex w-full items-center justify-between gap-3 p-5 text-left" aria-expanded={isOpen}>
                <div>
                  <h4 className="font-semibold">{entry.mode === 'base' ? `${STAGE_LABELS[stage]} foundation` : entry.idea}</h4>
                  <p className="mt-1 text-xs text-neutral-500">{entry.mode === 'base' ? 'Base intake' : entry.mode === 'push' ? 'Pure Push' : entry.mode === 'import' ? 'Imported copy' : 'Quick Idea'} · {new Date(entry.created_at).toLocaleString()} · {entry.copy.adSets.length} concept{entry.copy.adSets.length === 1 ? '' : 's'} · {entry.copy.sms.length} SMS · {entry.copy.email.length} email{entry.copy.email.length === 1 ? '' : 's'}</p>
                  {angles.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{angles.map((angle, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${angleColor(angle).badge}`}>{angle}</span>)}</div>}
                </div>
                <span className="shrink-0 text-neutral-400">{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
              </button>
              {isOpen && <div className="border-t border-neutral-200 p-5 dark:border-neutral-800">
                {tab === 'ads' && entry.copy.adSets.map((ad, i) => <div key={i} className={`mb-4 rounded-lg border-l-4 pl-3 last:mb-0 ${angleColor(ad.angle).border}`}>
                  <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${angleColor(ad.angle).badge}`}>{ad.angle}</span>
                  <CopyField label="Angle" value={ad.angle} accent={angleColor(ad.angle).dot} path={`adSets.${i}.angle`} onSave={(path, _label, v) => saveContributionField(entry.id, path, v)} />
                  <CopyField label="Primary text" value={ad.primaryText} accent={angleColor(ad.angle).dot} path={`adSets.${i}.primaryText`} onSave={(path, _label, v) => saveContributionField(entry.id, path, v)} />
                  <CopyField label="Headline" value={ad.headline} accent={angleColor(ad.angle).dot} path={`adSets.${i}.headline`} onSave={(path, _label, v) => saveContributionField(entry.id, path, v)} />
                  <CopyField label="Description" value={ad.description} accent={angleColor(ad.angle).dot} path={`adSets.${i}.description`} onSave={(path, _label, v) => saveContributionField(entry.id, path, v)} />
                  {scriptBeats(ad.videoScript, ad.scriptFramework).map(beat => <CopyField key={beat.key} label={beat.label} value={beat.value} accent={angleColor(ad.angle).dot} path={`adSets.${i}.videoScript.${beat.key}`} onSave={(path, _label, v) => saveContributionField(entry.id, path, v)} />)}
                </div>)}
                {tab === 'sms' && entry.copy.sms.map((sms, i) => <CopyField key={i} label={`SMS ${i + 1} · suggested day ${sms.day}`} value={sms.message} />)}
                {tab === 'email' && entry.copy.email.map((email, i) => <div key={i} className="mt-4"><CopyField label={`Email ${i + 1} · suggested day ${email.day} · subject`} value={email.subject} /><CopyField label="Body" value={email.body} /></div>)}
                {entry.copy.flags.length > 0 && <details className="mt-4 text-sm text-amber-700 dark:text-amber-400"><summary className="cursor-pointer">Review before use: {entry.copy.flags.length} flags</summary>{entry.copy.flags.map((f, i) => <p className="mt-2" key={i}><strong>{f.issue}:</strong> {f.detail} — {f.resolveBy}</p>)}</details>}
              </div>}
            </section>;
          })}
        </div>}
      </main>
    </div>
  </div>;
}
