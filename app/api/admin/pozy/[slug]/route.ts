import { requireAdmin } from "@/lib/admin-route";
import { deletePoseLink } from "@/modules/pozy/lib/picks";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  await deletePoseLink(slug);
  return NextResponse.json({ ok: true });
}
