import { describe, it, expect, vi, beforeEach } from "vitest";

const kvData = new Map<string, unknown>();
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(async (key: string) => kvData.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvData.set(key, value); }),
  },
}));

import { markPhotosUsed, mergeDrafts } from "../store";
import type { StoryDraft } from "../types";

const draft = (id: string): StoryDraft => ({
  id, template: "C", photos: [{ publicId: "portfolio/a", x: 50, y: 50 }],
  headline: "H", sub: "S", words: [], subHeadline: "", textSource: "manual",
  createdAt: "2026-07-17T06:00:00.000Z",
});

beforeEach(() => {
  kvData.clear();
  process.env.KV_REST_API_URL = "https://test";
  process.env.KV_REST_API_TOKEN = "test";
});

describe("retention", () => {
  it("markPhotosUsed drops entries older than 8 weeks", async () => {
    kvData.set("stories:usedPhotos", [
      { publicId: "portfolio/old", usedAt: "2026-05-01T00:00:00.000Z" },
      { publicId: "portfolio/recent", usedAt: "2026-07-15T00:00:00.000Z" },
    ]);
    await markPhotosUsed(["portfolio/new"], new Date("2026-07-17T00:00:00Z"));
    const ids = (kvData.get("stories:usedPhotos") as { publicId: string }[]).map(u => u.publicId);
    expect(ids).toEqual(["portfolio/recent", "portfolio/new"]);
  });

  it("mergeDrafts puts new first and trims to max newest", () => {
    const result = mergeDrafts([draft("n1"), draft("n2")], [draft("e1"), draft("e2"), draft("e3")], 4);
    expect(result.map(d => d.id)).toEqual(["n1", "n2", "e1", "e2"]);
  });

  it("mergeDrafts defaults to 12", () => {
    const existing = Array.from({ length: 15 }, (_, i) => draft(`e${i}`));
    expect(mergeDrafts([draft("n")], existing)).toHaveLength(12);
  });
});
