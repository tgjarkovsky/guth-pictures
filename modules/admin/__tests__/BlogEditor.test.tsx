"use client";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlogEditor } from "@/modules/admin/components/BlogEditor";

const flush = () => act(async () => {});

function mockFetch(ok: boolean) {
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) =>
    init?.method === "POST" ? { ok } : { ok: true, json: async () => [] }));
}

async function fillAndSave() {
  render(<BlogEditor />);
  await flush();
  fireEvent.change(screen.getByPlaceholderText("Název příspěvku"), { target: { value: "Test" } });
  fireEvent.click(screen.getByRole("button", { name: "Vytvořit příspěvek" }));
  await flush();
}

describe("BlogEditor ukládání", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("uložení ukáže Uloženo a po 2000 ms zmizí", async () => {
    mockFetch(true);
    await fillAndSave();
    expect(screen.getByText("Uloženo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Uložit změny" })).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1999); });
    expect(screen.getByText("Uloženo")).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.queryByText("Uloženo")).not.toBeInTheDocument();
  });

  it("chyba ukáže Chyba při ukládání", async () => {
    mockFetch(false);
    await fillAndSave();
    expect(screen.getByText("Chyba při ukládání")).toBeInTheDocument();
  });

  it("prázdný titulek neukládá", async () => {
    mockFetch(true);
    render(<BlogEditor />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit příspěvek" }));
    await flush();
    expect(screen.queryByText("Uloženo")).not.toBeInTheDocument();
  });
});
