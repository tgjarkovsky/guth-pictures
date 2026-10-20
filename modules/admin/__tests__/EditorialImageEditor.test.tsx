"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditorialImageEditor } from "@/modules/admin/components/EditorialImageEditor";
import type { EditorialImage, EditorialImages, Testimonial } from "@/modules/admin/lib/content";

const emptyImage = (): EditorialImage => ({
  publicId: "",
  alt: { cs: "", en: "" },
  focal: { desktop: "50% 50%", mobile: "50% 50%" },
});

const editorial = (): EditorialImages => ({
  home: { hero: emptyImage(), stories: [emptyImage(), emptyImage(), emptyImage()], photographer: emptyImage(), tools: { foceni101: emptyImage(), lightPlanner: emptyImage() } },
  portrait: { hero: emptyImage(), gallery: [emptyImage(), emptyImage(), emptyImage()] },
  business: { hero: emptyImage(), headshots: [emptyImage(), emptyImage(), emptyImage()], atWork: [emptyImage(), emptyImage(), emptyImage()] },
  events: { hero: emptyImage(), reportage: [emptyImage(), emptyImage(), emptyImage(), emptyImage()] },
});

describe("EditorialImageEditor", () => {
  it("přiřadí galerijní fotku do slotu a uloží celý editorial", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EditorialImageEditor editorial={editorial()} photos={[{
      publicId: "portfolio/event",
      width: 1200,
      height: 800,
      alt: { cs: "Atmosféra eventu", en: "Event atmosphere" },
      category: "svatby",
    }]} />);

    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Eventy — hero");
    await user.click(screen.getByRole("button", { name: "Změnit fotku: Eventy — hero" }));
    await user.click(screen.getByRole("button", { name: "Vybrat Atmosféra eventu" }));
    await user.click(screen.getByRole("button", { name: "Uložit editorialové fotky" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/images", expect.objectContaining({ method: "POST" })));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.editorial.events.hero).toMatchObject({
      publicId: "portfolio/event",
      alt: { cs: "Atmosféra eventu", en: "Event atmosphere" },
    });
  });

  it("umí změnit pořadí a vyprázdnit slot", async () => {
    const value = editorial();
    value.portrait.gallery[0].publicId = "portfolio/first";
    value.portrait.gallery[1].publicId = "portfolio/second";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EditorialImageEditor editorial={value} photos={[]} />);
    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Portréty — galerie 1");
    await user.click(screen.getByRole("button", { name: "Posunout dolů: Portréty — galerie 1" }));
    await user.click(screen.getByRole("button", { name: "Vyprázdnit slot: Portréty — galerie 1" }));
    await user.click(screen.getByRole("button", { name: "Uložit editorialové fotky" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.editorial.portrait.gallery.map((image: EditorialImage) => image.publicId)).toEqual([
      "", "portfolio/first", "",
    ]);
  });

  it("přidá a odebere fotku v portrétní galerii", async () => {
    const value = editorial();
    value.portrait.gallery[0].publicId = "portfolio/first";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EditorialImageEditor editorial={value} photos={[]} />);
    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Portréty — galerie 1");
    await user.click(screen.getByRole("button", { name: "Přidat fotku: Portréty — galerie" }));
    expect(screen.getByRole("heading", { name: /Galerie 4/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Přidat fotku: Portréty — galerie" }));
    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Portréty — galerie 2");
    await user.click(screen.getByRole("button", { name: "Odebrat: Portréty — galerie 2" }));
    await user.click(screen.getByRole("button", { name: "Uložit editorialové fotky" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.editorial.portrait.gallery.map((image: EditorialImage) => image.publicId)).toEqual(["portfolio/first", "", "", ""]);
  });

  it("u reportáže eventů přidání nenabízí (pevný layout)", async () => {
    const user = userEvent.setup();
    render(<EditorialImageEditor editorial={editorial()} photos={[]} />);
    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Eventy — reportáž 1");
    expect(screen.queryByRole("button", { name: /Přidat fotku/ })).toBeNull();
  });

  it("ukazuje jen vybraný slot", async () => {
    const user = userEvent.setup();
    render(<EditorialImageEditor editorial={editorial()} photos={[]} />);
    expect(screen.getByRole("button", { name: "Změnit fotku: Homepage — hero" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Změnit fotku: Eventy — hero" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Eventy — hero");
    expect(screen.queryByRole("button", { name: "Změnit fotku: Homepage — hero" })).not.toBeInTheDocument();
  });

  it("nabízí jen sloty, které web vykresluje, a reference u jejich stránky", () => {
    render(<EditorialImageEditor editorial={editorial()} photos={[]} references={{ cs: [], en: [] }} />);
    const options = [...(screen.getByLabelText("Vybrat sekci") as HTMLSelectElement).options].map((o) => o.value);
    expect(options.filter((o) => /příběh \d|headshot \d|Focení 101|plánovač/.test(o))).toEqual([]);
    expect(options).toContain("Homepage — vybrané příběhy");
    expect(options).toContain("Business — headshoty");
  });

  it("změní fotku reference a uloží ji do CS i EN bez ztráty ostatního obsahu", async () => {
    const ref = (quote: string): Testimonial => ({ id: "r1", quote, author: "Jana", role: "", photo: "portfolio/old", service: "creative" });
    const stored = { home: { title: "Patička", subtitle: "" }, testimonials: [] };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => ({
      ok: true,
      json: async () => (init?.method === "POST" ? { ok: true } : url.startsWith("/api/admin/content") ? stored : {}),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EditorialImageEditor editorial={editorial()} photos={[{
      publicId: "portfolio/new", width: 800, height: 1000, alt: { cs: "Klientka", en: "Client" }, category: "portréty",
    }]} references={{ cs: [ref("Skvělé")], en: [ref("Great")] }} />);

    await user.selectOptions(screen.getByLabelText("Vybrat sekci"), "Homepage — vybrané příběhy");
    await user.click(screen.getByText("Jana"));
    await user.click(screen.getByRole("button", { name: "Vybrat fotku: Jana" }));
    await user.click(screen.getByRole("button", { name: "Použít Klientka" }));
    await user.click(screen.getByRole("button", { name: "Uložit editorialové fotky" }));

    await waitFor(() => expect(fetchMock.mock.calls.filter(([u, i]) => u === "/api/admin/content" && i?.method === "POST")).toHaveLength(2));
    const saved = fetchMock.mock.calls
      .filter(([u, i]) => u === "/api/admin/content" && i?.method === "POST")
      .map(([, i]) => JSON.parse(i!.body as string));
    for (const { locale, data } of saved) {
      expect(data.home.title).toBe("Patička");
      expect(data.testimonials).toEqual([expect.objectContaining({ id: "r1", photo: "portfolio/new", quote: locale === "cs" ? "Skvělé" : "Great" })]);
    }
  });
});
