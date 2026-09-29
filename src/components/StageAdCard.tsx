"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CopyField } from "@/components/CopyField";
import { PictureAds, type PictureOwner } from "@/components/PictureAds";
import { ImagePrompts } from "@/components/ProductionPrompts";
import { angleColor } from "@/lib/angleColors";
import { scriptBeats } from "@/lib/scriptFrameworks";
import type { AdSet, EmailMessage, Flag, SavedRun, SmsMessage } from "@/lib/types";
import type { FunnelPlacement } from "@/lib/funnels";

type Section = "copy" | "picture" | "video" | "email" | "sms";
const SECTION_LABELS: Record<Section, string> = { copy: "Ad copy", picture: "Picture ad", video: "Video script", email: "Email", sms: "SMS" };

/** One button that copies a whole block (all of an angle's ad copy, or its full script). */
function CopyAllButton({ label, text }: { label: string; text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-orange-400 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-500/10 dark:text-orange-300"
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : label}
    </button>
  );
}

function adCopyText(set: AdSet) {
  return [`Headline: ${set.headline}`, `Primary text:\n${set.primaryText}`, `Description: ${set.description}`].join("\n\n");
}

function scriptText(set: AdSet) {
  return scriptBeats(set.videoScript, set.scriptFramework)
    .map((beat) => `${beat.label.toUpperCase()}\n${beat.value}`)
    .join("\n\n");
}

/** Delete/remove with an in-page "are you sure" step. Browser confirm() pop-ups
 * are silently blocked in some previews (e.g. VS Code's built-in browser). */
function ConfirmDelete({ label, onConfirm, disabled }: { label: string; onConfirm: () => void | Promise<void>; disabled?: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" disabled={disabled} onClick={() => setAsking(true)} className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-red-400 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">
        {label}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-neutral-500">Sure?</span>
      <button type="button" disabled={disabled} onClick={async () => { await onConfirm(); setAsking(false); }} className="rounded-lg bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-500 disabled:opacity-50">
        Yes, {label.toLowerCase()}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="text-neutral-500 underline">Cancel</button>
    </span>
  );
}

/** Dropdown for choosing the single angle (kit.adSets index) an ad uses in a funnel level. */
export function AnglePicker({
  ad,
  value,
  onChange,
  disabled,
  taken = [],
  className = "",
}: {
  ad: SavedRun;
  value: number | null;
  onChange: (index: number) => void;
  disabled?: boolean;
  /** Angles already placed in this level — shown but not selectable. */
  taken?: number[];
  className?: string;
}) {
  return (
    <select
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => e.target.value !== "" && onChange(Number(e.target.value))}
      className={`rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      <option value="" disabled>Choose one angle…</option>
      {ad.kit.adSets.map((set, i) => (
        <option key={i} value={i} disabled={taken.includes(i) && i !== value}>
          {set.angle || `Angle ${i + 1}`}{taken.includes(i) ? " (already here)" : ""}
        </option>
      ))}
    </select>
  );
}

/**
 * One item in a funnel level — an assigned ad or a piece of level copy
 * (foundation, AI concept, pasted). Collapsed: name, kind, angles, counts.
 * Open: Ad copy / Picture ad / Video script / Email / SMS tabs. "Ad copy" is
 * the post text; "Picture ad" is the uploaded image creative.
 */
export function LevelCard({
  title,
  kind,
  adSets,
  email,
  sms,
  flags = [],
  notice,
  headerExtra,
  actions,
  onSaveAdField,
  pictureOwner,
  angleIndices,
  onDelete,
  deleteLabel = "Delete",
  deleteDisabled,
}: {
  title: string;
  kind: string;
  adSets: AdSet[];
  email: EmailMessage[];
  sms: SmsMessage[];
  flags?: Flag[];
  /** Always-visible bar under the header (e.g. "pick an angle"). */
  notice?: ReactNode;
  /** Shown at the top of the open body (e.g. the angle switcher). */
  headerExtra?: ReactNode;
  actions?: ReactNode;
  /** Makes picture/video fields editable. Path is relative to the item's copy, e.g. "adSets.0.headline". */
  onSaveAdField?: (path: string, value: string) => Promise<void>;
  /** Which item uploaded picture-ad images belong to. */
  pictureOwner: PictureOwner;
  /** Each shown angle's index in its source copy (defaults to 0, 1, 2…), for image prompts. */
  angleIndices?: number[];
  /** Shows an always-visible delete/remove control in the card header. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("copy");
  // Picture count isn't known until the images load, so that tab shows none.
  const counts: Record<Section, number | null> = { copy: adSets.length, picture: null, video: adSets.length, email: email.length, sms: sms.length };
  const save = onSaveAdField ? (path: string, _label: string, v: string) => onSaveAdField(path, v) : undefined;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3 p-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {kind} · {email.length} email{email.length === 1 ? "" : "s"} · {sms.length} SMS
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {adSets.map((set, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${angleColor(set.angle).badge}`}>{set.angle}</span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-sm text-neutral-400">{open ? "▲ Close" : "▼ Open"}</span>
      </button>
      {onDelete && <div className="shrink-0"><ConfirmDelete label={deleteLabel} onConfirm={onDelete} disabled={deleteDisabled} /></div>}
      </div>

      {notice && (
        <div className="flex flex-wrap items-center gap-3 border-t border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">{notice}</div>
      )}

      {open && (
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          {headerExtra}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="tablist">
              {(Object.keys(SECTION_LABELS) as Section[]).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={section === s}
                  onClick={() => setSection(s)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${section === s ? "border-orange-500 bg-orange-500/10 font-semibold text-orange-700 dark:text-orange-300" : "border-neutral-300 dark:border-neutral-700"}`}
                >
                  {SECTION_LABELS[s]}{counts[s] !== null && ` (${counts[s]})`}
                </button>
              ))}
            </div>
            <div className="flex gap-3 text-sm">{actions}</div>
          </div>

          {section === "picture" && (
            <div className="space-y-4">
              {!("runId" in pictureOwner) && (
                <ImagePrompts owner={pictureOwner} angles={adSets.map((set, i) => ({ index: angleIndices?.[i] ?? i, name: set.angle || `Angle ${i + 1}` }))} />
              )}
              <PictureAds owner={pictureOwner} />
            </div>
          )}

          {section === "copy" &&
            adSets.map((set, i) => (
              <div key={i} className={`mb-5 border-l-4 pl-3 last:mb-0 ${angleColor(set.angle).border}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${angleColor(set.angle).badge}`}>{set.angle}</span>
                  <CopyAllButton label="Copy all ad copy" text={adCopyText(set)} />
                </div>
                <CopyField label="Headline" value={set.headline} path={save && `adSets.${i}.headline`} onSave={save} />
                <CopyField label="Primary text" value={set.primaryText} path={save && `adSets.${i}.primaryText`} onSave={save} />
                <CopyField label="Description" value={set.description} path={save && `adSets.${i}.description`} onSave={save} />
              </div>
            ))}

          {section === "video" &&
            adSets.map((set, i) => (
              <div key={i} className={`mb-5 border-l-4 pl-3 last:mb-0 ${angleColor(set.angle).border}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${angleColor(set.angle).badge}`}>{set.angle}</span>
                  <CopyAllButton label="Copy full script" text={scriptText(set)} />
                </div>
                {scriptBeats(set.videoScript, set.scriptFramework).map((beat) => (
                  <CopyField key={beat.key} label={beat.label} value={beat.value} accent={angleColor(set.angle).dot} path={save && `adSets.${i}.videoScript.${beat.key}`} onSave={save} />
                ))}
              </div>
            ))}

          {section === "email" &&
            (email.length === 0 ? (
              <p className="text-sm text-neutral-500">No emails.</p>
            ) : (
              email.map((e, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <CopyField label={`Email ${i + 1} · day ${e.day} · subject`} value={e.subject} />
                  <CopyField label="Body" value={e.body} />
                </div>
              ))
            ))}

          {section === "sms" &&
            (sms.length === 0 ? (
              <p className="text-sm text-neutral-500">No SMS.</p>
            ) : (
              sms.map((m, i) => <CopyField key={i} label={`SMS ${i + 1} · day ${m.day}`} value={m.message} />)
            ))}

          {flags.length > 0 && (
            <details className="mt-4 text-sm text-amber-700 dark:text-amber-400">
              <summary className="cursor-pointer">Review before use: {flags.length} flag{flags.length === 1 ? "" : "s"}</summary>
              {flags.map((f, i) => (
                <p className="mt-2" key={i}><strong>{f.issue}:</strong> {f.detail} — {f.resolveBy}</p>
              ))}
            </details>
          )}
        </div>
      )}
    </section>
  );
}

/** One angle of an ad placed into a funnel level. The same ad can appear in
 * several cards — one per placement — each with its own angle and pictures. */
export function StageAdCard({
  ad,
  placement,
  onRemove,
  onChangeAngle,
  removing,
}: {
  ad: SavedRun;
  placement: FunnelPlacement;
  onRemove: () => void;
  onChangeAngle: (index: number) => void;
  removing?: boolean;
}) {
  const i = placement.angle_index ?? (ad.kit.adSets.length === 1 ? 0 : null);
  const chosen = i !== null && ad.kit.adSets[i] ? i : null;
  // A single-angle ad needs no choice; otherwise show every angle until one is picked.
  const needsChoice = chosen === null && ad.kit.adSets.length > 1;
  return (
    <LevelCard
      title={ad.label}
      kind="Ad"
      pictureOwner={{ placementId: placement.id }}
      adSets={chosen !== null ? [ad.kit.adSets[chosen]] : ad.kit.adSets}
      angleIndices={chosen !== null ? [chosen] : ad.kit.adSets.map((_, n) => n)}
      email={ad.kit.email}
      sms={ad.kit.sms}
      notice={
        needsChoice && (
          <>
            <span>Pick the one angle this level uses:</span>
            <AnglePicker ad={ad} value={null} onChange={onChangeAngle} disabled={removing} />
          </>
        )
      }
      headerExtra={
        ad.kit.adSets.length > 1 &&
        !needsChoice && (
          <label className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            Angle used here
            <AnglePicker ad={ad} value={chosen} onChange={onChangeAngle} disabled={removing} />
          </label>
        )
      }
      onDelete={onRemove}
      deleteLabel="Remove"
      deleteDisabled={removing}
      actions={<Link href={`/ads?open=${ad.id}`} className="text-orange-600 underline">Edit in Ad Sets</Link>}
    />
  );
}
