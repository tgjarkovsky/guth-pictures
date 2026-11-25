import "server-only";
import { getKv } from "@/lib/kv";
import { normalizeContent, DEFAULTS } from "./content-defaults";
import { normalizeImages } from "./editorial-images";
import type { PricingPackage } from "@/lib/types";
import type { PageCopy } from "./page-copy";

export type { PricingPackage };
export type ServiceContent = {
  title: string;
  desc: string;
  packages: PricingPackage[];
  extras?: PricingPackage[]; // příplatky — name + price, duration/includes unused
  note?: string;
};
export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;   // optional — e.g. "Svatba, Praha" / job title
  photo?: string;  // optional — Cloudinary public ID
  service?: TestimonialService; // which page shows it; missing = creative (homepage)
};
export type TestimonialService = "creative" | "business";

export type FocalPoint = {
  desktop: string;
  mobile: string;
};
export type EditorialImage = {
  publicId: string;
  alt: { cs: string; en: string };
  focal: FocalPoint;
};
export type EditorialImageSlot = EditorialImage | EditorialImage[];

export type EditorialImages = {
  home: {
    belt: EditorialImage[];
    stories: EditorialImage[];
    photographer: EditorialImage;
    tools: { foceni101: EditorialImage; lightPlanner: EditorialImage };
  };
  portrait: { hero: EditorialImage; gallery: EditorialImage[] };
  business: { hero: EditorialImage; headshots: EditorialImage[]; atWork: EditorialImage[] };
  // reportage = conference gallery (key predates the wedding gallery)
  events: { hero: EditorialImage; weddingHero: EditorialImage; reportage: EditorialImage[]; weddingGallery: EditorialImage[] };
  brand: { hero: EditorialImage; work: EditorialImage[] };
};
export type EditorialCopy = {
  eventsTitle: string;
};
export type ContentData = {
  home: { title: string; subtitle: string };
  "o-mne": { title: string; subtitle: string; bio: string };
  sluzby: {
    portraits: ServiceContent;
    weddings: ServiceContent;
    business: ServiceContent;
    conferences?: ServiceContent; // missing in KV saved before the events chapters
  };
  lightTesterPromo: { title: string; desc: string };
  testimonials: Testimonial[];
  editorial?: EditorialCopy;
  pages?: PageCopy;
};
export type NormalizedContentData = Omit<ContentData, "editorial" | "pages" | "sluzby"> & {
  editorial: EditorialCopy;
  pages: PageCopy;
  sluzby: Required<ContentData["sluzby"]>;
};
export type SiteImages = {
  profile: string; // Cloudinary public ID
  heroTriptych?: [string[], string[], string[]]; // pole publicIds pro 3 panely hero sekce
  editorial?: EditorialImages;
};
export type NormalizedSiteImages = Omit<SiteImages, "editorial"> & {
  editorial: EditorialImages;
};

export { defaultEditorialImages, isImageNode, normalizeImages } from "./editorial-images";
export { normalizeContent } from "./content-defaults";

async function readOr<T>(key: string, fallback: T): Promise<T> {
  const kv = await getKv();
  if (kv) {
    try {
      const value = await kv.get<T>(key);
      if (value) return value;
    } catch {
      // KV unavailable, fall through to fallback
    }
  }
  return fallback;
}

async function write(key: string, value: unknown): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set(key, value);
}

export const getContent = async (locale: string): Promise<NormalizedContentData> =>
  normalizeContent(await readOr(`content:${locale}`, DEFAULTS[locale] ?? DEFAULTS.cs), locale);
export const setContent = (locale: string, data: ContentData) => write(`content:${locale}`, data);
export const getImages = async (): Promise<NormalizedSiteImages> =>
  normalizeImages(await readOr<SiteImages>("content:images", { profile: "" }));
export const setImages = (data: SiteImages) => write("content:images", data);
export const getContactEmail = (): Promise<string> =>
  readOr("content:email", process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "guth.jarkovsky.tomas@gmail.com");
export const setContactEmail = (email: string) => write("content:email", email);
