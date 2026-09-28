import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAtPath, setAtPath } from '@/lib/deepPath';
import type { FunnelCopy } from '@/lib/funnels';

/**
 * Edits a single field inside a funnel contribution's copy, identified by a
 * dot path (e.g. "adSets.0.videoScript.hook"). Mirrors the campaign-run edit
 * route, minus the edit ledger — funnel_contributions has no such column.
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string; contributionId: string }> }) {
  const { id, contributionId } = await context.params;
  const db = supabaseServer();
  const body = await req.json();

  const path: string | undefined = body.path;
  const newValue = body.newValue;
  if (!path || newValue === undefined) {
    return NextResponse.json({ error: 'path and newValue are required.' }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await db
    .from('funnel_contributions')
    .select('*')
    .eq('id', contributionId)
    .eq('project_id', id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? 'Contribution not found.' }, { status: 404 });
  }

  let updatedCopy: FunnelCopy;
  try {
    updatedCopy = setAtPath(existing.copy as FunnelCopy, path, newValue);
    getAtPath(existing.copy, path);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid field path.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await db
    .from('funnel_contributions')
    .update({ copy: updatedCopy })
    .eq('id', contributionId)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contribution: data });
}
