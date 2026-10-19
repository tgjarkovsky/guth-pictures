import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeEditorial } from "../HomeEditorial";
import { normalizeContent, normalizeImages } from "@/modules/admin/lib/content";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form aria-label="Kontakt" /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav aria-label="Hlavní navigace" /> }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a>,
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

it("falls back to the admin-picked stories when no testimonial has a photo", () => {
  const html = renderToStaticMarkup(<HomeEditorial locale="cs" content={{ ...content, testimonials: [] }} images={normalizeImages({ profile: "" })} />);
  const document = new DOMParser().parseFromString(html, "text/html");
  expect(document.querySelectorAll("#tvorba figure").length).toBeGreaterThan(0);
  expect(document.querySelector("#tvorba figcaption")).toBeNull();
});
