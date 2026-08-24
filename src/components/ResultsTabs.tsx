"use client";

import { useState } from "react";
import type { CampaignKit, TabKey } from "@/lib/types";
import { TAB_LABELS } from "@/lib/types";
import { Card } from "@/components/Card";
import { CopyField, CopyListField } from "@/components/CopyField";
import { AdSetCard } from "@/components/AdSetCard";

const TAB_ORDER: TabKey[] = [
  "extraction",
  "adSets",
  "optIn",
  "thankYou",
  "vsl",
  "sms",
  "email",
  "opsPlan",
  "flags",
];

export type FieldEditFn = (path: string, label: string, newValue: string | string[]) => Promise<void>;
type AdSetOrder = "generated" | "emotional";

export function ResultsTabs({
  kit,
  originalKit,
  onFieldEdit,
  angleEmotions,
}: {
  kit: CampaignKit;
  /** The frozen AI-generated snapshot, for "edited" indicators — editing is disabled if omitted. */
  originalKit?: CampaignKit;
  onFieldEdit?: FieldEditFn;
  /** Angle name -> {emotion display name, ascending development rank}, for badges and emotional-order sorting. */
  angleEmotions?: Record<string, { label: string; rank: number }>;
}) {
  const [active, setActive] = useState<TabKey>("extraction");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [adSetOrder, setAdSetOrder] = useState<AdSetOrder>("generated");
  const editable = Boolean(originalKit && onFieldEdit);

  function toggleAdSet(i: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const adSetsWithIndex = kit.adSets.map((ad, i) => ({ ad, i }));
  const orderedAdSets =
    adSetOrder === "emotional"
      ? [...adSetsWithIndex].sort((a, b) => {
          const rankA = angleEmotions?.[a.ad.angle]?.rank ?? Number.MAX_SAFE_INTEGER;
          const rankB = angleEmotions?.[b.ad.angle]?.rank ?? Number.MAX_SAFE_INTEGER;
          return rankA - rankB;
        })
      : adSetsWithIndex;
  const unassignedCount =
    adSetOrder === "emotional"
      ? kit.adSets.filter((ad) => angleEmotions?.[ad.angle] === undefined).length
      : 0;

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px dark:border-neutral-800">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === tab
                ? "border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {TAB_LABELS[tab]}
            {tab === "flags" && kit.flags.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                {kit.flags.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {active === "extraction" && (
          <Card title="Extraction block">
            <CopyListField
              label="Verbatim language"
              items={kit.extraction.verbatimLanguage}
              path={editable ? "extraction.verbatimLanguage" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.extraction.verbatimLanguage}
            />
            <CopyField
              label="Central reframe"
              value={kit.extraction.centralReframe}
              path={editable ? "extraction.centralReframe" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.extraction.centralReframe}
            />
            <CopyListField
              label="Proof stack"
              items={kit.extraction.proofStack}
              path={editable ? "extraction.proofStack" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.extraction.proofStack}
            />
            <CopyField
              label="Before state"
              value={kit.extraction.beforeState}
              path={editable ? "extraction.beforeState" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.extraction.beforeState}
            />
            <CopyField
              label="After state"
              value={kit.extraction.afterState}
              path={editable ? "extraction.afterState" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.extraction.afterState}
            />
            <CopyListField
              label="Failed alternatives"
              items={kit.extraction.failedAlternatives}
              path={editable ? "extraction.failedAlternatives" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.extraction.failedAlternatives}
            />
            <CopyListField
              label="Objections"
              items={kit.extraction.objections}
              path={editable ? "extraction.objections" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.extraction.objections}
            />
            <CopyListField
              label="False beliefs"
              items={kit.extraction.falseBeliefs}
              path={editable ? "extraction.falseBeliefs" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.extraction.falseBeliefs}
            />
            <CopyField
              label="Voice"
              value={kit.extraction.voice}
              path={editable ? "extraction.voice" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.extraction.voice}
            />
            <CopyListField
              label="Personas"
              items={kit.extraction.personas}
              path={editable ? "extraction.personas" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.extraction.personas}
            />
          </Card>
        )}

        {active === "adSets" && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {angleEmotions && Object.keys(angleEmotions).length > 0 ? (
                <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-xs font-medium dark:bg-neutral-900">
                  <button
                    onClick={() => setAdSetOrder("generated")}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      adSetOrder === "generated"
                        ? "bg-white text-orange-600 shadow-sm dark:bg-neutral-800 dark:text-orange-400"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    Generated order
                  </button>
                  <button
                    onClick={() => setAdSetOrder("emotional")}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      adSetOrder === "emotional"
                        ? "bg-white text-orange-600 shadow-sm dark:bg-neutral-800 dark:text-orange-400"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                    title="Sort by the assigned emotional tone's position on the scale, contracted to expanded — the order to actually show a client as their emotional state develops."
                  >
                    🎭 Emotional order
                  </button>
                </div>
              ) : (
                <span />
              )}
              {kit.adSets.length > 1 && (
                <div className="flex gap-3 text-xs font-medium">
                  <button
                    onClick={() => setCollapsed(new Set())}
                    className="text-orange-600 hover:underline dark:text-orange-400"
                  >
                    Expand all
                  </button>
                  <button
                    onClick={() => setCollapsed(new Set(kit.adSets.map((_, i) => i)))}
                    className="text-orange-600 hover:underline dark:text-orange-400"
                  >
                    Collapse all
                  </button>
                </div>
              )}
            </div>

            {adSetOrder === "emotional" && (
              <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                Sorted from the most contracted assigned tone to the most expanded — the sequence to actually
                show a client as they move through it.
                {unassignedCount > 0 &&
                  ` ${unassignedCount} ad set${unassignedCount > 1 ? "s have" : " has"} no tone assigned and ${
                    unassignedCount > 1 ? "sort" : "sorts"
                  } last.`}
              </p>
            )}

            <div className="space-y-4">
              {orderedAdSets.map(({ ad, i }, position) => (
                <AdSetCard
                  key={i}
                  index={i}
                  displayNumber={adSetOrder === "emotional" ? position + 1 : undefined}
                  ad={ad}
                  originalAd={originalKit?.adSets[i]}
                  onFieldEdit={onFieldEdit}
                  emotionLabel={angleEmotions?.[ad.angle]?.label}
                  expanded={!collapsed.has(i)}
                  onToggleExpanded={() => toggleAdSet(i)}
                />
              ))}
            </div>
          </div>
        )}

        {active === "optIn" && (
          <Card title="Opt-in page">
            <CopyField
              label="Eyebrow"
              value={kit.optIn.eyebrow}
              path={editable ? "optIn.eyebrow" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.optIn.eyebrow}
            />
            <CopyField
              label="Hook headline"
              value={kit.optIn.hookHeadline}
              path={editable ? "optIn.hookHeadline" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.optIn.hookHeadline}
            />
            <CopyField
              label="Sub-headline"
              value={kit.optIn.subHeadline}
              path={editable ? "optIn.subHeadline" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.optIn.subHeadline}
            />
            <CopyListField
              label="Bullets"
              items={kit.optIn.bullets}
              path={editable ? "optIn.bullets" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.optIn.bullets}
            />
            <CopyField
              label="CTA button"
              value={kit.optIn.ctaButton}
              path={editable ? "optIn.ctaButton" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.optIn.ctaButton}
            />
            <CopyField
              label="Micro-trust line"
              value={kit.optIn.microTrust}
              path={editable ? "optIn.microTrust" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.optIn.microTrust}
            />
            <CopyField
              label="Wireframe note"
              value={kit.optIn.wireframeNote}
              path={editable ? "optIn.wireframeNote" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.optIn.wireframeNote}
            />
          </Card>
        )}

        {active === "thankYou" && (
          <Card title="Thank-you page">
            <CopyField
              label="Headline"
              value={kit.thankYou.headline}
              path={editable ? "thankYou.headline" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.thankYou.headline}
            />
            <CopyField
              label="Confirmation line"
              value={kit.thankYou.confirmationLine}
              path={editable ? "thankYou.confirmationLine" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.thankYou.confirmationLine}
            />
            <CopyField
              label="You're registered video script"
              value={kit.thankYou.videoScript}
              path={editable ? "thankYou.videoScript" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.thankYou.videoScript}
            />
            <CopyField
              label="CTA"
              value={kit.thankYou.cta}
              path={editable ? "thankYou.cta" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.thankYou.cta}
            />
            <CopyField
              label="Fallback line"
              value={kit.thankYou.fallbackLine}
              path={editable ? "thankYou.fallbackLine" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.thankYou.fallbackLine}
            />
            <CopyField
              label="Wireframe note"
              value={kit.thankYou.wireframeNote}
              path={editable ? "thankYou.wireframeNote" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.thankYou.wireframeNote}
            />
          </Card>
        )}

        {active === "vsl" && (
          <Card title="Video sales letter (4-6 min)">
            {kit.vsl.sections.map((s, i) => (
              <CopyField
                key={i}
                label={`${s.timestamp} — ${s.name}`}
                value={s.script}
                path={editable ? `vsl.sections.${i}.script` : undefined}
                onSave={onFieldEdit}
                originalValue={originalKit?.vsl.sections[i]?.script}
              />
            ))}
            <CopyField
              label="Wireframe note"
              value={kit.vsl.wireframeNote}
              path={editable ? "vsl.wireframeNote" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.vsl.wireframeNote}
            />
          </Card>
        )}

        {active === "sms" && (
          <Card title="SMS sequence (3 days)">
            {kit.sms.map((m, i) => (
              <CopyField
                key={i}
                label={`Day ${m.day}`}
                value={m.message}
                path={editable ? `sms.${i}.message` : undefined}
                onSave={onFieldEdit}
                originalValue={originalKit?.sms[i]?.message}
              />
            ))}
          </Card>
        )}

        {active === "email" && (
          <Card title="Email sequence (7 days)">
            {kit.email.map((e, i) => (
              <div key={i} className="border-b border-neutral-200 pb-1 last:border-b-0 dark:border-neutral-800">
                <p className="pt-3 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Day {e.day}
                </p>
                <CopyField
                  label="Subject"
                  value={e.subject}
                  path={editable ? `email.${i}.subject` : undefined}
                  onSave={onFieldEdit}
                  originalValue={originalKit?.email[i]?.subject}
                />
                <CopyField
                  label="Body"
                  value={e.body}
                  path={editable ? `email.${i}.body` : undefined}
                  onSave={onFieldEdit}
                  originalValue={originalKit?.email[i]?.body}
                />
              </div>
            ))}
          </Card>
        )}

        {active === "opsPlan" && (
          <Card title="12-week ops plan">
            <CopyField
              label="Launch date"
              value={kit.opsPlan.launchDate}
              path={editable ? "opsPlan.launchDate" : undefined}
              onSave={onFieldEdit}
              originalValue={originalKit?.opsPlan.launchDate}
            />
            {kit.opsPlan.weeks.map((w, i) => (
              <CopyField
                key={w.week}
                label={`Week ${w.week} — ${w.dates} — ${w.focus}`}
                value={w.action}
                path={editable ? `opsPlan.weeks.${i}.action` : undefined}
                onSave={onFieldEdit}
                originalValue={originalKit?.opsPlan.weeks[i]?.action}
              />
            ))}
            <CopyListField
              label="Scoreboard metrics"
              items={kit.opsPlan.metrics}
              path={editable ? "opsPlan.metrics" : undefined}
              onSave={onFieldEdit}
              originalItems={originalKit?.opsPlan.metrics}
            />
          </Card>
        )}

        {active === "flags" && (
          <Card title="Flag sheet">
            {kit.flags.length === 0 ? (
              <p className="py-2 text-sm text-neutral-500 dark:text-neutral-400">
                No flags — the intake was complete enough to build without gaps.
              </p>
            ) : (
              kit.flags.map((f, i) => (
                <div key={i} className="border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-800">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{f.issue}</p>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{f.detail}</p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Resolve by: {f.resolveBy}</p>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
