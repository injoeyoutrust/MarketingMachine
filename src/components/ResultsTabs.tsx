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

export function ResultsTabs({
  kit,
  angleEmotions,
}: {
  kit: CampaignKit;
  /** Angle name -> emotion display name (e.g. "Grief"), for ad sets that had one assigned. */
  angleEmotions?: Record<string, string>;
}) {
  const [active, setActive] = useState<TabKey>("extraction");

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px dark:border-neutral-800">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active === tab
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
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
            <CopyListField label="Verbatim language" items={kit.extraction.verbatimLanguage} />
            <CopyField label="Central reframe" value={kit.extraction.centralReframe} />
            <CopyListField label="Proof stack" items={kit.extraction.proofStack} />
            <CopyField label="Before state" value={kit.extraction.beforeState} />
            <CopyField label="After state" value={kit.extraction.afterState} />
            <CopyListField label="Failed alternatives" items={kit.extraction.failedAlternatives} />
            <CopyListField label="Objections" items={kit.extraction.objections} />
            <CopyListField label="False beliefs" items={kit.extraction.falseBeliefs} />
            <CopyField label="Voice" value={kit.extraction.voice} />
            <CopyListField label="Personas" items={kit.extraction.personas} />
          </Card>
        )}

        {active === "adSets" && (
          <div className="space-y-6">
            {kit.adSets.map((ad, i) => (
              <AdSetCard key={i} index={i} ad={ad} emotionLabel={angleEmotions?.[ad.angle]} />
            ))}
          </div>
        )}

        {active === "optIn" && (
          <Card title="Opt-in page">
            <CopyField label="Eyebrow" value={kit.optIn.eyebrow} />
            <CopyField label="Hook headline" value={kit.optIn.hookHeadline} />
            <CopyField label="Sub-headline" value={kit.optIn.subHeadline} />
            <CopyListField label="Bullets" items={kit.optIn.bullets} />
            <CopyField label="CTA button" value={kit.optIn.ctaButton} />
            <CopyField label="Micro-trust line" value={kit.optIn.microTrust} />
            <CopyField label="Wireframe note" value={kit.optIn.wireframeNote} />
          </Card>
        )}

        {active === "thankYou" && (
          <Card title="Thank-you page">
            <CopyField label="Headline" value={kit.thankYou.headline} />
            <CopyField label="Confirmation line" value={kit.thankYou.confirmationLine} />
            <CopyField label="You're registered video script" value={kit.thankYou.videoScript} />
            <CopyField label="CTA" value={kit.thankYou.cta} />
            <CopyField label="Fallback line" value={kit.thankYou.fallbackLine} />
            <CopyField label="Wireframe note" value={kit.thankYou.wireframeNote} />
          </Card>
        )}

        {active === "vsl" && (
          <Card title="Video sales letter (4-6 min)">
            {kit.vsl.sections.map((s, i) => (
              <CopyField key={i} label={`${s.timestamp} — ${s.name}`} value={s.script} />
            ))}
            <CopyField label="Wireframe note" value={kit.vsl.wireframeNote} />
          </Card>
        )}

        {active === "sms" && (
          <Card title="SMS sequence (3 days)">
            {kit.sms.map((m, i) => (
              <CopyField key={i} label={`Day ${m.day}`} value={m.message} />
            ))}
          </Card>
        )}

        {active === "email" && (
          <Card title="Email sequence (7 days)">
            {kit.email.map((e, i) => (
              <CopyField key={i} label={`Day ${e.day} — ${e.subject}`} value={e.body} />
            ))}
          </Card>
        )}

        {active === "opsPlan" && (
          <Card title="12-week ops plan">
            <CopyField label="Launch date" value={kit.opsPlan.launchDate} />
            {kit.opsPlan.weeks.map((w) => (
              <CopyField
                key={w.week}
                label={`Week ${w.week} — ${w.dates} — ${w.focus}`}
                value={w.action}
              />
            ))}
            <CopyListField label="Scoreboard metrics" items={kit.opsPlan.metrics} />
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
