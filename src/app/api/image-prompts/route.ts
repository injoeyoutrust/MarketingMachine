import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { adOwner } from '@/lib/productionContext';
import { startPromptJob } from '@/lib/startPromptJob';


export async function GET(req: NextRequest) {
  const o = adOwner(Object.fromEntries(req.nextUrl.searchParams));
  if (!o) return NextResponse.json({ error: 'placementId or contributionId is required.' }, { status: 400 });
  const { data, error } = await supabaseServer().from('image_prompts').select('*').eq(o.column, o.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load image prompts. Has the production_prompts migration been run?' }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] });
}

/** Queues the writing job (a minute of Claude time) and returns its id for the page to poll. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return startPromptJob('image', body, new URL(req.url).origin);
}
