import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { isVoucherTheme } from "@/modules/vouchers/lib/design";
import { renderFrontPreview } from "@/modules/vouchers/lib/render";
import { cleanThemePhotos } from "@/modules/vouchers/lib/settings-validation";

/**
 * Front of the card with the photo picked in the admin, saved or not:
 * ?theme=snow&publicId=portfolio/x&x=50&y=30 (without publicId = the bundled photo).
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const theme = q.get("theme");
  if (!isVoucherTheme(theme)) return NextResponse.json({ error: "Neznámý vzhled" }, { status: 400 });
  const publicId = q.get("publicId");
  const photo = publicId ? cleanThemePhotos({ [theme]: { publicId, x: Number(q.get("x")), y: Number(q.get("y")) } })[theme] : null;
  if (publicId && !photo) return NextResponse.json({ error: "Neplatná fotka" }, { status: 400 });
  try {
    const png = await renderFrontPreview(theme, q.get("locale") === "en" ? "en" : "cs", photo ?? null, 1.5);
    return new NextResponse(Buffer.from(png), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: `Fotku se nepodařilo načíst: ${err instanceof Error ? err.message : err}` }, { status: 502 });
  }
}
