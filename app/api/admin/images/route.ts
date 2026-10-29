import { NextRequest, NextResponse } from "next/server";
import { IMAGE_PAGES, revalidateLocalized } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/admin-route";
import { defaultEditorialImages, getImages, isImageNode, setImages, type EditorialImage, type EditorialImages } from "@/modules/admin/lib/content";

const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-.\/]{1,200}$/;
const FOCAL_POINT_RE = /^(100|[0-9]{1,2})% (100|[0-9]{1,2})%$/;
const MAX_TEXT = 200;
const MAX_IMAGES = 12;

function isValidPublicId(id: unknown): boolean {
  return id === "" || (typeof id === "string" && CLOUDINARY_ID_RE.test(id));
}

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

function isValidImage(value: unknown): value is EditorialImage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (!hasOnlyKeys(item, ["publicId", "alt", "focal"]) || !isValidPublicId(item.publicId)) return false;
  if (!item.alt || typeof item.alt !== "object" || Array.isArray(item.alt)) return false;
  const alt = item.alt as Record<string, unknown>;
  if (!hasOnlyKeys(alt, ["cs", "en"])) return false;
  if (typeof alt.cs !== "string" || alt.cs.length > MAX_TEXT) return false;
  if (typeof alt.en !== "string" || alt.en.length > MAX_TEXT) return false;
  if (!item.focal || typeof item.focal !== "object" || Array.isArray(item.focal)) return false;
  const focal = item.focal as Record<string, unknown>;
  if (!hasOnlyKeys(focal, ["desktop", "mobile"])) return false;
  return typeof focal.desktop === "string" && FOCAL_POINT_RE.test(focal.desktop)
    && typeof focal.mobile === "string" && FOCAL_POINT_RE.test(focal.mobile);
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function matchesTemplate(template: unknown, value: unknown): boolean {
  if (Array.isArray(template)) {
    return Array.isArray(value) && value.length <= MAX_IMAGES && value.every(isValidImage);
  }
  if (isImageNode(template)) return isValidImage(value);
  const keys = Object.keys(template as object);
  return isPlainObject(value) && hasOnlyKeys(value, keys)
    && keys.every((key) => key in value && matchesTemplate((template as Record<string, unknown>)[key], value[key]));
}

export const isValidEditorialImages = (value: unknown): value is EditorialImages =>
  matchesTemplate(defaultEditorialImages(), value);

export function isValidImagesPayload(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  if (!hasOnlyKeys(payload, ["profile", "heroTriptych", "editorial"])) return false;
  if (payload.profile !== undefined && !isValidPublicId(payload.profile)) return false;
  if (payload.heroTriptych !== undefined && (
    !Array.isArray(payload.heroTriptych)
    || payload.heroTriptych.length !== 3
    || !payload.heroTriptych.every((slot: unknown) => Array.isArray(slot) && slot.every(isValidPublicId))
  )) return false;
  return payload.editorial === undefined || isValidEditorialImages(payload.editorial);
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const data = await getImages();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  if (!isValidImagesPayload(body)) return NextResponse.json({ error: "Invalid images payload" }, { status: 400 });
  const { profile, heroTriptych, editorial } = body;
  const current = await getImages();
  await setImages({
    profile: profile ?? current.profile,
    heroTriptych: heroTriptych ?? current.heroTriptych,
    editorial: editorial ?? current.editorial,
  });
  revalidateLocalized(IMAGE_PAGES);
  return NextResponse.json({ ok: true });
}
