"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { IntakeForm } from "@/components/IntakeForm";
import { StyleSelector } from "@/components/StyleSelector";
import { StyleLibrary } from "@/components/StyleLibrary";
import { ResultsTabs } from "@/components/ResultsTabs";
import { loadRuns, saveRun, deleteRun } from "@/lib/storage";
import { loadStyles } from "@/lib/styleStorage";
import { emptyIntakeFields, composeIntakeText, type IntakeFields } from "@/lib/intakeFields";
import type { SavedRun } from "@/lib/types";
import type { Style } from "@/lib/styleLibrary";

const DEFAULT_ANGLE_IDS = [
  "identity-mirror",
  "failed-alternative-mirror",
  "myth-buster",
  "cost-of-inaction",
];
const DEFAULT_FUNNEL_ID = "optin-vsl-personal-call";
const DEFAULT_VSL_ID = "personal-call-frame";

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
  const [fields, setFields] = useState<IntakeFields>(() => emptyIntakeFields());
  const [selectedAngleIds, setSelectedAngleIds] = useState<string[]>(DEFAULT_ANGLE_IDS);
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
    setFields(emptyIntakeFields());
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
    setFields({ ...emptyIntakeFields(), ...run.fields });
    const matchedAngleIds = styles
      .filter((s) => s.category === "adAngle" && run.adAngleNames.includes(s.name))
      .map((s) => s.id);
    if (matchedAngleIds.length > 0) setSelectedAngleIds(matchedAngleIds);
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
  }

  function handleContinueToStyles() {
    setError(null);
    setStage("styles");
  }

  async function handleGenerate() {
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

    const intake = composeIntakeText(fields);
    const adAngles = selectedAngleIds
      .map((id) => styles.find((s) => s.id === id))
      .filter((s): s is Style => Boolean(s));
    const funnelStyle = styles.find((s) => s.id === selectedFunnelId) ?? null;
    const vslStyle = styles.find((s) => s.id === selectedVslId) ?? null;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake, adAngles, funnelStyle, vslStyle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong generating the kit.");
        return;
      }

      const saved = await saveRun({
        label: label.trim() || "Untitled campaign",
        intake,
        fields,
        adAngleNames: adAngles.map((a) => a.name),
        funnelStyleName: funnelStyle?.name ?? "",
        vslStyleName: vslStyle?.name ?? "",
        kit: data.kit,
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
                    {activeRun.adAngleNames.join(" · ")} — {activeRun.funnelStyleName} — {activeRun.vslStyleName}
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
              label={label}
              onLabelChange={setLabel}
              fields={fields}
              onFieldChange={handleFieldChange}
              onSubmit={handleContinueToStyles}
              loading={false}
              error={error}
            />
          ) : (
            <StyleSelector
              styles={styles}
              selectedAngleIds={selectedAngleIds}
              onToggleAngle={toggleAngle}
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
