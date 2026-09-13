import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { FUNNEL_STAGES, isRecord, validImportedCopy, type FunnelStage } from '@/lib/funnels';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body: unknown = await req.json().catch(() => null);
  if (!isRecord(body) || !FUNNEL_STAGES.includes(body.stage as FunnelStage) || typeof body.requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.requestId)) return NextResponse.json({ error: 'Choose a valid target level.' }, { status: 400 });
  try {
    const db = supabaseServer();
    const { data: project } = await db.from('funnel_projects').select('id').eq('id', id).single();
    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    const { data: previous } = await db.from('funnel_contributions').select('*').eq('project_id', id).eq('id', body.requestId).single();
    if (previous) return NextResponse.json({ contribution: previous });
    let copy: unknown = body.copy;
    let label = typeof body.label === 'string' ? body.label.trim().slice(0, 200) : '';
    if (typeof body.runId === 'string') {
      const { data: run } = await db.from('campaign_runs').select('label, kit').eq('id', body.runId).single();
      if (!run) return NextResponse.json({ error: 'Saved campaign not found.' }, { status: 404 });
      copy = run.kit;
      label = `Imported campaign: ${run.label}`;
    }
    if (!label || !validImportedCopy(copy)) return NextResponse.json({ error: 'Provide a label and valid ad copy. SMS and email arrays can be empty.' }, { status: 400 });
    const { data, error } = await db.from('funnel_contributions').insert({ id: body.requestId, project_id: id, stage: body.stage, mode: 'import', idea: label, copy: { adSets: copy.adSets, sms: copy.sms, email: copy.email, flags: copy.flags } }).select('*').single();
    if (error?.code === '23505') {
      const { data: saved } = await db.from('funnel_contributions').select('*').eq('project_id', id).eq('id', body.requestId).single();
      if (saved) return NextResponse.json({ contribution: saved });
    }
    if (error) throw error;
    return NextResponse.json({ contribution: data });
  } catch { return NextResponse.json({ error: 'Could not import copy. Check the funnel imports migration and retry.' }, { status: 500 }); }
}
