import "server-only";
import { addMonths, pragueDate } from "./dates";
import { activeProducts, getVoucherSettings } from "./settings";
import type { Locale, VoucherOrder } from "./types";

/** A made-up paid order for admin previews — the chosen package, or the first one. */
export async function sampleOrder(locale: Locale, productId?: string | null): Promise<VoucherOrder | null> {
  const settings = await getVoucherSettings();
  const products = activeProducts(settings);
  const product = products.find((p) => p.id === productId) ?? products[0];
  if (!product) return null;
  return {
    id: "preview", vs: "77000000", locale, status: "paid", createdAt: new Date().toISOString(),
    product: { id: product.id, name: product.name[locale], details: product.details[locale], priceCzk: product.priceCzk },
    buyer: { name: "Petr", email: "petr@example.com" },
    recipient: { name: locale === "cs" ? "Jana Nováková" : "Jane Doe" },
    dedication: locale === "cs" ? "Ať máš konečně fotky, na kterých se líbíš sama sobě. Krásné Vánoce, Petr" : "For the photos you've always wanted. Merry Christmas, Peter",
    christmas: settings.christmas,
    code: "GP-7KQ4-M2XD",
    validUntil: addMonths(pragueDate(), settings.validityMonths),
  };
}
