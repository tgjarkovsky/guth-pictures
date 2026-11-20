import "server-only";
import { siteUrl, contactEmail } from "@/lib/config";

/** Seller + bank details. Everything that ends up on the payment page and the receipt. */
export function voucherConfig() {
  return {
    iban: process.env.VOUCHER_IBAN ?? "",
    accountLabel: process.env.VOUCHER_ACCOUNT_LABEL ?? "",       // "2900000000/2010" — shown to people
    fioToken: process.env.FIO_API_TOKEN ?? "",
    resendKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.VOUCHER_FROM_EMAIL ?? "Guth Pictures <poukazy@guthpictures.eu>",
    notify: process.env.VOUCHER_NOTIFY_EMAIL ?? contactEmail,
    replyTo: contactEmail,
    seller: {
      name: process.env.BUSINESS_NAME ?? "Tomáš Guth Jarkovský",
      ico: process.env.BUSINESS_ICO ?? "01948253",
      address: process.env.BUSINESS_ADDRESS ?? "",
    },
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
