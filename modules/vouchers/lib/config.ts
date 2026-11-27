import "server-only";
import { siteUrl, contactEmail } from "@/lib/config";

/** Bank details for the payment page, mail settings and the Fakturáček connection. */
export function voucherConfig() {
  return {
    iban: process.env.VOUCHER_IBAN ?? "",
    accountLabel: process.env.VOUCHER_ACCOUNT_LABEL ?? "",       // "2900000000/2010" — shown to people
    fioToken: process.env.FIO_API_TOKEN ?? "",
    resendKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.VOUCHER_FROM_EMAIL ?? "Guth Pictures <poukazy@guthpictures.eu>",
    notify: process.env.VOUCHER_NOTIFY_EMAIL ?? contactEmail,
    replyTo: contactEmail,
    // Name on the QR payment; invoices take the supplier details from Fakturáček's own settings.
    payeeName: process.env.BUSINESS_NAME ?? "Tomáš Guth Jarkovský",
    // Printed on the voucher. Base64 like RevealPhone, so the number isn't greppable in the repo.
    phone: process.env.VOUCHER_PHONE ?? Buffer.from("KzQyMDcyODExMzk2Ng==", "base64").toString(),
    fakturacekUrl: (process.env.FAKTURACEK_URL ?? "").replace(/\/+$/, ""),
    fakturacekToken: process.env.FAKTURACEK_API_TOKEN ?? "",
    siteUrl,
    secret: process.env.AUTH_SECRET ?? "",
  };
}

export function isPaymentConfigured(): boolean {
  const c = voucherConfig();
  return Boolean(c.iban && c.secret);
}

/** Days before an unpaid order gets a reminder / expires. */
export const REMINDER_AFTER_DAYS = 3;
export const EXPIRE_AFTER_DAYS = 10;
export const MAX_SEND_ATTEMPTS = 5;
/** Fakturáček retries: ~8 hours at a 10-minute cron; the owner hears about it after the 5th failure. */
export const MAX_INVOICE_ATTEMPTS = 50;
export const NOTIFY_INVOICE_AFTER = 5;

export function isFakturacekConfigured(): boolean {
  const c = voucherConfig();
  return Boolean(c.fakturacekUrl && c.fakturacekToken);
}
