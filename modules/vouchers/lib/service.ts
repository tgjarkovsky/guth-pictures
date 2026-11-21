import "server-only";
import { signPayload, verifyPayload } from "@/lib/hmac-token";
import { generateVoucherCode } from "./code";
import {
  EXPIRE_AFTER_DAYS,
  MAX_INVOICE_ATTEMPTS,
  MAX_SEND_ATTEMPTS,
  NOTIFY_INVOICE_AFTER,
  REMINDER_AFTER_DAYS,
  isFakturacekConfigured,
  voucherConfig,
} from "./config";
import { addMonths, daysBetween, formatDate, pragueDate } from "./dates";
import { notifyOwner, ownerSummary, sendInvoice, sendReminder, sendVoucherToBuyer } from "./email";
import { createVoucherInvoice, fetchVoucherInvoicePdf } from "./fakturacek";
import { fetchIncomingPayments, type IncomingPayment } from "./fio";
import { themeForProduct } from "./design";
import { qrDataUri, renderVoucherPdf, type VoucherCardInput } from "./render";
import { voucherLineDetails } from "./portrait-products";
import { getVoucherSettings } from "./settings";
import { acquireLock, findOrderByVs, isCodeTaken, listOrders, releaseLock, saveOrder } from "./store";
import type { VoucherOrder } from "./types";

// ── order links ──────────────────────────────────────────────────────────────
const TOKEN_PREFIX = "voucher-order:";

export function orderToken(id: string): Promise<string> {
  return signPayload(`${TOKEN_PREFIX}${id}`, voucherConfig().secret).then((t) => t.slice(TOKEN_PREFIX.length));
}

export async function orderIdFromToken(token: string): Promise<string | null> {
  if (!/^[0-9a-f]{18}\.[\w-]+$/.test(token)) return null;
  const payload = await verifyPayload(`${TOKEN_PREFIX}${token}`, voucherConfig().secret);
  return payload ? payload.slice(TOKEN_PREFIX.length) : null;
}

// Gift link — what the buyer shares with the recipient. Separate prefix, so it can't open the order page.
const GIFT_PREFIX = "voucher-gift:";

export function giftToken(id: string): Promise<string> {
  return signPayload(`${GIFT_PREFIX}${id}`, voucherConfig().secret).then((t) => t.slice(GIFT_PREFIX.length));
}

export async function orderIdFromGiftToken(token: string): Promise<string | null> {
  if (!/^[0-9a-f]{18}\.[\w-]+$/.test(token)) return null;
  const payload = await verifyPayload(`${GIFT_PREFIX}${token}`, voucherConfig().secret);
  return payload ? payload.slice(GIFT_PREFIX.length) : null;
}

export async function giftUrl(order: Pick<VoucherOrder, "id" | "locale">): Promise<string> {
  return `${voucherConfig().siteUrl}/${order.locale}/darkovy-poukaz/darek/${await giftToken(order.id)}`;
}

// ── PDFs ─────────────────────────────────────────────────────────────────────
export function bookingUrl(order: Pick<VoucherOrder, "locale" | "code">): string {
  return `${voucherConfig().siteUrl}/${order.locale}/darkovy-poukaz/uplatnit?kod=${order.code}`;
}

export function bookingHostLabel(): string {
  return `${new URL(voucherConfig().siteUrl).host.replace(/^www\./, "")}/poukaz`;
}

/** Everything the card needs, from an issued order. */
export async function voucherCard(order: VoucherOrder): Promise<VoucherCardInput> {
  if (!order.code || !order.validUntil) throw new Error("Voucher is not issued yet");
  return {
    locale: order.locale,
    theme: themeForProduct(order.product.id),
    packageName: order.product.name,
    packageDetails: voucherLineDetails(order.product.details),
    recipientName: order.recipient.name,
    dedication: order.dedication,
    code: order.code,
    validUntil: formatDate(order.validUntil, order.locale),
    qrSrc: await qrDataUri(bookingUrl(order)),
    bookingUrlLabel: bookingHostLabel(),
  };
}

export async function buildVoucherPdf(order: VoucherOrder): Promise<Uint8Array> {
  return renderVoucherPdf(
    await voucherCard(order),
    order.locale === "cs" ? `Dárkový poukaz ${order.code}` : `Gift voucher ${order.code}`,
  );
}

export function getInvoicePdf(order: VoucherOrder): Promise<Uint8Array> {
  if (!order.invoiceNumber) throw new Error("Faktura ještě nebyla vystavena");
  return fetchVoucherInvoicePdf(order);
}

// ── state transitions ────────────────────────────────────────────────────────
async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateVoucherCode();
    if (!(await isCodeTaken(code))) return code;
  }
  throw new Error("Could not generate a unique voucher code");
}

/** pending → paid. Assigns code and validity. Idempotent. */
export async function markPaid(order: VoucherOrder, payment: { amount: number; ref: string; at?: Date }): Promise<VoucherOrder> {
  if (order.status !== "pending") return order;
  const settings = await getVoucherSettings();
  const at = payment.at ?? new Date();
  order.status = "paid";
  order.paidAt = at.toISOString();
  order.paidAmount = payment.amount;
  order.paymentRef = payment.ref;
  order.paymentIssue = undefined;
  order.code = await uniqueCode();
  order.validUntil = addMonths(pragueDate(at), settings.validityMonths);
  await saveOrder(order);
  return order;
}

/** Issues the invoice in Fakturáček. Failures are recorded on the order and retried by the next run. */
async function issueInvoice(order: VoucherOrder): Promise<{ number: string; pdf: Uint8Array } | undefined> {
  if (!isFakturacekConfigured() || (order.invoiceAttempts ?? 0) >= MAX_INVOICE_ATTEMPTS) return undefined;
  try {
    const invoice = await createVoucherInvoice(order);
    order.invoiceNumber = invoice.number;
    order.invoiceError = undefined;
    order.invoiceAttempts = 0;
    return invoice;
  } catch (err) {
    order.invoiceAttempts = (order.invoiceAttempts ?? 0) + 1;
    order.invoiceError = err instanceof Error ? err.message : String(err);
    console.error(`[vouchers] invoice for ${order.id} failed:`, err);
    if (order.invoiceAttempts === NOTIFY_INVOICE_AFTER) {
      await notifyOwner(`⚠️ Fakturu k poukazu ${order.code} se nedaří vystavit`, [...ownerSummary(order), `Chyba: ${order.invoiceError}`, "Poukaz zákazníkovi odešel, faktura se zkouší dál."]).catch(() => {});
    }
    return undefined;
  }
}

/**
 * Sends whatever this paid order still owes the buyer: the voucher (with the invoice when
 * Fakturáček answers) and, if the invoice was late, the invoice on its own. The voucher never
 * waits for the invoice.
 */
export async function deliver(order: VoucherOrder, now = new Date()): Promise<VoucherOrder> {
  if (order.status !== "paid" && order.status !== "redeemed") return order;
  const needsVoucher = !order.sentToBuyerAt;
  const needsInvoice = !order.invoiceSentAt;
  if (!needsVoucher && !needsInvoice) return order;
  if (needsVoucher && (order.sendAttempts ?? 0) >= MAX_SEND_ATTEMPTS) return order;

  const invoice = needsInvoice ? await issueInvoice(order) : undefined;
  try {
    if (needsVoucher) {
      await sendVoucherToBuyer(order, await orderToken(order.id), await buildVoucherPdf(order), await giftUrl(order), invoice);
      order.sentToBuyerAt = now.toISOString();
      if (invoice) order.invoiceSentAt = now.toISOString();
    } else if (invoice) {
      await sendInvoice(order, invoice);
      order.invoiceSentAt = now.toISOString();
    }
    order.lastError = undefined;
    order.sendAttempts = 0;
  } catch (err) {
    order.sendAttempts = (order.sendAttempts ?? 0) + 1;
    order.lastError = err instanceof Error ? err.message : String(err);
    console.error(`[vouchers] delivery of ${order.id} failed:`, err);
    if (order.sendAttempts >= MAX_SEND_ATTEMPTS) {
      await notifyOwner(`⚠️ Poukaz ${order.code} se nepodařilo odeslat`, [...ownerSummary(order), `Chyba: ${order.lastError}`]).catch(() => {});
    }
  }
  await saveOrder(order);
  return order;
}

export type PaymentMatch = { payment: IncomingPayment; order: VoucherOrder; result: "paid" | "underpaid" | "ignored" };

/** Matches incoming payments to pending orders by VS. */
export async function applyPayments(payments: IncomingPayment[]): Promise<PaymentMatch[]> {
  const matches: PaymentMatch[] = [];
  for (const payment of payments) {
    const order = await findOrderByVs(payment.vs);
    if (!order) continue;
    if (order.status !== "pending" && order.status !== "expired") {
      matches.push({ payment, order, result: "ignored" });
      continue;
    }
    if (payment.amount + 0.001 < order.product.priceCzk) {
      const issue = `Přišlo ${payment.amount} Kč z ${order.product.priceCzk} Kč (platba ${payment.id})`;
      if (order.paymentIssue !== issue) {
        order.paymentIssue = issue;
        await saveOrder(order);
        await notifyOwner(`⚠️ Nedoplatek u poukazu VS ${order.vs}`, [...ownerSummary(order), issue]).catch(() => {});
      }
      matches.push({ payment, order, result: "underpaid" });
      continue;
    }
    // A late payment revives an expired order — the money is there, the customer gets the voucher.
    if (order.status === "expired") order.status = "pending";
    // Paid on the day the money reached the account (drives validity and the invoice date).
    await markPaid(order, { amount: payment.amount, ref: `fio:${payment.id}`, at: /^\d{4}-\d{2}-\d{2}$/.test(payment.date) ? new Date(`${payment.date}T12:00:00Z`) : undefined });
    await notifyOwner(`🎁 Prodán poukaz ${order.code}`, ownerSummary(order)).catch(() => {});
    matches.push({ payment, order, result: "paid" });
  }
  return matches;
}

export type RunReport = { checkedPayments: number; paid: number; delivered: number; reminded: number; expired: number; errors: string[]; skipped?: string };

/** The whole automation in one idempotent pass — called by cron and by the admin button. */
export async function runVoucherJobs(now = new Date()): Promise<RunReport> {
  const report: RunReport = { checkedPayments: 0, paid: 0, delivered: 0, reminded: 0, expired: 0, errors: [] };
  if (!(await acquireLock())) return { ...report, skipped: "Jiná kontrola právě běží" };
  try {
    const { fioToken } = voucherConfig();
    if (fioToken) {
      try {
        const payments = await fetchIncomingPayments(fioToken, 21, now);
        report.checkedPayments = payments.length;
        report.paid = (await applyPayments(payments)).filter((m) => m.result === "paid").length;
      } catch (err) {
        report.errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    for (const order of await listOrders()) {
      try {
        if (order.status === "pending") {
          const age = daysBetween(order.createdAt, now);
          if (age >= EXPIRE_AFTER_DAYS) {
            order.status = "expired";
            await saveOrder(order);
            report.expired++;
          } else if (age >= REMINDER_AFTER_DAYS && !order.reminderSentAt) {
            await sendReminder(order, await orderToken(order.id));
            order.reminderSentAt = now.toISOString();
            await saveOrder(order);
            report.reminded++;
          }
        } else if (order.status === "paid" || order.status === "redeemed") {
          const before = `${order.sentToBuyerAt}|${order.invoiceSentAt}`;
          const after = await deliver(order, now);
          if (`${after.sentToBuyerAt}|${after.invoiceSentAt}` !== before) report.delivered++;
          if (after.lastError) report.errors.push(`${order.vs}: ${after.lastError}`);
          if (after.invoiceError) report.errors.push(`${order.vs}: ${after.invoiceError}`);
        }
      } catch (err) {
        report.errors.push(`${order.vs}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } finally {
    await releaseLock();
  }
  return report;
}
