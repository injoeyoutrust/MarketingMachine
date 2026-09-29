import type { FunnelPlacement, FunnelStage } from "./funnels";
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

/** Places one angle of an ad into a funnel level. The same ad can be placed many times. */
export async function placeAd(
  funnelSetId: string,
  runId: string,
  stage: FunnelStage,
  angleIndex: number | null
): Promise<FunnelPlacement> {
  const res = await fetch(`/api/funnels/${funnelSetId}/placements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, stage, angleIndex }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Could not add that ad to the funnel.");
  return data.placement as FunnelPlacement;
}

export async function setPlacementAngle(p: FunnelPlacement, angleIndex: number): Promise<FunnelPlacement> {
  const res = await fetch(`/api/funnels/${p.funnel_set_id}/placements/${p.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ angleIndex }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Could not save that angle.");
  return data.placement as FunnelPlacement;
}

export async function removePlacement(p: FunnelPlacement): Promise<void> {
  const res = await fetch(`/api/funnels/${p.funnel_set_id}/placements/${p.id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not remove that ad from the level.");
}
