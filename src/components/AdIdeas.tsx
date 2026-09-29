"use client";

import { useEffect, useRef, useState } from "react";
import { FUNNEL_STAGES, STAGE_LABELS, type FunnelStage } from "@/lib/funnels";

export interface AdIdea {
  id: string;
  text: string;
  note: string;
  stage: FunnelStage | null;
  used: boolean;
  created_at: string;
}

type Filter = "open" | "used" | "all";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900";

/** Parses an API response, turning an empty/non-JSON body into a readable error. */
async function readJson(res: Response) {
  const body = await res.text();
  let data: { error?: string; [key: string]: unknown } = {};
  try { data = body ? JSON.parse(body) : {}; } catch { /* non-JSON error page */ }
  if (!res.ok) throw new Error(data.error ?? `Server error (${res.status}). Has the ad_ideas migration been run?`);
  return data;
}

function StageSelect({ value, onChange }: { value: FunnelStage | null; onChange: (s: FunnelStage | null) => void }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value || null) as FunnelStage | null)}
      className="rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <option value="">Any level</option>
      {FUNNEL_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
    </select>
  );
}

/** Library of ad ideas to run later. "Build this ad" hands an idea to the ad builder. */
export function AdIdeas({ onBuild }: { onBuild: (idea: AdIdea) => void }) {
  const [ideas, setIdeas] = useState<AdIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<FunnelStage | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdIdea | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/ad-ideas")
      .then(readJson)
      .then((data) => setIdeas(data.ideas as AdIdea[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load ideas."))
      .finally(() => setLoading(false));
  }, []);

  async function patch(id: string, changes: Partial<Pick<AdIdea, "text" | "note" | "stage" | "used">>) {
    setError("");
    try {
      const res = await fetch(`/api/ad-ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const updated = (await readJson(res)).idea as AdIdea;
      setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that change.");
      return false;
    }
  }

  async function handleAdd() {
    if (!text.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ad-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, note, stage }),
      });
      const data = await readJson(res);
      setIdeas((prev) => [data.idea as AdIdea, ...prev]);
      setText("");
      setNote("");
      setFilter((f) => (f === "used" ? "open" : f));
      textRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that idea.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setConfirmingId(null);
    try {
      await readJson(await fetch(`/api/ad-ideas/${id}`, { method: "DELETE" }));
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete that idea.");
    }
  }

  const needle = search.trim().toLowerCase();
  const visible = ideas.filter(
    (i) =>
      (filter === "all" || (filter === "used" ? i.used : !i.used)) &&
      (!needle || [i.text, i.note].some((f) => f.toLowerCase().includes(needle)))
  );
  const openCount = ideas.filter((i) => !i.used).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Ad Ideas</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Jot down ads you want to run later. When you&apos;re ready, hit <strong>Build this ad</strong> to start it. Press ⌘/Ctrl + Enter to save.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-orange-300 bg-orange-500/5 p-4">
        <textarea
          ref={textRef}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="The ad idea…"
          className={inputClass}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes — angle, hook, who it's for (optional)" className={inputClass} />
          <StageSelect value={stage} onChange={setStage} />
        </div>
        <button onClick={handleAdd} disabled={saving || !text.trim()} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          {saving ? "Saving…" : "+ Add idea"}
        </button>
      </section>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ideas…" className={`${inputClass} max-w-xs`} />
        <div className="flex gap-1 text-sm">
          {(["open", "used", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-lg px-3 py-1.5 ${filter === f ? "bg-orange-500/10 font-semibold text-orange-700 dark:text-orange-300" : "text-neutral-500"}`}
            >
              {{ open: `To build (${openCount})`, used: `Built (${ideas.length - openCount})`, all: "All" }[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-neutral-400">
          {ideas.length === 0 ? "No ideas yet. Add your first one above." : needle ? "Nothing matches that search." : "Nothing here."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((idea) =>
            editing?.id === idea.id ? (
              <li key={idea.id} className="space-y-2 rounded-xl border border-orange-400 p-4">
                <textarea rows={3} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} className={inputClass} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Notes" className={inputClass} />
                  <StageSelect value={editing.stage} onChange={(s) => setEditing({ ...editing, stage: s })} />
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!editing.text.trim()}
                    onClick={async () => { if (await patch(editing.id, { text: editing.text, note: editing.note, stage: editing.stage })) setEditing(null); }}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Cancel</button>
                </div>
              </li>
            ) : (
              <li key={idea.id} className={`rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 ${idea.used ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-900 dark:text-neutral-100">{idea.text}</p>
                  {idea.stage && (
                    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                      {STAGE_LABELS[idea.stage]}
                    </span>
                  )}
                </div>
                {idea.note && <p className="mt-2 text-sm text-neutral-500">{idea.note}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-neutral-400">{new Date(idea.created_at).toLocaleDateString()}</span>
                  <button onClick={() => onBuild(idea)} className="rounded-lg bg-orange-600 px-3 py-1 font-semibold text-white hover:bg-orange-500">Build this ad →</button>
                  <button onClick={() => patch(idea.id, { used: !idea.used })} className="text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200">
                    {idea.used ? "Move back to To build" : "Mark as built"}
                  </button>
                  <button onClick={() => setEditing(idea)} className="text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200">Edit</button>
                  {confirmingId === idea.id ? (
                    <>
                      <button onClick={() => handleDelete(idea.id)} className="font-semibold text-red-600 underline">Yes, delete</button>
                      <button onClick={() => setConfirmingId(null)} className="text-neutral-500 underline">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmingId(idea.id)} className="text-neutral-400 underline hover:text-red-600">Delete</button>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
