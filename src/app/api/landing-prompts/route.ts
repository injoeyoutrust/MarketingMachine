import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { adOwner } from '@/lib/productionContext';
import { startPromptJob } from '@/lib/startPromptJob';
import { FUNNEL_STAGES, type FunnelStage } from '@/lib/funnels';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: NextRequest) {
  // Per-ad: prompts belonging to one placement / piece of level copy.
  const o = adOwner(Object.fromEntries(req.nextUrl.searchParams));
  if (o) {
    const { data, error } = await supabaseServer().from('landing_prompts').select('*').eq(o.column, o.id).order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: 'Could not load funnel page prompts. Has the video_and_ad_landing_prompts migration been run?' }, { status: 500 });
    return NextResponse.json({ prompts: data ?? [] });
  }
  const funnelSetId = req.nextUrl.searchParams.get('funnelSetId') ?? '';
  const stage = req.nextUrl.searchParams.get('stage') as FunnelStage;
  if (!UUID.test(funnelSetId) || !FUNNEL_STAGES.includes(stage)) return NextResponse.json({ error: 'funnelSetId and stage are required.' }, { status: 400 });
  const { data, error } = await supabaseServer().from('landing_prompts').select('*').eq('funnel_set_id', funnelSetId).eq('stage', stage).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load landing page prompts. Has the production_prompts migration been run?' }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] });
}

/** Queues the writing job (a minute of Claude time) and returns its id for the page to poll. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return startPromptJob('landing', body, new URL(req.url).origin);
}
