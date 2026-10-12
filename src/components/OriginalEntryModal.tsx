"use client";

import { useEffect, useState } from "react";
import { INTAKE_SECTIONS, QUICK_IDEA_KEY, PURE_PUSH_KEY } from "@/lib/intakeFields";
import type { SavedRun } from "@/lib/types";
import { CopyField } from "@/components/CopyField";

export function OriginalEntryModal({ run, onClose, onSaveEntry }: { run: SavedRun; onClose: () => void; onSaveEntry: (key: string, label: string, value: string) => Promise<void> }) {
  // Close on Escape, and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const quickIdea = run.fields[QUICK_IDEA_KEY];
  const purePush = run.fields[PURE_PUSH_KEY];
  const entryMode = purePush ? "Pure push" : quickIdea ? "Quick idea" : "Full intake";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Original entry
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {entryMode} — exactly what was submitted for &quot;{run.label}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {purePush ? (
            <CopyField label="Concept" value={purePush} path={PURE_PUSH_KEY} onSave={(_p, l, v) => onSaveEntry(PURE_PUSH_KEY, l, v)} />
          ) : quickIdea ? (
            <CopyField label="Idea" value={quickIdea} path={QUICK_IDEA_KEY} onSave={(_p, l, v) => onSaveEntry(QUICK_IDEA_KEY, l, v)} />
          ) : (
            <FullIntakeEditable fields={run.fields} onSaveEntry={onSaveEntry} />
          )}
        </div>
      </div>
    </div>
  );
}

function FullIntakeEditable({ fields, onSaveEntry }: { fields: Record<string, string>; onSaveEntry: (key: string, label: string, value: string) => Promise<void> }) {
  const [showEmpty, setShowEmpty] = useState(false);
  const sections = INTAKE_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.filter((f) => showEmpty || (fields[f.key] ?? "").trim().length > 0),
  })).filter((section) => section.fields.length > 0);

  return (
    <div className="space-y-5">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Edit any answer to correct the record. This doesn&apos;t rewrite the generated copy — use &quot;Edit intake &amp; regenerate&quot; for that.{" "}
        <button type="button" onClick={() => setShowEmpty((v) => !v)} className="underline">{showEmpty ? "Hide unanswered questions" : "Show unanswered questions"}</button>
      </p>
      {sections.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">No fields were answered.</p>}
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            {section.title}
          </h4>
          {section.fields.map((f) => (
            <CopyField key={f.key} label={f.question} value={fields[f.key] ?? ""} path={f.key} onSave={(_p, l, v) => onSaveEntry(f.key, l, v)} />
          ))}
        </div>
      ))}
    </div>
  );
}
