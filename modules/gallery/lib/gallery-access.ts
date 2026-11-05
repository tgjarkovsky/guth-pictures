import { NextResponse } from "next/server";
import { getGallery, isExpired, type GalleryRecord } from "./gallery";
import { hasGallerySession } from "./gallery-session";

/** Client-side gallery gate shared by the public gallery API: exists → not expired → valid session. */
export async function requireGalleryAccess(
  slug: string,
  expiredError = "Gallery expired"
): Promise<GalleryRecord | NextResponse> {
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isExpired(gallery)) return NextResponse.json({ error: expiredError }, { status: 410 });
  if (!(await hasGallerySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return gallery;
}
