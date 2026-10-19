import { describe, it, expect } from "vitest";
import { slugify } from "../slugify";

describe("slugify", () => {
  it("odstraní diakritiku", () => {
    expect(slugify("Jana Nováková")).toBe("jana-novakova");
  });

  it("sloučí běhy znaků a ořízne pomlčky", () => {
    expect(slugify(" --Svatba 2025!! ")).toBe("svatba-2025");
  });

  it("vrátí prázdný řetězec, když nic nezbude", () => {
    expect(slugify("!!!")).toBe("");
  });
});
