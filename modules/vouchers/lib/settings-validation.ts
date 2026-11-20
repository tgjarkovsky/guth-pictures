import type { VoucherProduct, VoucherSettings } from "./types";

const strings = (v: unknown) => Array.isArray(v) && v.every((s) => typeof s === "string");

/** Admin-edited settings → clean object, or a Czech error message. */
export function parseSettings(raw: unknown): VoucherSettings | string {
  const b = (raw ?? {}) as Record<string, unknown>;
  if (typeof b.enabled !== "boolean" || typeof b.christmas !== "boolean") return "Chybí přepínače";
  if (typeof b.photoPublicId !== "string" || !b.photoPublicId.trim()) return "Chybí fotka poukazu";
  const months = Number(b.validityMonths);
  if (!Number.isInteger(months) || months < 1 || months > 36) return "Platnost musí být 1–36 měsíců";
  if (!Array.isArray(b.products) || !b.products.length) return "Přidej aspoň jeden balíček";

  const ids = new Set<string>();
  const products: VoucherProduct[] = [];
  for (const p of b.products as Record<string, unknown>[]) {
    const name = p?.name as Record<string, unknown> | undefined;
    const details = p?.details as Record<string, unknown> | undefined;
    const id = typeof p?.id === "string" ? p.id.trim() : "";
    if (!/^[a-z0-9-]{2,40}$/.test(id) || ids.has(id)) return `Neplatné nebo duplicitní ID balíčku „${id}“`;
    if (typeof name?.cs !== "string" || !name.cs.trim() || typeof name?.en !== "string" || !name.en.trim()) return `Balíček ${id}: chybí název CS/EN`;
    const price = Number(p.priceCzk);
    if (!Number.isInteger(price) || price < 100 || price > 100_000) return `Balíček ${id}: cena musí být celé číslo 100–100 000 Kč`;
    if (!strings(details?.cs) || !strings(details?.en)) return `Balíček ${id}: chybí popis`;
    ids.add(id);
    products.push({
      id,
      name: { cs: name.cs.trim(), en: name.en.trim() },
      priceCzk: price,
      details: {
        cs: (details!.cs as string[]).map((s) => s.trim()).filter(Boolean).slice(0, 4),
        en: (details!.en as string[]).map((s) => s.trim()).filter(Boolean).slice(0, 4),
      },
      active: p.active === true,
    });
  }
  if (!products.some((p) => p.active)) return "Aspoň jeden balíček musí být aktivní";
  return { enabled: b.enabled, christmas: b.christmas, photoPublicId: b.photoPublicId.trim(), validityMonths: months, products };
}
