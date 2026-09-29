import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { FUNNEL_STAGES } from "@/lib/funnels";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.text === "string") patch.text = body.text.trim();
  if (typeof body.note === "string") patch.note = body.note.trim();
  if (body.stage === null || FUNNEL_STAGES.includes(body.stage)) patch.stage = body.stage;
  if (typeof body.used === "boolean") patch.used = body.used;
  if (patch.text === "") return NextResponse.json({ error: "The idea can't be empty." }, { status: 400 });

  const { data, error } = await supabaseServer().from("ad_ideas").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ idea: data });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { error } = await supabaseServer().from("ad_ideas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
