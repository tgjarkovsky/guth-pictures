import "server-only";
import { getKv } from "@/lib/kv";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { VoucherProduct, VoucherSettings } from "./types";

const KEY = "voucher:settings";

export const defaultProducts: VoucherProduct[] = [
  {
    id: "portrait-basic",
    name: { cs: "Kreativní portrét — Základ", en: "Creative portrait — Basic" },
    priceCzk: 2500,
    details: { cs: ["1,5 hod focení", "7 upravených fotek", "online galerie"], en: ["1.5 hr session", "7 edited photos", "online gallery"] },
    active: true,
  },
  {
    id: "portrait-extended",
    name: { cs: "Kreativní portrét — Rozšířený", en: "Creative portrait — Extended" },
    priceCzk: 4000,
    details: { cs: ["2–4 hod focení", "15 upravených fotek", "online galerie"], en: ["2–4 hr session", "15 edited photos", "online gallery"] },
    active: true,
  },
  {
    id: "business-solo",
    name: { cs: "Business portrét — Solo", en: "Business portrait — Solo" },
    priceCzk: 3900,
    details: { cs: ["do 1 hod, 1–3 osoby", "2 upravené fotky na osobu", "online galerie s výběrem"], en: ["up to 1 hr, 1–3 people", "2 edited photos per person", "online gallery with selection"] },
    active: false,
  },
];

export function defaultSettings(): VoucherSettings {
  return {
    enabled: true,
    christmas: true,
    photoPublicId: "portfolio/scppmskdespdikncpzhz",
    validityMonths: 12,
    products: defaultProducts,
  };
}

export function normalizeSettings(raw: Partial<VoucherSettings> | null | undefined): VoucherSettings {
  const d = defaultSettings();
  if (!raw) return d;
  return {
    enabled: raw.enabled ?? d.enabled,
    christmas: raw.christmas ?? d.christmas,
    photoPublicId: raw.photoPublicId || d.photoPublicId,
    validityMonths: Number.isInteger(raw.validityMonths) && raw.validityMonths! > 0 ? raw.validityMonths! : d.validityMonths,
    products: Array.isArray(raw.products) && raw.products.length ? raw.products : d.products,
  };
}

export async function getVoucherSettings(): Promise<VoucherSettings> {
  const kv = await getKv();
  if (!kv) return defaultSettings();
  try {
    return normalizeSettings(await kv.get<VoucherSettings>(KEY));
  } catch {
    return defaultSettings();
  }
}

export async function setVoucherSettings(settings: VoucherSettings): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set(KEY, settings);
}

export function activeProducts(settings: VoucherSettings): VoucherProduct[] {
  return settings.products.filter((p) => p.active);
}

/** Cloudinary public ID, or a full https URL (handy for a photo hosted elsewhere). */
export function voucherPhotoSrc(photo: string): string {
  if (/^https?:\/\//.test(photo)) return photo;
  return cloudinaryUrl(photo, "c_fill,g_auto,w_670,h_1240,q_85,f_jpg");
}
