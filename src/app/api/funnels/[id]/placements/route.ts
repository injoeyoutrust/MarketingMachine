import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { FUNNEL_STAGES, isRecord, type FunnelStage } from '@/lib/funnels';

/** Places one angle of a saved ad into a level of this funnel set. */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body: unknown = await req.json().catch(() => null);
  if (!isRecord(body) || typeof body.runId !== 'string' || !FUNNEL_STAGES.includes(body.stage as FunnelStage)) {
    return NextResponse.json({ error: 'Choose an ad and a level.' }, { status: 400 });
  }
  const angleIndex = body.angleIndex ?? null;
  const db = supabaseServer();
  const { data: run, error: runError } = await db.from('campaign_runs').select('kit').eq('id', body.runId).single();
  if (runError || !run) return NextResponse.json({ error: 'Ad not found.' }, { status: 404 });
  const angleCount = (run.kit as { adSets?: unknown[] })?.adSets?.length ?? 0;
  if (angleIndex !== null && (typeof angleIndex !== 'number' || !Number.isInteger(angleIndex) || angleIndex < 0 || angleIndex >= angleCount)) {
    return NextResponse.json({ error: "That angle doesn't exist on this ad." }, { status: 400 });
  }
  const { data, error } = await db
    .from('funnel_placements')
    .insert({ funnel_set_id: id, stage: body.stage, run_id: body.runId, angle_index: angleIndex })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ placement: data });
}
