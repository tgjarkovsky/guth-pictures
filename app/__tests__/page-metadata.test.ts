import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}));
vi.mock("@/modules/admin/lib/content", () => ({
  getContent: async () => ({ pages: { events: { metaTitle: "Eventy", metaDescription: "Popis eventů" } } }),
  getImages: async () => ({}),
}));

vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => null }));
vi.mock("@/modules/editorial/components/BusinessEditorial", () => ({ BusinessEditorial: () => null }));
vi.mock("@/modules/editorial/components/EventsEditorial", () => ({ EventsEditorial: () => null }));
vi.mock("@/modules/editorial/components/EditorialSubpage", () => ({ EditorialSubpage: () => null }));
vi.mock("@/modules/homepage/components/ServiceCards", () => ({ ServiceCards: () => null }));
vi.mock("@/modules/homepage/components/ServiceLinks", () => ({ ServiceLinks: () => null }));

import { generateMetadata as firemniPortrety } from "@/app/[locale]/firemni-portrety/page";
import { generateMetadata as sluzby } from "@/app/[locale]/sluzby/page";
import { generateMetadata as oMne } from "@/app/[locale]/o-mne/page";
import { generateMetadata as eventy } from "@/app/[locale]/sluzby/eventy-a-svatby/page";

const pages = { "firemni-portrety": firemniPortrety, sluzby, "o-mne": oMne, "eventy-a-svatby": eventy };

describe.each(Object.entries(pages))("generateMetadata %s", (_name, generateMetadata) => {
  it.each(["cs", "en"])("vrací og obrázek, titulek a twitter kartu pro %s", async (locale) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const images = [meta.openGraph?.images].flat() as { url: string }[];
    expect(images.map((i) => i.url)).toContain("/og-image.jpg");
    expect(meta.openGraph?.title).toBeTruthy();
    expect((meta.twitter as { card: string }).card).toBe("summary_large_image");
  });
});
