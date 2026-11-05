import { describe, expect, it } from "vitest";
import { isServiceSlug } from "../lib/service-pages";

describe("service discovery", () => {
  it("accepts only published service slugs", () => {
    expect(isServiceSlug("portretni-foceni")).toBe(true);
    expect(isServiceSlug("brandove-foceni")).toBe(true);
    expect(isServiceSlug("unknown")).toBe(false);
    expect(isServiceSlug("toString")).toBe(false);
  });
});
