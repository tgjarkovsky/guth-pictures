import "server-only";
import { Resend } from "resend";
import { voucherConfig } from "./config";
import { formatCzk, formatDate } from "./dates";
import type { VoucherOrder } from "./types";

type Attachment = { filename: string; content: Uint8Array };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Helvetica,Arial,sans-serif;color:#11100e">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b87333">Guth Pictures</p>
${body}
<p style="margin:40px 0 0;font-size:12px;color:#6b625e">Guth Pictures · <a href="https://guthpictures.eu" style="color:#6b625e">guthpictures.eu</a></p>
</div></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${s}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#11100e;color:#f4f1ea;padding:14px 22px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;
const table = (rows: [string, string][]) =>
  `<table style="border-collapse:collapse;margin:8px 0 20px;font-size:15px">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 24px 6px 0;color:#6b625e">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>`;

async function send(to: string, subject: string, html: string, attachments: Attachment[] = []): Promise<void> {
  const c = voucherConfig();
  if (!c.resendKey) throw new Error("RESEND_API_KEY není nastavený");
  const resend = new Resend(c.resendKey);
  const { error } = await resend.emails.send({
    from: c.from,
    to,
    replyTo: c.replyTo,
    subject,
    html,
    attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content) })),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export function orderUrl(token: string, locale: string): string {
  return `${voucherConfig().siteUrl}/${locale}/darkovy-poukaz/objednavka/${token}`;
}

export async function sendPaymentInstructions(order: VoucherOrder, token: string): Promise<void> {
  const c = voucherConfig();
  const cs = order.locale === "cs";
  const amount = formatCzk(order.product.priceCzk, order.locale);
  const html = layout(
    (cs
      ? p(`Dobrý den, ${esc(order.buyer.name)},`) +
        p(`děkuju za objednávku dárkového poukazu <strong>${esc(order.product.name)}</strong> pro ${esc(order.recipient.name)}. Jakmile platba dorazí, pošlu vám poukaz v PDF automaticky e-mailem (obvykle do 15 minut).`)
      : p(`Hi ${esc(order.buyer.name)},`) +
        p(`thank you for ordering the gift voucher <strong>${esc(order.product.name)}</strong> for ${esc(order.recipient.name)}. As soon as the payment arrives, the PDF voucher is e-mailed to you automatically (usually within 15 minutes).`)) +
      table([
        [cs ? "Částka" : "Amount", amount],
        [cs ? "Číslo účtu" : "Account", c.accountLabel],
        ["IBAN", c.iban],
        [cs ? "Variabilní symbol" : "Variable symbol", order.vs],
      ]) +
      p(cs ? "Nejrychlejší je naskenovat QR kód na stránce objednávky v bankovní aplikaci:" : "The quickest way is to scan the QR code on your order page in your banking app:") +
      button(orderUrl(token, order.locale), cs ? "Zobrazit QR platbu" : "Show QR payment") +
      p(cs ? `Bez platby objednávka po ${10} dnech zanikne. Kdybyste cokoli potřebovali, stačí odpovědět na tento e-mail.` : `Unpaid orders expire after 10 days. Just reply to this e-mail if you need anything.`),
  );
  await send(order.buyer.email, cs ? `Pokyny k platbě — dárkový poukaz (VS ${order.vs})` : `Payment details — gift voucher (VS ${order.vs})`, html);
}

export async function sendReminder(order: VoucherOrder, token: string): Promise<void> {
  const cs = order.locale === "cs";
  const html = layout(
    p(cs ? `Dobrý den, ${esc(order.buyer.name)},` : `Hi ${esc(order.buyer.name)},`) +
      p(cs
        ? `jen připomínám objednaný dárkový poukaz <strong>${esc(order.product.name)}</strong> — platbu (VS ${order.vs}) jsem zatím neviděl. Pokud už je na cestě, tento e-mail ignorujte.`
        : `just a reminder about your gift voucher <strong>${esc(order.product.name)}</strong> — I haven't seen the payment (VS ${order.vs}) yet. If it's on its way, please ignore this e-mail.`) +
      button(orderUrl(token, order.locale), cs ? "Platební údaje a QR kód" : "Payment details and QR code"),
  );
  await send(order.buyer.email, cs ? "Připomínka platby — dárkový poukaz" : "Payment reminder — gift voucher", html);
}

export async function sendVoucherToBuyer(order: VoucherOrder, token: string, voucherPdf: Uint8Array, receiptPdf: Uint8Array): Promise<void> {
  const cs = order.locale === "cs";
  const scheduled = order.recipient.email && order.recipient.sendOn;
  const html = layout(
    p(cs ? `Dobrý den, ${esc(order.buyer.name)},` : `Hi ${esc(order.buyer.name)},`) +
      p(cs
        ? `platba dorazila, děkuju! V příloze je <strong>dárkový poukaz</strong> pro ${esc(order.recipient.name)} (PDF, formát A5 — můžete ho vytisknout nebo rovnou přeposlat) a doklad o zaplacení.`
        : `your payment has arrived, thank you! Attached is the <strong>gift voucher</strong> for ${esc(order.recipient.name)} (PDF, A5 — print it or forward it) and your payment receipt.`) +
      table([
        [cs ? "Kód poukazu" : "Voucher code", order.code ?? ""],
        [cs ? "Platí do" : "Valid until", order.validUntil ? formatDate(order.validUntil, order.locale) : ""],
      ]) +
      (scheduled
        ? p(cs
            ? `Poukaz zároveň pošlu obdarovanému na ${esc(order.recipient.email!)} dne ${formatDate(order.recipient.sendOn!, "cs")} ráno.`
            : `I'll also e-mail the voucher to ${esc(order.recipient.email!)} on ${formatDate(order.recipient.sendOn!, "en")} in the morning.`)
        : "") +
      p(cs
        ? "Obdarovaný si termín focení domluví přes QR kód na poukazu nebo odpovědí na tento e-mail."
        : "The recipient books a date via the QR code on the voucher or by replying to this e-mail.") +
      button(orderUrl(token, order.locale), cs ? "Stáhnout poukaz znovu" : "Download the voucher again"),
  );
  await send(order.buyer.email, cs ? `Váš dárkový poukaz ${order.code}` : `Your gift voucher ${order.code}`, html, [
    { filename: `darkovy-poukaz-${order.code}.pdf`, content: voucherPdf },
    { filename: `doklad-${order.docNumber}.pdf`, content: receiptPdf },
  ]);
}

export async function sendVoucherToRecipient(order: VoucherOrder, voucherPdf: Uint8Array): Promise<void> {
  const cs = order.locale === "cs";
  const html = layout(
    p(cs ? `Ahoj ${esc(order.recipient.name)},` : `Hi ${esc(order.recipient.name)},`) +
      p(cs
        ? `${esc(order.buyer.name)} ti daroval(a) <strong>${esc(order.product.name)}</strong>. Poukaz najdeš v příloze.`
        : `${esc(order.buyer.name)} has given you <strong>${esc(order.product.name)}</strong>. The voucher is attached.`) +
      (order.dedication ? `<blockquote style="margin:0 0 20px;padding:0 0 0 16px;border-left:2px solid #b87333;font-style:italic;color:#4a4340">${esc(order.dedication)}</blockquote>` : "") +
      p(cs
        ? `Až budeš chtít vybrat termín, klikni níže nebo mi napiš. Poukaz platí do ${order.validUntil ? formatDate(order.validUntil, "cs") : ""}.`
        : `Whenever you want to pick a date, click below or write to me. The voucher is valid until ${order.validUntil ? formatDate(order.validUntil, "en") : ""}.`) +
      button(`${voucherConfig().siteUrl}/${order.locale}/darkovy-poukaz/uplatnit?kod=${order.code}`, cs ? "Domluvit termín focení" : "Book the session"),
  );
  await send(order.recipient.email!, cs ? "Máš dárkový poukaz na focení 🎁" : "You've got a photo session gift 🎁", html, [
    { filename: `darkovy-poukaz-${order.code}.pdf`, content: voucherPdf },
  ]);
}

export async function notifyOwner(subject: string, lines: string[]): Promise<void> {
  const c = voucherConfig();
  await send(c.notify, subject, layout(lines.map((l) => p(esc(l))).join("") + button(`${c.siteUrl}/admin/poukazy`, "Otevřít admin")));
}

export function ownerSummary(order: VoucherOrder): string[] {
  return [
    `${order.product.name} — ${formatCzk(order.product.priceCzk, "cs")}`,
    `Kupující: ${order.buyer.name} <${order.buyer.email}>`,
    `Obdarovaný: ${order.recipient.name}${order.recipient.email ? ` <${order.recipient.email}>, poslat ${order.recipient.sendOn}` : ""}`,
    `VS ${order.vs}${order.code ? ` · kód ${order.code}` : ""}`,
  ];
}
