import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BrandEditorial } from "../BrandEditorial";
import { normalizeContent, normalizeImages } from "@/modules/admin/lib/content";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));

const content = normalizeContent({ home: { title: "", subtitle: "" }, "o-mne": { title: "", subtitle: "", bio: "" }, lightTesterPromo: { title: "", desc: "" }, testimonials: [], sluzby: { portraits: { title: "", desc: "", packages: [] }, weddings: { title: "", desc: "", packages: [] }, business: { title: "", desc: "", packages: [] } } }, "cs");

const render = (edit: (images: ReturnType<typeof normalizeImages>) => void = () => {}) => {
  const images = normalizeImages();
  edit(images);
  return new DOMParser().parseFromString(renderToStaticMarkup(<BrandEditorial locale="cs" content={content} images={images} />), "text/html");
};

describe("BrandEditorial", () => {
  it("hides the hero photo and the selected work until the admin picks photos", () => {
    const document = render();
    expect(document.querySelector(".ed-brand-hero-image")).toBeNull();
    expect(document.querySelector(".ed-brand-work")).toBeNull();
    expect(document.querySelector("h1")).not.toBeNull();
  });

  it("shows the admin-picked hero and work, skipping empty slots", () => {
    const document = render(({ editorial }) => {
      editorial.brand.hero.publicId = "portfolio/brand-hero";
      editorial.brand.work = [{ ...editorial.brand.hero, publicId: "portfolio/a" }, { ...editorial.brand.hero, publicId: "" }, { ...editorial.brand.hero, publicId: "portfolio/b" }];
    });
    expect(document.querySelectorAll(".ed-brand-hero-image img")).toHaveLength(1);
    expect(document.querySelectorAll(".ed-brand-work__grid figure")).toHaveLength(2);
  });
});
