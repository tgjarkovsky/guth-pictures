import { describe, it, expect } from "vitest";
import type { Testimonial } from "../content";
import { mergeReferences, splitReferences } from "../references";

const cs: Testimonial[] = [
  { id: "a", quote: "Skvělé", author: "Jana", role: "Svatba", photo: "p/a", service: "creative" },
  { id: "b", quote: "Rychlé", author: "Firma", photo: "p/b", service: "business" },
];
const en: Testimonial[] = [
  { id: "a", quote: "Great", author: "Jana", role: "Wedding", photo: "p/a", service: "creative" },
  { id: "c", quote: "Only English", author: "Tom" },
];

describe("mergeReferences", () => {
  it("pairs locales by id, keeps Czech order and appends English-only entries", () => {
    const refs = mergeReferences(cs, en);
    expect(refs.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(refs[0]).toMatchObject({ photo: "p/a", author: "Jana", quote: { cs: "Skvělé", en: "Great" }, role: { cs: "Svatba", en: "Wedding" } });
    expect(refs[1].quote).toEqual({ cs: "Rychlé", en: "" });
    expect(refs[2]).toMatchObject({ service: "creative", quote: { cs: "", en: "Only English" } });
  });
});

describe("splitReferences", () => {
  it("round-trips the stored lists", () => {
    const refs = mergeReferences(cs, en);
    expect(splitReferences(refs, "cs")).toEqual([
      { ...cs[0] },
      { ...cs[1], role: "" },
    ]);
    expect(splitReferences(refs, "en").map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("shares photo changes across both locales", () => {
    const refs = mergeReferences(cs, en);
    refs[0].photo = "p/new";
    expect(splitReferences(refs, "cs")[0].photo).toBe("p/new");
    expect(splitReferences(refs, "en")[0].photo).toBe("p/new");
  });

  it("skips references without a quote in that language or without an author", () => {
    const refs = mergeReferences(cs, []);
    refs[1].author = " ";
    expect(splitReferences(refs, "cs").map((t) => t.id)).toEqual(["a"]);
    expect(splitReferences(refs, "en")).toEqual([]);
  });

  it("keeps a reference with no quote in either language in both locales", () => {
    const refs = mergeReferences([{ id: "h", quote: "", author: "Petr", photo: "p/h", service: "business" }], []);
    expect(splitReferences(refs, "cs")).toMatchObject([{ id: "h", quote: "", author: "Petr", service: "business" }]);
    expect(splitReferences(refs, "en").map((t) => t.id)).toEqual(["h"]);
  });
});
