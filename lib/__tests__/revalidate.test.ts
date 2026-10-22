import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { BLOG_INDEX, CONTENT_PAGES, IMAGE_PAGES, revalidateLocalized } from "../revalidate";

const revalidated = () => revalidatePath.mock.calls.map((c) => c[0]).sort();

describe("revalidateLocalized", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("revaliduje cs i en variantu, prázdná cesta je kořen locale", () => {
    revalidateLocalized(["", "/x"]);
    expect(revalidated()).toEqual(["/cs", "/cs/x", "/en", "/en/x"]);
  });

  it("CONTENT_PAGES dá původních 14 cest z content routy", () => {
    revalidateLocalized(CONTENT_PAGES);
    expect(revalidated()).toEqual([
      "/cs", "/en", "/cs/sluzby", "/en/sluzby",
      "/cs/firemni-portrety", "/en/firemni-portrety",
      "/cs/sluzby/portretni-foceni", "/en/sluzby/portretni-foceni",
      "/cs/sluzby/brandove-foceni", "/en/sluzby/brandove-foceni",
      "/cs/sluzby/eventy-a-svatby", "/en/sluzby/eventy-a-svatby",
      "/cs/o-mne", "/en/o-mne",
    ].sort());
  });

  it("IMAGE_PAGES dá původních 8 cest z images routy", () => {
    revalidateLocalized(IMAGE_PAGES);
    expect(revalidated()).toEqual([
      "/cs", "/en", "/cs/sluzby/portretni-foceni", "/en/sluzby/portretni-foceni",
      "/cs/firemni-portrety", "/en/firemni-portrety",
      "/cs/sluzby/eventy-a-svatby", "/en/sluzby/eventy-a-svatby",
    ].sort());
  });

  it("blog dá index a detail v obou jazycích", () => {
    revalidateLocalized([...BLOG_INDEX, "/blog/muj-clanek"]);
    expect(revalidated()).toEqual([
      "/cs/blog", "/en/blog", "/cs/blog/muj-clanek", "/en/blog/muj-clanek",
    ].sort());
  });
});
