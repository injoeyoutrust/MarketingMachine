import type { SupabaseClient } from '@supabase/supabase-js';
import { composeIntakeText } from './intakeFields';
import { STAGE_DESCRIPTIONS, STAGE_LABELS, type FunnelProject, type FunnelStage, type FunnelCopy } from './funnels';
import type { AdSet } from './types';

/** What a funnel level is for, plus the master intake if the funnel has one. */
export function funnelContext(project: FunnelProject, stage: FunnelStage): string {
  const brief = project.stages?.[stage];
  const parts = [
    `Funnel: ${project.label}`,
    `Level: ${STAGE_LABELS[stage]} — ${STAGE_DESCRIPTIONS[stage]}`,
    brief?.idea && `Level direction: ${brief.idea}`,
    brief?.tone && `Tone: ${brief.tone}`,
  ];
  const intake = composeIntakeText(project.fields ?? {}).trim();
  if (intake) parts.push(`Master intake (brand, offer, audience, proof):\n${intake}`);
  return parts.filter(Boolean).join('\n');
}

export function adSetText(set: AdSet): string {
  return `Angle: ${set.angle}\nHeadline: ${set.headline}\nPrimary text:\n${set.primaryText}\nDescription: ${set.description}`;
}

type Db = SupabaseClient<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Every ad angle in a level: placed ad angles plus level copy (foundation, concepts, pasted). */
export async function levelAdSets(db: Db, funnelSetId: string, stage: FunnelStage): Promise<AdSet[]> {
  const [{ data: placements }, { data: contributions }] = await Promise.all([
    db.from('funnel_placements').select('run_id, angle_index').eq('funnel_set_id', funnelSetId).eq('stage', stage),
    db.from('funnel_contributions').select('copy').eq('project_id', funnelSetId).eq('stage', stage),
  ]);
  const runIds = [...new Set((placements ?? []).map(p => p.run_id as string))];
  const { data: runs } = runIds.length ? await db.from('campaign_runs').select('id, kit').in('id', runIds) : { data: [] };
  const kitById = new Map((runs ?? []).map(r => [r.id as string, r.kit as { adSets: AdSet[] }]));
  const placed = (placements ?? []).flatMap(p => {
    const sets = kitById.get(p.run_id)?.adSets ?? [];
    return p.angle_index !== null && sets[p.angle_index] ? [sets[p.angle_index]] : sets;
  });
  const copy = (contributions ?? []).flatMap(c => (c.copy as FunnelCopy).adSets ?? []);
  return [...placed, ...copy];
}

const UUID = /^[0-9a-f-]{36}$/i;

/** Which saved item a per-ad prompt belongs to: an ad placement or a piece of level copy. */
export function adOwner(p: { placementId?: unknown; contributionId?: unknown }) {
  if (typeof p.placementId === 'string' && UUID.test(p.placementId)) return { column: 'placement_id', id: p.placementId } as const;
  if (typeof p.contributionId === 'string' && UUID.test(p.contributionId)) return { column: 'contribution_id', id: p.contributionId } as const;
  return null;
}

/** Loads one ad angle and its funnel level from the database (never trusts the browser for copy). */
export async function resolveAdAngle(db: Db, o: NonNullable<ReturnType<typeof adOwner>>, angleIndex: number) {
  let adSet: AdSet | undefined;
  let projectId: string;
  let stage: FunnelStage;
  let title: string;
  if (o.column === 'placement_id') {
    const { data: p } = await db.from('funnel_placements').select('*').eq('id', o.id).single();
    if (!p) return { error: 'That ad is no longer in this level.', status: 404 } as const;
    const { data: run } = await db.from('campaign_runs').select('kit, label').eq('id', p.run_id).single();
    adSet = (run?.kit as { adSets?: AdSet[] })?.adSets?.[angleIndex];
    projectId = p.funnel_set_id; stage = p.stage; title = run?.label ?? 'Ad';
  } else {
    const { data: c } = await db.from('funnel_contributions').select('*').eq('id', o.id).single();
    if (!c) return { error: 'That item no longer exists.', status: 404 } as const;
    adSet = (c.copy as FunnelCopy).adSets?.[angleIndex];
    projectId = c.project_id; stage = c.stage; title = c.mode === 'base' ? 'Foundation' : c.idea;
  }
  if (!adSet) return { error: "That angle doesn't exist on this ad.", status: 400 } as const;
  const { data: project } = await db.from('funnel_projects').select('*').eq('id', projectId).single();
  if (!project) return { error: 'Funnel not found.', status: 404 } as const;
  return { adSet, project: project as FunnelProject, projectId, stage, label: `${title.slice(0, 80)} — ${adSet.angle || `Angle ${angleIndex + 1}`}` } as const;
}
