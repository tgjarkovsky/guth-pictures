import type { VoucherTheme } from "./design";

export type Locale = "cs" | "en";
export type Localized<T> = { cs: T; en: T };

export type VoucherProduct = {
  id: string;
  name: Localized<string>;      // "Kreativní portrét — Základ"
  priceCzk: number;
  details: Localized<string[]>; // ["1,5 hod", "7 upravených fotek", "online galerie"]
  active: boolean;
  featured?: boolean;
};

/** A portfolio photo (Cloudinary public id) chosen in the admin for one card design; x/y = crop focus in %. */
export type ThemePhoto = { publicId: string; x: number; y: number };

export type VoucherSettings = {
  enabled: boolean;             // hides the shop when false
  christmas: boolean;           // seasonal artwork + copy
  validityMonths: number;
  themePhotos: Partial<Record<VoucherTheme, ThemePhoto>>; // missing theme = the bundled photo in modules/vouchers/photos
  products: VoucherProduct[];
};

export type OrderStatus = "pending" | "paid" | "redeemed" | "expired" | "cancelled";

export type VoucherOrder = {
  id: string;
  vs: string;                   // variabilní symbol
  locale: Locale;
  status: OrderStatus;
  createdAt: string;
  product: { id: string; name: string; details: string[]; priceCzk: number; featured?: boolean };
  buyer: { name: string; email: string };
  recipient: { name: string };
  dedication?: string;
  christmas: boolean;
  theme?: VoucherTheme;         // photo + accent the buyer picked; default follows the package

  // payment
  paidAt?: string;
  paidAmount?: number;
  paymentRef?: string;          // Fio transaction id or "manual"
  paymentIssue?: string;        // e.g. underpaid — shown in admin

  // fulfilment
  code?: string;
  validUntil?: string;          // YYYY-MM-DD
  sentToBuyerAt?: string;
  sendAttempts?: number;
  lastError?: string;

  // invoice from Fakturáček (externalRef voucher:<id>)
  invoiceNumber?: string;
  invoiceSentAt?: string;       // e-mailed to the buyer (with the voucher, or later on its own)
  invoiceAttempts?: number;
  invoiceError?: string;
  reminderSentAt?: string;
  redeemedAt?: string;
  cancelledAt?: string;
  adminNote?: string;
};
