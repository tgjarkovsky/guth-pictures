import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { BLOG_INDEX, revalidateLocalized } from "../revalidate";

const revalidated = () => revalidatePath.mock.calls.map((c) => c[0]).sort();

describe("revalidateLocalized", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("revaliduje cs i en variantu, prázdná cesta je kořen locale", () => {
    revalidateLocalized(["", "/x"]);
    expect(revalidated()).toEqual(["/cs", "/cs/x", "/en", "/en/x"]);
  });



  it("blog dá index a detail v obou jazycích", () => {
    revalidateLocalized([...BLOG_INDEX, "/blog/muj-clanek"]);
    expect(revalidated()).toEqual([
      "/cs/blog", "/en/blog", "/cs/blog/muj-clanek", "/en/blog/muj-clanek",
    ].sort());
  });
});
