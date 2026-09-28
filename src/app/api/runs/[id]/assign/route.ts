import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { runRowToSavedRun, type RunRow } from "@/lib/dbMappers";
import { FUNNEL_STAGES } from "@/lib/funnels";

/**
 * Moves an ad into a funnel set's TOFU/MOFU/BOFU campaign, or back out to
 * the unassigned ad pool. Both fields null means "unassign".
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const funnelSetId: string | null = body.funnelSetId ?? null;
  const stage: string | null = body.stage ?? null;

  if (funnelSetId === null && stage !== null) {
    return NextResponse.json({ error: "stage cannot be set without funnelSetId." }, { status: 400 });
  }
  if (funnelSetId !== null && !FUNNEL_STAGES.includes(stage as never)) {
    return NextResponse.json({ error: "A valid stage is required when assigning to a funnel set." }, { status: 400 });
  }

  const db = supabaseServer();
  const { data, error } = await db
    .from("campaign_runs")
    .update({ funnel_set_id: funnelSetId, stage })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ run: runRowToSavedRun(data as RunRow) });
}
