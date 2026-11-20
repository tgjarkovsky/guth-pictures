import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeKv } from "./fake-kv";

const { kv, emails, payments } = vi.hoisted(() => ({
  kv: { current: null as ReturnType<typeof import("./fake-kv").createFakeKv> | null },
  emails: [] as { type: string; to?: string; vs: string }[],
  payments: { list: [] as { id: string; date: string; amount: number; vs: string }[] },
}));

vi.mock("@/lib/kv", () => ({ getKv: async () => kv.current }));
vi.mock("../lib/render", () => ({ renderVoucherPdf: async () => new Uint8Array([1]), qrDataUri: async () => "data:," }));
vi.mock("../lib/receipt", () => ({ renderReceiptPdf: async () => new Uint8Array([2]) }));
vi.mock("../lib/fio", () => ({ fetchIncomingPayments: async () => payments.list }));
vi.mock("../lib/email", () => ({
  sendReminder: async (o: { vs: string; buyer: { email: string } }) => { emails.push({ type: "reminder", to: o.buyer.email, vs: o.vs }); },
  sendVoucherToBuyer: async (o: { vs: string; buyer: { email: string } }) => { emails.push({ type: "buyer", to: o.buyer.email, vs: o.vs }); },
  sendVoucherToRecipient: async (o: { vs: string; recipient: { email: string } }) => { emails.push({ type: "recipient", to: o.recipient.email, vs: o.vs }); },
  notifyOwner: async (subject: string) => { emails.push({ type: `owner:${subject}`, vs: "" }); },
  ownerSummary: () => [],
}));

import { createOrder, getOrder, findOrderByCode } from "../lib/store";
import { orderIdFromToken, orderToken, runVoucherJobs } from "../lib/service";

const orderData = (over: Record<string, unknown> = {}) => ({
  locale: "cs" as const,
  product: { id: "portrait-basic", name: "Kreativní portrét — Základ", details: ["1,5 hod"], priceCzk: 2500 },
  buyer: { name: "Petr", email: "petr@example.com" },
  recipient: { name: "Jana" },
  christmas: true,
  ...over,
});

beforeEach(() => {
  kv.current = createFakeKv();
  emails.length = 0;
  payments.list = [];
  process.env.FIO_API_TOKEN = "token";
  process.env.AUTH_SECRET = "test-secret";
});

describe("voucher jobs", () => {
  it("pays, issues and e-mails exactly once even when run repeatedly", async () => {
    const order = await createOrder(orderData(), new Date("2026-11-20T10:00:00Z"));
    payments.list = [{ id: "9001", date: "2026-11-20", amount: 2500, vs: order.vs }];

    const first = await runVoucherJobs(new Date("2026-11-20T10:10:00Z"));
    expect(first).toMatchObject({ paid: 1, delivered: 1, errors: [] });
    const second = await runVoucherJobs(new Date("2026-11-20T10:20:00Z"));
    expect(second).toMatchObject({ paid: 0, delivered: 0 });

    const saved = (await getOrder(order.id))!;
    expect(saved.status).toBe("paid");
    expect(saved.code).toMatch(/^GP-/);
    expect(saved.validUntil).toBe("2027-11-20");
    expect(saved.docNumber).toBe("2026-0001");
    expect(saved.paymentRef).toBe("fio:9001");
    expect(emails.filter((e) => e.type === "buyer")).toHaveLength(1);
    expect((await findOrderByCode(saved.code!))?.id).toBe(order.id);
  });

  it("does not issue a voucher for an underpayment", async () => {
    const order = await createOrder(orderData());
    payments.list = [{ id: "9002", date: "2026-11-20", amount: 2000, vs: order.vs }];
    await runVoucherJobs();
    const saved = (await getOrder(order.id))!;
    expect(saved.status).toBe("pending");
    expect(saved.paymentIssue).toMatch(/2000/);
    expect(emails.some((e) => e.type === "buyer")).toBe(false);
  });

  it("ignores payments with an unknown VS", async () => {
    await createOrder(orderData());
    payments.list = [{ id: "9003", date: "2026-11-20", amount: 2500, vs: "123" }];
    expect(await runVoucherJobs()).toMatchObject({ paid: 0 });
  });

  it("reminds after 3 days and expires after 10", async () => {
    const order = await createOrder(orderData(), new Date("2026-11-01T10:00:00Z"));
    await runVoucherJobs(new Date("2026-11-04T11:00:00Z"));
    expect(emails.filter((e) => e.type === "reminder")).toHaveLength(1);
    await runVoucherJobs(new Date("2026-11-05T11:00:00Z"));
    expect(emails.filter((e) => e.type === "reminder")).toHaveLength(1);
    await runVoucherJobs(new Date("2026-11-11T11:00:00Z"));
    expect((await getOrder(order.id))!.status).toBe("expired");
  });

  it("revives an expired order when the money arrives late", async () => {
    const order = await createOrder(orderData(), new Date("2026-11-01T10:00:00Z"));
    await runVoucherJobs(new Date("2026-11-12T10:00:00Z"));
    payments.list = [{ id: "9004", date: "2026-11-13", amount: 2500, vs: order.vs }];
    await runVoucherJobs(new Date("2026-11-13T10:00:00Z"));
    expect((await getOrder(order.id))!.status).toBe("paid");
  });

  it("sends to the recipient on the chosen day only", async () => {
    const order = await createOrder(orderData({ recipient: { name: "Jana", email: "jana@example.com", sendOn: "2026-12-24" } }));
    payments.list = [{ id: "9005", date: "2026-11-20", amount: 2500, vs: order.vs }];
    await runVoucherJobs(new Date("2026-11-20T12:00:00Z"));
    expect(emails.map((e) => e.type)).toContain("buyer");
    expect(emails.map((e) => e.type)).not.toContain("recipient");
    await runVoucherJobs(new Date("2026-12-24T06:00:00Z")); // 07:00 in Prague
    expect(emails.filter((e) => e.type === "recipient")).toEqual([{ type: "recipient", to: "jana@example.com", vs: order.vs }]);
  });

  it("skips when another run holds the lock", async () => {
    await kv.current!.set("voucher:lock", "1");
    expect((await runVoucherJobs()).skipped).toBeTruthy();
  });
});

describe("order tokens", () => {
  it("round-trips and rejects tampering", async () => {
    const order = await createOrder(orderData());
    const token = await orderToken(order.id);
    expect(await orderIdFromToken(token)).toBe(order.id);
    // flip a character in the middle of the signature (the last base64url char carries padding bits)
    const dot = token.indexOf(".");
    const i = dot + 5;
    const tampered = token.slice(0, i) + (token[i] === "A" ? "B" : "A") + token.slice(i + 1);
    expect(await orderIdFromToken(tampered)).toBeNull();
    expect(await orderIdFromToken(`${"0".repeat(18)}${token.slice(dot)}`)).toBeNull();
    expect(await orderIdFromToken("../../etc")).toBeNull();
  });
});
