"use client";

import { CopyField } from "@/components/CopyField";
import { EmotionBadge } from "@/components/Card";
import type { AdSet } from "@/lib/types";

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
  ad,
  emotionLabel,
}: {
  index: number;
  ad: AdSet;
  emotionLabel?: string;
}) {
  const beats: { label: keyof typeof BEAT_COLORS; value: string }[] = [
    { label: "Hook", value: ad.videoScript.hook },
    { label: "Mirror", value: ad.videoScript.mirror },
    { label: "Shift", value: ad.videoScript.shift },
    { label: "Proof", value: ad.videoScript.proof },
    { label: "CTA", value: ad.videoScript.cta },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-l-4 border-neutral-200 border-l-orange-500 bg-white shadow-sm dark:border-neutral-800 dark:border-l-orange-500">
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
