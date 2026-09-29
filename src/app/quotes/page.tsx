"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Quote {
  id: string;
  text: string;
  source: string;
  note: string;
  created_at: string;
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900";

/** Parses an API response, turning an empty/non-JSON body (an unhandled
 * server crash, usually missing Supabase env vars) into a readable error. */
async function readJson(res: Response) {
  const body = await res.text();
  let data: { error?: string; [key: string]: unknown } = {};
  try { data = body ? JSON.parse(body) : {}; } catch { /* non-JSON error page */ }
  if (!res.ok) {
    throw new Error(data.error ?? `Server error (${res.status}). Check the dev server terminal — Supabase env vars in .env.local may be missing.`);
  }
  return data;
}

export default function QuoteBank() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Quote | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/quotes")
      .then(readJson)
      .then((data) => setQuotes(data.quotes as Quote[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load quotes."))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!text.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source, note }),
      });
      const data = await readJson(res);
      setQuotes((prev) => [data.quote as Quote, ...prev]);
      setText("");
      setNote("");
      // Source is kept — several quotes in a row often come from the same place.
      textRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that quote.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing || !editing.text.trim()) return;
    setError("");
    const res = await fetch(`/api/quotes/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editing.text, source: editing.source, note: editing.note }),
    });
    try {
      const updated = (await readJson(res)).quote as Quote;
      setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that edit.");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    try {
      await readJson(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete that quote.");
      return;
    }
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleCopy(quote: Quote) {
    try {
      await navigator.clipboard.writeText(quote.source ? `"${quote.text}" — ${quote.source}` : quote.text);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId((id) => (id === quote.id ? null : id)), 1500);
    } catch {
      setError("Clipboard unavailable — select the text to copy it.");
    }
  }

  const needle = search.trim().toLowerCase();
  const visible = needle
    ? quotes.filter((q) => [q.text, q.source, q.note].some((f) => f.toLowerCase().includes(needle)))
    : quotes;

  return (
    <main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Quote Bank</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Drop great lines here the moment you think of them. Press ⌘/Ctrl + Enter to save.
          </p>
        </div>

        <section className="space-y-3 rounded-xl border border-orange-300 bg-orange-500/5 p-4">
          <textarea
            ref={textRef}
            rows={3}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
            }}
            placeholder="The quote…"
            className={inputClass}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Who said it / where from (optional)" className={inputClass} />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note — how you might use it (optional)" className={inputClass} />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !text.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "+ Add quote"}
          </button>
        </section>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes…" className={`${inputClass} max-w-xs`} />
          <span className="text-xs text-neutral-500">
            {needle ? `${visible.length} of ${quotes.length}` : quotes.length} quote{quotes.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-neutral-400">{quotes.length === 0 ? "No quotes yet. Add your first one above." : "Nothing matches that search."}</p>
        ) : (
          <ul className="space-y-3">
            {visible.map((q) =>
              editing?.id === q.id ? (
                <li key={q.id} className="space-y-2 rounded-xl border border-orange-400 p-4">
                  <textarea rows={3} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} className={inputClass} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} placeholder="Source" className={inputClass} />
                    <input value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Note" className={inputClass} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={!editing.text.trim()} className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Save</button>
                    <button onClick={() => setEditing(null)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Cancel</button>
                  </div>
                </li>
              ) : (
                <li key={q.id} className="group rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                  <blockquote className="whitespace-pre-wrap text-base leading-relaxed">“{q.text}”</blockquote>
                  {q.source && <p className="mt-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">— {q.source}</p>}
                  {q.note && <p className="mt-1 text-xs italic text-neutral-500">{q.note}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="text-neutral-400">{new Date(q.created_at).toLocaleDateString()}</span>
                    <button onClick={() => handleCopy(q)} className="text-orange-600">{copiedId === q.id ? "Copied!" : "Copy"}</button>
                    <button onClick={() => setEditing(q)} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">Edit</button>
                    <button onClick={() => handleDelete(q.id)} className="text-neutral-400 hover:text-red-600">Delete</button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
