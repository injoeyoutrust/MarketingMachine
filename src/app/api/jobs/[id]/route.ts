import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/** Status of a queued prompt job: queued/running, or done with the saved prompt, or error. */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Unknown job.' }, { status: 404 });
  const { data, error } = await supabaseServer().from('prompt_jobs').select('status, result, error').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not check the job.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Unknown job.' }, { status: 404 });
  return NextResponse.json({ status: data.status, prompt: data.result, error: data.error });
}
