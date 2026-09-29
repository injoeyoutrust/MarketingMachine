"use client";

import { useEffect, useState } from "react";
import { ScriptFrameworkSelector } from "@/components/ScriptFrameworkSelector";
import { DEFAULT_SCRIPT_OPTIONS, validScriptOptions, type ScriptOptions } from "@/lib/scriptFrameworks";
import { Sidebar } from "@/components/Sidebar";
import { IntakeForm, type IntakeMode } from "@/components/IntakeForm";
import { StyleSelector } from "@/components/StyleSelector";
import { StyleLibrary } from "@/components/StyleLibrary";
import { AdIdeas, type AdIdea } from "@/components/AdIdeas";
import { ResultsTabs } from "@/components/ResultsTabs";
import { OriginalEntryModal } from "@/components/OriginalEntryModal";
import { EditLedgerModal } from "@/components/EditLedgerModal";
import { AnglePicker } from "@/components/StageAdCard";
import { loadRuns, saveRun, deleteRun, editRunField, placeAd, removePlacement } from "@/lib/storage";
import { loadStyles } from "@/lib/styleStorage";
import {
  emptyIntakeFields,
  composeIntakeText,
  composeQuickIdeaText,
  composePurePushText,
  purePushAngleName,
  QUICK_IDEA_KEY,
  PURE_PUSH_KEY,
  ANGLE_EMOTIONS_KEY,
  encodeAngleEmotions,
  decodeAngleEmotions,
  type IntakeFields,
} from "@/lib/intakeFields";
import type { SavedRun, CampaignKit } from "@/lib/types";
import { stripEmotionPoints, getEmotionDevelopmentRank, type Style } from "@/lib/styleLibrary";
import { FUNNEL_STAGES, STAGE_LABELS, type FunnelPlacement, type FunnelProject, type FunnelStage } from "@/lib/funnels";

const DEFAULT_ANGLE_IDS = [
  "identity-mirror",
  "failed-alternative-mirror",
  "myth-buster",
  "cost-of-inaction",
];
const DEFAULT_FUNNEL_ID = "optin-vsl-personal-call";
const DEFAULT_VSL_ID = "personal-call-frame";
const DEFAULT_EMOTION_ID = "emotion-fear";

/** Bakes a single assigned emotional tone into an angle's brief so the
 * whole ad set (hook/mirror/shift/proof/cta) gets written from within that
 * one state — no backend changes needed, the pipeline already treats each
 * angle's description as its writing instructions. */
function withEmotion(angle: Style, emotion: Style | undefined): Style {
  if (!emotion) return angle;
  return {
    ...angle,
    description: `${angle.description}\n\nAssigned emotional tone — ${emotion.name}: ${emotion.description}\nWrite this entire ad — hook, mirror, shift, proof, cta — from within this one emotional state throughout. Do not blend in other emotional registers.`,
    examples: [...angle.examples, ...emotion.examples],
  };
}

function angleEmotionEntries(
  run: SavedRun,
  styles: Style[]
): { angleName: string; emotionName: string; rank: number }[] {
  const map = decodeAngleEmotions(run.fields[ANGLE_EMOTIONS_KEY]);
  return Object.entries(map)
    .map(([angleId, emotionId]) => {
      // The pure-push angle is synthesized on the fly and never saved to
      // the style catalog, so it won't be found by id — fall back to the
      // run's recorded angle name (there's only ever one for a push run).
      const angleName = angleId === "pure-push" ? run.adAngleNames[0] : styles.find((s) => s.id === angleId)?.name;
      const emotion = styles.find((s) => s.id === emotionId);
      if (!angleName || !emotion) return null;
      return {
        angleName,
        emotionName: stripEmotionPoints(emotion.name),
        rank: getEmotionDevelopmentRank(emotion.id),
      };
    })
    .filter((e): e is { angleName: string; emotionName: string; rank: number } => Boolean(e));
}

/** Angle name -> {emotion display name, ascending development rank}, for badges and emotional-order sorting. */
function angleEmotionsByName(run: SavedRun, styles: Style[]): Record<string, { label: string; rank: number }> {
  return Object.fromEntries(
    angleEmotionEntries(run, styles).map((e) => [e.angleName, { label: e.emotionName, rank: e.rank }])
  );
}

/** "Identity mirror (Fear) · Cost of inaction (no tone)" for a run's header — every angle shown, tone or not. */
function describeAngleEmotions(run: SavedRun, styles: Style[]): string[] {
  const byName = angleEmotionsByName(run, styles);
  return run.adAngleNames.map((name) => (byName[name] ? `${name} (${byName[name].label})` : name));
}

type Panel = "runs" | "library" | "ideas";
type Stage = "form" | "styles";

export default function AdsPage() {
  const [scriptOptions, setScriptOptions] = useState<ScriptOptions>(DEFAULT_SCRIPT_OPTIONS);
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [funnelSets, setFunnelSets] = useState<FunnelProject[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("runs");
  const [stage, setStage] = useState<Stage>("form");
  const [showOriginalEntry, setShowOriginalEntry] = useState(false);
  const [showEditLedger, setShowEditLedger] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ funnelSetId: string; stage: FunnelStage; angleIndex: number | null } | null>(null);
  const [pendingAssign, setPendingAssign] = useState<{ funnelSetId: string; stage: FunnelStage } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const assignTo = new URLSearchParams(window.location.search).get("assignTo");
      if (!assignTo) return null;
      const [funnelSetId, stageCode] = assignTo.split(":");
      return funnelSetId && FUNNEL_STAGES.includes(stageCode as FunnelStage) ? { funnelSetId, stage: stageCode as FunnelStage } : null;
    } catch { return null; }
  });
  const [assigning, setAssigning] = useState(false);
  // Funnel levels the open ad is placed in, tagged with the ad they were loaded for.
  const [placementsFor, setPlacementsFor] = useState<{ runId: string; list: FunnelPlacement[] } | null>(null);

  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<IntakeMode>("quick");
  const [quickIdea, setQuickIdea] = useState("");
  const [purePushIdea, setPurePushIdea] = useState("");
  const [fields, setFields] = useState<IntakeFields>(() => emptyIntakeFields());
  const [selectedAngleIds, setSelectedAngleIds] = useState<string[]>(DEFAULT_ANGLE_IDS);
  const [angleEmotionIds, setAngleEmotionIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(DEFAULT_ANGLE_IDS.map((id) => [id, DEFAULT_EMOTION_ID]))
  );
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(DEFAULT_FUNNEL_ID);
  const [selectedVslId, setSelectedVslId] = useState<string | null>(DEFAULT_VSL_ID);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data now lives in Supabase, so the initial load is a network round trip
  // rather than a synchronous localStorage read — must happen post-mount.
  useEffect(() => {
    Promise.all([loadRuns(), loadStyles(), fetch("/api/funnels").then((r) => r.json())]).then(([r, s, f]) => {
      setRuns(r);
      setStyles(s);
      setFunnelSets(Array.isArray(f.projects) ? f.projects : []);
      setInitializing(false);
      try {
        const params = new URLSearchParams(window.location.search);
        const openId = params.get("open");
        if (openId && r.some((run: SavedRun) => run.id === openId)) { setPanel("runs"); setActiveId(openId); }
      } catch { /* no query params to read */ }
    });
  }, []);

  const activeRun = runs.find((r) => r.id === activeId) ?? null;
  const activePlacements = placementsFor && placementsFor.runId === activeId ? placementsFor.list : [];

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetch(`/api/runs/${activeId}/placements`)
      .then((res) => (res.ok ? res.json() : { placements: [] }))
      .then((data) => { if (!cancelled) setPlacementsFor({ runId: activeId, list: data.placements ?? [] }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeId]);

  async function refreshStyles() {
    setStyles(await loadStyles());
  }

  function handleNew() {
    setScriptOptions(DEFAULT_SCRIPT_OPTIONS);
    setPanel("runs");
    setActiveId(null);
    setStage("form");
    setLabel("");
    setMode("quick");
    setQuickIdea("");
    setPurePushIdea("");
    setFields(emptyIntakeFields());
    setSelectedAngleIds(DEFAULT_ANGLE_IDS);
    setAngleEmotionIds(Object.fromEntries(DEFAULT_ANGLE_IDS.map((id) => [id, DEFAULT_EMOTION_ID])));
    setShowOriginalEntry(false);
    setShowEditLedger(false);
    setError(null);
  }

  function handleSelect(id: string) {
    setPanel("runs");
    setActiveId(id);
    setShowOriginalEntry(false);
    setShowEditLedger(false);
    setError(null);
  }

  function handleOpenIdeas() {
    setPanel("ideas");
    setActiveId(null);
  }

  /** Starts a new Quick Idea ad pre-filled from a saved idea. */
  function handleBuildFromIdea(idea: AdIdea) {
    handleNew();
    setMode("quick");
    setQuickIdea(idea.note ? `${idea.text}\n\n${idea.note}` : idea.text);
    setLabel(idea.text.length > 60 ? `${idea.text.slice(0, 57).trimEnd()}…` : idea.text);
  }

  function handleOpenLibrary() {
    setPanel("library");
    setActiveId(null);
  }

  function handleEditIntake(run: SavedRun) {
    const savedOptions = run.kit.adSets[0]?.scriptOptions;
    setScriptOptions(validScriptOptions(savedOptions) ? savedOptions : { ...DEFAULT_SCRIPT_OPTIONS, framework: "hmspc" });
    setPanel("runs");
    setActiveId(null);
    setStage("form");
    setLabel(run.label);
    if (run.fields[PURE_PUSH_KEY]) {
      setMode("push");
      setPurePushIdea(run.fields[PURE_PUSH_KEY]);
      setQuickIdea("");
      setFields(emptyIntakeFields());
    } else if (run.fields[QUICK_IDEA_KEY]) {
      setMode("quick");
      setQuickIdea(run.fields[QUICK_IDEA_KEY]);
      setPurePushIdea("");
      setFields(emptyIntakeFields());
    } else {
      setMode("full");
      setQuickIdea("");
      setPurePushIdea("");
      setFields({ ...emptyIntakeFields(), ...run.fields });
    }
    const matchedAngleIds = styles
      .filter((s) => s.category === "adAngle" && run.adAngleNames.includes(s.name))
      .map((s) => s.id);
    if (matchedAngleIds.length > 0) setSelectedAngleIds(matchedAngleIds);
    setAngleEmotionIds(decodeAngleEmotions(run.fields[ANGLE_EMOTIONS_KEY]));
    const matchedFunnel = styles.find((s) => s.category === "funnelStyle" && s.name === run.funnelStyleName);
    if (matchedFunnel) setSelectedFunnelId(matchedFunnel.id);
    const matchedVsl = styles.find((s) => s.category === "vslStyle" && s.name === run.vslStyleName);
    if (matchedVsl) setSelectedVslId(matchedVsl.id);
    setError(null);
  }

  function handleFieldChange(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDelete(id: string) {
    await deleteRun(id);
    setRuns(await loadRuns());
    if (activeId === id) handleNew();
  }

  async function handleFieldEdit(path: string, fieldLabel: string, newValue: string | string[]) {
    if (!activeId) return;
    const updated = await editRunField(activeId, path, fieldLabel, newValue);
    if (!updated) {
      setError("Couldn't save that edit — check the Supabase connection and try again.");
      return;
    }
    setRuns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function handleAddToFunnel() {
    if (!activeId || !assignTarget?.funnelSetId) return;
    setAssigning(true);
    try {
      const placed = await placeAd(assignTarget.funnelSetId, activeId, assignTarget.stage, assignTarget.angleIndex);
      setPlacementsFor((prev) => ({ runId: activeId, list: [...(prev?.runId === activeId ? prev.list : []), placed] }));
      // Stay open so another angle can go in straight away.
      setAssignTarget({ ...assignTarget, angleIndex: activeRun && activeRun.kit.adSets.length === 1 ? 0 : null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that ad to the funnel.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemovePlacement(p: FunnelPlacement) {
    setAssigning(true);
    try {
      await removePlacement(p);
      setPlacementsFor((prev) => (prev ? { ...prev, list: prev.list.filter((x) => x.id !== p.id) } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove that.");
    } finally {
      setAssigning(false);
    }
  }

  function toggleAngle(id: string) {
    setSelectedAngleIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
    setAngleEmotionIds((prev) => (prev[id] ? prev : { ...prev, [id]: DEFAULT_EMOTION_ID }));
  }

  function setAngleEmotion(angleId: string, emotionId: string) {
    setAngleEmotionIds((prev) => {
      if (!emotionId) {
        const next = { ...prev };
        delete next[angleId];
        return next;
      }
      return { ...prev, [angleId]: emotionId };
    });
  }

  function handleContinueToStyles() {
    setError(null);
    setStage("styles");
  }

  async function runGenerate(params: {
    intake: string;
    savedFields: IntakeFields;
    adAngles: Style[];
    funnelStyle: Style;
    vslStyle: Style;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: params.intake,
          scriptOptions,
          adAngles: params.adAngles,
          funnelStyle: params.funnelStyle,
          vslStyle: params.vslStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong generating the ad.");
        return;
      }

      const kit = data.kit as CampaignKit;
      const saved = await saveRun({
        label: label.trim() || "Untitled ad",
        intake: params.intake,
        fields: params.savedFields,
        adAngleNames: params.adAngles.map((a) => a.name),
        funnelStyleName: params.funnelStyle.name,
        vslStyleName: params.vslStyle.name,
        kit,
      });
      if (!saved) {
        setError("Ad was generated but couldn't be saved. Check the Supabase connection.");
        return;
      }
      if (pendingAssign) {
        // Angle is left unset — the funnel level card asks for it.
        await placeAd(pendingAssign.funnelSetId, saved.id, pendingAssign.stage, saved.kit.adSets.length === 1 ? 0 : null).catch(() =>
          setError("Ad was saved, but couldn't be added to the funnel. Add it from the Funnels page.")
        );
        setPendingAssign(null);
      }
      setRuns(await loadRuns());
      setActiveId(saved.id);
      setStage("form");
    } catch {
      setError("Network error reaching the server. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (mode === "quick" && quickIdea.trim().length < 10) {
      setError("Give it a bit more than that — a sentence or two is enough.");
      return;
    }
    if (selectedAngleIds.length === 0) {
      setError("Select at least one ad angle.");
      return;
    }
    if (!selectedFunnelId) {
      setError("Select a funnel style.");
      return;
    }
    if (!selectedVslId) {
      setError("Select a VSL style.");
      return;
    }

    const intake = mode === "quick" ? composeQuickIdeaText(quickIdea) : composeIntakeText(fields);
    const rawAngles = selectedAngleIds
      .map((id) => styles.find((s) => s.id === id))
      .filter((s): s is Style => Boolean(s));
    const adAngles = rawAngles.map((angle) =>
      withEmotion(angle, styles.find((s) => s.id === angleEmotionIds[angle.id]))
    );
    const funnelStyle = styles.find((s) => s.id === selectedFunnelId);
    const vslStyle = styles.find((s) => s.id === selectedVslId);
    if (!funnelStyle || !vslStyle) {
      setError("Couldn't find the selected funnel/VSL style. Try picking it again.");
      return;
    }

    const usedAngleEmotions = Object.fromEntries(
      selectedAngleIds.filter((id) => angleEmotionIds[id]).map((id) => [id, angleEmotionIds[id]])
    );
    const savedFields: IntakeFields =
      mode === "quick"
        ? { [QUICK_IDEA_KEY]: quickIdea.trim(), [ANGLE_EMOTIONS_KEY]: encodeAngleEmotions(usedAngleEmotions) }
        : { ...fields, [ANGLE_EMOTIONS_KEY]: encodeAngleEmotions(usedAngleEmotions) };

    await runGenerate({ intake, savedFields, adAngles, funnelStyle, vslStyle });
  }

  async function handlePurePush() {
    if (purePushIdea.trim().length < 10) {
      setError("Give it a bit more than that — write out the actual concept.");
      return;
    }

    const defaultFunnel = styles.find((s) => s.id === DEFAULT_FUNNEL_ID);
    const defaultVsl = styles.find((s) => s.id === DEFAULT_VSL_ID);
    if (!defaultFunnel || !defaultVsl) {
      setError("Default funnel/VSL styles are missing from the library. Check the Style library.");
      return;
    }

    const idea = purePushIdea.trim();
    const rawAngle: Style = {
      id: "pure-push",
      category: "adAngle",
      name: purePushAngleName(idea),
      description: idea,
      builtIn: false,
      examples: [],
    };
    const purePushEmotion = styles.find((s) => s.id === angleEmotionIds["pure-push"]);
    const customAngle = withEmotion(rawAngle, purePushEmotion);

    const savedFields: IntakeFields = { [PURE_PUSH_KEY]: idea };
    if (purePushEmotion) {
      savedFields[ANGLE_EMOTIONS_KEY] = encodeAngleEmotions({ "pure-push": purePushEmotion.id });
    }

    await runGenerate({
      intake: composePurePushText(idea),
      savedFields,
      adAngles: [customAngle],
      funnelStyle: defaultFunnel,
      vslStyle: defaultVsl,
    });
  }

  if (initializing) {
    return (
      <div className="flex h-[calc(100dvh-var(--topnav-h))] items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-var(--topnav-h))] bg-white dark:bg-neutral-950">
      <Sidebar
        runs={runs}
        activeId={activeId}
        panel={panel}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onOpenLibrary={handleOpenLibrary}
        onOpenIdeas={handleOpenIdeas}
      />
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Ad Pool</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Build an ad here, on its own. Assign it into a funnel set&apos;s TOFU/MOFU/BOFU campaign whenever you&apos;re ready — or leave it in the pool.
          </p>
        </header>
        <div className="p-6">
          {pendingAssign && !activeRun && (
            <p className="mx-auto mb-4 max-w-5xl rounded-lg border border-orange-300 bg-orange-500/10 p-3 text-sm">
              The next ad you generate will be added to {STAGE_LABELS[pendingAssign.stage]} in{" "}
              {funnelSets.find((f) => f.id === pendingAssign.funnelSetId)?.label ?? "the selected funnel set"}.
            </p>
          )}
          {panel === "runs" && !activeRun && <ScriptFrameworkSelector value={scriptOptions} onChange={setScriptOptions} disabled={loading} />}
          {panel === "ideas" ? (
            <AdIdeas onBuild={handleBuildFromIdea} />
          ) : panel === "library" ? (
            <StyleLibrary styles={styles} onChanged={refreshStyles} />
          ) : activeRun ? (
            <div>
              <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {activeRun.label}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {describeAngleEmotions(activeRun, styles).join(" · ")} — {activeRun.funnelStyleName} —{" "}
                    {activeRun.vslStyleName}
                  </p>
                  <p className="mt-1 text-xs">
                    {activePlacements.length === 0 ? (
                      <span className="text-neutral-400 dark:text-neutral-500">Not in any funnel yet</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {activePlacements.map((p) => (
                          <span key={p.id} className="flex items-center gap-1 rounded-full bg-orange-100 py-0.5 pl-2 pr-1 font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                            {STAGE_LABELS[p.stage]} · {funnelSets.find((f) => f.id === p.funnel_set_id)?.label ?? "Funnel"}
                            {p.angle_index !== null && activeRun.kit.adSets[p.angle_index] ? ` · ${activeRun.kit.adSets[p.angle_index].angle}` : ""}
                            <button
                              disabled={assigning}
                              onClick={() => handleRemovePlacement(p)}
                              aria-label="Remove from this funnel level"
                              title="Remove from this funnel level"
                              className="rounded-full px-1 hover:bg-orange-200 disabled:opacity-50 dark:hover:bg-orange-900"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setAssignTarget((t) => (t ? null : { funnelSetId: activePlacements.at(-1)?.funnel_set_id ?? "", stage: activePlacements.at(-1)?.stage ?? "TOFO", angleIndex: activeRun.kit.adSets.length === 1 ? 0 : null }))}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {assignTarget ? "Close" : "Add to a funnel"}
                  </button>
                  <button
                    onClick={() => setShowOriginalEntry(true)}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    View original entry
                  </button>
                  <button
                    onClick={() => setShowEditLedger(true)}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Edit history
                    {activeRun.editLedger.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                        {activeRun.editLedger.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleEditIntake(activeRun)}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Edit intake &amp; regenerate
                  </button>
                </div>
              </div>
              {assignTarget && (
                <div className="mx-auto mb-4 max-w-5xl rounded-lg border border-orange-300 bg-orange-500/10 p-4">
                  <p className="mb-1 text-sm font-semibold">Add this ad to a funnel</p>
                  <p className="mb-3 text-xs text-neutral-500">Add as many angles as you like — to one level or spread across TOFU, MOFU and BOFU.</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-sm">
                      Funnel
                      <select
                        className="mt-1 block rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        value={assignTarget.funnelSetId}
                        onChange={(e) => setAssignTarget({ ...assignTarget, funnelSetId: e.target.value })}
                      >
                        <option value="">Select a funnel…</option>
                        {funnelSets.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                    </label>
                    <label className="text-sm">
                      Level
                      <select
                        className="mt-1 block rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        value={assignTarget.stage}
                        onChange={(e) => setAssignTarget({ ...assignTarget, stage: e.target.value as FunnelStage })}
                      >
                        {FUNNEL_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
                    </label>
                    {activeRun.kit.adSets.length > 1 && (
                      <label className="text-sm">
                        Angle
                        <AnglePicker
                          ad={activeRun}
                          value={assignTarget.angleIndex}
                          onChange={(i) => setAssignTarget({ ...assignTarget, angleIndex: i })}
                          taken={activePlacements
                            .filter((p) => p.funnel_set_id === assignTarget.funnelSetId && p.stage === assignTarget.stage && p.angle_index !== null)
                            .map((p) => p.angle_index as number)}
                          className="mt-1 block"
                        />
                      </label>
                    )}
                    <button
                      disabled={assigning || !assignTarget.funnelSetId || assignTarget.angleIndex === null}
                      onClick={handleAddToFunnel}
                      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
                    >
                      {assigning ? "Adding…" : "Add"}
                    </button>
                  </div>
                </div>
              )}
              <div className="mx-auto max-w-5xl">
                <ResultsTabs
                  kit={activeRun.kit}
                  originalKit={activeRun.originalKit}
                  onFieldEdit={handleFieldEdit}
                  angleEmotions={angleEmotionsByName(activeRun, styles)}
                />
              </div>
              {showOriginalEntry && (
                <OriginalEntryModal run={activeRun} onClose={() => setShowOriginalEntry(false)} />
              )}
              {showEditLedger && (
                <EditLedgerModal run={activeRun} onClose={() => setShowEditLedger(false)} />
              )}
            </div>
          ) : stage === "form" ? (
            <IntakeForm
              mode={mode}
              onModeChange={setMode}
              label={label}
              onLabelChange={setLabel}
              fields={fields}
              onFieldChange={handleFieldChange}
              quickIdea={quickIdea}
              onQuickIdeaChange={setQuickIdea}
              purePushIdea={purePushIdea}
              onPurePushIdeaChange={setPurePushIdea}
              emotionStyles={styles.filter((s) => s.category === "emotionalTone")}
              purePushEmotionId={angleEmotionIds["pure-push"] ?? ""}
              onPurePushEmotionChange={(id) => setAngleEmotion("pure-push", id)}
              onSubmit={handleContinueToStyles}
              onPurePush={handlePurePush}
              loading={mode === "push" ? loading : false}
              error={error}
            />
          ) : (
            <StyleSelector
              styles={styles}
              selectedAngleIds={selectedAngleIds}
              onToggleAngle={toggleAngle}
              angleEmotionIds={angleEmotionIds}
              onSetAngleEmotion={setAngleEmotion}
              selectedFunnelId={selectedFunnelId}
              onSelectFunnel={setSelectedFunnelId}
              selectedVslId={selectedVslId}
              onSelectVsl={setSelectedVslId}
              onBack={() => setStage("form")}
              onGenerate={handleGenerate}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </main>
    </div>
  );
}
