import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { styleRowToStyle, styleToRow, type StyleRow } from "@/lib/dbMappers";
import { seedStyles, DEFAULT_EMOTION_STATES } from "@/lib/styleLibrary";
import type { Style, StyleExample } from "@/lib/styleLibrary";

// Built-in categories added after a database was already seeded need to be
// backfilled here — editing styleLibrary.ts alone doesn't reach a database
// that was seeded before the new category existed.
const BACKFILLS: { category: Style["category"]; defaults: Omit<Style, "examples">[] }[] = [
  { category: "emotionalTone", defaults: DEFAULT_EMOTION_STATES },
];

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

  let styles = (data as StyleRow[]).map(styleRowToStyle);

  const missing = BACKFILLS.filter((b) => !styles.some((s) => s.category === b.category));
  if (missing.length > 0) {
    const newStyles: Style[] = missing.flatMap((b) =>
      b.defaults.map((s) => ({ ...s, examples: [] as StyleExample[] }))
    );
    const { error: insertError } = await db.from("styles").insert(newStyles.map(styleToRow));
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    styles = [...styles, ...newStyles];
  }

  return NextResponse.json({ styles });
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
