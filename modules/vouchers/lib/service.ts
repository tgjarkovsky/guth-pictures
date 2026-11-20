import "server-only";
import { signPayload, verifyPayload } from "@/lib/hmac-token";
import { generateVoucherCode } from "./code";
import { EXPIRE_AFTER_DAYS, MAX_SEND_ATTEMPTS, REMINDER_AFTER_DAYS, voucherConfig } from "./config";
import { addMonths, daysBetween, formatDate, pragueDate } from "./dates";
import { notifyOwner, ownerSummary, sendReminder, sendVoucherToBuyer, sendVoucherToRecipient } from "./email";
import { fetchIncomingPayments, type IncomingPayment } from "./fio";
import { renderReceiptPdf } from "./receipt";
import { qrDataUri, renderVoucherPdf } from "./render";
import { getVoucherSettings, voucherPhotoSrc } from "./settings";
import { acquireLock, findOrderByVs, isCodeTaken, listOrders, nextDocNumber, releaseLock, saveOrder } from "./store";
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

// ── PDFs ─────────────────────────────────────────────────────────────────────
export function bookingUrl(order: Pick<VoucherOrder, "locale" | "code">): string {
  return `${voucherConfig().siteUrl}/${order.locale}/darkovy-poukaz/uplatnit?kod=${order.code}`;
}

export async function buildVoucherPdf(order: VoucherOrder): Promise<Uint8Array> {
  if (!order.code || !order.validUntil) throw new Error("Voucher is not issued yet");
  const settings = await getVoucherSettings();
  const host = new URL(voucherConfig().siteUrl).host.replace(/^www\./, "");
  return renderVoucherPdf(
    {
      locale: order.locale,
      packageName: order.product.name,
      packageDetails: order.product.details,
      recipientName: order.recipient.name,
      dedication: order.dedication,
      code: order.code,
      validUntil: formatDate(order.validUntil, order.locale),
      photoSrc: voucherPhotoSrc(settings.photoPublicId),
      qrSrc: await qrDataUri(bookingUrl(order)),
      bookingUrlLabel: `${host}/poukaz`,
      christmas: order.christmas,
    },
    order.locale === "cs" ? `Dárkový poukaz ${order.code}` : `Gift voucher ${order.code}`,
  );
}

export function buildReceiptPdf(order: VoucherOrder): Promise<Uint8Array> {
  return renderReceiptPdf(order, voucherConfig().seller);
}

// ── state transitions ────────────────────────────────────────────────────────
async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateVoucherCode();
    if (!(await isCodeTaken(code))) return code;
  }
  throw new Error("Could not generate a unique voucher code");
}

/** pending → paid. Assigns code, validity and receipt number. Idempotent. */
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
  order.docNumber = await nextDocNumber(at);
  await saveOrder(order);
  return order;
}

/** Sends whatever this paid order still owes: buyer e-mail, then the scheduled recipient e-mail. */
export async function deliver(order: VoucherOrder, now = new Date()): Promise<VoucherOrder> {
  if (order.status !== "paid" && order.status !== "redeemed") return order;
  const needsBuyer = !order.sentToBuyerAt;
  const needsRecipient = Boolean(order.recipient.email && order.recipient.sendOn && !order.sentToRecipientAt && order.recipient.sendOn <= pragueDate(now));
  if (!needsBuyer && !needsRecipient) return order;
  if ((order.sendAttempts ?? 0) >= MAX_SEND_ATTEMPTS) return order;

  try {
    const voucherPdf = await buildVoucherPdf(order);
    if (needsBuyer) {
      await sendVoucherToBuyer(order, await orderToken(order.id), voucherPdf, await buildReceiptPdf(order));
      order.sentToBuyerAt = now.toISOString();
    }
    if (needsRecipient) {
      await sendVoucherToRecipient(order, voucherPdf);
      order.sentToRecipientAt = now.toISOString();
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
    await markPaid(order, { amount: payment.amount, ref: `fio:${payment.id}` });
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
          const before = `${order.sentToBuyerAt}|${order.sentToRecipientAt}`;
          const after = await deliver(order, now);
          if (`${after.sentToBuyerAt}|${after.sentToRecipientAt}` !== before) report.delivered++;
          if (after.lastError) report.errors.push(`${order.vs}: ${after.lastError}`);
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
