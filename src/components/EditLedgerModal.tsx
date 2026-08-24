"use client";

import { useEffect } from "react";
import type { EditLedgerEntry, SavedRun } from "@/lib/types";

function displayValue(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((i) => `• ${i}`).join("\n") : String(parsed);
  } catch {
    return raw;
  }
}

function LedgerRow({ entry }: { entry: EditLedgerEntry }) {
  return (
    <div className="border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-800">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{entry.fieldLabel}</span>
        <span className="text-[0.7rem] text-neutral-400 dark:text-neutral-500">
          {new Date(entry.editedAt).toLocaleString()}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-950/50">
          <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Before
          </p>
          <p className="whitespace-pre-wrap text-xs text-neutral-600 dark:text-neutral-400">
            {displayValue(entry.oldValue)}
          </p>
        </div>
        <div className="rounded border border-orange-200 bg-orange-50 px-2 py-1.5 dark:border-orange-900 dark:bg-orange-950/30">
          <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            After
          </p>
          <p className="whitespace-pre-wrap text-xs text-orange-900 dark:text-orange-200">
            {displayValue(entry.newValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EditLedgerModal({ run, onClose }: { run: SavedRun; onClose: () => void }) {
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

  const entries = [...run.editLedger].reverse();

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
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Edit history</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {entries.length === 0
                ? `No edits yet on "${run.label}" — all copy still matches what Claude generated.`
                : `${entries.length} edit${entries.length > 1 ? "s" : ""} to "${run.label}", newest first`}
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

        <div className="max-h-[70vh] overflow-y-auto px-5 py-2">
          {entries.length === 0 ? (
            <p className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
              Edit any field with the Edit button and it&apos;ll show up here — old value, new value, and when.
            </p>
          ) : (
            entries.map((entry) => <LedgerRow key={entry.id} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
