import type { Locale, VoucherProduct } from "./types";

export type OrderInput = {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  dedication?: string;
  recipientEmail?: string;
  sendOn?: string;
  locale: Locale;
  terms: boolean;
  website?: string; // honeypot
};

export type ValidOrder = {
  product: VoucherProduct;
  locale: Locale;
  buyer: { name: string; email: string };
  recipient: { name: string; email?: string; sendOn?: string };
  dedication?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const DEDICATION_MAX = 160;
export const NAME_MAX = 60;

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/** Returns a clean order or a field → error-key map. `today` is YYYY-MM-DD in Prague. */
export function validateOrder(raw: unknown, products: VoucherProduct[], today: string): { ok: true; value: ValidOrder } | { ok: false; errors: Record<string, string> } {
  const b = (raw ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const locale: Locale = b.locale === "en" ? "en" : "cs";

  if (str(b.website)) return { ok: false, errors: { form: "spam" } };

  const product = products.find((p) => p.active && p.id === b.productId);
  if (!product) errors.productId = "required";

  const buyerName = str(b.buyerName);
  if (!buyerName) errors.buyerName = "required";
  else if (buyerName.length > NAME_MAX) errors.buyerName = "tooLong";

  const buyerEmail = str(b.buyerEmail).toLowerCase();
  if (!EMAIL_RE.test(buyerEmail) || buyerEmail.length > 120) errors.buyerEmail = "email";

  const recipientName = str(b.recipientName);
  if (!recipientName) errors.recipientName = "required";
  else if (recipientName.length > NAME_MAX) errors.recipientName = "tooLong";

  // Keep line breaks out — the dedication is set in two lines on the voucher.
  const dedication = str(b.dedication);
  if (dedication.length > DEDICATION_MAX) errors.dedication = "tooLong";

  const recipientEmail = str(b.recipientEmail).toLowerCase();
  const sendOn = str(b.sendOn);
  if (recipientEmail) {
    if (!EMAIL_RE.test(recipientEmail) || recipientEmail.length > 120) errors.recipientEmail = "email";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sendOn)) errors.sendOn = "required";
    else if (sendOn < today) errors.sendOn = "past";
    else if (sendOn > `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`) errors.sendOn = "tooFar";
  }

  if (b.terms !== true) errors.terms = "required";

  if (Object.keys(errors).length || !product) return { ok: false, errors };
  return {
    ok: true,
    value: {
      product,
      locale,
      buyer: { name: buyerName, email: buyerEmail },
      recipient: recipientEmail ? { name: recipientName, email: recipientEmail, sendOn } : { name: recipientName },
      dedication: dedication || undefined,
    },
  };
}
