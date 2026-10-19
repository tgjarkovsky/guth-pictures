// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const requireAdmin = vi.fn();
const setContactEmail = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/admin-route", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/modules/admin/lib/content", () => ({
  getContactEmail: async () => "old@example.com",
  setContactEmail: (...a: unknown[]) => setContactEmail(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

import { POST } from "../route";

const req = (body: unknown) =>
  new Request("http://localhost/api/admin/email", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];

describe("POST /api/admin/email", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue(null);
    setContactEmail.mockReset();
    revalidatePath.mockReset();
  });

  it("uloží platný e-mail a revaliduje celý layout", async () => {
    const res = await POST(req({ email: "new@example.com" }));
    expect(res.status).toBe(200);
    expect(setContactEmail).toHaveBeenCalledWith("new@example.com");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/llms.txt");
  });

  it("neplatný e-mail vrátí 400 bez uložení a revalidace", async () => {
    const res = await POST(req({ email: "neni-email" }));
    expect(res.status).toBe(400);
    expect(setContactEmail).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("bez admina vrátí odpověď z requireAdmin", async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const res = await POST(req({ email: "new@example.com" }));
    expect(res.status).toBe(401);
    expect(setContactEmail).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
