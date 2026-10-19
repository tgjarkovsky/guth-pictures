"use client";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContentEditor } from "@/modules/admin/components/ContentEditor";
import type { ContentData } from "@/modules/admin/lib/content";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const service = (title: string) => ({ title, desc: `${title} popis`, packages: [], note: "" });

const content = (): ContentData => ({
  home: { title: "Home", subtitle: "Sub" },
  "o-mne": { title: "O mně", subtitle: "", bio: "" },
  lightTesterPromo: { title: "", desc: "" },
  editorial: { eventsTitle: "" },
  pages: defaultPageCopy("cs"),
  sluzby: {
    portraits: service("Portréty původní"),
    weddings: service("Svatby původní"),
    business: { ...service("Firmy původní"), extras: [] },
  },
  testimonials: [],
});

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
    if (init?.method === "POST") return json({ ok: true });
    if (url.startsWith("/api/admin/content")) return json(content());
    if (url === "/api/admin/images") return json({ profile: "" });
    if (url === "/api/admin/email") return json({ email: "a@b.cz" });
    throw new Error(`unexpected ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const posts = (fetchMock: ReturnType<typeof mockFetch>) =>
  fetchMock.mock.calls.filter(([u, i]) => u === "/api/admin/content" && i?.method === "POST");

describe("ContentEditor", () => {
  it("najde sekci hledáním, upraví nadpis služby a odešle celý obsah", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<ContentEditor />);

    const nav = screen.getByRole("navigation", { name: "Sekce" });
    await user.type(within(nav).getByPlaceholderText("Hledat text nebo pole…"), "portrety puvodni");
    await user.click(within(nav).getByRole("button", { name: "Ceník" }));
    const field = await screen.findByDisplayValue("Portréty původní");
    await user.clear(field);
    await user.type(field, "Nový nadpis");
    await user.click(screen.getByRole("button", { name: "Uložit · 1" }));

    await waitFor(() => expect(posts(fetchMock)).toHaveLength(1));
    const body = JSON.parse(posts(fetchMock)[0][1]!.body as string);
    expect(body.locale).toBe("cs");
    expect(body.data.sluzby.portraits.title).toBe("Nový nadpis");
    expect(body.data.sluzby.weddings.title).toBe("Svatby původní");
    expect(body.data.sluzby.business.title).toBe("Firmy původní");
    expect(body.data.testimonials).toEqual([]);
    expect(await screen.findByRole("button", { name: "Vše uloženo" })).toBeDisabled();
  });

  it("ukazuje jen pole vybrané sekce", async () => {
    mockFetch();
    const user = userEvent.setup();

    render(<ContentEditor />);

    expect(await screen.findByDisplayValue(defaultPageCopy("cs").home.title)).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Portréty původní")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Patička" })[0]);
    expect(await screen.findByDisplayValue("Home")).toBeInTheDocument();
    expect(screen.queryByDisplayValue(defaultPageCopy("cs").home.title)).not.toBeInTheDocument();
  });

  it("uloží změny v obou jazycích jedním kliknutím", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();

    render(<ContentEditor />);

    const title = await screen.findByDisplayValue(defaultPageCopy("cs").home.title);
    await user.type(title, "!");
    await user.click(screen.getByRole("button", { name: "EN" }));
    await user.type(await screen.findByDisplayValue(defaultPageCopy("cs").home.title), "?");
    await user.click(screen.getByRole("button", { name: "Uložit · 2" }));

    await waitFor(() => expect(posts(fetchMock)).toHaveLength(2));
    const locales = posts(fetchMock).map(([, i]) => JSON.parse(i!.body as string).locale).sort();
    expect(locales).toEqual(["cs", "en"]);
  });
});
