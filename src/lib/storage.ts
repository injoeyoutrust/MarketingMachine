import type { SavedRun } from "./types";

export async function loadRuns(): Promise<SavedRun[]> {
  const res = await fetch("/api/runs");
  if (!res.ok) return [];
  const data = await res.json();
  return data.runs as SavedRun[];
}

export async function saveRun(
  run: Omit<SavedRun, "id" | "createdAt" | "originalKit" | "editLedger">
): Promise<SavedRun | null> {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(run),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.run as SavedRun;
}

export async function deleteRun(id: string): Promise<void> {
  await fetch(`/api/runs/${id}`, { method: "DELETE" });
}

/** Edits one field inside a run's kit; returns the updated run (new kit + appended ledger entry). */
export async function editRunField(
  runId: string,
  path: string,
  fieldLabel: string,
  newValue: string | string[]
): Promise<SavedRun | null> {
  const res = await fetch(`/api/runs/${runId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, fieldLabel, newValue }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.run as SavedRun;
}
