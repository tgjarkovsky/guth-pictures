import { featuredFlags, parsePriceCzk } from "@/lib/package-price";
import { slugify } from "@/lib/slugify";
import type { PricingPackage } from "@/lib/types";
import type { VoucherProduct } from "./types";

// Vouchers sell exactly the creative-portrait packages from the admin (Texty → Služby → Portréty),
// so a price change there shows up on the voucher page too. Pure — tested on its own.

export function productsFromPortraitPackages(cs: PricingPackage[], en: PricingPackage[]): VoucherProduct[] {
  const products: VoucherProduct[] = [];
  const featured = featuredFlags(cs);
  cs.forEach((pkg, i) => {
    const priceCzk = parsePriceCzk(pkg.price);
    if (!priceCzk || !pkg.name.trim()) return;
    // Package ids can be generated per request (content.ts withIds), so match by position and
    // derive the voucher product id from the Czech name — it must stay the same between page and order.
    const enPkg = en[i] ?? pkg;
    const details = (p: PricingPackage) => [p.duration, ...p.includes].map((s) => s.trim()).filter(Boolean);
    const base = `portrait-${slugify(pkg.name)}`;
    products.push({
      id: products.some((p) => p.id === base) ? `${base}-${i + 1}` : base,
      name: { cs: `Kreativní portrét — ${pkg.name.trim()}`, en: `Creative portrait — ${(enPkg.name || pkg.name).trim()}` },
      priceCzk,
      details: { cs: details(pkg), en: details(enPkg) },
      active: true,
      featured: featured[i],
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
  return [duration, ...picked].filter(Boolean).slice(0, 3).map(tidyDetail);
}

/** Admin copy → print: "90-120" gets an en dash, a trailing period goes, "Min." mid-line becomes "min.". */
function tidyDetail(d: string): string {
  return d
    .trim()
    .replace(/(\d)\s*-\s*(\d)/g, "$1–$2")
    .replace(/\.$/, "")
    .replace(/^(Min\.|Minimálně|At least)(?=\s)/, (m) => m.toLowerCase());
}

export { parsePriceCzk };

/** The highlighted package sits in the middle of the row (Standard · Deluxe · Rozšířený). */
export function featuredInMiddle<T extends { featured?: boolean }>(items: T[]): T[] {
  const i = items.findIndex((p) => p.featured);
  if (i < 0 || items.length < 3) return items;
  const rest = items.filter((_, j) => j !== i);
  const mid = Math.floor(items.length / 2);
  return [...rest.slice(0, mid), items[i], ...rest.slice(mid)];
}
