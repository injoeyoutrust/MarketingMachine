import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { runRowToSavedRun, type RunRow } from "@/lib/dbMappers";
import type { CampaignKit } from "@/lib/types";

export async function GET() {
  const db = supabaseServer();

  const { data, error } = await db
    .from("campaign_runs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ runs: (data as RunRow[]).map(runRowToSavedRun) });
}

export async function POST(req: NextRequest) {
  const db = supabaseServer();
  const body = await req.json();

  const kit = body.kit as CampaignKit;
  const row = {
    label: body.label ?? "Untitled campaign",
    intake: body.intake ?? "",
    fields: body.fields ?? {},
    ad_angle_names: body.adAngleNames ?? [],
    funnel_style_name: body.funnelStyleName ?? "",
    vsl_style_name: body.vslStyleName ?? "",
    kit,
    // Frozen at creation, never touched again — the permanent record of
    // exactly what Claude generated, independent of later edits to `kit`.
    original_kit: kit,
    edit_ledger: [],
  };

  const { data, error } = await db.from("campaign_runs").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ run: runRowToSavedRun(data as RunRow) });
}
