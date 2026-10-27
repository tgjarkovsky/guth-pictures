import { checkRateLimit } from "@/lib/rate-limit";
import { keepAllowed } from "@/modules/pozy/filter";
import { getPoseLink, savePicks } from "@/modules/pozy/lib/picks";
import { NextRequest, NextResponse } from "next/server";

const MAX_NOTE_LENGTH = 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  const ip = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`pose-picks:${slug}:${ip}`, 30, 15 * 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const link = await getPoseLink(slug);
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { ids?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.note !== undefined && typeof body.note !== "string") {
    return NextResponse.json({ error: "note must be string" }, { status: 400 });
  }
  const note = body.note?.trim();
  if (note && note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "note too long" }, { status: 400 });
  }

  const ids = keepAllowed(body.ids, link.poseIds);
  await savePicks(slug, ids, note);
  return NextResponse.json({ ok: true, count: ids.length });
}
