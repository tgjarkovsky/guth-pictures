import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/kv", () => ({ getKv: vi.fn() }));

import { getKv } from "@/lib/kv";
import {
  updateGallerySyncState,
  setGalleryDelivered,
  markGalleryOpened,
  saveGallerySelection,
  pruneGallerySelection,
  confirmGallerySelection,
  unlockGallerySelection,
} from "../gallery";

const NOW = new Date("2026-01-02T03:04:05.000Z");
const RECORD_KEY = "gallery:abc";
const SEL_KEY = "gallery:abc:selection";

let store: Map<string, unknown>;
let set: ReturnType<typeof vi.fn>;

beforeEach(() => {
  store = new Map();
  set = vi.fn(async (k: string, v: unknown) => {
    store.set(k, v);
  });
  vi.mocked(getKv).mockResolvedValue({
    get: async (k: string) => store.get(k) ?? null,
    set,
  } as never);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(getKv).mockReset();
});

const record = { slug: "abc", albumId: "a", catalogId: "c", photoCount: 1 };

describe("gallery record updates", () => {
  it("updateGallerySyncState sets photoCount and syncedAt", async () => {
    store.set(RECORD_KEY, record);
    await updateGallerySyncState("abc", 5);
    expect(store.get(RECORD_KEY)).toEqual({ ...record, photoCount: 5, syncedAt: NOW.toISOString() });
  });

  it("setGalleryDelivered sets delivered", async () => {
    store.set(RECORD_KEY, record);
    await setGalleryDelivered("abc", true);
    expect(store.get(RECORD_KEY)).toEqual({ ...record, delivered: true });
  });

  it("markGalleryOpened keeps firstOpenedAt on later calls", async () => {
    store.set(RECORD_KEY, record);
    await markGalleryOpened("abc");
    expect(store.get(RECORD_KEY)).toMatchObject({
      firstOpenedAt: NOW.toISOString(),
      lastOpenedAt: NOW.toISOString(),
    });
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
    await markGalleryOpened("abc");
    expect(store.get(RECORD_KEY)).toMatchObject({
      firstOpenedAt: NOW.toISOString(),
      lastOpenedAt: "2026-02-01T00:00:00.000Z",
    });
  });

  it.each([
    ["updateGallerySyncState", () => updateGallerySyncState("abc", 1)],
    ["setGalleryDelivered", () => setGalleryDelivered("abc", true)],
    ["markGalleryOpened", () => markGalleryOpened("abc")],
  ])("%s does nothing without record", async (_n, run) => {
    await run();
    expect(set).not.toHaveBeenCalled();
  });

  it.each([
    ["updateGallerySyncState", () => updateGallerySyncState("abc", 1)],
    ["setGalleryDelivered", () => setGalleryDelivered("abc", true)],
    ["markGalleryOpened", () => markGalleryOpened("abc")],
  ])("%s survives missing KV", async (_n, run) => {
    vi.mocked(getKv).mockResolvedValue(null as never);
    await expect(run()).resolves.toBeUndefined();
  });
});

describe("gallery selection updates", () => {
  it("saveGallerySelection creates selection under :selection key", async () => {
    await saveGallerySelection("abc", ["1"], "hi");
    expect(set).toHaveBeenCalledWith(SEL_KEY, {
      favorites: ["1"],
      note: "hi",
      submittedAt: NOW.toISOString(),
      lastUpdated: NOW.toISOString(),
    });
  });

  it("saveGallerySelection keeps note when undefined, clears when empty", async () => {
    store.set(SEL_KEY, {
      favorites: ["1"],
      note: "old",
      submittedAt: "s",
      confirmedAt: "c",
      lastUpdated: "l",
    });
    await saveGallerySelection("abc", ["2"]);
    expect(store.get(SEL_KEY)).toEqual({
      favorites: ["2"],
      note: "old",
      submittedAt: "s",
      confirmedAt: "c",
      lastUpdated: NOW.toISOString(),
    });
    await saveGallerySelection("abc", ["2"], "");
    expect(store.get(SEL_KEY)).toEqual({
      favorites: ["2"],
      submittedAt: "s",
      confirmedAt: "c",
      lastUpdated: NOW.toISOString(),
    });
  });

  it("pruneGallerySelection writes only on change", async () => {
    store.set(SEL_KEY, { favorites: ["1", "2"], lastUpdated: "l" });
    await pruneGallerySelection("abc", new Set(["1", "2"]));
    expect(set).not.toHaveBeenCalled();
    await pruneGallerySelection("abc", new Set(["1"]));
    expect(store.get(SEL_KEY)).toEqual({ favorites: ["1"], lastUpdated: "l" });
  });

  it("pruneGallerySelection does nothing without selection", async () => {
    await pruneGallerySelection("abc", new Set());
    expect(set).not.toHaveBeenCalled();
  });

  it("confirmGallerySelection returns null for missing or empty selection", async () => {
    expect(await confirmGallerySelection("abc")).toBeNull();
    store.set(SEL_KEY, { favorites: [], lastUpdated: "l" });
    expect(await confirmGallerySelection("abc")).toBeNull();
    expect(set).not.toHaveBeenCalled();
  });

  it("confirmGallerySelection returns the same confirmedAt on repeat", async () => {
    store.set(SEL_KEY, { favorites: ["1"], lastUpdated: "l" });
    expect(await confirmGallerySelection("abc")).toBe(NOW.toISOString());
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
    expect(await confirmGallerySelection("abc")).toBe(NOW.toISOString());
    expect(store.get(SEL_KEY)).toEqual({
      favorites: ["1"],
      lastUpdated: "l",
      confirmedAt: NOW.toISOString(),
    });
  });

  it("unlockGallerySelection removes confirmedAt, no write when absent", async () => {
    store.set(SEL_KEY, { favorites: ["1"], lastUpdated: "l" });
    await unlockGallerySelection("abc");
    expect(set).not.toHaveBeenCalled();
    store.set(SEL_KEY, { favorites: ["1"], lastUpdated: "l", confirmedAt: "c" });
    await unlockGallerySelection("abc");
    expect(store.get(SEL_KEY)).toEqual({ favorites: ["1"], lastUpdated: "l" });
  });
});
