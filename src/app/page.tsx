'use client';

import { ScriptFrameworkSelector } from '@/components/ScriptFrameworkSelector';
import { DEFAULT_SCRIPT_OPTIONS, type ScriptOptions } from '@/lib/scriptFrameworks';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { INTAKE_SECTIONS, emptyIntakeFields, composeIntakeText } from '@/lib/intakeFields';
import { FUNNEL_STAGES, STAGE_DESCRIPTIONS, STAGE_LABELS, emptyStageBriefs, type FunnelProject, type FunnelContribution, type FunnelPlacement, type FunnelStage } from '@/lib/funnels';
import type { SavedRun } from '@/lib/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { placeAd, setPlacementAngle, removePlacement } from '@/lib/storage';
import { FunnelPyramid } from '@/components/FunnelPyramid';
import { StageAdCard, AnglePicker, LevelCard } from '@/components/StageAdCard';
import { LandingPrompts } from '@/components/ProductionPrompts';

const inputClass = 'mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900';
const buttonClass = 'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50';
async function api(path: string, body?: unknown) {
  let res: Response;
  try {
    res = await fetch(`/api/funnels${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    // fetch only throws when the server can't be reached at all.
    throw new Error("Can't reach the app server. Is `npm run dev` running? Start it, then click Reload list.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed. Please retry.');
  return data;
}

type AddMode = 'existing' | 'new' | 'ai' | 'paste';
const ADD_MODES: { key: AddMode; label: string }[] = [
  { key: 'existing', label: 'Existing ad' },
  { key: 'new', label: 'New ad' },
  { key: 'ai', label: 'AI concept' },
  { key: 'paste', label: 'Paste my own' },
];
const KIND_LABELS: Record<FunnelContribution['mode'], string> = { base: 'Foundation', quick: 'AI concept · Quick Idea', push: 'AI concept · Pure Push', import: 'Pasted / imported copy' };

/** For older items that came in with every angle: pick the one to keep. */
function KeepOneAngle({ entry, onKeep, disabled }: { entry: FunnelContribution; onKeep: (index: number) => void; disabled?: boolean }) {
  const [choice, setChoice] = useState<number | null>(null);
  return <>
    <span>This has {entry.copy.adSets.length} angles. Keep only one:</span>
    <select disabled={disabled} value={choice ?? ''} onChange={e => setChoice(Number(e.target.value))} className="rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
      <option value="" disabled>Choose the angle…</option>
      {entry.copy.adSets.map((set, i) => <option key={i} value={i}>{set.angle || `Angle ${i + 1}`}</option>)}
    </select>
    <button disabled={disabled || choice === null} onClick={() => choice !== null && onKeep(choice)} className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">Keep this angle, remove the rest</button>
  </>;
}

export default function Home() {
  const [coldScript, setColdScript] = useState<ScriptOptions>(DEFAULT_SCRIPT_OPTIONS);
  const [funnelSets, setFunnelSets] = useState<FunnelProject[]>([]);
  const [project, setProject] = useState<FunnelProject | null>(null);
  const [contributions, setContributions] = useState<FunnelContribution[]>([]);
  const [placements, setPlacements] = useState<FunnelPlacement[]>([]);
  const [quickName, setQuickName] = useState('');
  // The full intake wizard is optional; a funnel can start from just a name.
  const [fullSetup, setFullSetup] = useState(false);
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState(emptyIntakeFields);
  const [briefs, setBriefs] = useState(emptyStageBriefs);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<FunnelStage>('TOFO');
  const [mode, setMode] = useState<'quick' | 'push'>('quick');
  const [idea, setIdea] = useState('');
  // Which way of adding to the open level is showing (null = panel closed).
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const [allAds, setAllAds] = useState<SavedRun[]>([]);
  const [assignAdId, setAssignAdId] = useState('');
  const [assignAngle, setAssignAngle] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [importNotice, setImportNotice] = useState('');
  const [importDraft, setImportDraft] = useState({ label: '', headline: '', primaryText: '', sms: '', subject: '', email: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const pending = useRef<{ key: string; id: string } | null>(null);
  const stageDetailRef = useRef<HTMLDivElement>(null);

  async function work(message: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(message); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please retry.'); }
    finally { lock.current = false; setBusy(''); }
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
      setProject(data.project); setContributions(data.contributions); setPlacements(data.placements ?? []); setIdea(''); setStage('TOFO'); setAddMode(null); setImportNotice(''); setAssignAdId(''); setAssignAngle(null);
    });
  }
  function mergeContribution(entry: FunnelContribution) {
    setContributions(prev => prev.some(e => e.id === entry.id) ? prev : [...prev, entry]);
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
  async function keepOneAngle(entry: FunnelContribution, angleIndex: number) {
    if (!project) return;
    await work('Keeping one angle…', async () => {
      const res = await fetch(`/api/funnels/${project.id}/contributions/${entry.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keepAngleIndex: angleIndex }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not trim that item to one angle.');
      setContributions(prev => prev.map(c => (c.id === entry.id ? { ...c, copy: data.contribution.copy } : c)));
    });
  }
  async function deleteContribution(entry: FunnelContribution) {
    if (!project) return;
    await work('Deleting…', async () => {
      const res = await fetch(`/api/funnels/${project.id}/contributions/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete that item.');
      setContributions(prev => prev.filter(c => c.id !== entry.id));
    });
  }
  async function assignExistingAd() {
    if (!project || !assignAdId) return;
    setAssigning(true);
    try {
      const placed = await placeAd(project.id, assignAdId, stage, assignAngle);
      setPlacements(prev => [...prev, placed]);
      const ad = allAds.find(a => a.id === assignAdId);
      const angleName = assignAngle !== null ? ad?.kit.adSets[assignAngle]?.angle : undefined;
      // Keep the ad selected so another of its angles can be added right away.
      setAssignAngle(null);
      setImportNotice(`Added ${angleName ? `“${angleName}”` : 'the ad'} to ${STAGE_LABELS[stage]}.${ad && ad.kit.adSets.length > 1 ? ' Pick another angle to add it too.' : ''}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add that ad.'); }
    finally { setAssigning(false); }
  }
  async function changeAdAngle(p: FunnelPlacement, angleIndex: number) {
    setAssigning(true);
    try {
      const updated = await setPlacementAngle(p, angleIndex);
      setPlacements(prev => prev.map(x => (x.id === updated.id ? updated : x)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save that angle.'); }
    finally { setAssigning(false); }
  }
  async function unplaceAd(p: FunnelPlacement) {
    setAssigning(true);
    try {
      await removePlacement(p);
      setPlacements(prev => prev.filter(x => x.id !== p.id));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove that ad.'); }
    finally { setAssigning(false); }
  }
  async function createQuickFunnel() {
    const name = quickName.trim();
    if (!name) return;
    await work('Creating funnel…', async () => {
      const data = await api('', { label: name, fields: {}, stages: emptyStageBriefs() });
      setFunnelSets(prev => [data.project, ...prev]);
      setProject(data.project); setContributions([]); setPlacements([]); setQuickName('');
      setStage('TOFO'); setAddMode('existing'); setImportNotice(''); setAssignAdId(''); setAssignAngle(null);
    });
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
      mergeContribution(data.contribution); setIdea(''); setAddMode(null); pending.current = null;
    });
  }
  async function importCopy() {
    if (!project) return;
    setImportNotice('');
    await work(`Importing into ${STAGE_LABELS[stage]}…`, async () => {
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
      setImportNotice(`Added to ${STAGE_LABELS[stage]}. Paste another to keep going.`);
    });
  }
  const ready = FUNNEL_STAGES.every(s => contributions.some(c => c.stage === s && c.mode === 'base'));
  const stageCopy = contributions.filter(c => c.stage === stage).sort((a, b) => Number(b.mode === 'base') - Number(a.mode === 'base'));
  const adById = new Map(allAds.map(a => [a.id, a]));
  // Placements whose ad still exists (a deleted ad cascades, but the list may be stale).
  const placedInStage = placements.filter(p => p.stage === stage && adById.has(p.run_id)).map(p => ({ placement: p, ad: adById.get(p.run_id) as SavedRun }));
  // Everything in a level — placed ad angles plus its copy — for the pyramid's counts.
  const levelCounts = Object.fromEntries(FUNNEL_STAGES.map(s => [s,
    placements.filter(p => p.stage === s && adById.has(p.run_id)).length + contributions.filter(c => c.stage === s).length,
  ])) as Record<FunnelStage, number>;
  /** Older "import saved ad" copies duplicate an ad that's also placed in this level. */
  const duplicateOf = (entry: FunnelContribution) => entry.mode === 'import' ? placedInStage.map(x => x.ad).find(ad => entry.idea.startsWith(`Imported campaign: ${ad.label}`)) : undefined;
  const hasIntake = project ? Object.values(project.fields ?? {}).some(v => typeof v === 'string' && v.trim()) : false;
  const takenAngles = placedInStage.filter(x => x.ad.id === assignAdId).map(x => x.placement.angle_index).filter((i): i is number => i !== null);
  function openStage(s: FunnelStage) {
    setStage(s); setIdea(''); setAddMode(null); setImportNotice(''); setAssignAdId(''); setAssignAngle(null);
    requestAnimationFrame(() => stageDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
      <h1 className="text-xl font-bold">Funnel Sets</h1><Link href="/scripts" className="ml-auto text-sm text-orange-600">Write & polish a script →</Link><div className="w-40"><ThemeToggle /></div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[240px_1fr] md:p-6">
      <aside className="space-y-3">
        <button className={`${buttonClass} w-full`} disabled={!!busy} onClick={() => { setProject(null); setContributions([]); setPlacements([]); setStep(0); setFullSetup(false); setError(''); }}>+ New funnel set</button>
        <p className="text-xs text-neutral-500">Saved funnel sets</p>
        {funnelSets.map(p => <button key={p.id} disabled={!!busy} onClick={() => openProject(p.id)} className={`block w-full rounded-lg border p-3 text-left text-sm ${project?.id === p.id ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-200 dark:border-neutral-800'}`}>{p.label}</button>)}
      </aside>
      <main className="min-w-0">
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-400 p-3 text-sm text-red-600">{error}<button className="ml-3 underline" disabled={!!busy} onClick={() => work('Reloading funnel sets…', async () => { setFunnelSets((await api('')).projects); })}>Reload list</button></div>}
        {busy && <p role="status" className="mb-4 rounded-lg bg-orange-500/10 p-3 text-sm">{busy} This may take a minute. Keep this page open.</p>}
        {!project ? <div className="space-y-6">
          <section className="space-y-3 rounded-xl border border-orange-300 bg-orange-500/5 p-5">
            <h2 className="text-2xl font-bold">New funnel</h2>
            <p className="text-sm text-neutral-500">Just name it. Then add ads — any angle of any ad — into TOFU, MOFU and BOFU.</p>
            <div className="flex flex-wrap gap-3">
              <input className={`${inputClass} mt-0 max-w-md flex-1`} value={quickName} onChange={e => setQuickName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void createQuickFunnel(); }} placeholder="e.g. New authority — fall push" />
              <button className={buttonClass} disabled={!!busy || !quickName.trim()} onClick={createQuickFunnel}>Create funnel →</button>
            </div>
          </section>
          <button className="text-sm text-orange-600 underline" onClick={() => setFullSetup(v => !v)}>{fullSetup ? 'Hide the full intake setup' : 'Or set it up with the full intake (needed for AI-generated funnel copy)'}</button>
          {fullSetup && <fieldset disabled={!!busy} className="space-y-6">
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
        </fieldset>}
        </div> : <div className="space-y-6">
          <div><h2 className="text-2xl font-bold">{project.label}</h2><p className="mt-1 text-sm text-neutral-500">Base copy + individual ads = growing nurture pools. Copy is for planning; nothing is sent automatically.</p></div>
          {hasIntake && <details className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"><summary className="cursor-pointer text-sm font-semibold">Master intake and funnel direction</summary><pre className="mt-3 whitespace-pre-wrap font-sans text-sm">{composeIntakeText(project.fields)}</pre>{FUNNEL_STAGES.map(s => <div key={s} className="mt-4 text-sm"><strong>{STAGE_LABELS[s]}</strong><p>{project.stages[s].idea}</p><p>Tone: {project.stages[s].tone}</p><p>Ad types: {project.stages[s].adTypes || 'Open to ideas'}</p></div>)}</details>}
          <FunnelPyramid counts={levelCounts} selected={stage} onSelect={openStage} disabled={!!busy} />

          <div ref={stageDetailRef} className="flex scroll-mt-4 flex-wrap items-end justify-between gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Open level</p>
              <h3 className="text-xl font-bold">{STAGE_LABELS[stage]} · {levelCounts[stage]} item{levelCounts[stage] === 1 ? '' : 's'}</h3>
              {(project.stages[stage].tone || project.stages[stage].idea) && <p className="text-sm text-neutral-500">{[project.stages[stage].tone, project.stages[stage].idea].filter(Boolean).join(' — ')}</p>}
            </div>
            <button disabled={!!busy} className={buttonClass} onClick={() => { setAddMode(m => (m ? null : 'existing')); setImportNotice(''); }}>{addMode ? 'Close' : `+ Add to ${STAGE_LABELS[stage]}`}</button>
          </div>

          {hasIntake && !ready && <div className="space-y-3 rounded-xl border border-orange-300 p-5">
            <h3 className="font-semibold">Start with the full funnel foundation</h3>
            <p className="text-sm">Generates a base ad, SMS and email for all three levels. Levels that already have one are kept when you retry.</p>
            <ScriptFrameworkSelector value={coldScript} onChange={setColdScript} audience="cold" disabled={!!busy} />
            <p className="text-xs text-neutral-500">The script framework applies to TOFU. MOFU and BOFU use warm HMSPC.</p>
            <button disabled={!!busy} className={buttonClass} onClick={generateBase}>{contributions.length ? 'Finish foundation' : 'Generate foundation'}</button>
          </div>}

          {addMode && <fieldset disabled={!!busy} className="space-y-4 rounded-xl border border-orange-300 bg-orange-500/5 p-5">
            <legend className="px-2 font-semibold">Add to {STAGE_LABELS[stage]}</legend>
            <div className="flex flex-wrap gap-2" role="tablist">{ADD_MODES.map(m => <button key={m.key} role="tab" aria-selected={addMode === m.key} onClick={() => { setAddMode(m.key); setImportNotice(''); }} className={`rounded-lg border px-4 py-2 text-sm ${addMode === m.key ? 'border-orange-500 bg-white font-semibold text-orange-700 dark:bg-neutral-900 dark:text-orange-300' : 'border-neutral-300 dark:border-neutral-700'}`}>{m.label}</button>)}</div>

            {addMode === 'existing' && (allAds.length === 0
              ? <p className="text-sm text-neutral-500">No saved ads yet. Choose <strong>New ad</strong> to build one.</p>
              : <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">Ad from Ad Sets
                  <select className="mt-1 block rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" value={assignAdId} onChange={e => { const ad = allAds.find(a => a.id === e.target.value); setAssignAdId(e.target.value); setAssignAngle(ad && ad.kit.adSets.length === 1 ? 0 : null); }}>
                    <option value="">Select an ad…</option>
                    {allAds.map(ad => <option key={ad.id} value={ad.id}>{ad.label} ({ad.kit.adSets.length} angle{ad.kit.adSets.length === 1 ? '' : 's'})</option>)}
                  </select>
                </label>
                {(() => { const ad = allAds.find(a => a.id === assignAdId); return ad && ad.kit.adSets.length > 1 && <label className="text-sm">Angle to use<AnglePicker ad={ad} value={assignAngle} onChange={setAssignAngle} taken={takenAngles} className="mt-1 block" /></label>; })()}
                <button disabled={!assignAdId || assignAngle === null || assigning} className={buttonClass} onClick={assignExistingAd}>{assigning ? 'Adding…' : `Add to ${STAGE_LABELS[stage]}`}</button>
              </div>)}

            {addMode === 'new' && <div className="space-y-3">
              <p className="text-sm">Build a brand-new ad in Ad Sets. When it&apos;s generated it lands straight in {STAGE_LABELS[stage]}, and you pick its angle here.</p>
              <Link href={`/ads?assignTo=${project.id}:${stage}`} className={`${buttonClass} inline-block`}>Open the ad builder →</Link>
            </div>}

            {addMode === 'ai' && (!hasIntake
              ? <p className="text-sm text-neutral-500">AI concepts write from the master intake, and this funnel was made without one. Use <strong>Existing ad</strong> to pull in angles from your saved ads.</p>
              : !ready
              ? <p className="text-sm text-neutral-500">Generate the foundation above first — AI concepts build on it.</p>
              : <div className="space-y-3">
                <div className="flex gap-2">{(['quick', 'push'] as const).map(m => <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`rounded-lg border px-4 py-2 text-sm ${mode === m ? 'border-orange-500 text-orange-600' : 'border-neutral-300 dark:border-neutral-700'}`}>{m === 'quick' ? 'Quick Idea' : 'Pure Push'}</button>)}</div>
                <p className="text-xs text-neutral-500">{mode === 'quick' ? 'Develops a rough idea using the master intake and this level’s direction.' : 'Executes your exact concept.'} Comes with its own SMS and emails.</p>
                {stage === 'TOFO' && <ScriptFrameworkSelector value={coldScript} onChange={setColdScript} audience="cold" disabled={!!busy} />}
                <label className="block text-sm">Idea<textarea className={inputClass} rows={4} value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe the concept you want to create…" /></label>
                <button disabled={!!busy || idea.trim().length < 10} className={buttonClass} onClick={addConcept}>Generate + add to {STAGE_LABELS[stage]}</button>
              </div>)}

            {addMode === 'paste' && <div className="space-y-3">
              {(['label', 'headline', 'primaryText', 'sms', 'subject', 'email'] as const).map(key => <label key={key} className="block text-sm">{{ label: 'Name', headline: 'Ad headline (optional)', primaryText: 'Ad copy', sms: 'SMS (optional, one message per line)', subject: 'Email subject (optional)', email: 'Email body (optional)' }[key]}<textarea rows={key === 'primaryText' || key === 'email' ? 4 : key === 'label' ? 1 : 2} className={inputClass} value={importDraft[key]} onChange={e => setImportDraft({ ...importDraft, [key]: e.target.value })} /></label>)}
              <button className={buttonClass} disabled={!!busy || !importDraft.label.trim() || !importDraft.primaryText.trim()} onClick={importCopy}>Add to {STAGE_LABELS[stage]}</button>
            </div>}
            {importNotice && <p role="status" className="text-sm text-green-700 dark:text-green-400">{importNotice}</p>}
          </fieldset>}

          <LandingPrompts funnelSetId={project.id} stage={stage} adCount={levelCounts[stage]} />

          <div className="space-y-2">
            {levelCounts[stage] === 0 && <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">Nothing in {STAGE_LABELS[stage]} yet. Use <strong>+ Add to {STAGE_LABELS[stage]}</strong> to put an ad here.</p>}
            {placedInStage.map(({ placement, ad }) => <StageAdCard key={placement.id} ad={ad} placement={placement} removing={assigning} onRemove={() => unplaceAd(placement)} onChangeAngle={i => changeAdAngle(placement, i)} />)}
            {stageCopy.map(entry => {
              const dup = duplicateOf(entry);
              return <LevelCard
                key={entry.id}
                title={entry.mode === 'base' ? `${STAGE_LABELS[stage]} foundation` : entry.idea}
                kind={`${KIND_LABELS[entry.mode]} · ${new Date(entry.created_at).toLocaleDateString()}`}
                adSets={entry.copy.adSets}
                email={entry.copy.email}
                sms={entry.copy.sms}
                flags={entry.copy.flags}
                onSaveAdField={(path, v) => saveContributionField(entry.id, path, v)}
                pictureOwner={{ contributionId: entry.id }}
                notice={dup ? <span>This is an older copy of “{dup.label}”, which is already in this level as an ad. Use Delete to remove the duplicate.</span>
                  : entry.copy.adSets.length > 1 && <KeepOneAngle entry={entry} disabled={!!busy} onKeep={i => keepOneAngle(entry, i)} />}
                onDelete={() => deleteContribution(entry)}
                deleteDisabled={!!busy}
              />;
            })}
          </div>
        </div>}
      </main>
    </div>
  </div>;
}
