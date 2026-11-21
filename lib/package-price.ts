import type { PricingPackage } from "./types";

// Shared by the creative-portrait price list and the gift vouchers.

/** "2 500 Kč", "2500", "od 2 500 Kč" → 2500. Prices that are not a plain number ("na dotaz") give null. */
export function parsePriceCzk(price: string): number | null {
  const digits = price.replace(/[\s ]/g, "").match(/\d+/);
  const n = digits ? Number(digits[0]) : NaN;
  return Number.isInteger(n) && n >= 100 ? n : null;
}

/** A bare number typed in the admin ("2000") reads as a price; anything else is shown as written. */
export function formatPackagePrice(price: string, locale: string): string {
  const trimmed = price.trim();
  if (!/^\d[\d\s ]*$/.test(trimmed)) return trimmed;
  const n = new Intl.NumberFormat("cs-CZ").format(Number(trimmed.replace(/\D/g, ""))).replace(/ /g, " ");
  return locale === "en" ? `CZK ${n}` : `${n} Kč`;
}

/**
 * Which packages get the highlight. The admin checkbox wins once used on any package;
 * until then a package called "Deluxe" is highlighted.
 */
export function featuredFlags(packages: Pick<PricingPackage, "name" | "featured">[]): boolean[] {
  if (packages.some((p) => typeof p.featured === "boolean")) return packages.map((p) => p.featured === true);
  return packages.map((p) => /^\s*deluxe\s*$/i.test(p.name));
}
