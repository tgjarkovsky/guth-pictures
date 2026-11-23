import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeKv } from "./fake-kv";

const { kv, emails, payments, fakturacek } = vi.hoisted(() => ({
  kv: { current: null as ReturnType<typeof import("./fake-kv").createFakeKv> | null },
  emails: [] as { type: string; to?: string; vs: string; invoice?: string }[],
  payments: { list: [] as { id: string; date: string; amount: number; vs: string }[] },
  fakturacek: { up: true, calls: [] as { ref: string; paidAt: string; price: number }[], numbers: new Map<string, string>() },
}));

vi.mock("@/lib/kv", () => ({ getKv: async () => kv.current }));
vi.mock("../lib/render", () => ({ renderVoucherPdf: async () => new Uint8Array([1]), qrDataUri: async () => "data:," }));
// Fakturáček: idempotent per order, like the real API
vi.mock("../lib/fakturacek", () => ({
  createVoucherInvoice: async (o: { id: string; paidAt: string; product: { priceCzk: number } }) => {
    if (!fakturacek.up) throw new Error("Fakturáček: HTTP 503");
    fakturacek.calls.push({ ref: `voucher:${o.id}`, paidAt: o.paidAt, price: o.product.priceCzk });
    const number = fakturacek.numbers.get(o.id) ?? `2026${String(fakturacek.numbers.size + 1).padStart(4, "0")}`;
    fakturacek.numbers.set(o.id, number);
    return { number, pdf: new Uint8Array([3]) };
  },
  fetchVoucherInvoicePdf: async () => new Uint8Array([3]),
}));
vi.mock("../lib/fio", () => ({ fetchIncomingPayments: async () => payments.list }));
vi.mock("../lib/email", () => ({
  sendReminder: async (o: { vs: string; buyer: { email: string } }) => { emails.push({ type: "reminder", to: o.buyer.email, vs: o.vs }); },
  sendVoucherToBuyer: async (o: { vs: string; buyer: { email: string } }, _t: string, _pdf: unknown, _gift: string, invoice?: { number: string }) => { emails.push({ type: "buyer", to: o.buyer.email, vs: o.vs, invoice: invoice?.number }); },
  sendInvoice: async (o: { vs: string; buyer: { email: string } }, invoice: { number: string }) => { emails.push({ type: "invoice", to: o.buyer.email, vs: o.vs, invoice: invoice.number }); },
  notifyOwner: async (subject: string) => { emails.push({ type: `owner:${subject}`, vs: "" }); },
  ownerSummary: () => [],
}));

import { createOrder, getOrder, findOrderByCode } from "../lib/store";
import { canChangeTheme, orderIdFromToken, orderTheme, orderToken, runVoucherJobs } from "../lib/service";

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
  fakturacek.up = true;
  fakturacek.calls.length = 0;
  fakturacek.numbers.clear();
  process.env.FIO_API_TOKEN = "token";
  process.env.FAKTURACEK_URL = "https://faktury.test";
  process.env.FAKTURACEK_API_TOKEN = "t";
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
    expect(saved.paymentRef).toBe("fio:9001");
    expect(saved.invoiceNumber).toBe("20260001");
    expect(saved.invoiceSentAt).toBeTruthy();
    expect(emails.filter((e) => e.type === "buyer")).toEqual([{ type: "buyer", to: "petr@example.com", vs: order.vs, invoice: "20260001" }]);
    expect(fakturacek.calls).toHaveLength(1);
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

  it("sends the voucher without waiting when Fakturáček is down, the invoice follows later", async () => {
    const order = await createOrder(orderData());
    payments.list = [{ id: "9005", date: "2026-11-20", amount: 2500, vs: order.vs }];
    fakturacek.up = false;
    const first = await runVoucherJobs(new Date("2026-11-20T12:00:00Z"));
    const toCustomer = () => emails.filter((e) => !e.type.startsWith("owner:"));
    expect(toCustomer()).toEqual([expect.objectContaining({ type: "buyer", invoice: undefined })]);
    expect(first.errors.join()).toMatch(/Fakturáček/);
    let saved = (await getOrder(order.id))!;
    expect(saved).toMatchObject({ invoiceAttempts: 1, invoiceError: "Fakturáček: HTTP 503" });
    expect(saved.sentToBuyerAt).toBeTruthy();
    expect(saved.invoiceSentAt).toBeUndefined();

    fakturacek.up = true;
    await runVoucherJobs(new Date("2026-11-20T12:10:00Z"));
    await runVoucherJobs(new Date("2026-11-20T12:20:00Z"));
    expect(toCustomer().map((e) => e.type)).toEqual(["buyer", "invoice"]);
    saved = (await getOrder(order.id))!;
    expect(saved).toMatchObject({ invoiceNumber: "20260001", invoiceAttempts: 0 });
    expect(saved.invoiceError).toBeUndefined();
  });

  it("tells the owner once when invoicing keeps failing", async () => {
    const order = await createOrder(orderData());
    payments.list = [{ id: "9006", date: "2026-11-20", amount: 2500, vs: order.vs }];
    fakturacek.up = false;
    for (let i = 0; i < 7; i++) await runVoucherJobs(new Date(Date.UTC(2026, 10, 20, 12, i * 10)));
    expect(emails.filter((e) => e.type.startsWith("owner:⚠️ Fakturu"))).toHaveLength(1);
  });

  it("does not invoice when Fakturáček is not configured, but still sends the voucher", async () => {
    delete process.env.FAKTURACEK_URL;
    const order = await createOrder(orderData());
    payments.list = [{ id: "9007", date: "2026-11-20", amount: 2500, vs: order.vs }];
    const report = await runVoucherJobs();
    expect(report.errors).toEqual([]);
    expect(fakturacek.calls).toHaveLength(0);
    expect(emails.filter((e) => e.type === "buyer")).toHaveLength(1);
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

describe("voucher design choice", () => {
  const product = { id: "portrait-deluxe", name: "Deluxe", details: [], priceCzk: 4000 };
  it("follows the package until the buyer picks one", () => {
    expect(orderTheme({ product })).toBe("snow");
    expect(orderTheme({ product, theme: "noir" })).toBe("noir");
  });
  it("can change only until the voucher is e-mailed", () => {
    expect(canChangeTheme({ status: "pending" })).toBe(true);
    expect(canChangeTheme({ status: "paid" })).toBe(true);
    expect(canChangeTheme({ status: "paid", sentToBuyerAt: "2026-11-23T10:00:00Z" })).toBe(false);
    expect(canChangeTheme({ status: "expired" })).toBe(false);
  });
});
