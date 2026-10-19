import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { BusinessEditorial } from "../BusinessEditorial";
import { normalizeImages, type Testimonial } from "@/modules/admin/lib/content";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));

const business = { title: "Business", desc: "", packages: [{ name: "Tým", price: "950 Kč / osoba", duration: "", includes: [] }], extras: [], note: "Praha v ceně" };
const testimonials: Testimonial[] = [
  { id: "c", quote: "Kreativní focení.", author: "Apolena", photo: "portfolio/c" },
  { id: "b", quote: "Celý tým za dopoledne.", author: "Jana", role: "Acme", photo: "portfolio/b", service: "business" },
];

const render = (items: Testimonial[], images = normalizeImages()) => {
  const html = renderToStaticMarkup(<BusinessEditorial locale="cs" copy={defaultPageCopy("cs").business} business={business} images={images} testimonials={items} email="foto@example.cz" />);
  return new DOMParser().parseFromString(html, "text/html");
};

it("keeps business pricing, FAQ schema, form and a direct e-mail", () => {
  const doc = render(testimonials);
  expect(doc.querySelector("h1")?.textContent).toBe("Tvoje práce. Tvoje tvář.");
  expect(doc.body.textContent).toContain("950 Kč / osoba");
  expect(doc.querySelector('script[type="application/ld+json"]')?.textContent).toContain("FAQPage");
  expect(doc.querySelector("#kontakt form")).not.toBeNull();
  expect(doc.querySelector('#kontakt a[href="mailto:foto@example.cz"]')).not.toBeNull();
});

it("shows only business references, with the quote on the photo", () => {
  const quotes = [...render(testimonials).querySelectorAll(".ed-business-headshots blockquote")].map((q) => q.textContent);
  expect(quotes).toEqual(["Celý tým za dopoledne."]);
});

it("falls back to headshots that have a photo, never to empty placeholders", () => {
  const images = normalizeImages();
  images.editorial.business.headshots[0].publicId = "portfolio/h";
  const doc = render([], images);
  expect(doc.querySelectorAll(".ed-business-headshots figure")).toHaveLength(1);
  expect(doc.querySelector(".ed-business-headshots figcaption")).toBeNull();
});

it("drops the headshots section when there is nothing to show", () => {
  expect(render([]).querySelector(".ed-business-headshots")).toBeNull();
});

it("no longer renders the use-cases section", () => {
  expect(render(testimonials).body.textContent).not.toContain(defaultPageCopy("cs").business.useCasesTitle);
});
