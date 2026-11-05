import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import type { GalleryRecord } from "../gallery";

vi.mock("@/lib/kv", () => ({ getKv: async () => null }));
vi.mock("../gallery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../gallery")>()),
  getGallery: vi.fn(),
}));
vi.mock("../gallery-session", () => ({ hasGallerySession: vi.fn() }));

import { getGallery } from "../gallery";
import { hasGallerySession } from "../gallery-session";
import { requireGalleryAccess } from "../gallery-access";

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

async function status(gallery: Partial<GalleryRecord> | null, session: boolean) {
  vi.mocked(getGallery).mockResolvedValue(gallery as GalleryRecord | null);
  vi.mocked(hasGallerySession).mockResolvedValue(session);
  const res = await requireGalleryAccess("g");
  return res instanceof NextResponse ? res.status : "ok";
}

describe("requireGalleryAccess", () => {
  it("neexistující galerie → 404", async () => {
    expect(await status(null, true)).toBe(404);
  });

  it("propadlá galerie → 410 i s platnou session", async () => {
    expect(await status({ slug: "g", expiresAt: past }, true)).toBe(410);
  });

  it("bez session → 401", async () => {
    expect(await status({ slug: "g", expiresAt: future }, false)).toBe(401);
  });

  it("platná session → vrátí galerii", async () => {
    expect(await status({ slug: "g", expiresAt: future }, true)).toBe("ok");
  });
});
