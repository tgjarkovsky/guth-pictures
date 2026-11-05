import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { ContactForm } from "@/components/ContactForm";
import { ServiceCards } from "@/modules/homepage/components/ServiceCards";

vi.mock("next/navigation", () => ({
  useSearchParams: () => { throw new Promise(() => {}); },
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("SEO server rendering", () => {
  it("contains query suspension within the contact form", () => {
    expect(() => renderToString(<ContactForm />)).not.toThrow();
  });

  it("includes package prices and deliverables before opening a card", () => {
    const html = renderToStaticMarkup(<ServiceCards selectLabel="Vybrat" services={[{
      key: "portraits", number: "001", category: "portréty", title: "Portréty", desc: "Portrétní focení",
      packages: [{ name: "Základ", price: "2 500 Kč", duration: "1,5 hod", includes: ["7 upravených fotek"] }],
    }]} />);
    expect(html).toContain("2 500 Kč");
    expect(html).toContain("7 upravených fotek");
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
  });
});
