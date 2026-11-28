import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
const settings = vi.hoisted(() => ({ themePhotos: {} as Record<string, unknown> }));
vi.mock("../lib/settings", () => ({ getVoucherSettings: async () => settings }));

import { renderFrontPreview, themePhoto } from "../lib/render";

describe("themePhoto", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo");
    global.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))) as unknown as typeof fetch;
  });

  it("bez vybrané fotky použije přibalenou", async () => {
    settings.themePhotos = {};
    const p = await themePhoto("snow");
    expect(p.src).toMatch(/^data:image\/jpeg;base64,/);
    expect(p.position).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("vybranou fotku stáhne z Cloudinary ve velikosti pro tisk", async () => {
    settings.themePhotos = { noir: { publicId: "portfolio/a", x: 40, y: 20 } };
    const p = await themePhoto("noir");
    expect(global.fetch).toHaveBeenCalledWith("https://res.cloudinary.com/demo/image/upload/c_limit,w_1600,h_2400,q_90,f_jpg/portfolio/a");
    expect(p).toEqual({ src: "data:image/jpeg;base64,AQID", position: "40% 20%" });
  });

  it("když Cloudinary neodpoví, vrátí přibalenou fotku", async () => {
    settings.themePhotos = { ivy: { publicId: "portfolio/b", x: 50, y: 50 } };
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 })) as unknown as typeof fetch;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const p = await themePhoto("ivy");
    expect(p.position).toBeUndefined();
    expect(p.src).toMatch(/^data:image\/jpeg;base64,\/9j/);
  });

  it("náhled v adminu při chybě Cloudinary nepodstrčí starou fotku, ale ohlásí chybu", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 })) as unknown as typeof fetch;
    await expect(renderFrontPreview("snow", "cs", { publicId: "portfolio/missing", x: 50, y: 50 })).rejects.toThrow(/Cloudinary 404/);
  });
});
