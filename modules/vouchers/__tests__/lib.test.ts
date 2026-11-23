import { describe, expect, it } from "vitest";
import { spayd, ibanToLocal } from "../lib/spayd";
import { generateVoucherCode, normalizeVoucherCode, formatVs } from "../lib/code";
import { addMonths, formatCzk, formatDate, pragueDate } from "../lib/dates";
import { parseFioStatement } from "../lib/fio";
import { validateOrder } from "../lib/validation";
import { parseSettings } from "../lib/settings-validation";
import { defaultStoredSettings, normalizeSettings } from "../lib/settings";
import { parsePriceCzk, productsFromPortraitPackages, voucherLineDetails } from "../lib/portrait-products";

// The live creative-portrait packages (admin → Texty → Služby → Portréty)
const portraitCs = [
  { id: "zakladni", name: "Základní", price: "2500", duration: "90 minut", includes: ["Standardní foto session", "Jedna lokace, jeden námět a úprava", "min. 5 upravených fotografií"] },
  { id: "deluxe", name: "Deluxe", price: "4 500 Kč", duration: "150-180 minut", includes: ["Půlden strávený společnou tvorbou.", "min. 15 upravených fotografií"] },
  { name: "Na míru", price: "na dotaz", duration: "", includes: [] },
];
const portraitEn = [
  { id: "zakladni", name: "Basic", price: "2500", duration: "90 minutes", includes: ["Standard session", "min. 5 edited photos"] },
  { id: "deluxe", name: "Deluxe", price: "4500", duration: "150–180 minutes", includes: ["min. 15 edited photos"] },
];

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
  it("formats the variable symbol", () => {
    expect(formatVs(12, 2026)).toBe("77260012");
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
  const products = productsFromPortraitPackages(portraitCs, portraitEn);
  const base = { productId: "portrait-zakladni", buyerName: " Petr ", buyerEmail: "Petr@Example.com", recipientName: "Jana", terms: true, locale: "cs" };

  it("accepts a minimal order and normalizes it", () => {
    const r = validateOrder(base, products);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.buyer).toEqual({ name: "Petr", email: "petr@example.com" });
      expect(r.value.recipient).toEqual({ name: "Jana" });
    }
  });
  it("rejects inactive products, bad e-mails and missing consent", () => {
    const r = validateOrder({ ...base, productId: "portrait-neexistuje", buyerEmail: "nope", terms: false }, products);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toMatchObject({ productId: "package", buyerEmail: "email", terms: "terms" });
  });
  it("ignores any recipient e-mail fields — the buyer passes the voucher on", () => {
    const r = validateOrder({ ...base, recipientEmail: "jana@example.com", sendOn: "2026-12-24" }, products);
    expect(r.ok && r.value.recipient).toEqual({ name: "Jana" });
  });
  it("limits the dedication and catches the honeypot", () => {
    const long = validateOrder({ ...base, dedication: "x".repeat(161) }, products);
    expect(!long.ok && long.errors.dedication).toBe("tooLong");
    const bot = validateOrder({ ...base, website: "http://spam" }, products);
    expect(!bot.ok && bot.errors.form).toBe("spam");
  });
});

describe("settings", () => {
  it("parses admin settings and ignores packages", () => {
    expect(parseSettings({ ...defaultStoredSettings(), products: [{ id: "x" }] })).toEqual(defaultStoredSettings());
  });
  it("rejects bad values", () => {
    expect(parseSettings({ ...defaultStoredSettings(), validityMonths: 0 })).toMatch(/Platnost/);
  });
  it("fills in defaults for partial KV data", () => {
    expect(normalizeSettings({ christmas: false })).toEqual({ ...defaultStoredSettings(), christmas: false });
  });
});

describe("packages from the creative portrait", () => {
  it("parses prices", () => {
    expect(parsePriceCzk("2500")).toBe(2500);
    expect(parsePriceCzk("4 500 Kč")).toBe(4500);
    expect(parsePriceCzk("od 2\u00a0500 Kč")).toBe(2500);
    expect(parsePriceCzk("na dotaz")).toBeNull();
  });
  it("sells exactly the portrait packages with a price", () => {
    const p = productsFromPortraitPackages(portraitCs, portraitEn);
    expect(p.map((x) => [x.id, x.name.cs, x.name.en, x.priceCzk])).toEqual([
      ["portrait-zakladni", "Kreativní portrét — Základní", "Creative portrait — Basic", 2500],
      ["portrait-deluxe", "Kreativní portrét — Deluxe", "Creative portrait — Deluxe", 4500],
    ]);
    expect(p[0].details.cs[0]).toBe("90 minut");
    expect(p.map((x) => x.featured)).toEqual([false, true]); // Deluxe by default
  });
  it("keeps product ids stable when package ids are regenerated", () => {
    const a = productsFromPortraitPackages(portraitCs.map((x) => ({ ...x, id: "random-1" })), []);
    const b = productsFromPortraitPackages(portraitCs.map((x) => ({ ...x, id: "random-2" })), []);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });
  it("keeps the voucher line short", () => {
    expect(voucherLineDetails(["90 minut", "Standardní foto session", "Jedna lokace, jeden námět a úprava", "min. 5 upravených fotografií"]))
      .toEqual(["90 minut", "min. 5 upravených fotografií"]);
    expect(voucherLineDetails(["2 hod", "online galerie", "Dlouhý popis, který se na poukaz nevejde"])).toEqual(["2 hod", "online galerie"]);
  });
});

describe("featuredInMiddle", () => {
  it("moves the highlighted package to the middle", async () => {
    const { featuredInMiddle } = await import("../lib/portrait-products");
    const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
    type P = { id: string; featured?: boolean };
    const run = (xs: P[]) => ids(featuredInMiddle<P>(xs));
    expect(run([{ id: "s" }, { id: "r" }, { id: "d", featured: true }])).toEqual(["s", "d", "r"]);
    expect(run([{ id: "s" }, { id: "r" }, { id: "d" }])).toEqual(["s", "r", "d"]);
    expect(run([{ id: "s" }, { id: "d", featured: true }])).toEqual(["s", "d"]);
  });
});
