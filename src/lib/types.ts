export interface VideoScript {
  hook: string;
  mirror: string;
  shift: string;
  proof: string;
  cta: string;
}

export interface AdSet {
  angle: string;
  primaryText: string;
  headline: string;
  description: string;
  videoScript: VideoScript;
}

export interface Extraction {
  verbatimLanguage: string[];
  centralReframe: string;
  proofStack: string[];
  beforeState: string;
  afterState: string;
  failedAlternatives: string[];
  objections: string[];
  falseBeliefs: string[];
  voice: string;
  personas: string[];
}

export interface OptInPage {
  eyebrow: string;
  hookHeadline: string;
  subHeadline: string;
  bullets: string[];
  ctaButton: string;
  microTrust: string;
  wireframeNote: string;
}

export interface ThankYouPage {
  headline: string;
  confirmationLine: string;
  videoScript: string;
  cta: string;
  fallbackLine: string;
  wireframeNote: string;
}

export interface VslSection {
  name: string;
  timestamp: string;
  script: string;
}

export interface Vsl {
  sections: VslSection[];
  wireframeNote: string;
}

export interface SmsMessage {
  day: number;
  message: string;
}

export interface EmailMessage {
  day: number;
  subject: string;
  body: string;
}

export interface OpsWeek {
  week: number;
  dates: string;
  focus: string;
  action: string;
}

export interface OpsPlan {
  launchDate: string;
  weeks: OpsWeek[];
  metrics: string[];
}

export interface Flag {
  issue: string;
  detail: string;
  resolveBy: string;
}

export interface CampaignKit {
  extraction: Extraction;
  adSets: AdSet[];
  optIn: OptInPage;
  thankYou: ThankYouPage;
  vsl: Vsl;
  sms: SmsMessage[];
  email: EmailMessage[];
  opsPlan: OpsPlan;
  flags: Flag[];
}

export type TabKey =
  | "extraction"
  | "adSets"
  | "optIn"
  | "thankYou"
  | "vsl"
  | "sms"
  | "email"
  | "opsPlan"
  | "flags";

export const TAB_LABELS: Record<TabKey, string> = {
  extraction: "Extraction",
  adSets: "Ad Sets",
  optIn: "Opt-in",
  thankYou: "Thank-You",
  vsl: "VSL",
  sms: "SMS",
  email: "Email",
  opsPlan: "Ops Plan",
  flags: "Flags",
};

export interface SavedRun {
  id: string;
  label: string;
  createdAt: string;
  intake: string;
  fields: Record<string, string>;
  adAngleNames: string[];
  funnelStyleName: string;
  vslStyleName: string;
  kit: CampaignKit;
}
