"use client";

import { useEffect } from "react";
import { INTAKE_SECTIONS, QUICK_IDEA_KEY, PURE_PUSH_KEY } from "@/lib/intakeFields";
import type { SavedRun } from "@/lib/types";
import { CopyField } from "@/components/CopyField";

export function OriginalEntryModal({ run, onClose }: { run: SavedRun; onClose: () => void }) {
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
            <CopyField label="Concept" value={purePush} />
          ) : quickIdea ? (
            <CopyField label="Idea" value={quickIdea} />
          ) : (
            <FullIntakeReadOnly fields={run.fields} />
          )}
        </div>
      </div>
    </div>
  );
}

function FullIntakeReadOnly({ fields }: { fields: Record<string, string> }) {
  const sectionsWithAnswers = INTAKE_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.filter((f) => (fields[f.key] ?? "").trim().length > 0),
  })).filter((section) => section.fields.length > 0);

  if (sectionsWithAnswers.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No fields were answered.</p>;
  }

  return (
    <div className="space-y-5">
      {sectionsWithAnswers.map((section) => (
        <div key={section.title}>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {section.title}
          </h4>
          {section.fields.map((f) => (
            <CopyField key={f.key} label={f.question} value={fields[f.key]} />
          ))}
        </div>
      ))}
    </div>
  );
}
