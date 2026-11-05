"use client";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactEmailForm } from "@/modules/admin/components/ContactEmailForm";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const flush = () => act(async () => {});

function mockFetch(ok: boolean) {
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) =>
    init?.method === "POST" ? { ok, status: ok ? 200 : 500 } : { ok: true, status: 200, json: async () => ({ email: "a@b.cz" }) }));
}

describe("ContactEmailForm ukládání", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uložení ukáže Uloženo", async () => {
    mockFetch(true);
    render(<ContactEmailForm />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Uložit email" }));
    await flush();
    expect(screen.getByText("Uloženo")).toBeInTheDocument();
  });

  it("chyba ukáže Chyba při ukládání", async () => {
    mockFetch(false);
    render(<ContactEmailForm />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Uložit email" }));
    await flush();
    expect(screen.getByText("Chyba při ukládání")).toBeInTheDocument();
  });
});
