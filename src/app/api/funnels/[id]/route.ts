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
    return NextResponse.json({ project, contributions });
  } catch { return NextResponse.json({ error: 'Could not load funnel copy.' }, { status: 500 }); }
}
