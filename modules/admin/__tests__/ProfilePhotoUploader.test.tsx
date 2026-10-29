"use client";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePhotoUploader } from "@/modules/admin/components/ProfilePhotoUploader";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const flush = () => act(async () => {});

function mockFetch(uploadOk: boolean) {
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => { release = r; });
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/upload") { await gate; return { ok: uploadOk, json: async () => ({ publicId: "site/x" }) }; }
    if (init?.method === "POST") return { ok: true };
    return { ok: true, status: 200, json: async () => ({ profile: "" }) };
  }));
  return release;
}

const pick = (container: HTMLElement) => {
  const input = container.querySelector("input[type=file]")!;
  fireEvent.change(input, { target: { files: [new File(["x"], "a.jpg", { type: "image/jpeg" })] } });
};

describe("ProfilePhotoUploader ukládání", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("nahrání: Nahrávám… → Uloženo → po 3000 ms zmizí", async () => {
    const release = mockFetch(true);
    const { container } = render(<ProfilePhotoUploader />);
    await flush();
    pick(container);
    await flush();
    expect(screen.getByRole("button", { name: "Nahrávám…" })).toBeDisabled();
    release();
    await flush();
    expect(screen.getByText("Uloženo")).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(2999); });
    expect(screen.getByText("Uloženo")).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.queryByText("Uloženo")).not.toBeInTheDocument();
  });

  it("selhání uploadu ukáže Chyba při nahrávání", async () => {
    const release = mockFetch(false);
    const { container } = render(<ProfilePhotoUploader />);
    await flush();
    pick(container);
    release();
    await flush();
    expect(screen.getByText("Chyba při nahrávání")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vybrat fotku" })).toBeEnabled();
  });
});
