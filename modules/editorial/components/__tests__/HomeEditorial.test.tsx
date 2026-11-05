import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeEditorial } from "../HomeEditorial";
import { normalizeContent, normalizeImages } from "@/modules/admin/lib/content";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form aria-label="Kontakt" /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav aria-label="Hlavní navigace" /> }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, className }: React.PropsWithChildren<{ href: string; className?: string }>) => <a href={href} className={className}>{children}</a>,
}));

const content = normalizeContent({
  home: { title: "Guth Pictures", subtitle: "Portréty a příběhy" },
  "o-mne": { title: "Tomáš", subtitle: "Fotograf", bio: "Zajímá mě člověk, ne dokonalá póza." },
  sluzby: {
    portraits: { title: "Portréty", desc: "Portréty", packages: [] },
    weddings: { title: "Svatby", desc: "Svatby", packages: [] },
    business: { title: "Business", desc: "Business", packages: [] },
  },
  lightTesterPromo: { title: "Light planner", desc: "Připrav si světlo." },
  testimonials: [{ id: "t1", quote: "Focení působí spíš jako hra.", author: "Apolena", photo: "portfolio/abc" }],
}, "cs");

describe("HomeEditorial", () => {
  it("renders the complete server-visible editorial journey", () => {
    const html = renderToStaticMarkup(<HomeEditorial locale="cs" content={content} images={normalizeImages({ profile: "" })} />);
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector('a[href="/sluzby/portretni-foceni"]')).not.toBeNull();
    expect(document.querySelector('a[href="/firemni-portrety"]')).not.toBeNull();
    expect(document.querySelector('a[href="/sluzby/eventy-a-svatby"]')).not.toBeNull();
    expect(document.querySelector("#tvorba blockquote")?.textContent).toBe("Focení působí spíš jako hra.");
    expect(document.querySelector("#tvorba figcaption span")?.textContent).toBe("Apolena");
    expect(document.querySelector("#kontakt form")).not.toBeNull();
  });
});

describe("HomeEditorial belt", () => {
  it("uses only the admin-picked belt, not the stories", () => {
    const images = normalizeImages({ profile: "" });
    images.editorial.home.belt = [];
    const html = renderToStaticMarkup(<HomeEditorial locale="cs" content={content} images={images} />);
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelectorAll(".ed-home-hero .ed-belt img")).toHaveLength(0);
  });
});

describe("HomeEditorial call to action", () => {
  const parse = (locale: string) => new DOMParser().parseFromString(
    renderToStaticMarkup(<HomeEditorial locale={locale} content={content} images={normalizeImages({ profile: "" })} />),
    "text/html",
  );

  it("puts a primary booking link in the hero", () => {
    const cta = parse("cs").querySelector('.ed-home-hero a.ed-book[href="/#kontakt"]');
    expect(cta?.textContent).toBe("Domluvit focení");
  });

  it("repeats the booking link right after the work grid", () => {
    const cta = parse("cs").querySelector('#tvorba ~ .ed-home-cta a.ed-book[href="/#kontakt"]');
    expect(cta?.textContent).toBe("Domluvit focení →");
  });

  it("translates the call to action", () => {
    expect(parse("en").querySelector(".ed-home-hero a.ed-book")?.textContent).toBe("Book a shoot");
  });
});

it("leaves business references to the business page", () => {
  const business = { id: "b", quote: "Firemní reference.", author: "Jana", photo: "portfolio/b", service: "business" as const };
  const html = renderToStaticMarkup(<HomeEditorial locale="cs" content={{ ...content, testimonials: [...content.testimonials, business] }} images={normalizeImages({ profile: "" })} />);
  const quotes = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("#tvorba blockquote")].map((q) => q.textContent);
  expect(quotes).toEqual(["Focení působí spíš jako hra."]);
});

it("falls back to the admin-picked stories when no testimonial has a photo", () => {
  const html = renderToStaticMarkup(<HomeEditorial locale="cs" content={{ ...content, testimonials: [] }} images={normalizeImages({ profile: "" })} />);
  const document = new DOMParser().parseFromString(html, "text/html");
  expect(document.querySelectorAll("#tvorba figure").length).toBeGreaterThan(0);
  expect(document.querySelector("#tvorba figcaption")).toBeNull();
});
