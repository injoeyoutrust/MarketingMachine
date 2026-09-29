"use client";

import Link from "next/link";
import type { SavedRun } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Sidebar({
  runs,
  activeId,
  panel,
  onSelect: selectRun,
  onNew: newAd,
  onDelete,
  onOpenLibrary: openLibrary,
  onOpenIdeas: openIdeas,
  mobileOpen,
  onCloseMobile,
}: {
  runs: SavedRun[];
  activeId: string | null;
  panel: "runs" | "library" | "ideas";
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenLibrary: () => void;
  onOpenIdeas: () => void;
  /** Phones: the sidebar is a slide-out drawer, shown only while this is true. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  // On phones, picking anything in the drawer should also close it.
  const andClose = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => { fn(...args); onCloseMobile(); };
  const onSelect = andClose(selectRun);
  const onNew = andClose(newAd);
  const onOpenLibrary = andClose(openLibrary);
  const onOpenIdeas = andClose(openIdeas);
  return (
    <>
    {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onCloseMobile} aria-hidden />}
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 transition-transform md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 dark:border-neutral-800 dark:bg-neutral-950 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-3 md:hidden">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Ads &amp; libraries</span>
        <button onClick={onCloseMobile} aria-label="Close menu" className="rounded p-2 text-lg leading-none text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800">✕</button>
      </div>
      <div className="space-y-1.5 p-3">
        <Link href="/scripts" className="block w-full rounded-lg border border-orange-400 px-3 py-2 text-center text-sm font-semibold text-orange-600">Script Workshop →</Link>
        <button
          onClick={onNew}
          className="w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          + New ad
        </button>
        <button
          onClick={onOpenLibrary}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panel === "library"
              ? "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          }`}
        >
          🎨 Style library
        </button>
        <button
          onClick={onOpenIdeas}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panel === "ideas"
              ? "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          }`}
        >
          💡 Ad ideas
        </button>
      </div>
      <div className="px-3 pb-1 pt-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-600">
          Ads
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {runs.length === 0 && (
          <p className="px-2 py-4 text-xs text-neutral-400 dark:text-neutral-500">
            No ads yet. Generate one to see it here.
          </p>
        )}
        {runs.map((run) => (
          <div
            key={run.id}
            className={`group mb-1 flex items-center justify-between rounded-lg px-2 py-2 text-sm ${
              run.id === activeId
                ? "bg-orange-100 dark:bg-orange-950"
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
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <ThemeToggle />
      </div>
    </aside>
    </>
  );
}
