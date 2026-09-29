"use client";

import { useEffect, useRef, useState } from "react";

export type PictureOwner = { runId: string } | { contributionId: string } | { placementId: string };

interface Picture {
  id: string;
  name: string;
  image: string;
  created_at: string;
}

const MAX_EDGE = 1600;

/** Scales big photos down in the browser so uploads stay small. GIFs are kept
 * as-is (canvas would drop their animation). */
async function toDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
    reader.readAsDataURL(file);
  });
  if (file.type === "image/gif") return original;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`${file.name} isn't a readable image.`));
    el.src = original;
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 1_500_000) return original;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88);
}

/** The uploaded image creatives for one item in a funnel level. Loads when shown. */
export function PictureAds({ owner }: { owner: PictureOwner }) {
  const [pictures, setPictures] = useState<Picture[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = new URLSearchParams(owner as Record<string, string>).toString();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/picture-ads?${query}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Couldn't load pictures. Has the picture_ads migration been run?");
        if (!cancelled) setPictures(data.pictures);
      })
      .catch((e) => {
        if (!cancelled) { setError(e.message); setPictures([]); }
      });
    return () => { cancelled = true; };
  }, [query]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
        const image = await toDataUrl(file);
        const res = await fetch("/api/picture-ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...owner, image, name: file.name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `Couldn't upload ${file.name}.`);
        setPictures((prev) => [...(prev ?? []), data.picture]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(p: Picture) {
    setConfirmingId(null);
    const res = await fetch(`/api/picture-ads/${p.id}`, { method: "DELETE" });
    if (!res.ok) { setError("Couldn't delete that picture."); return; }
    setPictures((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
  }

  return (
    <div className="space-y-3">
      {pictures === null ? (
        <p className="text-sm text-neutral-400">Loading pictures…</p>
      ) : pictures.length === 0 ? (
        <p className="text-sm text-neutral-500">No picture uploaded yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pictures.map((p) => (
            <figure key={p.id} className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs, nothing for next/image to optimize */}
              <img src={p.image} alt={p.name || "Picture ad"} className="block max-h-96 w-full bg-neutral-100 object-contain dark:bg-neutral-950" />
              <figcaption className="flex items-center justify-between gap-2 p-2 text-xs">
                <span className="truncate text-neutral-500">{p.name}</span>
                <span className="flex shrink-0 gap-3">
                  <a href={p.image} download={p.name || "picture-ad"} className="text-orange-600 underline">Download</a>
                  {confirmingId === p.id ? (
                    <>
                      <button onClick={() => remove(p)} className="font-semibold text-red-600 underline">Yes, delete</button>
                      <button onClick={() => setConfirmingId(null)} className="text-neutral-500 underline">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmingId(p.id)} className="text-neutral-500 underline hover:text-red-600">Delete</button>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <label className={`inline-block cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
        {uploading ? "Uploading…" : pictures?.length ? "+ Upload another picture" : "+ Upload picture"}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
