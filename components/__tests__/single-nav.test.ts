import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../app/[locale]");
const pages = (readdirSync(root, { recursive: true }) as string[]).filter((p) => /(^|[\/])page\.tsx$/.test(p));
// Pages that render through a wrapper which includes EditorialNav (directly or via a *Editorial component)
const hasEditorialNav = (src: string) => /EditorialSubpage|\w+Editorial\b/.test(src);
// Admin preview renders the editorial pages itself; the rest are not yet migrated and still rely on the legacy Nav.
const legacy = new Set(["nahled/[page]/page.tsx", "foceni-101/page.tsx", "light-tester/page.tsx", "navrh/[slug]/page.tsx", "pozy/page.tsx", "pozy/[slug]/page.tsx"]);

describe("jedna navigace na stránku", () => {
  it("každá veřejná stránka používá editorial shell, nebo je v seznamu legacy", () => {
    const missing = pages
      .map((p) => p.replaceAll("\\", "/"))
      .filter((p) => !legacy.has(p) && !hasEditorialNav(readFileSync(join(root, p), "utf8")));
    expect(missing).toEqual([]);
  });
});
