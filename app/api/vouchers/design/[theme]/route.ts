import { NextRequest } from "next/server";
import { isVoucherTheme } from "@/modules/vouchers/lib/design";
import { renderCardPng } from "@/modules/vouchers/lib/render";

/** Front of the card for one design — thumbnails on the order page. Nothing personal on the front. ?locale=en */
export async function GET(req: NextRequest, { params }: { params: Promise<{ theme: string }> }) {
  const theme = (await params).theme;
  if (!isVoucherTheme(theme)) return new Response(null, { status: 404 });
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "cs";
  const png = await renderCardPng(
    { locale, theme, qrSrc: "", recipientName: "", packageName: "", packageDetails: [], code: "", validUntil: "", bookingUrlLabel: "" },
    "front",
    0.75,
  );
  return new Response(Buffer.from(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400" },
  });
}
