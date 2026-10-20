import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GalerieDetail } from "../GalerieDetail";
import type { GalleryPhoto, GalleryRecord, GallerySelection } from "@/modules/gallery/lib/gallery";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const gallery = {
  slug: "anna",
  expiresAt: "2999-01-01T00:00:00.000Z",
  photoCount: 2,
} as unknown as GalleryRecord;
const photos = [
  { lrId: "a", cloudinaryId: "id-a", filename: "a.jpg" },
  { lrId: "b", cloudinaryId: "id-b", filename: "b.jpg" },
] as unknown as GalleryPhoto[];
const selection = {
  favorites: ["a"],
  lastUpdated: "2026-01-01T00:00:00.000Z",
  confirmedAt: "2026-01-02T00:00:00.000Z",
  note: "Díky",
} as unknown as GallerySelection;

const fetchMock = vi.fn();
const reply = (ok: boolean, body: unknown) => fetchMock.mockResolvedValueOnce({ ok, json: async () => body });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  render(<GalerieDetail gallery={gallery} photos={photos} selection={selection} />);
});
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  refresh.mockReset();
});

describe("GalerieDetail", () => {
  it("renders selection details", () => {
    expect(screen.getByText("Díky")).toBeTruthy();
    expect(screen.getByText(/Potvrzeno klientem/)).toBeTruthy();
    expect(screen.getByText("Všechny fotky (2)")).toBeTruthy();
  });

  it("shows sync result and refreshes", async () => {
    reply(true, { synced: 3, failed: 1, errors: ["x"] });
    fireEvent.click(screen.getByRole("button", { name: "↻ Sync z Lightroomu" }));
    const msg = await screen.findByText(/Synchronizováno: 3 fotek, 1 selhalo/);
    expect(msg.textContent).toBe("Synchronizováno: 3 fotek, 1 selhalo\nx");
    expect(msg.className).toContain("text-green-400");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/gallery/anna/sync", { method: "POST" });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows sync error from the API", async () => {
    reply(false, { error: "Boom" });
    fireEvent.click(screen.getByRole("button", { name: "↻ Sync z Lightroomu" }));
    const msg = await screen.findByText("Chyba: Boom");
    expect(msg.className).toContain("text-red-400");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows unlock error in the copy result field", async () => {
    reply(false, {});
    fireEvent.click(screen.getByRole("button", { name: "Odemknout" }));
    const msg = await screen.findByText("Chyba: Unlock failed");
    expect(msg.className).toContain("text-red-400");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/gallery/anna/unlock", { method: "POST" });
  });

  it("refreshes after a successful unlock", async () => {
    reply(true, {});
    fireEvent.click(screen.getByRole("button", { name: "Odemknout" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
