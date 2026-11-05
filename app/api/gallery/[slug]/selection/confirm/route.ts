import { confirmGallerySelection } from "@/modules/gallery/lib/gallery";
import { requireGalleryAccess } from "@/modules/gallery/lib/gallery-access";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const gallery = await requireGalleryAccess(slug, "Gallery expired — selection locked");
  if (gallery instanceof NextResponse) return gallery;

  const confirmedAt = await confirmGallerySelection(slug);
  if (!confirmedAt) {
    return NextResponse.json({ error: "Nothing to confirm" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, confirmedAt });
}
