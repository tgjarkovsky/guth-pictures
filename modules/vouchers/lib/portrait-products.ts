import { slugify } from "@/lib/slugify";
import type { PricingPackage } from "@/lib/types";
import type { VoucherProduct } from "./types";

// Vouchers sell exactly the creative-portrait packages from the admin (Texty → Služby → Portréty),
// so a price change there shows up on the voucher page too. Pure — tested on its own.

/** "2 500 Kč", "2500", "od 2 500 Kč" → 2500. Prices that are not a plain number ("na dotaz") give null. */
export function parsePriceCzk(price: string): number | null {
  const digits = price.replace(/[\s ]/g, "").match(/\d+/);
  const n = digits ? Number(digits[0]) : NaN;
  return Number.isInteger(n) && n >= 100 ? n : null;
}

export function productsFromPortraitPackages(cs: PricingPackage[], en: PricingPackage[]): VoucherProduct[] {
  const products: VoucherProduct[] = [];
  cs.forEach((pkg, i) => {
    const priceCzk = parsePriceCzk(pkg.price);
    if (!priceCzk || !pkg.name.trim()) return;
    const enPkg = en.find((e) => pkg.id && e.id === pkg.id) ?? en[i] ?? pkg;
    const details = (p: PricingPackage) => [p.duration, ...p.includes].map((s) => s.trim()).filter(Boolean);
    products.push({
      id: `portrait-${pkg.id || slugify(pkg.name)}`,
      name: { cs: `Kreativní portrét — ${pkg.name.trim()}`, en: `Creative portrait — ${(enPkg.name || pkg.name).trim()}` },
      priceCzk,
      details: { cs: details(pkg), en: details(enPkg) },
      active: true,
    });
  });
  return products;
}

/**
 * The voucher has room for one line: the duration plus the countable items
 * ("min. 5 upravených fotografií"); without those, the short ones.
 */
export function voucherLineDetails(details: string[]): string[] {
  const [duration, ...rest] = details;
  const counted = rest.filter((d) => /\d/.test(d));
  const picked = counted.length ? counted : rest.filter((d) => d.length <= 30);
  return [duration, ...picked].filter(Boolean).slice(0, 3);
}
