"use client";

import { INTAKE_SECTIONS, filledFieldCount, type IntakeFields } from "@/lib/intakeFields";

export type IntakeMode = "quick" | "full" | "push";

const QUICK_IDEA_EXAMPLES = [
  "Ad about drivers who keep leasing on and getting their pay capped — mirror that frustration, then reframe it as a dispatch problem, not a driving problem.",
  "Cost-of-inaction angle for owner-operators still parked at the same load board a year later — run the math on another year unchanged.",
  "Myth-buster: everyone thinks brokers won't work with a brand-new authority. Not true — they just won't work with a dispatcher they don't trust.",
];

function QuickIdeaPanel({
  idea,
  onIdeaChange,
}: {
  idea: string;
  onIdeaChange: (v: string) => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
        What&apos;s the ad idea?
      </label>
      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
        A sentence or two is enough — the engine works from whatever&apos;s here and flags what it had to
        guess at. More detail means fewer flags, not a requirement. Next you&apos;ll pick which angles and
        funnel style to write it in.
      </p>
      <textarea
        value={idea}
        onChange={(e) => onIdeaChange(e.target.value)}
        rows={6}
        placeholder="e.g. Ad about company drivers who are scared to go independent because they don't know how to find freight on their own..."
        className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <div className="mt-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-600">
          Examples
        </p>
        <div className="mt-1.5 space-y-1.5">
          {QUICK_IDEA_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onIdeaChange(ex)}
              className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PurePushPanel({
  idea,
  onIdeaChange,
}: {
  idea: string;
  onIdeaChange: (v: string) => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900 dark:bg-indigo-950/20">
      <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
        What&apos;s the exact concept?
      </label>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        No angle picking, no funnel/VSL screen — this idea <em>is</em> the angle. The engine fits it
        straight into Hook → Mirror → Shift → Proof → CTA as faithfully as it can, without remapping it
        onto a different technique. Write it the way you&apos;d actually say it.
      </p>
      <textarea
        value={idea}
        onChange={(e) => onIdeaChange(e.target.value)}
        rows={8}
        placeholder="Write out the concept as fully as you want — a hook line, the tension, why it's true, what makes it click. The more specific, the closer the output matches what's in your head."
        className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
    </div>
  );
}

export function IntakeForm({
  mode,
  onModeChange,
  label,
  onLabelChange,
  fields,
  onFieldChange,
  quickIdea,
  onQuickIdeaChange,
  purePushIdea,
  onPurePushIdeaChange,
  onSubmit,
  onPurePush,
  loading,
  error,
}: {
  mode: IntakeMode;
  onModeChange: (m: IntakeMode) => void;
  label: string;
  onLabelChange: (v: string) => void;
  fields: IntakeFields;
  onFieldChange: (key: string, value: string) => void;
  quickIdea: string;
  onQuickIdeaChange: (v: string) => void;
  purePushIdea: string;
  onPurePushIdeaChange: (v: string) => void;
  onSubmit: () => void;
  onPurePush: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { filled, total } = filledFieldCount(fields);
  const isPush = mode === "push";
  const primaryAction = isPush ? onPurePush : onSubmit;
  const primaryLabel = isPush ? (loading ? "Pushing it through…" : "Push it →") : "Choose styles →";

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="sticky top-0 z-10 -mx-6 border-b border-neutral-200 bg-white/90 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">New campaign kit</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {mode === "quick" && "Quick idea — the engine fills gaps with flags, not guesses."}
              {mode === "push" && "Pure push — your concept, straight into the five-beat structure."}
              {mode === "full" &&
                `${filled} of ${total} fields answered — unanswered ones become flags, not invented copy.`}
            </p>
          </div>
          <button
            onClick={primaryAction}
            disabled={loading}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      <div className="mt-5 flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900">
        <button
          onClick={() => onModeChange("quick")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "quick"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-neutral-800 dark:text-indigo-400"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          Quick idea
        </button>
        <button
          onClick={() => onModeChange("push")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "push"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-neutral-800 dark:text-indigo-400"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          Pure push
        </button>
        <button
          onClick={() => onModeChange("full")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "full"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-neutral-800 dark:text-indigo-400"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          Full intake
        </button>
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

      {mode === "quick" && <QuickIdeaPanel idea={quickIdea} onIdeaChange={onQuickIdeaChange} />}
      {mode === "push" && <PurePushPanel idea={purePushIdea} onIdeaChange={onPurePushIdeaChange} />}
      {mode === "full" &&
        INTAKE_SECTIONS.map((section) => (
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
        onClick={primaryAction}
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPush && loading ? "Pushing it through — this takes 30-90s…" : primaryLabel}
      </button>
    </div>
  );
}
