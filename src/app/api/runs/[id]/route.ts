import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAtPath, setAtPath } from "@/lib/deepPath";
import { runRowToSavedRun, type RunRow } from "@/lib/dbMappers";
import type { CampaignKit } from "@/lib/types";
import { INTAKE_SECTIONS, PURE_PUSH_KEY, QUICK_IDEA_KEY, composeIntakeText, composePurePushText, composeQuickIdeaText } from "@/lib/intakeFields";

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = supabaseServer();

  const { error } = await db.from("campaign_runs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/**
 * Edits a single field inside a run's kit, identified by a dot path (e.g.
 * "adSets.0.videoScript.hook"). Never touches original_kit — that stays a
 * frozen snapshot of what Claude generated. Every edit appends one entry
 * to edit_ledger rather than overwriting history.
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = supabaseServer();
  const body = await req.json();

  // Rename the ad, or edit one answer of its original entry (the intake it was generated from).
  // Neither touches the generated kit — use "Edit intake & regenerate" to rewrite copy from a changed entry.
  if (typeof body.label === "string" || typeof body.entryKey === "string") {
    const update: Record<string, unknown> = {};
    if (typeof body.label === "string") {
      const label = body.label.trim();
      if (!label || label.length > 200) return NextResponse.json({ error: "Enter a name up to 200 characters." }, { status: 400 });
      update.label = label;
    }
    if (typeof body.entryKey === "string") {
      const known = new Set([QUICK_IDEA_KEY, PURE_PUSH_KEY, ...INTAKE_SECTIONS.flatMap((sec) => sec.fields.map((f) => f.key))]);
      if (!known.has(body.entryKey) || typeof body.entryValue !== "string") return NextResponse.json({ error: "Unknown entry field." }, { status: 400 });
      const { data: row, error: readError } = await db.from("campaign_runs").select("fields").eq("id", id).single();
      if (readError || !row) return NextResponse.json({ error: readError?.message ?? "Run not found." }, { status: 404 });
      const fields: Record<string, string> = { ...((row.fields as Record<string, string>) ?? {}), [body.entryKey]: body.entryValue.slice(0, 20000) };
      update.fields = fields;
      // Keep the stored intake text in step with the answers it was composed from.
      update.intake = fields[PURE_PUSH_KEY] ? composePurePushText(fields[PURE_PUSH_KEY]) : fields[QUICK_IDEA_KEY] ? composeQuickIdeaText(fields[QUICK_IDEA_KEY]) : composeIntakeText(fields);
    }
    const { data, error } = await db.from("campaign_runs").update(update).eq("id", id).select("*").single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Could not save." }, { status: 500 });
    return NextResponse.json({ run: runRowToSavedRun(data as RunRow) });
  }

  const path: string | undefined = body.path;
  const fieldLabel: string | undefined = body.fieldLabel;
  const newValue = body.newValue;

  if (!path || !fieldLabel || newValue === undefined) {
    return NextResponse.json({ error: "path, fieldLabel, and newValue are required." }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await db
    .from("campaign_runs")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? "Run not found." }, { status: 404 });
  }

  const currentKit = existing.kit as CampaignKit;
  let oldValue: unknown;
  let updatedKit: CampaignKit;
  try {
    oldValue = getAtPath(currentKit, path);
    updatedKit = setAtPath(currentKit, path, newValue);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid field path.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ledgerEntry = {
    id: crypto.randomUUID(),
    path,
    fieldLabel,
    oldValue: JSON.stringify(oldValue),
    newValue: JSON.stringify(newValue),
    editedAt: new Date().toISOString(),
  };
  const updatedLedger = [...(Array.isArray(existing.edit_ledger) ? existing.edit_ledger : []), ledgerEntry];

  const { data, error } = await db
    .from("campaign_runs")
    .update({ kit: updatedKit, edit_ledger: updatedLedger })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ run: runRowToSavedRun(data as RunRow) });
}
