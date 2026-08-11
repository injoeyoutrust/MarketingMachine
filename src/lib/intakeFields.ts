export interface IntakeFieldDef {
  key: string;
  question: string;
  hint: string;
  type: "input" | "textarea";
}

export interface IntakeSection {
  title: string;
  fields: IntakeFieldDef[];
}

export const INTAKE_SECTIONS: IntakeSection[] = [
  {
    title: "Your business",
    fields: [
      {
        key: "q1_oneSentence",
        question: "In one sentence, what do you do and who do you do it for?",
        hint: `e.g. "I help burned-out corporate executives quit their jobs and build coaching businesses that replace their salary."`,
        type: "textarea",
      },
      {
        key: "q2_offer",
        question: "Signature offer or core program — name, format, duration, price",
        hint: "e.g. Breakthrough Ads Academy — 12-week group coaching program — $3,500",
        type: "textarea",
      },
      {
        key: "q3_otherOffers",
        question: "Other offers, services, or products you currently sell (with prices)",
        hint: "",
        type: "textarea",
      },
      {
        key: "q4_history",
        question: "How long have you been in business, and how many paying clients have you served to date?",
        hint: "",
        type: "input",
      },
      {
        key: "q5_links",
        question: "Website and primary social media handles",
        hint: "",
        type: "textarea",
      },
    ],
  },
  {
    title: "Your offer",
    fields: [
      {
        key: "q6_transformation",
        question: "What transformation does your offer deliver? Before state and after state.",
        hint: "What's their life/business like before you, and what's different 30/60/90 days later?",
        type: "textarea",
      },
      {
        key: "q7_differentiator",
        question: "What makes your offer different from competitors doing similar work?",
        hint: "",
        type: "textarea",
      },
      {
        key: "q8_results",
        question: "What results, outcomes, or case studies can you point to? Specific numbers only.",
        hint: `Real names not required — "helped a client go from $0 to $10k/mo in 6 weeks" is the specificity we need.`,
        type: "textarea",
      },
      {
        key: "q9_leadMagnet",
        question: "Current lead magnet or free offer, if any",
        hint: "Free PDF, webinar, challenge, training video, checklist — describe it.",
        type: "textarea",
      },
    ],
  },
  {
    title: "Ideal client avatar",
    fields: [
      {
        key: "q10_avatar",
        question: "Who exactly is your ideal client? Age range, profession, income level, life stage.",
        hint: "",
        type: "textarea",
      },
      {
        key: "q11_pains",
        question: "Top 3 pains, frustrations, or problems they're struggling with right now",
        hint: `Be specific — not "they want more money" but the actual situation.`,
        type: "textarea",
      },
      {
        key: "q12_dreamOutcome",
        question: "What does your ideal client desire most? Their dream outcome, in their own words.",
        hint: `What would make them say "this is exactly what I've been looking for"?`,
        type: "textarea",
      },
      {
        key: "q13_failedAttempts",
        question: "What have they tried before that didn't work? Why did it fail them?",
        hint: "Courses, coaches, agencies, DIY, partnerships — their graveyard of attempts.",
        type: "textarea",
      },
      {
        key: "q14_objections",
        question: "Top 3 objections or hesitations they raise before buying",
        hint: `Price, time, "I've tried this before," "will this work for my niche," etc.`,
        type: "textarea",
      },
    ],
  },
  {
    title: "Market language",
    fields: [
      {
        key: "q15_verbatim",
        question: "Exact words and phrases your ideal client uses to describe their problem",
        hint: `Write it exactly as they'd say it, misspellings and all — these are goldmines.`,
        type: "textarea",
      },
      {
        key: "q16_whereTheyAre",
        question: "Where does your ideal client spend time online? Platforms, groups, creators, podcasts.",
        hint: "",
        type: "textarea",
      },
      {
        key: "q17_falseBeliefs",
        question: "What do they believe about their problem that may not be true? The myths holding them back.",
        hint: `e.g. "They think they need a bigger ad budget. They actually need better copy."`,
        type: "textarea",
      },
    ],
  },
  {
    title: "Brand voice & positioning",
    fields: [
      {
        key: "q18_voice",
        question: "Describe your brand voice in 3 to 5 words",
        hint: "e.g. Direct. Competitive. No fluff.",
        type: "input",
      },
      {
        key: "q19_reputation",
        question: `What do you want to be known for? Finish: "When people think of me, I want them to think ___."`,
        hint: "",
        type: "input",
      },
      {
        key: "q20_competitors",
        question: "Name 3-5 competitors, peers, or creators in your space — who you admire, who you compete with",
        hint: "",
        type: "textarea",
      },
    ],
  },
  {
    title: "Your goals",
    fields: [
      {
        key: "q21_revenueGoal",
        question: "Revenue goal for the next 12 months",
        hint: "Be honest — the real number, not the safe one.",
        type: "input",
      },
      {
        key: "q22_successLooksLike",
        question: "What does success in this look like for you, specifically? How will you know you won?",
        hint: `e.g. "I sign 10 new coaching clients from Meta ads in 90 days."`,
        type: "textarea",
      },
      {
        key: "q23_biggestBlocker",
        question: "What is the single biggest challenge standing between you and that goal right now?",
        hint: "",
        type: "input",
      },
      {
        key: "q24_anythingElse",
        question: "Anything else we should know about you, your business, or what you need?",
        hint: "",
        type: "textarea",
      },
    ],
  },
];

export type IntakeFields = Record<string, string>;

export function emptyIntakeFields(): IntakeFields {
  const fields: IntakeFields = {};
  for (const section of INTAKE_SECTIONS) {
    for (const f of section.fields) fields[f.key] = "";
  }
  return fields;
}

export function composeIntakeText(fields: IntakeFields): string {
  const parts: string[] = [];
  for (const section of INTAKE_SECTIONS) {
    const sectionLines: string[] = [];
    for (const f of section.fields) {
      const value = (fields[f.key] ?? "").trim();
      if (value) sectionLines.push(`${f.question}\n${value}`);
    }
    if (sectionLines.length > 0) {
      parts.push(`## ${section.title}\n\n${sectionLines.join("\n\n")}`);
    }
  }
  return parts.join("\n\n");
}

export function filledFieldCount(fields: IntakeFields): { filled: number; total: number } {
  const all = INTAKE_SECTIONS.flatMap((s) => s.fields);
  const filled = all.filter((f) => (fields[f.key] ?? "").trim().length > 0).length;
  return { filled, total: all.length };
}

// "Quick idea" mode skips the structured intake entirely — the user just
// describes a rough concept and the engine extracts what it can, flagging
// the rest. The idea gets stashed under this key inside a run's `fields`
// blob (instead of the 24 question keys) so edit/regenerate can tell which
// mode a saved run was built from.
export const QUICK_IDEA_KEY = "__quickIdea";

export function composeQuickIdeaText(idea: string): string {
  return `## Quick ad idea (informal — not a completed intake)

${idea.trim()}

This is a rough concept, not a filled-out intake form. Extract whatever you
genuinely can from it (voice, angle, audience, the core hook) and put
everything else — proof numbers, business name, pricing, case-study
results, anything that isn't stated or clearly implied above — on the flag
sheet instead of inventing it.`;
}

// "Pure push" mode: the user's own concept IS the angle — no library angle
// gets picked or substituted. Stashed under this key in a run's `fields`
// blob, same pattern as QUICK_IDEA_KEY, so edit/regenerate restores the
// right mode.
export const PURE_PUSH_KEY = "__purePush";

export function composePurePushText(idea: string): string {
  return `## Ad concept — execute directly, do not reinterpret

${idea.trim()}

This concept is the campaign's one and only angle. Do not map it onto a
different named technique and do not soften or generalize it. Your job is
to fit THIS exact idea into the five-beat structure (Hook, Mirror, Shift,
Proof, CTA) as faithfully as possible. Extract what facts you genuinely can
from it; anything it doesn't state — proof numbers, business name, pricing
— goes on the flag sheet instead of being invented.`;
}

export function purePushAngleName(idea: string): string {
  const firstLine = idea.trim().split(/\n/)[0].trim();
  const words = firstLine.split(/\s+/).slice(0, 6).join(" ");
  return words.length < firstLine.length ? `${words}…` : words || "Your concept";
}
