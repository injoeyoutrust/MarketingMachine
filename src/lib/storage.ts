import type { SavedRun } from "./types";
import type { FunnelStage } from "./funnels";

export async function loadRuns(): Promise<SavedRun[]> {
  const res = await fetch("/api/runs");
  if (!res.ok) return [];
  const data = await res.json();
  return data.runs as SavedRun[];
}

export async function saveRun(
  run: Omit<SavedRun, "id" | "createdAt" | "originalKit" | "editLedger" | "funnelSetId" | "stage">
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

/** Moves an ad into a funnel set's TOFU/MOFU/BOFU campaign, or pass nulls to send it back to the ad pool. */
export async function assignRun(
  runId: string,
  funnelSetId: string | null,
  stage: FunnelStage | null
): Promise<SavedRun | null> {
  const res = await fetch(`/api/runs/${runId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ funnelSetId, stage }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.run as SavedRun;
}
