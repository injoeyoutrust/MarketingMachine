import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { validProject } from '@/lib/funnels';

export async function GET() {
  try {
    const { data, error } = await supabaseServer().from('funnel_projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ projects: data });
  } catch { return NextResponse.json({ error: 'Could not load funnel projects. Check the database connection and funnel migration.' }, { status: 500 }); }
}
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  if (!validProject(body)) return NextResponse.json({ error: 'A project name, intake fields, and all three stage briefs are required.' }, { status: 400 });
  try {
    const { data, error } = await supabaseServer().from('funnel_projects').insert({ label: body.label.trim(), fields: body.fields, stages: body.stages }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch { return NextResponse.json({ error: 'Could not save the project. Check the database connection and funnel migration.' }, { status: 500 }); }
}
