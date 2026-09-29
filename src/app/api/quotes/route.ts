import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from("quotes").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const db = supabaseServer();
  const body = await req.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Quote text is required." }, { status: 400 });

  const row = {
    text,
    source: typeof body.source === "string" ? body.source.trim() : "",
    note: typeof body.note === "string" ? body.note.trim() : "",
  };
  const { data, error } = await db.from("quotes").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}
