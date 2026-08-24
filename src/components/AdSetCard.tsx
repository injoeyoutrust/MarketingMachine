"use client";

import { CopyField } from "@/components/CopyField";
import { EmotionBadge } from "@/components/Card";
import type { AdSet } from "@/lib/types";

// Cycled by ad-set index so consecutive cards are never the same color —
// the fastest way to tell at a glance where one ad set ends and the next
// begins when scrolling through several.
const ACCENTS = [
  "border-l-indigo-500",
  "border-l-violet-500",
  "border-l-blue-500",
  "border-l-teal-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-fuchsia-500",
];

// Fixed per beat (not per card) so the same color always means the same
// beat across every ad set — Hook is always this blue, Proof always this
// green, everywhere in the kit.
const BEAT_COLORS: Record<string, string> = {
  Hook: "bg-sky-500",
  Mirror: "bg-blue-500",
  Shift: "bg-violet-500",
  Proof: "bg-emerald-500",
  CTA: "bg-amber-500",
};

export function AdSetCard({
  index,
  ad,
  emotionLabel,
}: {
  index: number;
  ad: AdSet;
  emotionLabel?: string;
}) {
  const accent = ACCENTS[index % ACCENTS.length];
  const beats: { label: keyof typeof BEAT_COLORS; value: string }[] = [
    { label: "Hook", value: ad.videoScript.hook },
    { label: "Mirror", value: ad.videoScript.mirror },
    { label: "Shift", value: ad.videoScript.shift },
    { label: "Proof", value: ad.videoScript.proof },
    { label: "CTA", value: ad.videoScript.cta },
  ];

  return (
    <div
      className={`overflow-hidden rounded-xl border border-l-4 border-neutral-200 bg-white shadow-sm dark:border-neutral-800 ${accent}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[0.7rem] font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">
            {index + 1}
          </span>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{ad.angle}</h3>
        </div>
        {emotionLabel && <EmotionBadge label={emotionLabel} />}
      </div>

      <div className="bg-white px-5 py-3 dark:bg-neutral-900">
        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Ad copy
        </p>
        <CopyField label="Primary text" value={ad.primaryText} />
        <CopyField label="Headline" value={ad.headline} />
        <CopyField label="Description" value={ad.description} />
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950/50">
        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Video script (45-60s)
        </p>
        {beats.map((b) => (
          <CopyField key={b.label} label={b.label} value={b.value} accent={BEAT_COLORS[b.label]} />
        ))}
      </div>
    </div>
  );
}
