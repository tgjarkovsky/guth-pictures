import { addMonths, formatDate, pragueDate } from "@/modules/vouchers/lib/dates";
import { qrDataUri, renderVoucherPng } from "@/modules/vouchers/lib/render";
import { activeProducts, getVoucherSettings, voucherPhotoSrc } from "@/modules/vouchers/lib/settings";
import { siteUrl } from "@/lib/config";

/** Sample voucher image for the sales page. Cached at the edge for a day. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "cs";
  const settings = await getVoucherSettings();
  const product = activeProducts(settings)[0] ?? settings.products[0];
  const png = await renderVoucherPng(
    {
      locale,
      packageName: product.name[locale],
      packageDetails: product.details[locale],
      recipientName: locale === "cs" ? "Jana" : "Jane",
      dedication: locale === "cs" ? "Ať máš konečně fotky, na kterých se líbíš sama sobě." : "For the photos you've always wanted.",
      code: "GP-XXXX-XXXX",
      validUntil: formatDate(addMonths(pragueDate(), settings.validityMonths), locale),
      photoSrc: voucherPhotoSrc(settings.photoPublicId),
      qrSrc: await qrDataUri(`${siteUrl}/${locale}/darkovy-poukaz`),
      bookingUrlLabel: `${new URL(siteUrl).host.replace(/^www\./, "")}/poukaz`,
      christmas: settings.christmas,
    },
    0.8,
  );
  return new Response(Buffer.from(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
