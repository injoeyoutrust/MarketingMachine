import type { AdSet, SmsMessage, EmailMessage } from './types';

export const FUNNEL_STAGES = ['TOFO', 'MOFO', 'BOFO'] as const;
export type FunnelStage = typeof FUNNEL_STAGES[number];
export const STAGE_DESCRIPTIONS: Record<FunnelStage, string> = {
  TOFO: 'Build awareness and help people recognize their problem.',
  MOFO: 'Build trust, explain the approach, and work through objections.',
  BOFO: 'Build confidence and readiness. Keep the final action secondary.',
};
export interface StageBrief { idea: string; tone: string; adTypes: string }
export interface FunnelProject {
  id: string;
  label: string;
  fields: Record<string, string>;
  stages: Record<FunnelStage, StageBrief>;
  created_at: string;
}
export interface FunnelCopy {
  adSets: AdSet[];
  sms: SmsMessage[];
  email: EmailMessage[];
  flags: { issue: string; detail: string; resolveBy: string }[];
}
export interface FunnelContribution {
  id: string;
  project_id: string;
  stage: FunnelStage;
  mode: 'base' | 'quick' | 'push' | 'import';
  idea: string;
  copy: FunnelCopy;
  created_at: string;
}
export function emptyStageBriefs(): FunnelProject['stages'] {
  return Object.fromEntries(FUNNEL_STAGES.map(stage => [stage, { idea: '', tone: '', adTypes: '' }])) as FunnelProject['stages'];
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function validProject(value: unknown): value is Pick<FunnelProject, 'label' | 'fields' | 'stages'> {
  if (!isRecord(value) || typeof value.label !== 'string' || !value.label.trim() || value.label.length > 200 || !isRecord(value.fields) || !isRecord(value.stages)) return false;
  if (!Object.values(value.fields).every(v => typeof v === 'string' && v.length <= 20000)) return false;
  return FUNNEL_STAGES.every(stage => {
    const brief = (value.stages as Record<string, unknown>)[stage];
    return isRecord(brief) && ['idea', 'tone', 'adTypes'].every(key => typeof brief[key] === 'string' && (brief[key] as string).length <= 10000);
  });
}
export function validCopy(value: unknown): value is FunnelCopy {
  if (!isRecord(value)) return false;
  const strings = (v: unknown, keys: string[]) => isRecord(v) && keys.every(k => typeof v[k] === 'string');
  return Array.isArray(value.adSets) && value.adSets.length === 1 && value.adSets.every(ad => strings(ad, ['angle', 'primaryText', 'headline', 'description']) && strings(ad.videoScript, ['hook', 'mirror', 'shift', 'proof', 'cta'])) &&
    Array.isArray(value.sms) && value.sms.length > 0 && value.sms.every(s => strings(s, ['message']) && Number.isInteger(s.day)) &&
    Array.isArray(value.email) && value.email.length > 0 && value.email.every(e => strings(e, ['subject', 'body']) && Number.isInteger(e.day)) &&
    Array.isArray(value.flags) && value.flags.every(f => strings(f, ['issue', 'detail', 'resolveBy']));
}

export function validImportedCopy(value: unknown): value is FunnelCopy {
  if (!isRecord(value) || !Array.isArray(value.adSets) || value.adSets.length === 0 || value.adSets.length > 50 || !Array.isArray(value.sms) || !Array.isArray(value.email) || !Array.isArray(value.flags)) return false;
  // Imported concepts may have no nurture copy yet. Validate any supplied messages.
  const { adSets, sms, email } = value;
  return adSets.every(ad => validCopy({ ...value, adSets: [ad],
    sms: sms.length ? sms : [{ day: 0, message: '' }],
    email: email.length ? email : [{ day: 0, subject: '', body: '' }],
  }));
}
