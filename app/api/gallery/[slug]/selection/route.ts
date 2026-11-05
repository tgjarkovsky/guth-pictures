import {
  getGalleryPhotos,
  getGallerySelection,
  saveGallerySelection,
} from "@/modules/gallery/lib/gallery";
import { hasGallerySession } from "@/modules/gallery/lib/gallery-session";
import { requireGalleryAccess } from "@/modules/gallery/lib/gallery-access";
import { NextRequest, NextResponse } from "next/server";
const MAX_NOTE_LENGTH = 1000;


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  if (!(await hasGallerySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const selection = await getGallerySelection(slug);
  return NextResponse.json({ selection });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const gallery = await requireGalleryAccess(slug, "Gallery expired — selection locked");
  if (gallery instanceof NextResponse) return gallery;

  if ((await getGallerySelection(slug))?.confirmedAt) {
    return NextResponse.json({ error: "Selection confirmed — locked" }, { status: 409 });
  }

  let body: { favorites?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!Array.isArray(body.favorites)) {
    return NextResponse.json({ error: "favorites must be array" }, { status: 400 });
  }

  if (body.note !== undefined && typeof body.note !== "string") {
    return NextResponse.json({ error: "note must be string" }, { status: 400 });
  }
  const note = body.note?.trim();
  if (note !== undefined && note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "note too long" }, { status: 400 });
  }

  const photos = await getGalleryPhotos(slug);
  const validIds = new Set(photos.map((p) => p.lrId));
  const favorites = [...new Set(body.favorites as unknown[])].filter(
    (id): id is string => typeof id === "string" && validIds.has(id)
  );

  if (gallery.maxSelection !== undefined && favorites.length > gallery.maxSelection) {
    return NextResponse.json(
      { error: `Selection limit exceeded (max ${gallery.maxSelection})` },
      { status: 400 }
    );
  }

  await saveGallerySelection(slug, favorites, note);
  return NextResponse.json({ ok: true, count: favorites.length });
}
