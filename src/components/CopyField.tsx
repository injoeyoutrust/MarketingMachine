"use client";

import { useState } from "react";

export function CopyField({
  label,
  value,
  mono = false,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  /** Tailwind bg-color class (e.g. "bg-orange-500") for a small dot before the label — used to color-code beats like Hook/Mirror/Shift/Proof/CTA consistently across cards. */
  accent?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-800">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {accent && <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />}
          {label}
        </span>
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
      </div>
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 ${
          mono ? "font-mono text-[0.8rem]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function CopyListField({ label, items }: { label: string; items: string[] }) {
  return <CopyField label={label} value={items.map((i) => `• ${i}`).join("\n")} />;
}
