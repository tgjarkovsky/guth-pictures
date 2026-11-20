import { describe, expect, it } from "vitest";
import { spayd, ibanToLocal } from "../lib/spayd";
import { generateVoucherCode, normalizeVoucherCode, formatVs, formatDocNumber } from "../lib/code";
import { addMonths, formatCzk, formatDate, pragueDate } from "../lib/dates";
import { parseFioStatement } from "../lib/fio";
import { validateOrder } from "../lib/validation";
import { parseSettings } from "../lib/settings-validation";
import { defaultSettings, normalizeSettings } from "../lib/settings";

describe("spayd", () => {
  it("builds a QR payment string without diacritics or asterisks", () => {
    expect(spayd({ iban: "CZ65 0800 0000 1920 0014 5399", amount: 2500, vs: "77260001", message: "Dárkový poukaz*1", recipient: "Tomáš Guth Jarkovský" }))
      .toBe("SPD*1.0*ACC:CZ6508000000192000145399*AM:2500.00*CC:CZK*X-VS:77260001*RN:Tomas Guth Jarkovsky*MSG:Darkovy poukaz1");
  });
  it("converts a Czech IBAN to the local account format", () => {
    expect(ibanToLocal("CZ65 0800 0000 1920 0014 5399")).toBe("19-2000145399/0800");
    expect(ibanToLocal("CZ1220100000002900000000")).toBe("2900000000/2010");
  });
});

describe("codes", () => {
  it("generates GP-XXXX-XXXX without ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateVoucherCode();
      expect(code).toMatch(/^GP-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    }
  });
  it("normalizes typed codes", () => {
    expect(normalizeVoucherCode("gp 7kq4 m2xd")).toBe("GP-7KQ4-M2XD");
    expect(normalizeVoucherCode("7KQ4M2XD")).toBe("GP-7KQ4-M2XD");
    expect(normalizeVoucherCode("GP-7KQ4-M2X0")).toBeNull(); // 0 is not in the alphabet
    expect(normalizeVoucherCode("GP-123")).toBeNull();
  });
  it("formats VS and receipt numbers", () => {
    expect(formatVs(12, 2026)).toBe("77260012");
    expect(formatDocNumber(3, 2026)).toBe("2026-0003");
  });
});

describe("dates", () => {
  it("adds months and clamps to month end", () => {
    expect(addMonths("2026-11-20", 12)).toBe("2027-11-20");
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
  });
  it("uses Prague time for today", () => {
    expect(pragueDate(new Date("2026-12-23T23:30:00Z"))).toBe("2026-12-24");
  });
  it("formats", () => {
    expect(formatDate("2027-12-31", "cs")).toBe("31. 12. 2027");
    expect(formatCzk(2500, "cs")).toBe("2 500 Kč");
  });
});

describe("parseFioStatement", () => {
  it("keeps incoming CZK payments with a VS", () => {
    const json = {
      accountStatement: {
        transactionList: {
          transaction: [
            { column22: { value: 111 }, column0: { value: "2026-11-21+0100" }, column1: { value: 2500 }, column14: { value: "CZK" }, column5: { value: "0077260001" }, column10: { value: "Petr" } },
            { column22: { value: 112 }, column0: { value: "2026-11-21+0100" }, column1: { value: -300 }, column14: { value: "CZK" }, column5: { value: "1" } },
            { column22: { value: 113 }, column0: { value: "2026-11-21+0100" }, column1: { value: 400 }, column14: { value: "CZK" }, column5: null },
            { column22: { value: 114 }, column0: { value: "2026-11-21+0100" }, column1: { value: 100 }, column14: { value: "EUR" }, column5: { value: "77260002" } },
          ],
        },
      },
    };
    expect(parseFioStatement(json)).toEqual([{ id: "111", date: "2026-11-21", amount: 2500, vs: "77260001", counterparty: "Petr", message: undefined }]);
  });
  it("handles an empty statement", () => {
    expect(parseFioStatement({ accountStatement: { transactionList: { transaction: [] } } })).toEqual([]);
    expect(parseFioStatement({})).toEqual([]);
  });
});

describe("validateOrder", () => {
  const products = defaultSettings().products;
  const base = { productId: "portrait-basic", buyerName: " Petr ", buyerEmail: "Petr@Example.com", recipientName: "Jana", terms: true, locale: "cs" };

  it("accepts a minimal order and normalizes it", () => {
    const r = validateOrder(base, products, "2026-11-20");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.buyer).toEqual({ name: "Petr", email: "petr@example.com" });
      expect(r.value.recipient).toEqual({ name: "Jana" });
    }
  });
  it("rejects inactive products, bad e-mails and missing consent", () => {
    const r = validateOrder({ ...base, productId: "business-solo", buyerEmail: "nope", terms: false }, products, "2026-11-20");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toMatchObject({ productId: "required", buyerEmail: "email", terms: "required" });
  });
  it("validates the scheduled recipient e-mail", () => {
    const ok = validateOrder({ ...base, recipientEmail: "jana@example.com", sendOn: "2026-12-24" }, products, "2026-11-20");
    expect(ok.ok && ok.value.recipient).toEqual({ name: "Jana", email: "jana@example.com", sendOn: "2026-12-24" });
    const past = validateOrder({ ...base, recipientEmail: "jana@example.com", sendOn: "2026-11-19" }, products, "2026-11-20");
    expect(!past.ok && past.errors.sendOn).toBe("past");
  });
  it("limits the dedication and catches the honeypot", () => {
    const long = validateOrder({ ...base, dedication: "x".repeat(161) }, products, "2026-11-20");
    expect(!long.ok && long.errors.dedication).toBe("tooLong");
    const bot = validateOrder({ ...base, website: "http://spam" }, products, "2026-11-20");
    expect(!bot.ok && bot.errors.form).toBe("spam");
  });
});

describe("settings", () => {
  it("parses admin settings", () => {
    const parsed = parseSettings(defaultSettings());
    expect(typeof parsed).toBe("object");
  });
  it("rejects bad prices and duplicate ids", () => {
    const s = defaultSettings();
    expect(parseSettings({ ...s, products: [{ ...s.products[0], priceCzk: 10 }] })).toMatch(/cena/);
    expect(parseSettings({ ...s, products: [s.products[0], s.products[0]] })).toMatch(/duplicitní/);
    expect(parseSettings({ ...s, products: s.products.map((p) => ({ ...p, active: false })) })).toMatch(/aktivní/);
  });
  it("fills in defaults for partial KV data", () => {
    expect(normalizeSettings({ christmas: false }).products.length).toBeGreaterThan(0);
    expect(normalizeSettings({ christmas: false }).christmas).toBe(false);
  });
});
