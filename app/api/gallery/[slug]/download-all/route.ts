import { cloudinary } from "@/lib/cloudinary";
import { getGallery, getGalleryPhotos, isExpired } from "@/modules/gallery/lib/gallery";
import { hasGallerySession } from "@/modules/gallery/lib/gallery-session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(gallery)) {
    return NextResponse.json({ error: "Gallery expired" }, { status: 410 });
  }

  if (!(await hasGallerySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!gallery.delivered) {
    return NextResponse.json({ error: "Gallery not delivered" }, { status: 403 });
  }

  const photos = await getGalleryPhotos(slug);
  if (photos.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = cloudinary.utils.download_zip_url({
    public_ids: photos.map((p) => p.cloudinaryId),
    target_public_id: slug,
    flatten_folders: true,
  });
  return NextResponse.redirect(url, 302);
}
