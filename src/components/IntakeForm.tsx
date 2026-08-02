"use client";

import { INTAKE_SECTIONS, filledFieldCount, type IntakeFields } from "@/lib/intakeFields";

export function IntakeForm({
  label,
  onLabelChange,
  fields,
  onFieldChange,
  onSubmit,
  loading,
  error,
}: {
  label: string;
  onLabelChange: (v: string) => void;
  fields: IntakeFields;
  onFieldChange: (key: string, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { filled, total } = filledFieldCount(fields);

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="sticky top-0 z-10 -mx-6 border-b border-neutral-200 bg-white/90 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">New campaign kit</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {filled} of {total} fields answered — unanswered ones become flags, not invented copy.
            </p>
          </div>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Choose styles →
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Client / run label
        </label>
        <input
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g. Hotspot LGX — dispatching offer"
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {INTAKE_SECTIONS.map((section) => (
        <div key={section.title} className="mt-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {section.title}
          </h3>
          <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            {section.fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {f.question}
                </label>
                {f.hint && (
                  <p className="mt-0.5 text-xs italic text-neutral-400 dark:text-neutral-500">{f.hint}</p>
                )}
                {f.type === "input" ? (
                  <input
                    value={fields[f.key] ?? ""}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                ) : (
                  <textarea
                    value={fields[f.key] ?? ""}
                    onChange={(e) => onFieldChange(f.key, e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Choose styles →
      </button>
    </div>
  );
}
