import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = supabaseServer();
  const body = await req.json();

  const patch: Record<string, string> = {};
  for (const key of ["text", "source", "note"] as const) {
    if (typeof body[key] === "string") patch[key] = body[key].trim();
  }
  if (patch.text === "") return NextResponse.json({ error: "Quote text is required." }, { status: 400 });

  const { data, error } = await db.from("quotes").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = supabaseServer();
  const { error } = await db.from("quotes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
