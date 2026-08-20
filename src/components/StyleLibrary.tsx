"use client";

import { useRef, useState } from "react";
import { sortEmotionStyles, type Style, type StyleCategory, type StyleExample } from "@/lib/styleLibrary";
import { addExample, addStyle, deleteStyle, removeExample } from "@/lib/styleStorage";

const CATEGORY_NOUN: Record<StyleCategory, string> = {
  adAngle: "ad angle",
  funnelStyle: "funnel style",
  vslStyle: "VSL style",
  emotionalTone: "emotional tone",
};

const CATEGORY_TABS: { key: StyleCategory; label: string }[] = [
  { key: "adAngle", label: "Ad Copy & Video Ad Copy angles" },
  { key: "funnelStyle", label: "Funnel Copy styles" },
  { key: "vslStyle", label: "VSL styles" },
  { key: "emotionalTone", label: "Emotional Tone" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AddExampleForm({ style, onAdded }: { style: Style; onAdded: () => void }) {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (mode === "text") {
        if (!text.trim()) return;
        const example: StyleExample = {
          id: crypto.randomUUID(),
          type: "text",
          label: label.trim() || "Untitled transcript",
          content: text.trim(),
        };
        await addExample(style, example);
        setText("");
        setLabel("");
        setOpen(false);
        onAdded();
      } else {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;
        const dataUrl = await fileToDataUrl(file);
        const example: StyleExample = {
          id: crypto.randomUUID(),
          type: "image",
          label: label.trim() || file.name,
          content: dataUrl,
        };
        await addExample(style, example);
        setLabel("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setOpen(false);
        onAdded();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        + Add reference example
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-2 flex gap-1">
        <button
          onClick={() => setMode("text")}
          className={`rounded px-2 py-1 text-xs font-medium ${mode === "text" ? "bg-indigo-600 text-white" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`}
        >
          Paste transcript / sales letter
        </button>
        <button
          onClick={() => setMode("image")}
          className={`rounded px-2 py-1 text-xs font-medium ${mode === "image" ? "bg-indigo-600 text-white" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`}
        >
          Upload funnel screenshot
        </button>
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (e.g. Client X opt-in page)"
        className="mb-2 w-full rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      {mode === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Paste the ad transcript, video script, or sales letter to mimic the technique of..."
          className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 font-mono text-xs text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
      ) : (
        <input ref={fileInputRef} type="file" accept="image/*" className="w-full text-xs text-neutral-600 dark:text-neutral-300" />
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save example"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded px-3 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function StyleCard({ style, onChanged }: { style: Style; onChanged: () => void }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{style.name}</h4>
            {style.builtIn && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.65rem] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                built-in
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{style.description}</p>
        </div>
        <button
          onClick={async () => {
            if (confirm(`Delete "${style.name}"? This can't be undone.`)) {
              await deleteStyle(style.id);
              onChanged();
            }
          }}
          className="shrink-0 rounded p-1 text-neutral-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
          title="Delete style"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
          </svg>
        </button>
      </div>

      {style.examples.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-neutral-100 pt-2 dark:border-neutral-800">
          {style.examples.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between rounded bg-neutral-50 px-2 py-1 text-xs dark:bg-neutral-800/60">
              <span className="truncate text-neutral-600 dark:text-neutral-300">
                {ex.type === "image" ? "🖼️" : "📄"} {ex.label}
              </span>
              <button
                onClick={async () => {
                  await removeExample(style, ex.id);
                  onChanged();
                }}
                className="ml-2 shrink-0 text-neutral-400 hover:text-red-600"
                title="Remove example"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <AddExampleForm style={style} onAdded={onChanged} />
    </div>
  );
}

function NewStyleForm({ category, onAdded }: { category: StyleCategory; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSave() {
    if (!name.trim() || !description.trim()) return;
    await addStyle({
      category,
      name: name.trim(),
      description: description.trim(),
    });
    setName("");
    setDescription("");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-neutral-700 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
      >
        + Add a new {CATEGORY_NOUN[category]}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/40">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Style name, e.g. 'Insider secret'"
        className="mb-2 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Describe the mechanism — what makes this angle/style distinct"
        className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={handleSave} className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
          Save style
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function StyleLibrary({ styles, onChanged }: { styles: Style[]; onChanged: () => void }) {
  const [tab, setTab] = useState<StyleCategory>("adAngle");
  const filtered =
    tab === "emotionalTone"
      ? sortEmotionStyles(styles.filter((s) => s.category === tab))
      : styles.filter((s) => s.category === tab);

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Style library</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        These are the angles and funnel structures available when generating a kit. Attach reference
        transcripts or funnel screenshots so the engine mimics their technique — not their exact wording.
      </p>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${tab === t.key ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-neutral-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "emotionalTone" && (
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          Adapted from David Hawkins&apos; Map of Consciousness — used here as a creative/tonal
          reference for voice, not a scientific claim. Assign one per ad angle in the style-selection
          step: that ad&apos;s hook, mirror, shift, proof, and CTA all get written from inside that one
          state.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((style) => (
          <StyleCard key={style.id} style={style} onChanged={onChanged} />
        ))}
        <NewStyleForm category={tab} onAdded={onChanged} />
      </div>
    </div>
  );
}
