export type StyleCategory = "adAngle" | "funnelStyle" | "vslStyle" | "emotionalTone";

export interface StyleExample {
  id: string;
  type: "text" | "image";
  label: string;
  /** For type "text": raw pasted transcript/copy. For type "image": a data: URL. */
  content: string;
}

export interface Style {
  id: string;
  category: StyleCategory;
  name: string;
  description: string;
  builtIn: boolean;
  examples: StyleExample[];
}

// Ad angles apply to BOTH Ad Copy and Video Ad Copy — in this engine every ad
// set already carries a primary-text version and a video-script version of
// the same angle, so one library serves both.
export const DEFAULT_AD_ANGLES: Omit<Style, "examples">[] = [
  {
    id: "identity-mirror",
    category: "adAngle",
    name: "Identity mirror",
    description:
      "Built on the market's own verbatim language. Describe the reader's exact situation so precisely they feel personally addressed.",
    builtIn: true,
  },
  {
    id: "failed-alternative-mirror",
    category: "adAngle",
    name: "Failed-alternative mirror",
    description:
      "Built on what the reader already tried that didn't work (a partner, a past service, a DIY attempt). Names the failure, then reframes why it failed.",
    builtIn: true,
  },
  {
    id: "myth-buster",
    category: "adAngle",
    name: "Myth-buster",
    description:
      "Built on a false belief the market holds. The myth is made half-true, then given the missing half — never told they were wrong, told they were incomplete.",
    builtIn: true,
  },
  {
    id: "cost-of-inaction",
    category: "adAngle",
    name: "Cost of inaction",
    description:
      "Built on the math of another year unchanged. Makes the price of staying still concrete and specific, without hype or false urgency.",
    builtIn: true,
  },
  {
    id: "contrarian-pattern-interrupt",
    category: "adAngle",
    name: "Contrarian / pattern interrupt",
    description:
      "Challenges conventional wisdom head-on — 'Why more of X is hurting your results.' Opens by disagreeing with what the reader already believes is true.",
    builtIn: true,
  },
  {
    id: "secret-mechanism-reveal",
    category: "adAngle",
    name: "Secret / mechanism reveal",
    description:
      "Leads with an unexpected mechanism — the one specific thing that actually drives the result, which the market hasn't been told. Claim, then reason, then outcome.",
    builtIn: true,
  },
  {
    id: "us-vs-them",
    category: "adAngle",
    name: "Us vs. them",
    description:
      "Names a common enemy — an industry practice, a broken model, a category of bad actor — without attacking a specific person. Positions the offer as the alternative to that enemy.",
    builtIn: true,
  },
  {
    id: "direct-callout",
    category: "adAngle",
    name: "Direct callout",
    description:
      "Names the reader's exact situation bluntly in the first line — 'If you're a [specific role] doing [specific thing]...' No warm-up, no story, straight identification.",
    builtIn: true,
  },
  {
    id: "case-study-spotlight",
    category: "adAngle",
    name: "Case-study spotlight",
    description:
      "Told as one client's story rather than stacked stats — a single before/after journey with enough specific detail that it reads as a real account, not a testimonial blurb.",
    builtIn: true,
  },
  {
    id: "day-in-the-life-scene",
    category: "adAngle",
    name: "Day-in-the-life scene",
    description:
      "Opens inside one dramatized, specific moment (a phone call, a bill on the table, a 3 a.m. text) rather than a general description of the problem.",
    builtIn: true,
  },
  {
    id: "objection-first",
    category: "adAngle",
    name: "Objection-first",
    description:
      "Leads with the single biggest reason people don't buy and dismantles it in the first two lines, before making any pitch at all.",
    builtIn: true,
  },
  {
    id: "founder-origin",
    category: "adAngle",
    name: "Founder origin",
    description:
      "'I was you' — credibility built through a shared past struggle, told briefly, before pivoting to what changed and why that same shift is available to the reader.",
    builtIn: true,
  },
];

// Funnel styles are a different axis than ad angles — they describe the
// shape of the page/offer sequence, not the psychological entry point of a
// single ad.
export const DEFAULT_FUNNEL_STYLES: Omit<Style, "examples">[] = [
  {
    id: "optin-vsl-personal-call",
    category: "funnelStyle",
    name: "Opt-in -> VSL -> personal call",
    description:
      "Lead leaves info, watches a video sales letter that pre-frames a call, operator calls them personally. No calendar, no booking button — the call is the close.",
    builtIn: true,
  },
  {
    id: "optin-nurture-book",
    category: "funnelStyle",
    name: "Opt-in -> nurture -> booked call",
    description:
      "Lead leaves info, gets a short SMS/email drip building trust and answering objections, ends with a direct booking link. No VSL required.",
    builtIn: true,
  },
  {
    id: "webinar-funnel",
    category: "funnelStyle",
    name: "Webinar funnel",
    description:
      "Registration page -> live or automated 45-90 minute webinar that educates and builds social proof -> pitch at the end. Suits complex or higher-ticket offers that need real explanation.",
    builtIn: true,
  },
  {
    id: "quiz-diagnostic-funnel",
    category: "funnelStyle",
    name: "Quiz / diagnostic funnel",
    description:
      "Short interactive quiz segments the visitor and delivers a personalized result, which leads into an offer tailored to their answers.",
    builtIn: true,
  },
  {
    id: "application-funnel",
    category: "funnelStyle",
    name: "Short VSL -> application -> call",
    description:
      "Best for higher-ticket offers: a short (8-15 min) VSL hits pain points, then routes to an application form that qualifies before a booking page. Filters harder than a plain opt-in.",
    builtIn: true,
  },
  {
    id: "tripwire-funnel",
    category: "funnelStyle",
    name: "Tripwire / low-ticket entry funnel",
    description:
      "A low-cost entry offer converts browsers into buyers immediately, then upsells into the core offer once trust and a payment relationship already exist.",
    builtIn: true,
  },
  {
    id: "challenge-funnel",
    category: "funnelStyle",
    name: "Challenge funnel",
    description:
      "A multi-day (often 3-5 day) challenge delivers real value daily, builds momentum and community, and pitches the core offer as the natural next step at the end.",
    builtIn: true,
  },
  {
    id: "direct-sales-page",
    category: "funnelStyle",
    name: "Direct offer / long-form sales page",
    description:
      "No separate opt-in step — traffic lands straight on a long-form sales page (classic PAS/AIDA structure) with the buy button built in. Fastest path, best for well-understood offers.",
    builtIn: true,
  },
  {
    id: "funnel-stack",
    category: "funnelStyle",
    name: "Squeeze page -> webinar -> application stack",
    description:
      "A squeeze page feeds a webinar funnel, which then routes buyers into a high-ticket application funnel — sequencing multiple funnel types to serve different readiness levels off one traffic source.",
    builtIn: true,
  },
  {
    id: "direct-book-a-call",
    category: "funnelStyle",
    name: "Direct book-a-call",
    description:
      "No lead magnet at all — the ad sends traffic straight to a booking page. Works when the offer and the qualification bar are both very clear up front.",
    builtIn: true,
  },
];

// VSL styles describe the internal structure of the centerpiece video itself
// — independent of the funnel style, which decides whether a VSL is used at
// all. Selected only when the chosen funnel style actually calls for one.
export const DEFAULT_VSL_STYLES: Omit<Style, "examples">[] = [
  {
    id: "personal-call-frame",
    category: "vslStyle",
    name: "Personal-call frame",
    description:
      "Direct-to-camera operator frame: who's calling and why, a persona fork for different viewer types, the wall (why most people fail), how it works, proof, exactly what the call is, close. No booking link — the call is the close.",
    builtIn: true,
  },
  {
    id: "star-story-solution",
    category: "vslStyle",
    name: "Star, Story, Solution",
    description:
      "Introduces a relatable 'star' (a real client or the founder), tells their specific story of struggle through to breakthrough, then presents the offer as the natural next chapter of that story.",
    builtIn: true,
  },
  {
    id: "pas-long-form",
    category: "vslStyle",
    name: "PAS long-form",
    description:
      "Problem, Agitate, Solution stretched to video length — spends real time deepening the pain and its cost before the offer is ever named.",
    builtIn: true,
  },
  {
    id: "aida-classic",
    category: "vslStyle",
    name: "AIDA classic",
    description:
      "Attention, Interest, Desire, Action — a broader, more traditional persuasion arc. Suits colder traffic that hasn't pre-qualified itself the way an opt-in lead has.",
    builtIn: true,
  },
  {
    id: "slap-fast-scroll",
    category: "vslStyle",
    name: "SLAP (fast-scroll)",
    description:
      "Stop, Look, Act, Purchase — front-loads the hook harder and compresses everything after it. Built for placements where attention drops off fast.",
    builtIn: true,
  },
  {
    id: "documentary-narrator",
    category: "vslStyle",
    name: "Documentary / third-party narrator",
    description:
      "A narrator voice-over rather than founder talking-head — plays like a short case-study documentary rather than a pitch, with the offer arriving as the natural conclusion.",
    builtIn: true,
  },
  {
    id: "case-study-led",
    category: "vslStyle",
    name: "Case-study-led",
    description:
      "Opens with someone else's specific, already-achieved result before the mechanism is explained, then unpacks exactly how they got there.",
    builtIn: true,
  },
  {
    id: "old-way-new-way",
    category: "vslStyle",
    name: "Old way vs. new way",
    description:
      "Runs two paths side by side for the whole video — what most people do vs. what actually works — building the contrast beat by beat instead of telling one straight story.",
    builtIn: true,
  },
  {
    id: "countdown-listicle",
    category: "vslStyle",
    name: "Countdown / listicle",
    description:
      "'5 reasons X keeps failing' — numbered tension building toward the reveal of the mechanism and the offer. Good for markets already aware of the problem but not the cause.",
    builtIn: true,
  },
  {
    id: "short-form-ad-vsl",
    category: "vslStyle",
    name: "Short-form ad-style VSL (60-90s)",
    description:
      "A compressed hook-problem-solution-proof-CTA arc for placements where a 4-6 minute video won't get watched. Trades depth for completion rate — every beat gets one sentence.",
    builtIn: true,
  },
];

// Emotional tone states, adapted from David Hawkins' Map of Consciousness —
// used as a creative/tonal reference, not a scientific claim. Each state
// describes the reader's real interior monologue at that level, so Hook and
// Mirror can be written from inside it rather than judged from outside it.
// Courage (200) is the marked threshold from "contracted" to "expanded."
// Ordered top to bottom exactly as the reference chart runs (Enlightenment
// at the peak down to Shame at the base) — see EMOTION_DISPLAY_ORDER below
// for why this source order alone doesn't control what the UI shows.
export const DEFAULT_EMOTION_STATES: Omit<Style, "examples">[] = [
  {
    id: "emotion-enlightenment",
    category: "emotionalTone",
    name: "Enlightenment (700+)",
    description:
      "Expanded. Beyond personal need. Essentially never a usable copy target — included only for completeness of the scale.",
    builtIn: true,
  },
  {
    id: "emotion-peace",
    category: "emotionalTone",
    name: "Peace (600)",
    description: "Expanded. Total presence, no urgency, quietly certain. Rare as a copy target; more a description of the life after the offer delivers.",
    builtIn: true,
  },
  {
    id: "emotion-joy",
    category: "emotionalTone",
    name: "Joy (540)",
    description:
      "Expanded. Grateful, energized, an internal yes that doesn't need external permission. Rarely a realistic target for a first ad — more common by the end of a nurture sequence.",
    builtIn: true,
  },
  {
    id: "emotion-love",
    category: "emotionalTone",
    name: "Love (500)",
    description:
      "Expanded. Genuinely cares about the outcome, not just personal gain — for family, for the crew, for what this makes possible for someone else.",
    builtIn: true,
  },
  {
    id: "emotion-reason",
    category: "emotionalTone",
    name: "Reason (400)",
    description:
      "Expanded. Logical, wants the data and the plan — convinced by clear thinking, not emotional appeal. 'Show me the numbers and the steps.'",
    builtIn: true,
  },
  {
    id: "emotion-acceptance",
    category: "emotionalTone",
    name: "Acceptance (350)",
    description:
      "Expanded. At peace with what is, no longer fighting reality — ready to build from exactly where they actually stand, not where they wish they were.",
    builtIn: true,
  },
  {
    id: "emotion-willingness",
    category: "emotionalTone",
    name: "Willingness (310)",
    description:
      "Expanded. Open, cooperative, actively saying yes to growth — 'okay, walk me through it, I'm in.'",
    builtIn: true,
  },
  {
    id: "emotion-neutrality",
    category: "emotionalTone",
    name: "Neutrality (250)",
    description:
      "Expanded. Calm, flexible, non-reactive — 'I'm okay either way, let's just see what's actually true.'",
    builtIn: true,
  },
  {
    id: "emotion-courage",
    category: "emotionalTone",
    name: "Courage (200)",
    description:
      "The threshold — first expanded state. 'I can do this' despite the fear still being present. First real willingness to face facts and act.",
    builtIn: true,
  },
  {
    id: "emotion-pride",
    category: "emotionalTone",
    name: "Pride (175)",
    description:
      "Contracted. Defensive ego protecting against admitting the real problem — 'I don't need help, I've got this handled' (while clearly not having it handled).",
    builtIn: true,
  },
  {
    id: "emotion-anger",
    category: "emotionalTone",
    name: "Anger (150)",
    description:
      "Contracted. Frustrated, blaming an external villain — a bad boss, a broker, the system. 'I'm sick of this happening to me.'",
    builtIn: true,
  },
  {
    id: "emotion-desire",
    category: "emotionalTone",
    name: "Desire (125)",
    description:
      "Contracted. Craving, wanting badly but not yet acting — pull without follow-through. 'I want this so bad it hurts to think about.'",
    builtIn: true,
  },
  {
    id: "emotion-fear",
    category: "emotionalTone",
    name: "Fear (100)",
    description:
      "Contracted. Anxious, catastrophizing, afraid of being exposed as a failure or making it worse. 'What if I try and it doesn't work.'",
    builtIn: true,
  },
  {
    id: "emotion-grief",
    category: "emotionalTone",
    name: "Grief (75)",
    description:
      "Contracted. Mourning what didn't happen — years spent, chances missed. 'I can't get that time back.'",
    builtIn: true,
  },
  {
    id: "emotion-apathy",
    category: "emotionalTone",
    name: "Apathy (50)",
    description:
      "Contracted. Hopeless, numb resignation — 'what's the point, nothing changes anyway.' Has stopped trying, not just stopped hoping.",
    builtIn: true,
  },
  {
    id: "emotion-guilt",
    category: "emotionalTone",
    name: "Guilt (30)",
    description:
      "Contracted. Self-blame, a punishing inner voice — 'I should have known better, I did this to myself.'",
    builtIn: true,
  },
  {
    id: "emotion-shame",
    category: "emotionalTone",
    name: "Shame (20)",
    description:
      "Contracted. Feels worthless, wants to disappear, self-loathing — 'I'm the problem.' Rarely useful as a target state; too paralyzing to act from. Useful only as a current-state read for the most beaten-down reader.",
    builtIn: true,
  },
];

// The API sorts styles alphabetically by name (needed for the other three
// categories), which would scramble the emotion scale — "Acceptance"
// wouldn't sit anywhere near "Anger." This gives display code an explicit
// framework-order sort instead of relying on fetch order.
export const EMOTION_DISPLAY_ORDER: string[] = DEFAULT_EMOTION_STATES.map((s) => s.id);

export function sortEmotionStyles(styles: Style[]): Style[] {
  const rank = (id: string) => {
    const i = EMOTION_DISPLAY_ORDER.indexOf(id);
    // Custom user-added emotions (not in the fixed scale) sort after the
    // known 17, rather than before — indexOf's -1 would otherwise sort first.
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...styles].sort((a, b) => rank(a.id) - rank(b.id));
}

export function seedStyles(): Style[] {
  return [
    ...DEFAULT_AD_ANGLES.map((s) => ({ ...s, examples: [] as StyleExample[] })),
    ...DEFAULT_FUNNEL_STYLES.map((s) => ({ ...s, examples: [] as StyleExample[] })),
    ...DEFAULT_VSL_STYLES.map((s) => ({ ...s, examples: [] as StyleExample[] })),
    ...DEFAULT_EMOTION_STATES.map((s) => ({ ...s, examples: [] as StyleExample[] })),
  ];
}
