import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { styleRowToStyle, styleToRow, type StyleRow } from "@/lib/dbMappers";
import { seedStyles } from "@/lib/styleLibrary";
import type { Style } from "@/lib/styleLibrary";

export async function GET() {
  const db = supabaseServer();

  const { data, error } = await db.from("styles").select("*").order("category").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    // First run against a fresh database — seed the built-in catalog once.
    const seeded = seedStyles();
    const rows = seeded.map(styleToRow);
    const { error: insertError } = await db.from("styles").insert(rows);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ styles: seeded });
  }

  return NextResponse.json({ styles: (data as StyleRow[]).map(styleRowToStyle) });
}

export async function POST(req: NextRequest) {
  const db = supabaseServer();
  const body = await req.json();

  const style: Style = {
    id: crypto.randomUUID(),
    category: body.category,
    name: body.name,
    description: body.description,
    builtIn: false,
    examples: [],
  };

  const { error } = await db.from("styles").insert(styleToRow(style));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ style });
}
