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
