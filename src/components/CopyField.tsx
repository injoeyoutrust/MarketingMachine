"use client";

import { useState } from "react";

type SaveFn = (path: string, label: string, newValue: string) => Promise<void>;

export function CopyField({
  label,
  value,
  mono = false,
  accent,
  path,
  onSave,
  originalValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  /** Tailwind bg-color class (e.g. "bg-orange-500") for a small dot before the label — used to color-code beats like Hook/Mirror/Shift/Proof/CTA consistently across cards. */
  accent?: string;
  /** Dot path into the kit (e.g. "adSets.0.videoScript.hook") — pass together with onSave to make this field editable. */
  path?: string;
  onSave?: SaveFn;
  /** The AI-generated value at this path, for an "Edited" indicator when it differs from the current value. Only meaningful alongside path/onSave. */
  originalValue?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const editable = Boolean(path && onSave);
  const wasEdited = editable && originalValue !== undefined && originalValue !== value;

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function startEdit() {
    setDraft(value);
    setShowOriginal(false);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(value);
    setEditing(false);
  }

  async function handleSave() {
    if (!path || !onSave || draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(path, label, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-800">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {accent && <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />}
          {label}
          {wasEdited && (
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-semibold normal-case text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
              title="This field was edited after generation — click to see the original"
            >
              edited
            </button>
          )}
        </span>
        <div className="flex shrink-0 gap-1">
          {editing ? (
            <>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="rounded px-2 py-0.5 text-[0.7rem] font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-60 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-orange-600 px-2 py-0.5 text-[0.7rem] font-medium text-white hover:bg-orange-500 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <>
              {editable && (
                <button
                  onClick={startEdit}
                  className="rounded bg-neutral-100 px-2 py-0.5 text-[0.7rem] font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleCopy}
                className={`rounded px-2 py-0.5 text-[0.7rem] font-medium transition-colors ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.min(16, Math.max(3, Math.ceil(draft.length / 60)))}
          autoFocus
          className={`w-full rounded border border-orange-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-orange-800 dark:bg-neutral-950 dark:text-neutral-100 ${
            mono ? "font-mono text-[0.8rem]" : ""
          }`}
        />
      ) : (
        <p
          className={`whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 ${
            mono ? "font-mono text-[0.8rem]" : ""
          }`}
        >
          {value}
        </p>
      )}

      {showOriginal && !editing && (
        <div className="mt-2 rounded border border-dashed border-amber-300 bg-amber-50 px-2 py-1.5 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Original AI output
          </p>
          <p className="whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-200">{originalValue}</p>
        </div>
      )}
    </div>
  );
}

export function CopyListField({
  label,
  items,
  path,
  onSave,
  originalItems,
}: {
  label: string;
  items: string[];
  path?: string;
  onSave?: (path: string, label: string, newItems: string[]) => Promise<void>;
  originalItems?: string[];
}) {
  const joined = items.map((i) => `• ${i}`).join("\n");
  const originalJoined = originalItems ? originalItems.map((i) => `• ${i}`).join("\n") : undefined;

  const wrappedSave: SaveFn | undefined = onSave
    ? async (p, l, newValue) => {
        const parsedItems = newValue
          .split("\n")
          .map((line) => line.replace(/^\s*[•\-*]\s*/, "").trim())
          .filter((line) => line.length > 0);
        await onSave(p, l, parsedItems);
      }
    : undefined;

  return (
    <CopyField label={label} value={joined} path={path} onSave={wrappedSave} originalValue={originalJoined} />
  );
}
