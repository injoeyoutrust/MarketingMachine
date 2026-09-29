import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const UUID = /^[0-9a-f-]{36}$/i;
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
// Images are downscaled in the browser before upload; this is a backstop.
const MAX_CHARS = 8_000_000;

/** Which item the images belong to: ?placementId= (an ad angle in a level),
 * ?contributionId= (level copy) or ?runId= (an ad outside any funnel). */
function owner(params: { runId?: unknown; contributionId?: unknown; placementId?: unknown }) {
  if (typeof params.placementId === "string" && UUID.test(params.placementId)) return { column: "placement_id", id: params.placementId } as const;
  if (typeof params.runId === "string" && UUID.test(params.runId)) return { column: "run_id", id: params.runId } as const;
  if (typeof params.contributionId === "string" && UUID.test(params.contributionId)) return { column: "contribution_id", id: params.contributionId } as const;
  return null;
}

export async function GET(req: NextRequest) {
  const o = owner(Object.fromEntries(req.nextUrl.searchParams));
  if (!o) return NextResponse.json({ error: "placementId, contributionId or runId is required." }, { status: 400 });
  const { data, error } = await supabaseServer()
    .from("picture_ads")
    .select("id, name, image, created_at")
    .eq(o.column, o.id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pictures: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const o = body && owner(body);
  if (!o) return NextResponse.json({ error: "runId or contributionId is required." }, { status: 400 });
  if (typeof body.image !== "string" || !IMAGE_DATA_URL.test(body.image) || body.image.length > MAX_CHARS) {
    return NextResponse.json({ error: "Upload a PNG, JPEG, GIF or WebP image under about 6 MB." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.slice(0, 200) : "";
  const { data, error } = await supabaseServer()
    .from("picture_ads")
    .insert({ [o.column]: o.id, name, image: body.image })
    .select("id, name, image, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ picture: data });
}
