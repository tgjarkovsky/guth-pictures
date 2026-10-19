// Client references edited once for both languages (admin → Fotky). KV keeps them per locale
// inside content:cs / content:en, paired by id; photo, author and order are shared.
import type { Testimonial, TestimonialService } from "./content";

type Locale = "cs" | "en";
type Localized = Record<Locale, string>;

export type Reference = {
  id: string;
  photo: string;
  service: TestimonialService;
  author: string;
  role: Localized;
  quote: Localized;
};

export const emptyReference = (service: TestimonialService): Reference => ({
  id: crypto.randomUUID(),
  photo: "",
  service,
  author: "",
  role: { cs: "", en: "" },
  quote: { cs: "", en: "" },
});

// Czech order first, English-only entries appended.
export function mergeReferences(cs: Testimonial[], en: Testimonial[]): Reference[] {
  const byId = new Map<string, Reference>();
  const add = (locale: Locale) => (t: Testimonial) => {
    const ref = byId.get(t.id) ?? { ...emptyReference(t.service ?? "creative"), id: t.id };
    ref.photo ||= t.photo ?? "";
    ref.author ||= t.author;
    ref.role[locale] = t.role ?? "";
    ref.quote[locale] = t.quote;
    byId.set(t.id, ref);
  };
  cs.forEach(add("cs"));
  en.forEach(add("en"));
  return [...byId.values()];
}

// A locale gets only references with a quote in that language (the API rejects empty quotes).
export function splitReferences(refs: Reference[], locale: Locale): Testimonial[] {
  return refs
    .filter((r) => r.quote[locale].trim() && r.author.trim())
    .map((r) => ({ id: r.id, quote: r.quote[locale], author: r.author, role: r.role[locale], photo: r.photo, service: r.service }));
}
