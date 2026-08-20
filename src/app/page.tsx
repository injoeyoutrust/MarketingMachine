"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { IntakeForm, type IntakeMode } from "@/components/IntakeForm";
import { StyleSelector } from "@/components/StyleSelector";
import { StyleLibrary } from "@/components/StyleLibrary";
import { ResultsTabs } from "@/components/ResultsTabs";
import { loadRuns, saveRun, deleteRun } from "@/lib/storage";
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
import type { Style } from "@/lib/styleLibrary";

const DEFAULT_ANGLE_IDS = [
  "identity-mirror",
  "failed-alternative-mirror",
  "myth-buster",
  "cost-of-inaction",
];
const DEFAULT_FUNNEL_ID = "optin-vsl-personal-call";
const DEFAULT_VSL_ID = "personal-call-frame";
const DEFAULT_EMOTION_ID = "emotion-fear";

function stripEmotionPoints(name: string): string {
  return name.replace(/\s*\(\d+\+?\)\s*$/, "");
}

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

/** "Identity mirror (Fear) · Cost of inaction (Grief)" for a run's header. */
function describeAngleEmotions(run: SavedRun, styles: Style[]): string[] {
  const map = decodeAngleEmotions(run.fields[ANGLE_EMOTIONS_KEY]);
  return Object.entries(map)
    .map(([angleId, emotionId]) => {
      // The pure-push angle is synthesized on the fly and never saved to
      // the style catalog, so it won't be found by id — fall back to the
      // run's recorded angle name (there's only ever one for a push run).
      const angleName = angleId === "pure-push" ? run.adAngleNames[0] : styles.find((s) => s.id === angleId)?.name;
      const emotion = styles.find((s) => s.id === emotionId);
      if (!angleName) return null;
      return emotion ? `${angleName} (${stripEmotionPoints(emotion.name)})` : angleName;
    })
    .filter((s): s is string => Boolean(s));
}

type Panel = "runs" | "library";
type Stage = "form" | "styles";

export default function Home() {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("runs");
  const [stage, setStage] = useState<Stage>("form");

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
    Promise.all([loadRuns(), loadStyles()]).then(([r, s]) => {
      setRuns(r);
      setStyles(s);
      setInitializing(false);
    });
  }, []);

  const activeRun = runs.find((r) => r.id === activeId) ?? null;

  async function refreshStyles() {
    setStyles(await loadStyles());
  }

  function handleNew() {
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
    setError(null);
  }

  function handleSelect(id: string) {
    setPanel("runs");
    setActiveId(id);
    setError(null);
  }

  function handleOpenLibrary() {
    setPanel("library");
    setActiveId(null);
  }

  function handleEditIntake(run: SavedRun) {
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
          adAngles: params.adAngles,
          funnelStyle: params.funnelStyle,
          vslStyle: params.vslStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong generating the kit.");
        return;
      }

      const kit = data.kit as CampaignKit;
      const saved = await saveRun({
        label: label.trim() || "Untitled campaign",
        intake: params.intake,
        fields: params.savedFields,
        adAngleNames: params.adAngles.map((a) => a.name),
        funnelStyleName: params.funnelStyle.name,
        vslStyleName: params.vslStyle.name,
        kit,
      });
      if (!saved) {
        setError("Kit was generated but couldn't be saved. Check the Supabase connection.");
        return;
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
      <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950">
      <Sidebar
        runs={runs}
        activeId={activeId}
        panel={panel}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onOpenLibrary={handleOpenLibrary}
      />
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Campaign Engine</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Intake in. Full launch-ready campaign kit out.
          </p>
        </header>
        <div className="p-6">
          {panel === "library" ? (
            <StyleLibrary styles={styles} onChanged={refreshStyles} />
          ) : activeRun ? (
            <div>
              <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {activeRun.label}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {describeAngleEmotions(activeRun, styles).join(" · ") || activeRun.adAngleNames.join(" · ")} —{" "}
                    {activeRun.funnelStyleName} — {activeRun.vslStyleName}
                  </p>
                </div>
                <button
                  onClick={() => handleEditIntake(activeRun)}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Edit intake &amp; regenerate
                </button>
              </div>
              <div className="mx-auto max-w-5xl">
                <ResultsTabs kit={activeRun.kit} />
              </div>
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
