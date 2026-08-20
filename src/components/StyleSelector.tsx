"use client";

import type { Style } from "@/lib/styleLibrary";

function StyleOption({
  style,
  checked,
  onToggle,
  inputType,
  groupName,
  extra,
}: {
  style: Style;
  checked: boolean;
  onToggle: () => void;
  inputType: "checkbox" | "radio";
  groupName?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm transition-colors ${
        checked
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/40"
          : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/50"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type={inputType}
          name={groupName}
          checked={checked}
          onChange={onToggle}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium text-neutral-900 dark:text-neutral-100">
            {style.name}
            {style.examples.length > 0 && (
              <span className="ml-1.5 text-[0.65rem] font-normal text-indigo-600 dark:text-indigo-400">
                {style.examples.length} ref{style.examples.length > 1 ? "s" : ""}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{style.description}</span>
        </span>
      </label>
      {checked && extra && <div className="mt-2 pl-6">{extra}</div>}
    </div>
  );
}

export function StyleSelector({
  styles,
  selectedAngleIds,
  onToggleAngle,
  angleEmotionIds,
  onSetAngleEmotion,
  selectedFunnelId,
  onSelectFunnel,
  selectedVslId,
  onSelectVsl,
  onBack,
  onGenerate,
  loading,
  error,
}: {
  styles: Style[];
  selectedAngleIds: string[];
  onToggleAngle: (id: string) => void;
  angleEmotionIds: Record<string, string>;
  onSetAngleEmotion: (angleId: string, emotionId: string) => void;
  selectedFunnelId: string | null;
  onSelectFunnel: (id: string) => void;
  selectedVslId: string | null;
  onSelectVsl: (id: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
}) {
  const angles = styles.filter((s) => s.category === "adAngle");
  const funnels = styles.filter((s) => s.category === "funnelStyle");
  const vslStyles = styles.filter((s) => s.category === "vslStyle");
  const emotions = styles.filter((s) => s.category === "emotionalTone");

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <button onClick={onBack} className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
        ← Back to intake
      </button>

      <h2 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Choose the styles to write
      </h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Pick as many ad angles as you want — one ad set (primary text + video script) gets written per
        angle selected, each with its own emotional tone. Pick one funnel style to shape the opt-in and
        thank-you pages, and one VSL style for the centerpiece video (used only if the chosen funnel
        style actually includes a VSL).
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <h3 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        Ad Copy &amp; Video Ad Copy angles ({selectedAngleIds.length} selected)
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {angles.map((angle) => (
          <StyleOption
            key={angle.id}
            style={angle}
            checked={selectedAngleIds.includes(angle.id)}
            onToggle={() => onToggleAngle(angle.id)}
            inputType="checkbox"
            extra={
              emotions.length > 0 && (
                <label className="block">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                    Emotional tone for this ad
                  </span>
                  <select
                    value={angleEmotionIds[angle.id] ?? ""}
                    onChange={(e) => onSetAngleEmotion(angle.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
                  >
                    {emotions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
          />
        ))}
      </div>

      <h3 className="mt-8 mb-2 text-sm font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        Funnel Copy style
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {funnels.map((funnel) => (
          <StyleOption
            key={funnel.id}
            style={funnel}
            checked={selectedFunnelId === funnel.id}
            onToggle={() => onSelectFunnel(funnel.id)}
            inputType="radio"
            groupName="funnelStyle"
          />
        ))}
      </div>

      <h3 className="mt-8 mb-2 text-sm font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        VSL style
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {vslStyles.map((vsl) => (
          <StyleOption
            key={vsl.id}
            style={vsl}
            checked={selectedVslId === vsl.id}
            onToggle={() => onSelectVsl(vsl.id)}
            inputType="radio"
            groupName="vslStyle"
          />
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Building the kit — this takes 30-60s…" : "Generate campaign kit"}
      </button>
    </div>
  );
}
