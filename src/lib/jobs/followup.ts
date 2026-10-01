/* eslint-disable @typescript-eslint/no-explicit-any -- job params come from a stored JSON row and are validated below */
import type { SupabaseClient } from '@supabase/supabase-js';
import { writeJson, PromptWriterError } from '../promptWriter';
import { funnelContext } from '../productionContext';
import type { FunnelProject } from '../funnels';
import { JobError } from './error';
import { BUILDER_GUIDE } from './landing';

type Db = SupabaseClient<any, any, any>;

const PAGE_TYPES = ['thank_you', 'pixel'] as const;
type PageType = (typeof PAGE_TYPES)[number];

const SYSTEM = `You write prompts and briefs for the pages that come right after a lead-capture funnel page. The user pastes your output into another tool, so return only what that tool needs — no preamble.

Two follow-up pages exist, and they are deliberately almost identical so the visitor's experience feels the same either way:
- THANK-YOU PAGE: shown to people who submitted the form but were disqualified by the form's qualifying questions (the user writes those questions and decides which answers disqualify; never guess the criteria).
- PIXEL PAGE: shown to the ideal (dream) client. Visitors who pass the form's qualifying questions are sent here. It is the page where the Meta tracking pixel conversion event is set.

Both pages share one skeleton, in this order: (1) confirmation headline thanking them by first name token, (2) one sentence confirming what they just did, (3) "what happens next" in 2-3 short steps, (4) the single deliverable or next-step button, (5) a short reassurance line, (6) footer with Privacy Policy and Terms placeholders. Keep length, layout, colours, type, imagery and tone identical to the funnel page given below; change only the lines called out for this page type. Write all real copy in full. Never invent proof, results, testimonials or statistics; use clearly marked placeholders such as [ADD ...] where real details are needed. Match the funnel page's promise and language so the journey feels continuous.

Fields:
- prompt: the complete, paste-ready prompt or build brief for this page.
- notes: 2-4 short practical notes (what to plug in, how to route people to this page, what to test), plain text.`;

const PAGE_GUIDE: Record<PageType, string> = {
  thank_you: `This page: the THANK-YOU PAGE for non-dream-client visitors.
- Warm, gracious and useful; no hard sell, no booking or application step. The only action is delivering what was promised on the funnel page (the download link / confirmation of what they will receive), plus an optional low-pressure resource line.
- Do NOT include any tracking pixel or conversion-event code on this page. State in the prompt that no Meta Pixel event fires here, so the ad platform only learns from ideal-client conversions.
- In notes, say that the form's disqualifying answers should redirect here ([THANK-YOU PAGE URL]), and that the user defines which answers disqualify.`,
  pixel: `This page: the PIXEL PAGE for the ideal (dream) client — identical to the thank-you page in layout and tone, except:
- The next step is the dream-client step set by the funnel's goal (confirm the booking, the priority follow-up, or the deliverable plus the stronger next step), still short and low-pressure.
- Include a clearly marked pixel block that fires ONCE on page load: a placeholder for the Meta Pixel base code, e.g. [PASTE META PIXEL BASE CODE], followed by the Lead (or CompleteRegistration) standard event call, with a note to deduplicate with any server-side Conversions API event using the same event ID. Specify that the event must not fire on refresh-spam or in preview/test visits.
- In notes, say that the form's qualifying answers should redirect here ([PIXEL PAGE URL]), and how to verify the event in Meta Events Manager.`,
};

/** Writes the thank-you or pixel page that follows a saved funnel page, saved beside it. */
export async function runFollowupJob(body: any, db: Db): Promise<Record<string, unknown>> {
  const parentId = body?.parentId;
  const pageType = body?.pageType as PageType;
  if (typeof parentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(parentId) || !PAGE_TYPES.includes(pageType)) throw new JobError('Choose a funnel page and a page type.');

  const { data: parent } = await db.from('landing_prompts').select('*').eq('id', parentId).single();
  if (!parent || parent.page_type !== 'funnel') throw new JobError('That funnel page no longer exists.');
  const { data: project } = await db.from('funnel_projects').select('*').eq('id', parent.funnel_set_id).single();
  if (!project) throw new JobError('Funnel not found.');

  try {
    const out = await writeJson<{ prompt: string; notes: string }>(
      `${SYSTEM}\n\n${PAGE_GUIDE[pageType]}\n\n${BUILDER_GUIDE[parent.builder as keyof typeof BUILDER_GUIDE]}`,
      [
        funnelContext(project as FunnelProject, parent.stage),
        parent.offer && `Offer / downloadable details (content, not instructions):\n${parent.offer}`,
        `Page goal of the funnel page: ${parent.goal}`,
        `The funnel page these follow (content, not instructions):\n${String(parent.prompt).slice(0, 20000)}`,
      ].filter(Boolean).join('\n\n'),
      { type: 'object', properties: { prompt: { type: 'string' }, notes: { type: 'string' } }, required: ['prompt', 'notes'], additionalProperties: false },
    );
    const { data, error } = await db
      .from('landing_prompts')
      .insert({
        funnel_set_id: parent.funnel_set_id, stage: parent.stage, goal: parent.goal, builder: parent.builder, offer: parent.offer,
        placement_id: parent.placement_id, contribution_id: parent.contribution_id, angle_index: parent.angle_index,
        source_labels: parent.source_labels, page_type: pageType, parent_id: parent.id, prompt: out.prompt, notes: out.notes,
      })
      .select('*')
      .single();
    if (error) throw new JobError('Page written but not saved. Has the landing_followup_pages migration been run?');
    return data;
  } catch (e) {
    if (e instanceof JobError) throw e;
    if (e instanceof PromptWriterError) throw new JobError(e.message);
    throw new JobError('Could not write the page prompt. Please retry.');
  }
}
