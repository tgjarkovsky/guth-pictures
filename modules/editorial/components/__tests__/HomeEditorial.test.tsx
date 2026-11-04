import { readFileSync } from "node:fs";
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
    expect(document.querySelector("#tvorba ~ #o-mne")).not.toBeNull();
    expect(document.querySelector("#tvorba blockquote")?.textContent).toBe("Focení působí spíš jako hra.");
    expect(document.querySelector("#tvorba figcaption span")?.textContent).toBe("Apolena");
    expect(document.querySelectorAll("#o-mne ol li")).toHaveLength(4);
    expect(document.querySelector("#foto-nastroje")).toBeNull();
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

  it("fills the hero with a belt of portraits instead of one big photo", () => {
    const document = parse("cs");
    expect(document.querySelectorAll(".ed-home-hero .ed-belt img").length).toBeGreaterThanOrEqual(6);
    expect(document.querySelector(".ed-trail")).toBeNull();
    expect(document.querySelector(".ed-home-hero__image")).toBeNull();
  });

  it("puts the booking link under the headline with the service links in the same row, right after it", () => {
    const hero = parse("cs").querySelector(".ed-home-hero")!;
    const row = hero.querySelector("h1")!.nextElementSibling!;
    expect(row.classList.contains("ed-home-hero__cta")).toBe(true);
    expect([...row.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([
      "/#kontakt", "/sluzby/portretni-foceni", "/firemni-portrety", "/sluzby/eventy-a-svatby",
    ]);
    expect(row.querySelector("a")!.classList.contains("ed-book")).toBe(true);
  });

  describe("hero spacing (CSS contract)", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const rule = (selector: string) => css.match(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`, "m"))?.[1] ?? "";

    it("pulls the headline up over the belt", () => {
      expect(rule(".ed-home-hero h1")).toMatch(/margin: -[\d.]+em 0 0/);
    });

    it("sits the belt in the flow, so the headline can overlap it at any viewport height", () => {
      expect(rule(".ed-belt")).not.toMatch(/position: absolute/);
    });

    it("separates the action row from the bottom with a thin line and room below", () => {
      const cta = rule(".ed-home-hero__cta");
      expect(cta).toMatch(/border-top: 1px solid/);
      expect(cta).toMatch(/padding: 1\.5rem 0 2\.5rem/);
    });

    it("keeps the hero within the first screen below the nav", () => {
      expect(rule(".ed-home-hero")).toMatch(/min-height: calc\(100svh - var\(--nav-h\)\)/);
    });
  });

  it("keeps only the intro in the bar below", () => {
    const bar = parse("cs").querySelector(".ed-home-hero__bar");
    expect(bar?.querySelector("p")).not.toBeNull();
    expect(bar?.querySelector("a")).toBeNull();
  });

  it("styles the booking buttons with a class defined once, so no later rule can repaint them", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const classes = new Set([...parse("cs").querySelectorAll(".ed-home-hero__cta > a, .ed-home-cta a")].map((a) => a.className));
    expect(classes.size).toBe(1);
    const [cls] = [...classes];
    expect(css.match(new RegExp(`^\\.${cls} \\{`, "gm"))).toHaveLength(1);
  });

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
