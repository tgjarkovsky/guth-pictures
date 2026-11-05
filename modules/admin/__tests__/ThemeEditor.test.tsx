"use client";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeEditor } from "@/modules/admin/components/ThemeEditor";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const flush = () => act(async () => {});

function mockFetch(ok: boolean) {
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => { release = r; });
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init?.method) return { ok: true, json: async () => { throw new Error("skip"); } };
    await gate;
    return { ok };
  }));
  return release;
}

describe("ThemeEditor ukládání", () => {
  beforeEach(() => refresh.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("uložení: Ukládám… → Uloženo a obnoví stránku", async () => {
    const release = mockFetch(true);
    render(<ThemeEditor />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Uložit" }));
    expect(screen.getByRole("button", { name: "Ukládám…" })).toBeDisabled();
    release();
    await flush();
    expect(screen.getByRole("button", { name: "Uloženo" })).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("chyba uložení ukáže Chyba", async () => {
    const release = mockFetch(false);
    render(<ThemeEditor />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Uložit" }));
    release();
    await flush();
    expect(screen.getByRole("button", { name: "Chyba" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("reset volá DELETE a ukáže Uloženo", async () => {
    const release = mockFetch(true);
    render(<ThemeEditor />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Reset na default" }));
    release();
    await flush();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/theme", { method: "DELETE" });
    expect(screen.getByRole("button", { name: "Uloženo" })).toBeInTheDocument();
  });
});
