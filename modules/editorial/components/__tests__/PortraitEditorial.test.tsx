import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { PortraitEditorial } from "../PortraitEditorial";
import { normalizeContent, normalizeImages } from "@/modules/admin/lib/content";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));

it("renders the portrait page with pricing, learning link and contact", () => {
  const content = normalizeContent({ home: { title: "", subtitle: "" }, "o-mne": { title: "", subtitle: "", bio: "" }, lightTesterPromo: { title: "", desc: "" }, testimonials: [], sluzby: { portraits: { title: "Portréty", desc: "", packages: [{ name: "Základ", price: "2 500 Kč", duration: "1 h", includes: [] }] }, weddings: { title: "", desc: "", packages: [] }, business: { title: "", desc: "", packages: [] } } }, "cs");
  const html = renderToStaticMarkup(<PortraitEditorial locale="cs" content={content} images={normalizeImages()} />);
  expect(html).toContain(defaultPageCopy("cs").portrait.heroTitle);
  expect(html).toContain("2 500 Kč");
  expect(html).toContain('href="/foceni-101"');
  expect(html).toContain("<form");
  expect(html).toContain("q_auto%3Abest"); // next/image URL-encodes the src
  expect(html).not.toContain("q_auto%3Agood");
});

it("lays out three packages in three columns with Deluxe highlighted", () => {
  const pkg = (name: string, price: string) => ({ name, price, duration: "60 minut", includes: ["min. 5 upravených fotografií"] });
  const content = normalizeContent({ home: { title: "", subtitle: "" }, "o-mne": { title: "", subtitle: "", bio: "" }, lightTesterPromo: { title: "", desc: "" }, testimonials: [], sluzby: { portraits: { title: "Portréty", desc: "", packages: [pkg("Standard", "2000"), pkg("Rozšířený", "4000"), pkg("Deluxe", "4000")] }, weddings: { title: "", desc: "", packages: [] }, business: { title: "", desc: "", packages: [] } } }, "cs");
  const html = renderToStaticMarkup(<PortraitEditorial locale="cs" content={content} images={normalizeImages()} />);
  expect(html).toContain("--cols:3");
  expect(html).toContain("2 000 Kč");
  expect(html.match(/data-featured="true"/g)).toHaveLength(1);
  expect(html).toMatch(/data-featured="true"><span class="ed-portrait-pricing__badge">.*Doporučuji<\/span><h3>Deluxe<\/h3>/);
});
