// Generic dot-path get/set for the CampaignKit JSON tree, e.g.
// "adSets.2.videoScript.hook" or "email.3.subject". Numeric segments index
// arrays. Used server-side by the run-edit route so any field in the kit
// can be updated without a bespoke handler per field.

function toKey(segment: string): string | number {
  const idx = Number(segment);
  return Number.isInteger(idx) && String(idx) === segment ? idx : segment;
}

export function getAtPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const segment of path.split(".")) {
    if (cur == null) return undefined;
    cur = (cur as Record<string | number, unknown>)[toKey(segment)];
  }
  return cur;
}

export function setAtPath<T>(obj: T, path: string, value: unknown): T {
  const segments = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural JSON clone walked by dynamic keys
  const clone = structuredClone(obj) as any;
  let cur = clone;
  for (let i = 0; i < segments.length - 1; i++) {
    cur = cur[toKey(segments[i])];
    if (cur == null) throw new Error(`Invalid path "${path}": nothing at segment "${segments[i]}"`);
  }
  cur[toKey(segments[segments.length - 1])] = value;
  return clone;
}
