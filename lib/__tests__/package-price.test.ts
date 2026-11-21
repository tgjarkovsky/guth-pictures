import { describe, expect, it } from "vitest";
import { featuredFlags, formatPackagePrice, parsePriceCzk } from "@/lib/package-price";

describe("package prices", () => {
  it("formats bare numbers and leaves written prices alone", () => {
    expect(formatPackagePrice("2000", "cs")).toBe("2 000 Kč");
    expect(formatPackagePrice(" 4 500 ", "en")).toBe("CZK 4 500");
    expect(formatPackagePrice("od 2 500 Kč", "cs")).toBe("od 2 500 Kč");
    expect(formatPackagePrice("na dotaz", "cs")).toBe("na dotaz");
  });
  it("parses the number for vouchers", () => {
    expect(parsePriceCzk("4 500 Kč")).toBe(4500);
    expect(parsePriceCzk("na dotaz")).toBeNull();
  });
});

describe("featuredFlags", () => {
  it("highlights Deluxe until the admin chooses", () => {
    expect(featuredFlags([{ name: "Standard" }, { name: "Rozšířený" }, { name: "Deluxe" }])).toEqual([false, false, true]);
  });
  it("follows the admin checkbox once used", () => {
    expect(featuredFlags([{ name: "Standard", featured: true }, { name: "Deluxe" }])).toEqual([true, false]);
    expect(featuredFlags([{ name: "Standard" }, { name: "Deluxe", featured: false }])).toEqual([false, false]);
  });
});
