import type { VideoScript } from './types';
export type ScriptFramework = 'hmspc' | 'insider' | 'story';
export interface ScriptOptions { framework: ScriptFramework; cta: 'diagnostic' | 'access' | 'engagement'; voice: 'operator' | 'client' }
export const DEFAULT_SCRIPT_OPTIONS: ScriptOptions = { framework: 'insider', cta: 'diagnostic', voice: 'operator' };
export const FRAMEWORKS = {
  hmspc: { name: 'HMSPC · warm / retargeted', runtime: '45–60s', labels: ['Hook', 'Mirror', 'Shift', 'Proof', 'CTA'] },
  insider: { name: 'Insider Reveal · cold traffic', runtime: '30–45s', labels: ['Credential Flash (0–3s)', 'The Reveal (3–15s)', 'Real Mechanism (15–30s)', 'Bridge Line (3–5s)', 'CTA'] },
  story: { name: 'Story-First Micro-Case · cold traffic', runtime: '30–60s', labels: ['Drop Into the Middle (0–5s)', 'The Turn (5–10s)', 'The One Thing (10–25s)', 'Universalize (25–40s)', 'CTA (last 5–15s)'] },
};
// Preserve stored edit paths and legacy kits. These are five ordered storage slots;
// the framework metadata determines their meaning and display labels.
export const SCRIPT_KEYS = ['hook', 'mirror', 'shift', 'proof', 'cta'] as const;
export function scriptBeats(script: VideoScript, framework: ScriptFramework = 'hmspc') {
  return SCRIPT_KEYS.map((key, i) => ({ key, label: FRAMEWORKS[framework].labels[i], value: script[key] }));
}
export function validScriptOptions(value: unknown): value is ScriptOptions {
  if (!value || typeof value !== 'object') return false;
  const v = value as ScriptOptions;
  return ['hmspc', 'insider', 'story'].includes(v.framework) && ['diagnostic', 'access', 'engagement'].includes(v.cta) && ['operator', 'client'].includes(v.voice);
}
export function scriptBrief(options: ScriptOptions): string {
  const framework = FRAMEWORKS[options.framework];
  return `SCRIPT FRAMEWORK CONTRACT — overrides generic five-beat, angle, funnel/VSL and CTA instructions where they conflict.
Framework: ${framework.name}. Runtime: ${framework.runtime}.
Use the videoScript storage slots in this order: ${SCRIPT_KEYS.map((key, i) => `${key} = ${framework.labels[i]}`).join('; ')}.
${options.framework === 'hmspc' ? 'HMSPC is ONLY for warm/retargeted viewers who already know the pain point. Use Hook, Mirror, Shift, Proof, CTA.' : `Cold/TOFU audience: introduce positioning and superior-thinking authority. Sell the observation, not the offer. ALL copy and downstream opt-in/thank-you/VSL/nurture CTAs must continue toward a lead magnet (diagnostic scorecard, swipe PDF or short training), never a direct booking or sale, even if another style requests calls.
${options.framework === 'insider' ? `INSIDER REVEAL: Credential Flash is one matter-of-fact first-person line establishing access/experience without bragging. The Reveal contradicts a common CDL/owner-operator belief, earned by the credential. Real Mechanism names a specific observed pattern such as cash-flow timing or dispatch pay staging, never vague mindset advice. Bridge Line turns the insight into a personal question about the viewer's situation. Use dark/gold brand voice, aggressive-but-honest operator authority, informed by the supplied brand voice.` : `STORY-FIRST MICRO-CASE: Open mid-scene with a real specific client result, no setup or 'let me tell you'. The Turn immediately negates the obvious explanation ONLY if supported by the intake. The One Thing names the concrete lever, not mindset. Universalize makes the viewer recognize the same mechanism in their situation. Close with the same worksheet/process used in the story, only if that connection is supplied. Voice variant: ${options.voice}. Client voice is a proposed testimonial script for client approval, not an invented quote or endorsement.`}
Use exactly ONE CTA style for this test: ${options.cta}. Diagnostic = invite viewers to check their numbers via the lead magnet. Access = offer the actual client worksheet; only mention scarcity or removal if supplied and true. Engagement = ask for one keyword to receive the one-pager; use the supplied keyword/delivery process or flag missing setup. Story CTAs continue the story, not a pitch.`}
Pull proof numbers, brand voice, and exact offer terminology (including Bridge / Zero Gap Dispatch when supplied) from the existing intake/brand/offer context. Never invent or import example figures (6 years, 100–150 clients, 80% failure, $150K to $267K) as facts. If credentials, real case results, mechanism, or lead magnet details are missing, use clearly marked [NEEDS ...] placeholders and flags; never fabricate proof, testimonial speech, scarcity, links, or an available asset.`;
}
