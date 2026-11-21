import { addMonths, formatDate, pragueDate } from "@/modules/vouchers/lib/dates";
import { themeForProduct } from "@/modules/vouchers/lib/design";
import { qrDataUri, renderSpreadPng } from "@/modules/vouchers/lib/render";
import { activeProducts, getVoucherSettings } from "@/modules/vouchers/lib/settings";
import { siteUrl } from "@/lib/config";
import { voucherLineDetails } from "@/modules/vouchers/lib/portrait-products";

/** Sample voucher (back | front) for the sales page. Cached at the edge for a day. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "cs";
  const settings = await getVoucherSettings();
  const products = activeProducts(settings);
  const product = products.find((p) => /deluxe/.test(p.id)) ?? products[0];
  if (!product) return new Response(null, { status: 404 });
  const png = await renderSpreadPng({
    locale,
    theme: themeForProduct(product.id),
    packageName: product.name[locale],
    packageDetails: voucherLineDetails(product.details[locale]),
    recipientName: locale === "cs" ? "Jana Nováková" : "Jane Doe",
    dedication: locale === "cs" ? "Ať máš konečně fotky, na kterých se líbíš sama sobě. Krásné Vánoce, Petr" : "For the photos you've always wanted. Merry Christmas, Peter",
    code: "GP-XXXX-XXXX",
    validUntil: formatDate(addMonths(pragueDate(), settings.validityMonths), locale),
    qrSrc: await qrDataUri(`${siteUrl}/${locale}/darkovy-poukaz`),
    bookingUrlLabel: `${new URL(siteUrl).host.replace(/^www\./, "")}/poukaz`,
  });
  return new Response(Buffer.from(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
