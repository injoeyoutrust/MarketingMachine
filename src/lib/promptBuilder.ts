import type Anthropic from "@anthropic-ai/sdk";
import type { Style } from "./styleLibrary";

type ImageBlock = Anthropic.ImageBlockParam;
type TextBlock = Anthropic.TextBlockParam;

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mediaType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  return { mediaType, data: match[2] };
}

/**
 * Turns a list of selected styles (ad angles or a single funnel style) into:
 * - a text block naming each style, its mechanism, and any pasted text
 *   examples, labeled clearly
 * - one image content block per attached screenshot example, each preceded
 *   by a short text label so the model knows which style it illustrates
 */
export function buildStyleBrief(
  heading: string,
  styles: Style[]
): { text: string; imageBlocks: (TextBlock | ImageBlock)[] } {
  const lines: string[] = [heading];
  const imageBlocks: (TextBlock | ImageBlock)[] = [];

  for (const style of styles) {
    lines.push(`\n### ${style.name}\n${style.description}`);

    const textExamples = style.examples.filter((e) => e.type === "text");
    const imageExamples = style.examples.filter((e) => e.type === "image");

    for (const ex of textExamples) {
      lines.push(`\nReference example for "${style.name}" (${ex.label || "untitled"}):\n"""\n${ex.content.slice(0, 4000)}\n"""`);
    }

    for (const ex of imageExamples) {
      const parsed = parseDataUrl(ex.content);
      if (!parsed) continue;
      imageBlocks.push({
        type: "text",
        text: `Reference screenshot for "${style.name}" (${ex.label || "untitled"}) — study its structure and mimic the technique, not the literal wording:`,
      });
      imageBlocks.push({
        type: "image",
        source: { type: "base64", media_type: parsed.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: parsed.data },
      });
    }
  }

  return { text: lines.join("\n"), imageBlocks };
}

/** Rough token-aware max_tokens scaling based on how many ad sets are requested. */
export function computeMaxTokens(angleCount: number): number {
  const base = 6000;
  const perAngle = 2200;
  return Math.min(32000, base + perAngle * Math.max(angleCount, 1));
}
