import type { StoredVoucherSettings } from "./settings";

/** Admin-edited settings → clean object, or a Czech error message. Packages are not edited here. */
export function parseSettings(raw: unknown): StoredVoucherSettings | string {
  const b = (raw ?? {}) as Record<string, unknown>;
  if (typeof b.enabled !== "boolean" || typeof b.christmas !== "boolean") return "Chybí přepínače";
  if (typeof b.photoPublicId !== "string" || !b.photoPublicId.trim()) return "Chybí fotka poukazu";
  const months = Number(b.validityMonths);
  if (!Number.isInteger(months) || months < 1 || months > 36) return "Platnost musí být 1–36 měsíců";
  return { enabled: b.enabled, christmas: b.christmas, photoPublicId: b.photoPublicId.trim(), validityMonths: months };
}
