import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/** Changes which angle of the ad this placement uses. */
export async function PATCH(req: Request, context: { params: Promise<{ id: string; placementId: string }> }) {
  const { id, placementId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const angleIndex = body.angleIndex;
  const db = supabaseServer();
  const { data: placement, error: findError } = await db.from('funnel_placements').select('run_id').eq('id', placementId).eq('funnel_set_id', id).single();
  if (findError || !placement) return NextResponse.json({ error: 'Placement not found.' }, { status: 404 });
  const { data: run } = await db.from('campaign_runs').select('kit').eq('id', placement.run_id).single();
  const angleCount = (run?.kit as { adSets?: unknown[] })?.adSets?.length ?? 0;
  if (typeof angleIndex !== 'number' || !Number.isInteger(angleIndex) || angleIndex < 0 || angleIndex >= angleCount) {
    return NextResponse.json({ error: "That angle doesn't exist on this ad." }, { status: 400 });
  }
  const { data, error } = await db.from('funnel_placements').update({ angle_index: angleIndex }).eq('id', placementId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ placement: data });
}

/** Takes this angle out of the level. The ad itself is untouched. */
export async function DELETE(_req: Request, context: { params: Promise<{ id: string; placementId: string }> }) {
  const { id, placementId } = await context.params;
  const { error } = await supabaseServer().from('funnel_placements').delete().eq('id', placementId).eq('funnel_set_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
