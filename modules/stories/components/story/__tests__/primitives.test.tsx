import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AccentEnd, fitHeadline, syneWidthEm } from "../primitives";

describe("fitHeadline", () => {
  it("diakritika se měří jako základní písmeno", () => {
    expect(syneWidthEm("atmosféra.")).toBeCloseTo(syneWidthEm("atmosfera."));
  });

  it("nejdelší řádek se vejde do šířky", () => {
    const size = fitHeadline("Silná\natmosféra.", 920, 150);
    expect(size * syneWidthEm("atmosféra.")).toBeLessThanOrEqual(920);
  });

  it("krátký nadpis drží maximum", () => {
    expect(fitHeadline("Ahoj.", 920, 150)).toBe(150);
  });

  it("dlouhý řádek bez zalomení se radši zalomí, než aby byl drobný", () => {
    const text = "Darujte fotky, které zůstanou na celý život.";
    expect(fitHeadline(text, 920, 150)).toBe(90);
  });
});

describe("AccentEnd", () => {
  it("koncovou interpunkci obarví a drží u posledního slova", () => {
    const { container } = render(<h1><AccentEnd text={"Jiný\npohled."} /></h1>);
    expect(container.textContent).toBe("Jiný\npohled.");
    const glued = container.querySelector("h1 > span")!;
    expect(glued.textContent).toBe("pohled.");
    expect(glued.querySelector("span")!.textContent).toBe(".");
  });

  it("bez koncové interpunkce text nemění", () => {
    const { container } = render(<h1><AccentEnd text="Portréty" /></h1>);
    expect(container.innerHTML).toBe("<h1>Portréty</h1>");
  });
});
