import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const EDITABLE = ["prompt", "notes"] as const;

/** Saves your edits to a generated prompt. */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};
  for (const key of EDITABLE) if (typeof body[key] === 'string') patch[key] = body[key].slice(0, 50000);
  if (patch.prompt !== undefined && !patch.prompt.trim()) return NextResponse.json({ error: "The prompt can't be empty." }, { status: 400 });
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
  const { data, error } = await supabaseServer().from('landing_prompts').update(patch).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompt: data });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { error } = await supabaseServer().from('landing_prompts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
