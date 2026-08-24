"use client";

import { useState } from "react";
import { CopyField } from "@/components/CopyField";
import { EmotionBadge } from "@/components/Card";
import type { AdSet } from "@/lib/types";
import type { FieldEditFn } from "@/components/ResultsTabs";

// Fixed per beat (not per card), light to dark following the beat's place
// in the arc — Hook is always the lightest, CTA always the darkest,
// everywhere in the kit. One accent family (orange), not a rainbow.
const BEAT_COLORS: Record<string, string> = {
  Hook: "bg-orange-300",
  Mirror: "bg-orange-400",
  Shift: "bg-orange-500",
  Proof: "bg-orange-600",
  CTA: "bg-orange-700",
};

export function AdSetCard({
  index,
  displayNumber,
  ad,
  originalAd,
  onFieldEdit,
  emotionLabel,
  expanded,
  onToggleExpanded,
}: {
  /** True position in kit.adSets — used for edit paths ("adSets.{index}...."). Never changes with display order. */
  index: number;
  /** Position to show in the numbered badge (e.g. when reordered by emotional development rank). Defaults to index + 1. */
  displayNumber?: number;
  ad: AdSet;
  /** The frozen AI-generated version of this ad, for "edited" indicators — editing is disabled if omitted. */
  originalAd?: AdSet;
  onFieldEdit?: FieldEditFn;
  emotionLabel?: string;
  /** Controlled from the parent so "collapse all / expand all" can work; defaults to expanded if omitted. */
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const [localExpanded, setLocalExpanded] = useState(true);
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : localExpanded;
  const toggle = onToggleExpanded ?? (() => setLocalExpanded((v) => !v));

  const editable = Boolean(originalAd && onFieldEdit);
  const prefix = `adSets.${index}`;
  const beats: { label: keyof typeof BEAT_COLORS; key: keyof AdSet["videoScript"]; value: string }[] = [
    { label: "Hook", key: "hook", value: ad.videoScript.hook },
    { label: "Mirror", key: "mirror", value: ad.videoScript.mirror },
    { label: "Shift", key: "shift", value: ad.videoScript.shift },
    { label: "Proof", key: "proof", value: ad.videoScript.proof },
    { label: "CTA", key: "cta", value: ad.videoScript.cta },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-l-4 border-neutral-200 border-l-orange-500 bg-white shadow-sm dark:border-neutral-800 dark:border-l-orange-500">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-left dark:border-neutral-800 dark:bg-neutral-900/60"
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`shrink-0 text-neutral-400 transition-transform dark:text-neutral-500 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[0.7rem] font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">
            {displayNumber ?? index + 1}
          </span>
          <h3 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">{ad.angle}</h3>
        </div>
        {emotionLabel && <EmotionBadge label={emotionLabel} />}
      </button>

      {isExpanded && (
        <>
          <div className="bg-white px-5 py-3 dark:bg-neutral-900">
            <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Ad copy
            </p>
            <CopyField
              label="Primary text"
              value={ad.primaryText}
              path={editable ? `${prefix}.primaryText` : undefined}
              onSave={onFieldEdit}
              originalValue={originalAd?.primaryText}
            />
            <CopyField
              label="Headline"
              value={ad.headline}
              path={editable ? `${prefix}.headline` : undefined}
              onSave={onFieldEdit}
              originalValue={originalAd?.headline}
            />
            <CopyField
              label="Description"
              value={ad.description}
              path={editable ? `${prefix}.description` : undefined}
              onSave={onFieldEdit}
              originalValue={originalAd?.description}
            />
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950/50">
            <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Video script (45-60s)
            </p>
            {beats.map((b) => (
              <CopyField
                key={b.label}
                label={b.label}
                value={b.value}
                accent={BEAT_COLORS[b.label]}
                path={editable ? `${prefix}.videoScript.${b.key}` : undefined}
                onSave={onFieldEdit}
                originalValue={originalAd?.videoScript[b.key]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
