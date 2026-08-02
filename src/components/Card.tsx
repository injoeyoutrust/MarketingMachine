export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}
