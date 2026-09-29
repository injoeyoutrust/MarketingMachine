import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { FUNNEL_STAGES } from "@/lib/funnels";

export async function GET() {
  const { data, error } = await supabaseServer().from("ad_ideas").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ideas: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Write the idea first." }, { status: 400 });
  const row = {
    text,
    note: typeof body.note === "string" ? body.note.trim() : "",
    stage: FUNNEL_STAGES.includes(body.stage) ? body.stage : null,
  };
  const { data, error } = await supabaseServer().from("ad_ideas").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ idea: data });
}
