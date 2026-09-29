"use client";

import { FUNNEL_STAGES, STAGE_DESCRIPTIONS, STAGE_LABELS, type FunnelStage } from "@/lib/funnels";

/** How far (in % of the full width) each side steps in per level. Three levels
 * × 15% leaves the bottom tip 10% wide so BOFU's count still fits. */
const STEP = 15;

const SHADES: Record<FunnelStage, string> = {
  TOFO: "bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-900/60",
  MOFO: "bg-orange-200 hover:bg-orange-300 dark:bg-orange-900/60 dark:hover:bg-orange-800/60",
  BOFO: "bg-orange-300 hover:bg-orange-400 dark:bg-orange-800/60 dark:hover:bg-orange-700/60",
};

/** Inverted-triangle funnel: one clickable band per stage, each showing how
 * many items (assigned ads + level copy) it holds. */
export function FunnelPyramid({
  counts,
  selected,
  onSelect,
  disabled,
}: {
  counts: Record<FunnelStage, number>;
  selected: FunnelStage | null;
  onSelect: (stage: FunnelStage) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-1">
      {FUNNEL_STAGES.map((stage, k) => {
        const top = STEP * k;
        const bottom = STEP * (k + 1);
        const isSelected = selected === stage;
        const n = counts[stage];
        return (
          <button
            key={stage}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(stage)}
            aria-pressed={isSelected}
            aria-label={`${STAGE_LABELS[stage]}: ${n} item${n === 1 ? "" : "s"}. Open this level.`}
            title={STAGE_DESCRIPTIONS[stage]}
            style={{ clipPath: `polygon(${top}% 0, ${100 - top}% 0, ${100 - bottom}% 100%, ${bottom}% 100%)` }}
            className={`flex h-24 w-full flex-col items-center justify-center gap-1 transition-colors focus-visible:brightness-90 focus-visible:outline-none disabled:opacity-60 sm:h-28 ${
              isSelected ? "bg-orange-600 text-white" : `${SHADES[stage]} text-neutral-900 dark:text-neutral-100`
            }`}
          >
            <span className="text-sm font-bold tracking-widest sm:text-base">{STAGE_LABELS[stage]}</span>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-bold sm:h-11 sm:w-11 ${
                isSelected ? "border-white" : "border-neutral-800 dark:border-neutral-200"
              }`}
            >
              {n}
            </span>
          </button>
        );
      })}
      <p className="pt-2 text-center text-xs text-neutral-500">
        Number = everything in that level. Click a level to open it.
      </p>
    </div>
  );
}
