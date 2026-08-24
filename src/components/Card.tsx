export function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

export function EmotionBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[0.7rem] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
      🎭 {label}
    </span>
  );
}
