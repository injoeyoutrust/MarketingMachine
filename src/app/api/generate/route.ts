import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CAMPAIGN_ENGINE_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { buildCampaignKitTool } from "@/lib/toolSchema";
import { buildStyleBrief, computeMaxTokens } from "@/lib/promptBuilder";
import type { CampaignKit } from "@/lib/types";
import type { Style } from "@/lib/styleLibrary";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  let intake: string;
  let adAngles: Style[];
  let funnelStyle: Style | null;
  let vslStyle: Style | null;
  try {
    const body = await req.json();
    intake = body.intake;
    adAngles = Array.isArray(body.adAngles) ? body.adAngles : [];
    funnelStyle = body.funnelStyle ?? null;
    vslStyle = body.vslStyle ?? null;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (!intake || typeof intake !== "string" || intake.trim().length < 20) {
    return NextResponse.json(
      { error: "Fill in more of the intake before generating." },
      { status: 400 }
    );
  }

  if (adAngles.length === 0) {
    return NextResponse.json(
      { error: "Select at least one ad angle before generating." },
      { status: 400 }
    );
  }

  if (!funnelStyle) {
    return NextResponse.json(
      { error: "Select a funnel style before generating." },
      { status: 400 }
    );
  }

  if (!vslStyle) {
    return NextResponse.json(
      { error: "Select a VSL style before generating." },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  const angleBrief = buildStyleBrief(
    `ANGLE BRIEF — write exactly one ad set per angle below, in this order:`,
    adAngles
  );
  const funnelBrief = buildStyleBrief(
    `FUNNEL BRIEF — shape the opt-in and thank-you pages to match this structure, and use it to decide whether a VSL is used at all:`,
    [funnelStyle]
  );
  const vslBrief = buildStyleBrief(
    `VSL BRIEF — if the FUNNEL BRIEF calls for a VSL, structure it using this style (ignore if the funnel style has no VSL):`,
    [vslStyle]
  );

  const userContent: Anthropic.MessageParam["content"] = [
    {
      type: "text",
      text: `Here is the completed client intake. Run the extraction, then build the full campaign kit.\n\n${intake}\n\n---\n\n${angleBrief.text}\n\n---\n\n${funnelBrief.text}\n\n---\n\n${vslBrief.text}`,
    },
    ...angleBrief.imageBlocks,
    ...funnelBrief.imageBlocks,
    ...vslBrief.imageBlocks,
  ];

  try {
    // Streamed rather than a single blocking call: with several angles
    // selected, max_tokens climbs high enough that the SDK requires
    // streaming (it refuses non-streaming requests it estimates could run
    // past ~10 minutes). We still just want the final assembled message.
    const stream = client.messages.stream({
      model: "claude-sonnet-5",
      max_tokens: computeMaxTokens(adAngles.length),
      system: CAMPAIGN_ENGINE_SYSTEM_PROMPT,
      tools: [buildCampaignKitTool(adAngles.length)],
      tool_choice: { type: "tool", name: "deliver_campaign_kit" },
      messages: [{ role: "user", content: userContent }],
    });

    const message = await stream.finalMessage();

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      return NextResponse.json(
        { error: "The model did not return a structured kit. Try again." },
        { status: 502 }
      );
    }

    const kit = toolUse.input as CampaignKit;
    return NextResponse.json({ kit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error calling Claude.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
