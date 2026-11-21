import "server-only";
import { getKv } from "@/lib/kv";
import { getContent } from "@/modules/admin/lib/content";
import { productsFromPortraitPackages } from "./portrait-products";
import type { VoucherSettings } from "./types";

const KEY = "voucher:settings";

/** What the admin stores; the packages come from the creative-portrait service. */
export type StoredVoucherSettings = Omit<VoucherSettings, "products">;

export function defaultStoredSettings(): StoredVoucherSettings {
  return { enabled: true, christmas: true, validityMonths: 12 };
}

export function normalizeSettings(raw: Partial<StoredVoucherSettings> | null | undefined): StoredVoucherSettings {
  const d = defaultStoredSettings();
  if (!raw) return d;
  return {
    enabled: raw.enabled ?? d.enabled,
    christmas: raw.christmas ?? d.christmas,
    validityMonths: Number.isInteger(raw.validityMonths) && raw.validityMonths! > 0 ? raw.validityMonths! : d.validityMonths,
  };
}

async function getStoredSettings(): Promise<StoredVoucherSettings> {
  const kv = await getKv();
  if (!kv) return defaultStoredSettings();
  try {
    return normalizeSettings(await kv.get<StoredVoucherSettings>(KEY));
  } catch {
    return defaultStoredSettings();
  }
}

export async function getVoucherSettings(): Promise<VoucherSettings> {
  const [stored, cs, en] = await Promise.all([getStoredSettings(), getContent("cs"), getContent("en")]);
  return { ...stored, products: productsFromPortraitPackages(cs.sluzby.portraits.packages, en.sluzby.portraits.packages) };
}

export async function setVoucherSettings(settings: StoredVoucherSettings): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set(KEY, settings);
}

export function activeProducts(settings: VoucherSettings) {
  return settings.products.filter((p) => p.active);
}
