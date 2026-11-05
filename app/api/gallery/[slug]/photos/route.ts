import { getGalleryPhotos } from "@/modules/gallery/lib/gallery";
import { requireGalleryAccess } from "@/modules/gallery/lib/gallery-access";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const gallery = await requireGalleryAccess(slug);
  if (gallery instanceof NextResponse) return gallery;

  const photos = await getGalleryPhotos(slug);
  return NextResponse.json({ photos, maxSelection: gallery.maxSelection ?? null,
    delivered: gallery.delivered ?? false,
  });
}
