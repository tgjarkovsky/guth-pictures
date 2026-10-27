import { requireAdmin, readJson } from "@/lib/admin-route";
import { keepAllowed } from "@/modules/pozy/filter";
import { createPoseLink, listPoseLinks } from "@/modules/pozy/lib/picks";
import poses from "@/tools/pose-pack/poses.json";
import { NextResponse } from "next/server";

const MAX_CLIENT_LENGTH = 100;

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ links: await listPoseLinks() });
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<{ client?: unknown; poseIds?: unknown }>(request);
  if (body instanceof NextResponse) return body;

  const client = typeof body.client === "string" ? body.client.trim() : "";
  if (!client || client.length > MAX_CLIENT_LENGTH) {
    return NextResponse.json({ error: "client required (max 100 chars)" }, { status: 400 });
  }
  const poseIds = keepAllowed(body.poseIds, poses.map((p) => p.id));
  if (!poseIds.length) return NextResponse.json({ error: "Pick at least one pose" }, { status: 400 });

  return NextResponse.json({ link: await createPoseLink(client, poseIds) });
}
