import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const db = supabaseServer();
    const { data: project, error } = await db.from('funnel_projects').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    const { data: contributions, error: copyError } = await db.from('funnel_contributions').select('*').eq('project_id', id).order('created_at');
    if (copyError) throw copyError;
    const { data: placements, error: placementError } = await db.from('funnel_placements').select('*').eq('funnel_set_id', id).order('created_at');
    if (placementError) return NextResponse.json({ error: 'Could not load the ads in this funnel. Has the funnel_placements migration been run?' }, { status: 500 });
    return NextResponse.json({ project, contributions, placements });
  } catch { return NextResponse.json({ error: 'Could not load funnel copy.' }, { status: 500 }); }
}
