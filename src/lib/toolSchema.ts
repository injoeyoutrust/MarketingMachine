// JSON schema for the deliver_campaign_kit tool. Forcing Claude to call this
// tool (instead of writing prose) is what makes the output reliably
// parseable into the tabs the UI renders.

const videoScriptSchema = {
  type: "object",
  properties: {
    hook: { type: "string" },
    mirror: { type: "string" },
    shift: { type: "string" },
    proof: { type: "string" },
    cta: { type: "string" },
  },
  required: ["hook", "mirror", "shift", "proof", "cta"],
};

export function buildCampaignKitTool(angleCount: number) {
  return {
    name: "deliver_campaign_kit",
    description:
      "Deliver the complete, launch-ready campaign kit generated from the client intake.",
    input_schema: {
    type: "object" as const,
    properties: {
      extraction: {
        type: "object",
        description: "The extraction block — ingredients pulled from the intake before any copy is written.",
        properties: {
          verbatimLanguage: { type: "array", items: { type: "string" } },
          centralReframe: { type: "string" },
          proofStack: { type: "array", items: { type: "string" } },
          beforeState: { type: "string" },
          afterState: { type: "string" },
          failedAlternatives: { type: "array", items: { type: "string" } },
          objections: { type: "array", items: { type: "string" } },
          falseBeliefs: { type: "array", items: { type: "string" } },
          voice: { type: "string" },
          personas: { type: "array", items: { type: "string" } },
        },
        required: [
          "verbatimLanguage",
          "centralReframe",
          "proofStack",
          "beforeState",
          "afterState",
          "failedAlternatives",
          "objections",
          "falseBeliefs",
          "voice",
          "personas",
        ],
      },
      adSets: {
        type: "array",
        description: `Exactly ${angleCount} ad set${angleCount === 1 ? "" : "s"} — one per angle named in the ANGLE BRIEF given in the user message, in the same order. Use the exact angle name given as the "angle" field.`,
        items: {
          type: "object",
          properties: {
            angle: {
              type: "string",
              description: "Must exactly match one of the angle names given in the ANGLE BRIEF.",
            },
            primaryText: { type: "string" },
            headline: { type: "string" },
            description: { type: "string" },
            videoScript: videoScriptSchema,
          },
          required: ["angle", "primaryText", "headline", "description", "videoScript"],
        },
        minItems: angleCount,
        maxItems: angleCount,
      },
      optIn: {
        type: "object",
        properties: {
          eyebrow: { type: "string" },
          hookHeadline: { type: "string" },
          subHeadline: { type: "string" },
          bullets: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
          ctaButton: { type: "string" },
          microTrust: { type: "string" },
          wireframeNote: { type: "string" },
        },
        required: ["eyebrow", "hookHeadline", "subHeadline", "bullets", "ctaButton", "microTrust", "wireframeNote"],
      },
      thankYou: {
        type: "object",
        properties: {
          headline: { type: "string" },
          confirmationLine: { type: "string" },
          videoScript: { type: "string" },
          cta: { type: "string" },
          fallbackLine: { type: "string" },
          wireframeNote: { type: "string" },
        },
        required: ["headline", "confirmationLine", "videoScript", "cta", "fallbackLine", "wireframeNote"],
      },
      vsl: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                timestamp: { type: "string" },
                script: { type: "string" },
              },
              required: ["name", "timestamp", "script"],
            },
          },
          wireframeNote: { type: "string" },
        },
        required: ["sections", "wireframeNote"],
      },
      sms: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "number" },
            message: { type: "string" },
          },
          required: ["day", "message"],
        },
        minItems: 3,
        maxItems: 3,
      },
      email: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "number" },
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["day", "subject", "body"],
        },
        minItems: 7,
        maxItems: 7,
      },
      opsPlan: {
        type: "object",
        properties: {
          launchDate: { type: "string" },
          weeks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                dates: { type: "string" },
                focus: { type: "string" },
                action: { type: "string" },
              },
              required: ["week", "dates", "focus", "action"],
            },
            minItems: 12,
            maxItems: 12,
          },
          metrics: { type: "array", items: { type: "string" } },
        },
        required: ["launchDate", "weeks", "metrics"],
      },
      flags: {
        type: "array",
        description: "Every gap, contradiction, or claim needing substantiation. Empty array only if genuinely none.",
        items: {
          type: "object",
          properties: {
            issue: { type: "string" },
            detail: { type: "string" },
            resolveBy: { type: "string" },
          },
          required: ["issue", "detail", "resolveBy"],
        },
      },
    },
      required: ["extraction", "adSets", "optIn", "thankYou", "vsl", "sms", "email", "opsPlan", "flags"],
    },
  };
}
