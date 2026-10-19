// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/kv", () => ({ getKv: async () => null }));
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: { utils: { download_zip_url: vi.fn(() => "https://api.cloudinary.com/zip?sig=1") } },
}));
vi.mock("@/modules/gallery/lib/gallery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/gallery/lib/gallery")>()),
  getGallery: vi.fn(),
  getGalleryPhotos: vi.fn(async () => [{ cloudinaryId: "a/1" }, { cloudinaryId: "a/2" }]),
  isExpired: vi.fn(() => false),
}));
vi.mock("@/modules/gallery/lib/gallery-session", () => ({
  hasGallerySession: vi.fn(async () => true),
}));

import { cloudinary } from "@/lib/cloudinary";
import { getGallery, getGalleryPhotos, isExpired, type GalleryRecord } from "@/modules/gallery/lib/gallery";
import { hasGallerySession } from "@/modules/gallery/lib/gallery-session";
import { GET } from "../route";

const params = { params: Promise.resolve({ slug: "test" }) };
const call = () => GET(new NextRequest("http://localhost/api/gallery/test/download-all"), params);
const give = (g: Partial<GalleryRecord> | null) =>
  vi.mocked(getGallery).mockResolvedValueOnce(g && ({ slug: "test", ...g } as GalleryRecord));

describe("/api/gallery/[slug]/download-all", () => {
  it("redirects a delivered gallery to the signed zip url", async () => {
    give({ delivered: true });
    const res = await call();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://api.cloudinary.com/zip?sig=1");
    expect(cloudinary.utils.download_zip_url).toHaveBeenCalledWith({
      public_ids: ["a/1", "a/2"],
      target_public_id: "test",
      flatten_folders: true,
    });
  });

  it("returns 404 for a missing gallery", async () => {
    give(null);
    expect((await call()).status).toBe(404);
  });

  it("returns 410 when expired", async () => {
    give({ delivered: true });
    vi.mocked(isExpired).mockReturnValueOnce(true);
    expect((await call()).status).toBe(410);
  });

  it("returns 401 without session", async () => {
    give({ delivered: true });
    vi.mocked(hasGallerySession).mockResolvedValueOnce(false);
    expect((await call()).status).toBe(401);
  });

  it("returns 403 when not delivered", async () => {
    give({});
    expect((await call()).status).toBe(403);
  });

  it("returns 404 for an empty gallery", async () => {
    give({ delivered: true });
    vi.mocked(getGalleryPhotos).mockResolvedValueOnce([]);
    expect((await call()).status).toBe(404);
  });
});
