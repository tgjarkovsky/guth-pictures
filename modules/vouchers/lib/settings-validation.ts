import { isVoucherTheme, type VoucherTheme } from "./design";
import type { StoredVoucherSettings } from "./settings";
import type { ThemePhoto } from "./types";

const clampPct = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 50);

/** Keeps only known themes with a plausible Cloudinary public id; crop focus clamped to 0–100. */
export function cleanThemePhotos(raw: unknown): Partial<Record<VoucherTheme, ThemePhoto>> {
  const out: Partial<Record<VoucherTheme, ThemePhoto>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [theme, v] of Object.entries(raw as Record<string, unknown>)) {
    const p = v as Partial<ThemePhoto> | null;
    if (!isVoucherTheme(theme) || typeof p?.publicId !== "string") continue;
    if (!/^[\w\-/.]{1,200}$/.test(p.publicId) || p.publicId.includes("..")) continue;
    out[theme] = { publicId: p.publicId, x: clampPct(p.x), y: clampPct(p.y) };
  }
  return out;
}

/** Admin-edited settings → clean object, or a Czech error message. Packages are not edited here. */
export function parseSettings(raw: unknown): StoredVoucherSettings | string {
  const b = (raw ?? {}) as Record<string, unknown>;
  if (typeof b.enabled !== "boolean" || typeof b.christmas !== "boolean") return "Chybí přepínače";
  const months = Number(b.validityMonths);
  if (!Number.isInteger(months) || months < 1 || months > 36) return "Platnost musí být 1–36 měsíců";
  return { enabled: b.enabled, christmas: b.christmas, validityMonths: months, themePhotos: cleanThemePhotos(b.themePhotos) };
}
