// Admin → Obsah navigation: which fields of ContentData live in which page section.
// Paths are dot paths into ContentData; a path may point at a text, a list or a whole object.
import type { PreviewPage } from "@/modules/admin/preview/protocol";

export type TreeSection = { id: string; title: string; paths: string[]; special?: "settings" };
export type TreePage = { page: string; preview?: PreviewPage; sections: TreeSection[] };

const p = (page: string, keys: string[]) => keys.map((key) => `pages.${page}.${key}`);

export const CONTENT_TREE: TreePage[] = [
  {
    page: "Homepage", preview: "home", sections: [
      { id: "home-hero", title: "Hero", paths: p("home", ["title", "titleShift", "titleShiftMobile", "intro"]) },
      { id: "home-services", title: "Služby", paths: p("home", ["creative", "business", "events"]) },
      { id: "home-work", title: "Vybrané příběhy", paths: p("home", ["work"]) },
      { id: "home-about", title: "O mně", paths: p("home", ["aboutKicker", "about", "aboutLink"]) },
      { id: "home-steps", title: "Kroky", paths: p("home", ["steps"]) },
      { id: "home-contact", title: "Kontakt", paths: p("home", ["contact"]) },
    ],
  },
  {
    page: "Kreativní portrét", preview: "portrety", sections: [
      { id: "portrait-hero", title: "Hero", paths: p("portrait", ["kicker", "heroTitle", "cta", "intro"]) },
      { id: "portrait-process", title: "Průběh", paths: p("portrait", ["processTitle", "steps"]) },
      { id: "portrait-pricing", title: "Ceník", paths: [...p("portrait", ["pricing"]), "sluzby.portraits"] },
      { id: "portrait-light", title: "Odkaz na Focení 101", paths: p("portrait", ["lightQuestion"]) },
      { id: "portrait-seo", title: "Google", paths: p("portrait", ["title", "description"]) },
    ],
  },
  {
    page: "Business", preview: "business", sections: [
      { id: "business-hero", title: "Hero", paths: p("business", ["eyebrow", "heroTitle", "heroSubtitle", "heroCta"]) },
      { id: "business-headshots", title: "Headshoty", paths: p("business", ["headshotsTitle", "headshotsDesc", "placeholder"]) },
      { id: "business-steps", title: "Průběh", paths: p("business", ["stepsTitle", "steps"]) },
      { id: "business-pricing", title: "Ceník", paths: [...p("business", ["pricingTitle", "select"]), "sluzby.business"] },
      { id: "business-faq", title: "Časté otázky", paths: p("business", ["faqTitle", "faq"]) },
      { id: "business-contact", title: "Kontakt", paths: p("business", ["contactTitle", "contactSubtitle"]) },
    ],
  },
  {
    page: "Brandové focení", sections: [
      { id: "brand-hero", title: "Hero", paths: p("brand", ["kicker", "cta", "intro"]) },
      { id: "brand-audience", title: "Pro koho", paths: p("brand", ["audienceTitle", "audience"]) },
      { id: "brand-work", title: "Ukázky", paths: p("brand", ["workTitle", "workLink"]) },
      { id: "brand-steps", title: "Průběh", paths: p("brand", ["stepsTitle", "steps"]) },
      { id: "brand-preparation", title: "Příprava", paths: p("brand", ["preparationTitle", "preparation"]) },
      { id: "brand-delivery", title: "Co dostanete", paths: p("brand", ["deliveryTitle", "delivery"]) },
      { id: "brand-pricing", title: "Ceník", paths: p("brand", ["pricing"]) },
      { id: "brand-faq", title: "Časté otázky", paths: p("brand", ["faqTitle", "questions"]) },
      { id: "brand-contact", title: "Kontakt", paths: p("brand", ["contactTitle", "aboutLink"]) },
      { id: "brand-seo", title: "Google", paths: p("brand", ["title", "description"]) },
    ],
  },
  {
    page: "Eventy a svatby", preview: "eventy", sections: [
      { id: "events-hero", title: "Hero", paths: ["editorial.eventsTitle", ...p("events", ["kicker", "cta"])] },
      { id: "events-info", title: "Atmosféra", paths: p("events", ["infoTitle", "infoText", "larpLink"]) },
      { id: "events-pricing", title: "Ceník", paths: [...p("events", ["pricingTitle"]), "sluzby.weddings"] },
      { id: "events-seo", title: "Google", paths: p("events", ["metaTitle", "metaDescription"]) },
    ],
  },
  {
    page: "Služby", sections: [
      { id: "services-header", title: "Záhlaví", paths: p("services", ["kicker", "title", "subtitle", "select"]) },
      { id: "services-faq", title: "Časté otázky", paths: p("services", ["faqTitle", "faq"]) },
      { id: "services-contact", title: "Kontakt", paths: p("services", ["contactTitle", "contactSubtitle"]) },
    ],
  },
  {
    page: "Ostatní", sections: [
      { id: "about", title: "O mně", paths: ["o-mne.title", "o-mne.subtitle", "o-mne.bio", ...p("about", ["eyebrow", "portfolioLink", "servicesLink"])] },
      { id: "footer", title: "Patička", paths: ["home.title", "home.subtitle"] },
      { id: "testimonials", title: "Reference", paths: ["testimonials"] },
      { id: "settings", title: "Nastavení", paths: [], special: "settings" },
    ],
  },
];

export const allSections = (tree: TreePage[]) => tree.flatMap((page) => page.sections.map((section) => ({ page, section })));

// Keys looked up as "<parent>.<key>" first, then "<key>"; unknown keys show the raw name.
export const LABELS: Record<string, string> = {
  title: "Nadpis",
  heroTitle: "Hlavní nadpis",
  titleShift: "Posun 2. řádku nadpisu (em, záporné = doleva)",
  titleShiftMobile: "Posun 2. řádku nadpisu na mobilu (em)",
  intro: "Úvodní text",
  kicker: "Nadtitulek",
  eyebrow: "Nadtitulek",
  cta: "Tlačítko",
  heroCta: "Tlačítko",
  heroSubtitle: "Podnadpis",
  subtitle: "Podnadpis",
  description: "Popis pro Google",
  metaTitle: "Název stránky (Google, odkazy)",
  metaDescription: "Popis pro Google",
  "portrait.title": "Název stránky (Google, odkazy)",
  "brand.title": "Název stránky (Google, odkazy)",
  creative: "Služba 01",
  business: "Služba 02",
  events: "Služba 03",
  work: "Nadpis — vybrané příběhy",
  aboutKicker: "Nadtitulek — o mně",
  about: "Nadpis — o mně",
  aboutLink: "Odkaz na O mně",
  tools: "Nadpis — nástroje",
  foceni101Desc: "Focení 101 — popis",
  foceni101Cta: "Focení 101 — tlačítko",
  plannerCta: "Light planner — tlačítko",
  plannerNotice: "Light planner — upozornění",
  contact: "Nadpis — kontakt",
  steps: "Kroky",
  "steps.title": "Název kroku",
  "steps.desc": "Popis kroku",
  pricing: "Nadpis ceníku",
  pricingTitle: "Nadpis ceníku",
  processTitle: "Nadpis — průběh",
  lightQuestion: "Otázka u odkazu na Focení 101",
  audience: "Pro koho — text",
  audienceTitle: "Pro koho — nadpis",
  preparation: "Příprava — text",
  preparationTitle: "Příprava — nadpis",
  delivery: "Co dostanete — text",
  deliveryTitle: "Co dostanete — nadpis",
  workTitle: "Ukázky — nadpis",
  workLink: "Ukázky — odkaz na portfolio",
  stepsTitle: "Průběh — nadpis",
  questions: "Časté otázky",
  faq: "Časté otázky",
  faqTitle: "Časté otázky — nadpis",
  q: "Otázka",
  a: "Odpověď",
  useCasesTitle: "Využití — nadpis",
  useCases: "Využití",
  "useCases.title": "Název",
  "useCases.desc": "Popis",
  headshotsTitle: "Headshoty — nadpis",
  headshotsDesc: "Headshoty — popis",
  atWorkTitle: "Firma v akci — nadpis",
  atWorkDesc: "Firma v akci — popis",
  select: "Tlačítko u balíčku",
  contactTitle: "Kontakt — nadpis",
  contactSubtitle: "Kontakt — podnadpis",
  placeholder: "Text místo chybějící fotky",
  infoTitle: "Nadpis — atmosféra",
  infoText: "Text — atmosféra",
  larpLink: "Odkaz na larpy",
  portfolioLink: "Tlačítko Portfolio",
  servicesLink: "Tlačítko Služby",
  // Packages and testimonials
  name: "Název",
  price: "Cena",
  duration: "Délka",
  includes: "Co zahrnuje",
  note: "Poznámka pod ceníkem",
  quote: "Citace",
  author: "Jméno",
  role: "Role",
  // Fields outside page copy (full path)
  "editorial.eventsTitle": "Hlavní nadpis",
  "o-mne.title": "Nadpis",
  "o-mne.subtitle": "Podnadpis",
  "o-mne.bio": "Bio",
  "home.title": "Nadpis",
  "home.subtitle": "Podnadpis",
};

// Page-copy fields the site no longer renders (business extras and use cases, homepage tools).
export const HIDDEN = new Set(["extrasTitle", "atWorkTitle", "atWorkDesc", "useCasesTitle", "useCases", "tools", "foceni101Desc", "foceni101Cta", "plannerCta", "plannerNotice"]);

export const labelFor = (parent: string, key: string) => LABELS[`${parent}.${key}`] ?? LABELS[key] ?? key;

export function fieldLabel(path: string) {
  if (LABELS[path]) return LABELS[path];
  const parts = path.split(".").filter((part) => !/^\d+$/.test(part));
  return labelFor(parts.at(-2) ?? "", parts.at(-1) ?? "");
}

type Data = Record<string, unknown>;

export function getAt(data: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Data)[key] : undefined), data);
}

export function setAt(data: object, path: string, value: unknown) {
  const keys = path.split(".");
  const last = keys.pop()!;
  let node = data as Data;
  for (const key of keys) {
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key] as Data;
  }
  node[last] = value;
}

// Leaf keys that are not visible text (ids, Cloudinary ids, enum values).
const NON_TEXT = new Set(["id", "photo", "service"]);

// Every visible text under a path, as [leafPath, text].
export function leaves(data: unknown, path: string): [string, string][] {
  const walk = (value: unknown, at: string): [string, string][] => {
    if (typeof value === "string") return [[at, value]];
    if (!value || typeof value !== "object") return [];
    return Object.entries(value).flatMap(([key, child]) =>
      NON_TEXT.has(key) || HIDDEN.has(key) ? [] : walk(child, `${at}.${key}`));
  };
  return walk(getAt(data, path), path);
}

export const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

export function searchSections(tree: TreePage[], data: unknown, query: string): Set<string> {
  const needle = normalize(query);
  const hits = allSections(tree).filter(({ page, section }) => {
    if (!needle) return true;
    const haystack = [page.page, section.title, ...section.paths.flatMap((path) =>
      leaves(data, path).flatMap(([leaf, text]) => [fieldLabel(leaf), text]),
    )];
    return haystack.some((text) => normalize(text).includes(needle));
  });
  return new Set(hits.map(({ section }) => section.id));
}

export function dirtySections(tree: TreePage[], current: unknown, saved: unknown): Set<string> {
  const changed = allSections(tree).filter(({ section }) =>
    section.paths.some((path) => JSON.stringify(getAt(current, path)) !== JSON.stringify(getAt(saved, path))),
  );
  return new Set(changed.map(({ section }) => section.id));
}

// Finds the field showing a text clicked in the preview. Exact match beats containment;
// sections of the previewed page win ties.
export function findFieldByText(tree: TreePage[], data: unknown, text: string, preview?: PreviewPage) {
  const needle = normalize(text);
  if (needle.length < 2) return null;
  let best: { sectionId: string; path: string; score: number } | null = null;
  for (const { page, section } of allSections(tree)) {
    for (const path of section.paths) {
      for (const [leaf, value] of leaves(data, path)) {
        const hay = normalize(value);
        // Containment only between texts of similar length, so a click on a big block doesn't hit a random field in it.
        const similar = hay.length >= 4 && Math.min(hay.length, needle.length) * 2 >= Math.max(hay.length, needle.length);
        const match = hay === needle ? 3 : similar && (hay.includes(needle) || needle.includes(hay)) ? 1 : 0;
        if (!match) continue;
        const score = match + (preview && page.preview === preview ? 0.5 : 0);
        if (!best || score > best.score) best = { sectionId: section.id, path: leaf, score };
      }
    }
  }
  return best && { sectionId: best.sectionId, path: best.path };
}
