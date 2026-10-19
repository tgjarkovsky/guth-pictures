import { describe, it, expect } from "vitest";
import type { ContentData } from "../content";
import { defaultPageCopy } from "../page-copy";
import {
  CONTENT_TREE, HIDDEN, allSections, dirtySections, findFieldByText, getAt, searchSections, setAt,
} from "../content-tree";

const sample = (): ContentData => ({
  home: { title: "Patička nadpis", subtitle: "Patička podnadpis" },
  "o-mne": { title: "O mně", subtitle: "", bio: "Fotím lidi." },
  lightTesterPromo: { title: "", desc: "Naplánuj si světlo." },
  editorial: { eventsTitle: "Eventy" },
  sluzby: {
    portraits: { title: "Portréty", desc: "", packages: [{ id: "a", name: "Mini", price: "2 000 Kč", duration: "1 h", includes: ["10 fotek"] }], note: "" },
    weddings: { title: "Svatby", desc: "", packages: [], note: "" },
    business: { title: "Business", desc: "", packages: [], note: "" },
  },
  testimonials: [{ id: "t1", quote: "Skvělé focení", author: "Jana", photo: "x" }],
  pages: defaultPageCopy("cs"),
});

const allPaths = allSections(CONTENT_TREE).flatMap(({ section }) => section.paths);
const covered = (path: string) => allPaths.some((p) => path === p || path.startsWith(`${p}.`));

function pageCopyFields(node: unknown, at: string): string[] {
  if (!node || typeof node !== "object" || Array.isArray(node)) return [at];
  return Object.entries(node).flatMap(([key, child]) => (HIDDEN.has(key) ? [] : pageCopyFields(child, `${at}.${key}`)));
}

describe("CONTENT_TREE", () => {
  it("covers every visible page-copy field", () => {
    const missing = pageCopyFields(defaultPageCopy("cs"), "pages").filter((path) => !covered(path));
    expect(missing).toEqual([]);
  });

  it("covers every editable ContentData field", () => {
    const fields = ["home.title", "home.subtitle", "o-mne.title", "o-mne.subtitle", "o-mne.bio", "lightTesterPromo.desc",
      "editorial.eventsTitle", "sluzby.portraits", "sluzby.weddings", "sluzby.business", "testimonials"];
    expect(fields.filter((path) => !covered(path))).toEqual([]);
  });

  it("has unique section ids", () => {
    const ids = allSections(CONTENT_TREE).map(({ section }) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getAt / setAt", () => {
  it("reads and writes nested paths, creating missing objects", () => {
    const data: Record<string, unknown> = {};
    setAt(data, "pages.home.title", "X");
    expect(getAt(data, "pages.home.title")).toBe("X");
    expect(getAt(data, "pages.missing.title")).toBeUndefined();
  });
});

describe("searchSections", () => {
  it("returns every section for an empty query", () => {
    expect(searchSections(CONTENT_TREE, sample(), "  ").size).toBe(allSections(CONTENT_TREE).length);
  });

  it("matches field values without diacritics", () => {
    const hits = searchSections(CONTENT_TREE, sample(), "jiny pohled");
    expect([...hits]).toEqual(["home-hero"]);
  });

  it("matches field labels and package texts", () => {
    expect(searchSections(CONTENT_TREE, sample(), "posun 2. řádku").has("home-hero")).toBe(true);
    expect(searchSections(CONTENT_TREE, sample(), "2 000 kč").has("portrait-pricing")).toBe(true);
  });

  it("ignores ids and photo ids", () => {
    expect(searchSections(CONTENT_TREE, sample(), "t1").has("testimonials")).toBe(false);
  });
});

describe("dirtySections", () => {
  it("marks exactly the section containing the changed field", () => {
    const saved = sample();
    const current = structuredClone(saved);
    current.pages!.services.faq[1].a = "Jinde.";
    expect([...dirtySections(CONTENT_TREE, current, saved)]).toEqual(["services-faq"]);
  });

  it("is empty when nothing changed", () => {
    expect(dirtySections(CONTENT_TREE, sample(), sample()).size).toBe(0);
  });
});

describe("findFieldByText", () => {
  it("finds a FAQ answer by its full text", () => {
    const data = sample();
    const answer = data.pages!.services.faq[2].a;
    expect(findFieldByText(CONTENT_TREE, data, `  ${answer} `)).toEqual({ sectionId: "services-faq", path: "pages.services.faq.2.a" });
  });

  it("prefers the previewed page when the same text appears twice", () => {
    const data = sample();
    expect(findFieldByText(CONTENT_TREE, data, "Mám zájem", "business")?.sectionId).toBe("business-pricing");
  });

  it("returns null for unknown or too short text", () => {
    expect(findFieldByText(CONTENT_TREE, sample(), "neexistující text xyz")).toBeNull();
    expect(findFieldByText(CONTENT_TREE, sample(), "a")).toBeNull();
  });
});
