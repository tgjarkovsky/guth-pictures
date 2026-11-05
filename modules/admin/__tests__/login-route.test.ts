import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashSync } from "bcryptjs";

vi.mock("@/lib/auth", () => ({
  signToken: vi.fn().mockResolvedValue("fake.token"),
  authCookieConfig: vi.fn((value: string) => ({ name: "admin_auth", value })),
}));

import { POST } from "@/app/api/admin/login/route";

const HASH = hashSync("spravne-heslo", 4);

function login(body: unknown, headers: Record<string, string>): Promise<Response> {
  return POST(
    new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  process.env.ADMIN_PASSWORD_HASH = HASH;
});

describe("POST /api/admin/login", () => {
  it("správné heslo vrátí 200 a nastaví auth cookie", async () => {
    const res = await login({ password: "spravne-heslo" }, { "x-real-ip": "10.0.0.1" });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("admin_auth=fake.token");
  });

  it("špatné heslo vrátí 401 bez cookie", async () => {
    const res = await login({ password: "spatne" }, { "x-real-ip": "10.0.0.2" });
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("bez ADMIN_PASSWORD_HASH nepustí nikoho", async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    const res = await login({ password: "spravne-heslo" }, { "x-real-ip": "10.0.0.3" });
    expect(res.status).toBe(401);
  });

  it.each([
    ["neplatný JSON", "{ not json"],
    ["chybějící heslo", {}],
    ["heslo není string", { password: 12345 }],
    ["prázdné heslo", { password: "" }],
  ])("%s → 401", async (_, body) => {
    const res = await login(body, { "x-real-ip": "10.0.1.1" });
    expect(res.status).toBe(401);
  });

  it("6. pokus ze stejné IP vrátí 429, jiná IP jede dál", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await login({ password: "x" }, { "x-real-ip": "10.0.2.1" })).status).toBe(401);
    }
    expect((await login({ password: "x" }, { "x-real-ip": "10.0.2.1" })).status).toBe(429);
    expect((await login({ password: "x" }, { "x-real-ip": "10.0.2.2" })).status).toBe(401);
  });

  it("limit se počítá podle x-vercel-forwarded-for, podvržené x-real-ip ho neobejde", async () => {
    for (let i = 0; i < 5; i++) {
      await login({ password: "x" }, { "x-vercel-forwarded-for": "10.0.3.1", "x-real-ip": `1.1.1.${i}` });
    }
    const res = await login({ password: "x" }, { "x-vercel-forwarded-for": "10.0.3.1", "x-real-ip": "9.9.9.9" });
    expect(res.status).toBe(429);
  });
});
