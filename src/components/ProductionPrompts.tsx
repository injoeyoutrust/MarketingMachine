"use client";

import { useEffect, useState } from "react";
import { STAGE_LABELS, type FunnelStage } from "@/lib/funnels";

/** Parses an API response, turning an empty/non-JSON body into a readable error. */
async function readJson(res: Response) {
  const body = await res.text();
  let data: { error?: string; [key: string]: unknown } = {};
  try { data = body ? JSON.parse(body) : {}; } catch { /* non-JSON error page */ }
  if (!res.ok) throw new Error(data.error ?? `Server error (${res.status}).`);
  return data;
}

/**
 * Starts a prompt-writing job and waits for it. Writing takes about a minute —
 * longer than a hosted web request may live — so the server queues the job,
 * runs it in the background, and we poll until it is done.
 */
async function runPromptJob<T>(url: string, body: unknown): Promise<T> {
  const start = await readJson(await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    let job: { status?: string; prompt?: unknown; error?: string };
    try {
      job = await readJson(await fetch(`/api/jobs/${start.jobId}`));
    } catch {
      continue; // a dropped poll is not a failed job — keep waiting
    }
    if (job.status === "done") return job.prompt as T;
    if (job.status === "error") throw new Error(job.error ?? "Could not write the prompt. Please retry.");
  }
  throw new Error("This is taking too long. Check back in a minute — if it finished, it will be in the list after a refresh.");
}

const selectClass = "rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const primaryButton = "rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50";

function CopyButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setState("copied"); } catch { setState("failed"); }
        setTimeout(() => setState("idle"), 1500);
      }}
      className="rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-500"
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed — select the text" : label}
    </button>
  );
}

function DeleteLink({ onConfirm }: { onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  return asking ? (
    <span className="flex gap-2">
      <button onClick={onConfirm} className="font-semibold text-red-600 underline">Yes, delete</button>
      <button onClick={() => setAsking(false)} className="text-neutral-500 underline">Cancel</button>
    </span>
  ) : (
    <button onClick={() => setAsking(true)} className="text-neutral-400 underline hover:text-red-600">Delete</button>
  );
}

/** Inline editor for a saved prompt's text fields. */
function PromptEditor({
  fields,
  initial,
  onSave,
  onCancel,
}: {
  fields: { key: string; label: string; rows: number }[];
  initial: Record<string, string>;
  onSave: (values: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <label key={f.key} className="block text-xs font-semibold text-neutral-500">
          {f.label}
          <textarea
            rows={f.rows}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 font-normal text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </label>
      ))}
      <div className="flex items-center gap-2">
        <button
          disabled={saving || !values.prompt?.trim()}
          onClick={async () => {
            setSaving(true);
            setError("");
            try { await onSave(values); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save."); setSaving(false); }
          }}
          className={primaryButton}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">Cancel</button>
        {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}

/** Saves edited fields on a prompt; returns the updated row. */
async function savePrompt<T>(kind: "image" | "landing" | "video", id: string, values: Record<string, string>): Promise<T> {
  const res = await fetch(`/api/${kind}-prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return (await readJson(res)).prompt as T;
}

const editLink = "text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200";

// ---------------------------------------------------------------- image ads

type Platform = "chatgpt" | "higgsfield";
type Aspect = "4:5" | "1:1" | "9:16";
const PLATFORM_LABELS: Record<Platform, string> = { chatgpt: "ChatGPT", higgsfield: "Higgsfield" };
const ASPECT_LABELS: Record<Aspect, string> = { "4:5": "4:5 — Feed (recommended)", "1:1": "1:1 — Square feed", "9:16": "9:16 — Stories / Reels" };

interface ImagePrompt {
  id: string;
  angle_index: number;
  platform: Platform;
  aspect: Aspect;
  prompt: string;
  on_image_text: string;
  notes: string;
  created_at: string;
}

export type ImagePromptOwner = { placementId: string } | { contributionId: string };

/** Writes and keeps image-generation prompts for one item's angle(s). */
export function ImagePrompts({ owner, angles }: { owner: ImagePromptOwner; angles: { index: number; name: string }[] }) {
  const [prompts, setPrompts] = useState<ImagePrompt[] | null>(null);
  const [platform, setPlatform] = useState<Platform>("chatgpt");
  const [aspect, setAspect] = useState<Aspect>("4:5");
  const [angleIndex, setAngleIndex] = useState(angles[0]?.index ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const query = new URLSearchParams(owner as Record<string, string>).toString();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/image-prompts?${query}`)
      .then(readJson)
      .then((d) => { if (!cancelled) setPrompts(d.prompts as ImagePrompt[]); })
      .catch((e) => { if (!cancelled) { setError(e.message); setPrompts([]); } });
    return () => { cancelled = true; };
  }, [query]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const prompt = await runPromptJob<ImagePrompt>("/api/image-prompts", { ...owner, angleIndex, platform, aspect });
      setPrompts((prev) => [prompt, ...(prev ?? [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write the prompt.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await readJson(await fetch(`/api/image-prompts/${id}`, { method: "DELETE" }));
      setPrompts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  const angleName = (i: number) => angles.find((a) => a.index === i)?.name ?? `Angle ${i + 1}`;

  return (
    <section className="space-y-3 rounded-xl border border-orange-300 bg-orange-500/5 p-4">
      <div>
        <h4 className="font-semibold">🎨 Image prompt</h4>
        <p className="text-xs text-neutral-500">Written from this ad&apos;s copy. Copy it into the tool, make the image, then upload it below.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {angles.length > 1 && (
          <label className="text-xs">Angle
            <select className={`${selectClass} mt-1 block`} value={angleIndex} onChange={(e) => setAngleIndex(Number(e.target.value))}>
              {angles.map((a) => <option key={a.index} value={a.index}>{a.name}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs">Tool
          <select className={`${selectClass} mt-1 block`} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
          </select>
        </label>
        <label className="text-xs">Size
          <select className={`${selectClass} mt-1 block`} value={aspect} onChange={(e) => setAspect(e.target.value as Aspect)}>
            {(Object.keys(ASPECT_LABELS) as Aspect[]).map((a) => <option key={a} value={a}>{ASPECT_LABELS[a]}</option>)}
          </select>
        </label>
        <button disabled={busy} onClick={generate} className={primaryButton}>{busy ? "Writing prompt… (up to a minute)" : "Write image prompt"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {prompts === null ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : (
        prompts.map((p) => (
          <div key={p.id} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
              <span>{PLATFORM_LABELS[p.platform]} · {p.aspect}{angles.length > 1 ? ` · ${angleName(p.angle_index)}` : ""} · {new Date(p.created_at).toLocaleDateString()}</span>
              {editingId !== p.id && (
                <span className="flex items-center gap-3">
                  <CopyButton text={p.prompt} />
                  <button onClick={() => setEditingId(p.id)} className={editLink}>Edit</button>
                  <DeleteLink onConfirm={() => remove(p.id)} />
                </span>
              )}
            </div>
            {editingId === p.id ? (
              <PromptEditor
                fields={[
                  { key: "prompt", label: "Prompt", rows: 10 },
                  { key: "on_image_text", label: "On-image text", rows: 2 },
                  { key: "notes", label: "Notes", rows: 2 },
                ]}
                initial={{ prompt: p.prompt, on_image_text: p.on_image_text, notes: p.notes }}
                onCancel={() => setEditingId(null)}
                onSave={async (values) => {
                  const updated = await savePrompt<ImagePrompt>("image", p.id, values);
                  setPrompts((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
                  setEditingId(null);
                }}
              />
            ) : (
            <>
            <p className="whitespace-pre-wrap text-sm">{p.prompt}</p>
            {p.on_image_text && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-neutral-100 p-2 text-sm dark:bg-neutral-800">
                <span><span className="text-xs font-semibold uppercase text-neutral-500">On-image text: </span>{p.on_image_text}</span>
                <CopyButton text={p.on_image_text} label="Copy text" />
              </div>
            )}
            {p.notes && <p className="text-xs text-neutral-500">💡 {p.notes}</p>}
            </>
            )}
          </div>
        ))
      )}
    </section>
  );
}

// ---------------------------------------------------------------- video ads

type VideoPlatform = "higgsfield" | "veo" | "sora";
type VideoAspect = "9:16" | "4:5" | "1:1";
const VIDEO_PLATFORM_LABELS: Record<VideoPlatform, string> = { higgsfield: "Higgsfield", veo: "Google Veo", sora: "OpenAI Sora" };
const VIDEO_ASPECT_LABELS: Record<VideoAspect, string> = { "9:16": "9:16 — Reels / Stories (recommended)", "4:5": "4:5 — Feed", "1:1": "1:1 — Square feed" };

interface VideoPrompt {
  id: string;
  angle_index: number;
  platform: VideoPlatform;
  aspect: VideoAspect;
  prompt: string;
  voiceover: string;
  notes: string;
  created_at: string;
}

/** Writes and keeps AI-video prompts (a shot list from the ad's video script) for one item's angle(s). */
export function VideoPrompts({ owner, angles }: { owner: ImagePromptOwner; angles: { index: number; name: string }[] }) {
  const [prompts, setPrompts] = useState<VideoPrompt[] | null>(null);
  const [platform, setPlatform] = useState<VideoPlatform>("higgsfield");
  const [aspect, setAspect] = useState<VideoAspect>("9:16");
  const [angleIndex, setAngleIndex] = useState(angles[0]?.index ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const query = new URLSearchParams(owner as Record<string, string>).toString();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/video-prompts?${query}`)
      .then(readJson)
      .then((d) => { if (!cancelled) setPrompts(d.prompts as VideoPrompt[]); })
      .catch((e) => { if (!cancelled) { setError(e.message); setPrompts([]); } });
    return () => { cancelled = true; };
  }, [query]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const prompt = await runPromptJob<VideoPrompt>("/api/video-prompts", { ...owner, angleIndex, platform, aspect });
      setPrompts((prev) => [prompt, ...(prev ?? [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write the prompt.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await readJson(await fetch(`/api/video-prompts/${id}`, { method: "DELETE" }));
      setPrompts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  const angleName = (i: number) => angles.find((a) => a.index === i)?.name ?? `Angle ${i + 1}`;

  return (
    <section className="space-y-3 rounded-xl border border-orange-300 bg-orange-500/5 p-4">
      <div>
        <h4 className="font-semibold">🎬 Video prompt</h4>
        <p className="text-xs text-neutral-500">A shot-by-shot prompt pack written from this ad&apos;s video script. Paste each shot into the tool, then cut the clips together.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {angles.length > 1 && (
          <label className="text-xs">Angle
            <select className={`${selectClass} mt-1 block`} value={angleIndex} onChange={(e) => setAngleIndex(Number(e.target.value))}>
              {angles.map((a) => <option key={a.index} value={a.index}>{a.name}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs">Tool
          <select className={`${selectClass} mt-1 block`} value={platform} onChange={(e) => setPlatform(e.target.value as VideoPlatform)}>
            {(Object.keys(VIDEO_PLATFORM_LABELS) as VideoPlatform[]).map((p) => <option key={p} value={p}>{VIDEO_PLATFORM_LABELS[p]}</option>)}
          </select>
        </label>
        <label className="text-xs">Size
          <select className={`${selectClass} mt-1 block`} value={aspect} onChange={(e) => setAspect(e.target.value as VideoAspect)}>
            {(Object.keys(VIDEO_ASPECT_LABELS) as VideoAspect[]).map((a) => <option key={a} value={a}>{VIDEO_ASPECT_LABELS[a]}</option>)}
          </select>
        </label>
        <button disabled={busy} onClick={generate} className={primaryButton}>{busy ? "Writing prompt… (up to a minute)" : "Write video prompt"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {prompts === null ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : (
        prompts.map((p) => (
          <div key={p.id} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
              <span>{VIDEO_PLATFORM_LABELS[p.platform]} · {p.aspect}{angles.length > 1 ? ` · ${angleName(p.angle_index)}` : ""} · {new Date(p.created_at).toLocaleDateString()}</span>
              {editingId !== p.id && (
                <span className="flex items-center gap-3">
                  <CopyButton text={p.prompt} />
                  <button onClick={() => setEditingId(p.id)} className={editLink}>Edit</button>
                  <DeleteLink onConfirm={() => remove(p.id)} />
                </span>
              )}
            </div>
            {editingId === p.id ? (
              <PromptEditor
                fields={[
                  { key: "prompt", label: "Prompt", rows: 14 },
                  { key: "voiceover", label: "Voiceover", rows: 5 },
                  { key: "notes", label: "Notes", rows: 2 },
                ]}
                initial={{ prompt: p.prompt, voiceover: p.voiceover, notes: p.notes }}
                onCancel={() => setEditingId(null)}
                onSave={async (values) => {
                  const updated = await savePrompt<VideoPrompt>("video", p.id, values);
                  setPrompts((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
                  setEditingId(null);
                }}
              />
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm">{p.prompt}</p>
                {p.voiceover && (
                  <div className="space-y-1 rounded bg-neutral-100 p-2 text-sm dark:bg-neutral-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase text-neutral-500">Voiceover</span>
                      <CopyButton text={p.voiceover} label="Copy voiceover" />
                    </div>
                    <p className="whitespace-pre-wrap">{p.voiceover}</p>
                  </div>
                )}
                {p.notes && <p className="whitespace-pre-wrap text-xs text-neutral-500">💡 {p.notes}</p>}
              </>
            )}
          </div>
        ))
      )}
    </section>
  );
}

// ------------------------------------------------------------- landing pages

type Goal = "email_phone" | "download" | "book_call";
type Builder = "ai_builder" | "html" | "manual";
const GOAL_LABELS: Record<Goal, string> = { email_phone: "Collect email + phone", download: "Give away a downloadable", book_call: "Book a call" };
const BUILDER_LABELS: Record<Builder, string> = {
  ai_builder: "AI site builder (Lovable, Bolt, v0)",
  html: "ChatGPT / Claude (HTML page)",
  manual: "Build it myself (GoHighLevel, ClickFunnels, Framer)",
};

interface LandingPrompt {
  id: string;
  goal: Goal;
  builder: Builder;
  offer: string;
  prompt: string;
  notes: string;
  source_labels?: string[];
  created_at: string;
}

/** One ad angle in a funnel level that a page can be written for. */
export interface LevelAdItem {
  key: string;
  label: string;
  source: { placementId: string; angleIndex: number } | { contributionId: string; angleIndex: number };
}

/** Writes and keeps landing-page prompts for one funnel level — for whichever of its ads you tick. */
export function LandingPrompts({ funnelSetId, stage, items }: { funnelSetId: string; stage: FunnelStage; items: LevelAdItem[] }) {
  const [prompts, setPrompts] = useState<LandingPrompt[] | null>(null);
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState<Goal>("email_phone");
  const [builder, setBuilder] = useState<Builder>("ai_builder");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [pageMode, setPageMode] = useState<"one" | "each">("one");
  const chosen = items.filter((it) => !unticked.has(it.key));
  const levelKey = `${funnelSetId}:${stage}`;
  const [loadedFor, setLoadedFor] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/landing-prompts?funnelSetId=${funnelSetId}&stage=${stage}`)
      .then(readJson)
      .then((d) => { if (!cancelled) { setPrompts(d.prompts as LandingPrompt[]); setLoadedFor(`${funnelSetId}:${stage}`); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setPrompts([]); setLoadedFor(`${funnelSetId}:${stage}`); } });
    return () => { cancelled = true; };
  }, [funnelSetId, stage]);

  async function write(sources: LevelAdItem["source"][]) {
    const prompt = await runPromptJob<LandingPrompt>("/api/landing-prompts", { funnelSetId, stage, goal, builder, offer, sources });
    setPrompts((prev) => [prompt, ...(prev ?? [])]);
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      if (pageMode === "each" && chosen.length > 1) {
        // One page per ad, written one after another; stop at the first failure.
        for (let i = 0; i < chosen.length; i++) {
          setProgress(`Writing page ${i + 1} of ${chosen.length}…`);
          await write([chosen[i].source]);
        }
      } else {
        await write(chosen.map((it) => it.source));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write the prompt.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function remove(id: string) {
    try {
      await readJson(await fetch(`/api/landing-prompts/${id}`, { method: "DELETE" }));
      setPrompts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  const list = loadedFor === levelKey ? prompts : null;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span>
          <span className="block font-semibold">🧲 Landing page prompt for {STAGE_LABELS[stage]}</span>
          <span className="text-xs text-neutral-500">Written to match this level&apos;s ads. {list?.length ? `${list.length} saved.` : ""}</span>
        </span>
        <span className="shrink-0 text-sm text-neutral-400">{open ? "▲ Close" : "▼ Open"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs">Page goal
              <select className={`${selectClass} mt-1 block`} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
              </select>
            </label>
            <label className="text-xs">Where you&apos;ll build it
              <select className={`${selectClass} mt-1 block`} value={builder} onChange={(e) => setBuilder(e.target.value as Builder)}>
                {(Object.keys(BUILDER_LABELS) as Builder[]).map((b) => <option key={b} value={b}>{BUILDER_LABELS[b]}</option>)}
              </select>
            </label>
          </div>
          <fieldset className="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            <legend className="px-1 text-xs font-semibold text-neutral-500">Which ads is this page for?</legend>
            {items.length === 0 ? (
              <p className="text-xs text-neutral-500">Add an ad to {STAGE_LABELS[stage]} first — the page is written to match the ads you pick.</p>
            ) : (
              <>
                <div className="flex gap-3 text-xs">
                  <button type="button" onClick={() => setUnticked(new Set())} className={editLink}>Select all</button>
                  <button type="button" onClick={() => setUnticked(new Set(items.map((it) => it.key)))} className={editLink}>Select none</button>
                </div>
                {items.map((it) => (
                  <label key={it.key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!unticked.has(it.key)}
                      onChange={(e) => setUnticked((prev) => { const n = new Set(prev); if (e.target.checked) n.delete(it.key); else n.add(it.key); return n; })}
                    />
                    <span>{it.label}</span>
                  </label>
                ))}
                {chosen.length > 1 && (
                  <div className="space-y-1 border-t border-neutral-200 pt-2 text-sm dark:border-neutral-800">
                    <label className="flex items-start gap-2">
                      <input type="radio" name={`pagemode-${levelKey}`} className="mt-1" checked={pageMode === "one"} onChange={() => setPageMode("one")} />
                      <span>One page for all {chosen.length} selected ads</span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input type="radio" name={`pagemode-${levelKey}`} className="mt-1" checked={pageMode === "each"} onChange={() => setPageMode("each")} />
                      <span>A separate page for each ad ({chosen.length} pages)</span>
                    </label>
                  </div>
                )}
              </>
            )}
          </fieldset>
          <label className="block text-xs">
            {goal === "download" ? "The downloadable — what it is and what's inside (required)" : "Offer details or anything the page must include (optional)"}
            <textarea
              rows={3}
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder={goal === "download" ? 'e.g. "First 90 Days Survival Checklist" — PDF, 12 pages: insurance, factoring, compliance calendar…' : "e.g. free 15-min authority review, bonus, deadline…"}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button disabled={busy || chosen.length === 0 || (goal === "download" && !offer.trim())} onClick={generate} className={primaryButton}>
            {busy ? `${progress || "Writing prompt…"} (about a minute each — keep this page open)` : pageMode === "each" && chosen.length > 1 ? `Write ${chosen.length} landing page prompts` : "Write landing page prompt"}
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {list === null ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            list.map((p) => (
              <div key={p.id} className="space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                  <span>{GOAL_LABELS[p.goal]} · {BUILDER_LABELS[p.builder]} · {new Date(p.created_at).toLocaleDateString()}<br /><strong className="font-semibold">For: </strong>{p.source_labels?.length ? p.source_labels.join(" + ") : "all ads in this level"}</span>
                  {editingId !== p.id && (
                    <span className="flex items-center gap-3">
                      <CopyButton text={p.prompt} />
                      <button onClick={() => setEditingId(p.id)} className={editLink}>Edit</button>
                      <DeleteLink onConfirm={() => remove(p.id)} />
                    </span>
                  )}
                </div>
                {editingId === p.id ? (
                  <PromptEditor
                    fields={[
                      { key: "prompt", label: "Prompt", rows: 18 },
                      { key: "notes", label: "Notes", rows: 3 },
                    ]}
                    initial={{ prompt: p.prompt, notes: p.notes }}
                    onCancel={() => setEditingId(null)}
                    onSave={async (values) => {
                      const updated = await savePrompt<LandingPrompt>("landing", p.id, values);
                      setPrompts((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <>
                    <details>
                      <summary className="cursor-pointer text-sm text-orange-600">Show the prompt</summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{p.prompt}</p>
                    </details>
                    {p.notes && <p className="whitespace-pre-wrap text-xs text-neutral-500">💡 {p.notes}</p>}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

/** Writes and keeps a funnel (landing) page prompt for ONE ad angle — the page that ad's click lands on. */
export function AdLandingPrompts({ owner, angles }: { owner: ImagePromptOwner; angles: { index: number; name: string }[] }) {
  const [prompts, setPrompts] = useState<LandingPrompt[] | null>(null);
  const [goal, setGoal] = useState<Goal>("email_phone");
  const [builder, setBuilder] = useState<Builder>("ai_builder");
  const [offer, setOffer] = useState("");
  const [angleIndex, setAngleIndex] = useState(angles[0]?.index ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const query = new URLSearchParams(owner as Record<string, string>).toString();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/landing-prompts?${query}`)
      .then(readJson)
      .then((d) => { if (!cancelled) setPrompts(d.prompts as LandingPrompt[]); })
      .catch((e) => { if (!cancelled) { setError(e.message); setPrompts([]); } });
    return () => { cancelled = true; };
  }, [query]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const prompt = await runPromptJob<LandingPrompt>("/api/landing-prompts", { ...owner, angleIndex, goal, builder, offer });
      setPrompts((prev) => [prompt, ...(prev ?? [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write the prompt.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await readJson(await fetch(`/api/landing-prompts/${id}`, { method: "DELETE" }));
      setPrompts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-orange-300 bg-orange-500/5 p-4">
      <div>
        <h4 className="font-semibold">🧲 Funnel page prompt</h4>
        <p className="text-xs text-neutral-500">A landing page written to match this one ad, so the click feels continuous. Paste it into your page builder.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {angles.length > 1 && (
          <label className="text-xs">Angle
            <select className={`${selectClass} mt-1 block`} value={angleIndex} onChange={(e) => setAngleIndex(Number(e.target.value))}>
              {angles.map((a) => <option key={a.index} value={a.index}>{a.name}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs">Page goal
          <select className={`${selectClass} mt-1 block`} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
          </select>
        </label>
        <label className="text-xs">Where you&apos;ll build it
          <select className={`${selectClass} mt-1 block`} value={builder} onChange={(e) => setBuilder(e.target.value as Builder)}>
            {(Object.keys(BUILDER_LABELS) as Builder[]).map((b) => <option key={b} value={b}>{BUILDER_LABELS[b]}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-xs">
        {goal === "download" ? "The downloadable — what it is and what's inside (required)" : "Offer details or anything the page must include (optional)"}
        <textarea
          rows={3}
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder={goal === "download" ? 'e.g. "First 90 Days Survival Checklist" — PDF, 12 pages: insurance, factoring, compliance calendar…' : "e.g. free 15-min authority review, bonus, deadline…"}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <button disabled={busy || (goal === "download" && !offer.trim())} onClick={generate} className={primaryButton}>
        {busy ? "Writing prompt… (about a minute — keep this page open)" : "Write funnel page prompt"}
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {prompts === null ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : (
        prompts.map((p) => (
          <div key={p.id} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
              <span>{GOAL_LABELS[p.goal]} · {BUILDER_LABELS[p.builder]} · {new Date(p.created_at).toLocaleDateString()}</span>
              {editingId !== p.id && (
                <span className="flex items-center gap-3">
                  <CopyButton text={p.prompt} />
                  <button onClick={() => setEditingId(p.id)} className={editLink}>Edit</button>
                  <DeleteLink onConfirm={() => remove(p.id)} />
                </span>
              )}
            </div>
            {editingId === p.id ? (
              <PromptEditor
                fields={[
                  { key: "prompt", label: "Prompt", rows: 18 },
                  { key: "notes", label: "Notes", rows: 3 },
                ]}
                initial={{ prompt: p.prompt, notes: p.notes }}
                onCancel={() => setEditingId(null)}
                onSave={async (values) => {
                  const updated = await savePrompt<LandingPrompt>("landing", p.id, values);
                  setPrompts((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
                  setEditingId(null);
                }}
              />
            ) : (
              <>
                <details>
                  <summary className="cursor-pointer text-sm text-orange-600">Show the prompt</summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{p.prompt}</p>
                </details>
                {p.notes && <p className="whitespace-pre-wrap text-xs text-neutral-500">💡 {p.notes}</p>}
              </>
            )}
          </div>
        ))
      )}
    </section>
  );
}
