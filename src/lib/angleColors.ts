/** Deterministic color mapping for ad angles, so the same angle name always gets the same color — lets you visually tell angles apart across a campaign's ad sets. */
const ANGLE_PALETTE = [
  { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', dot: 'bg-violet-500', border: 'border-violet-400 dark:border-violet-700' },
  { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-blue-400 dark:border-blue-700' },
  { badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', dot: 'bg-teal-500', border: 'border-teal-400 dark:border-teal-700' },
  { badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300', dot: 'bg-pink-500', border: 'border-pink-400 dark:border-pink-700' },
  { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-400 dark:border-amber-700' },
  { badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300', dot: 'bg-cyan-500', border: 'border-cyan-400 dark:border-cyan-700' },
  { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', dot: 'bg-rose-500', border: 'border-rose-400 dark:border-rose-700' },
  { badge: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300', dot: 'bg-lime-500', border: 'border-lime-400 dark:border-lime-700' },
  { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', dot: 'bg-indigo-500', border: 'border-indigo-400 dark:border-indigo-700' },
  { badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300', dot: 'bg-fuchsia-500', border: 'border-fuchsia-400 dark:border-fuchsia-700' },
];

// Assigned in first-seen order (not hashed) so distinct angles never collide
// until there are more distinct angles on the page than palette colors.
const assigned = new Map<string, number>();

export function angleColor(angle: string) {
  const key = angle.trim().toLowerCase();
  let index = assigned.get(key);
  if (index === undefined) {
    index = assigned.size % ANGLE_PALETTE.length;
    assigned.set(key, index);
  }
  return ANGLE_PALETTE[index];
}
