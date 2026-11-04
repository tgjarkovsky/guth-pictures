import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { EventsEditorial } from "../EventsEditorial";
import { normalizeContent, normalizeImages, type ContentData } from "@/modules/admin/lib/content";
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));

const base = (pages?: ContentData["pages"]) => normalizeContent({
  home: { title: "", subtitle: "" }, "o-mne": { title: "", subtitle: "", bio: "" }, lightTesterPromo: { title: "", desc: "" }, testimonials: [],
  editorial: { eventsTitle: "Až budete u toho." },
  sluzby: {
    portraits: { title: "", desc: "", packages: [] },
    weddings: { title: "Svatby", desc: "", packages: [{ name: "Celý den", price: "15 000 Kč", duration: "", includes: [] }], note: "Záloha" },
    business: { title: "", desc: "", packages: [] },
  },
  pages,
}, "cs");

it("renders admin-edited events copy", () => {
  const pages = { events: { conferenceHeading: "Vlastní nadpis z adminu" } } as unknown as ContentData["pages"];
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={base(pages)} images={normalizeImages()} />);
  expect(html).toContain("Vlastní nadpis z adminu");
  expect(html).not.toContain("Řečníci, sály, kuloáry.");
});

it("renders an events and weddings reportage with managed placeholders", () => {
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={base()} images={normalizeImages()} />);
  expect(html).toContain("Až budete u toho.");
  expect(html).toContain("Eventy a svatby");
  expect(html).toContain("15 000 Kč");
  expect(html).toContain("Poptat termín");
  expect(html).toContain("<form");
});

it("no longer marks the page as coming soon", () => {
  const cs = renderToStaticMarkup(<EventsEditorial locale="cs" content={base()} images={normalizeImages()} />);
  const en = renderToStaticMarkup(<EventsEditorial locale="en" content={base()} images={normalizeImages()} />);
  expect(cs).not.toContain("Připravujeme");
  expect(en).not.toContain("Coming soon");
});

it("shows conferences and weddings side by side in the hero", () => {
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={base()} images={normalizeImages()} />);
  const hero = html.slice(html.indexOf("ed-events-hero"), html.indexOf("ed-events-chapters"));
  expect(hero).toContain("Fotím konference a svatby");
  expect(hero).toContain("Konferenční fotografie bude doplněna");
  expect(hero).toContain("Svatební fotografie bude doplněna");
});

it("splits the page into a conference and a wedding chapter, each with its own pricing", () => {
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={base()} images={normalizeImages()} />);
  const conference = html.slice(html.indexOf('id="konference"'), html.indexOf('id="svatby"'));
  const wedding = html.slice(html.indexOf('id="svatby"'), html.indexOf('id="kontakt"'));
  expect(html).toContain('href="#konference"');
  expect(html).toContain('href="#svatby"');
  expect(conference).toContain("6 000 Kč");
  expect(conference).not.toContain("15 000 Kč");
  expect(wedding).toContain("15 000 Kč");
  expect(html).toContain("Napište mi o své akci");
});

it("falls back to default conference pricing for content saved before it existed", () => {
  const content = base();
  expect(content.sluzby.conferences.packages.map((pkg) => pkg.price)).toEqual(["4 500 Kč", "6 000 Kč", "12 000 Kč"]);
});

it("names the wedding chapter from page copy, not from the shared /sluzby service", () => {
  const content = base();
  content.sluzby.weddings.title = "Eventy";
  content.sluzby.weddings.desc = "Text karty na /sluzby";
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={content} images={normalizeImages()} />);
  const wedding = html.slice(html.indexOf('id="svatby"'), html.indexOf('id="kontakt"'));
  expect(wedding).toContain("02 — Svatby");
  expect(wedding).not.toContain("Text karty na /sluzby");
  expect(html).not.toContain("02</span> Eventy");
});
