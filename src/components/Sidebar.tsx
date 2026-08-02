"use client";

import type { SavedRun } from "@/lib/types";

export function Sidebar({
  runs,
  activeId,
  panel,
  onSelect,
  onNew,
  onDelete,
  onOpenLibrary,
}: {
  runs: SavedRun[];
  activeId: string | null;
  panel: "runs" | "library";
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenLibrary: () => void;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="space-y-1.5 p-3">
        <button
          onClick={onNew}
          className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          + New campaign kit
        </button>
        <button
          onClick={onOpenLibrary}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panel === "library"
              ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          }`}
        >
          🎨 Style library
        </button>
      </div>
      <div className="px-3 pb-1 pt-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-600">
          Saved campaigns
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {runs.length === 0 && (
          <p className="px-2 py-4 text-xs text-neutral-400 dark:text-neutral-500">
            No saved kits yet. Generate one to see it here.
          </p>
        )}
        {runs.map((run) => (
          <div
            key={run.id}
            className={`group mb-1 flex items-center justify-between rounded-lg px-2 py-2 text-sm ${
              run.id === activeId
                ? "bg-indigo-100 dark:bg-indigo-950"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
          >
            <button onClick={() => onSelect(run.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">{run.label}</p>
              <p className="text-[0.7rem] text-neutral-400 dark:text-neutral-500">
                {new Date(run.createdAt).toLocaleString()}
              </p>
            </button>
            <button
              onClick={() => onDelete(run.id)}
              className="ml-1 shrink-0 rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950"
              aria-label="Delete run"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
