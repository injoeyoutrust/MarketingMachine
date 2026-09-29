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
  const keepAngleIndex = body.keepAngleIndex;
  if (keepAngleIndex === undefined && (!path || newValue === undefined)) {
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
  if (keepAngleIndex !== undefined) {
    // Trims a multi-angle item (e.g. an older full-ad import) down to the one
    // angle this level should use. SMS and email are left as they are.
    const adSets = (existing.copy as FunnelCopy).adSets;
    if (!Number.isInteger(keepAngleIndex) || keepAngleIndex < 0 || keepAngleIndex >= adSets.length) {
      return NextResponse.json({ error: "That angle doesn't exist on this item." }, { status: 400 });
    }
    updatedCopy = { ...(existing.copy as FunnelCopy), adSets: [adSets[keepAngleIndex]] };
  } else try {
    updatedCopy = setAtPath(existing.copy as FunnelCopy, path!, newValue);
    getAtPath(existing.copy, path!);
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

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string; contributionId: string }> }) {
  const { id, contributionId } = await context.params;
  const { error } = await supabaseServer().from('funnel_contributions').delete().eq('id', contributionId).eq('project_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
