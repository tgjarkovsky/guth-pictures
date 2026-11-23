import "server-only";
import { Resend } from "resend";
import { voucherConfig } from "./config";
import { formatCzk, formatDate } from "./dates";
import type { VoucherOrder } from "./types";

type Attachment = { filename: string; content: Uint8Array };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f0efeb;font-family:Helvetica,Arial,sans-serif;color:#11100e">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c93a2b">Guth Pictures</p>
${body}
<p style="margin:40px 0 0;font-size:12px;color:#6b625e">Guth Pictures · <a href="https://guthpictures.eu" style="color:#6b625e">guthpictures.eu</a></p>
</div></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${s}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#11100e;color:#f0efeb;padding:14px 22px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;
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

export async function sendVoucherToBuyer(order: VoucherOrder, token: string, voucherPdf: Uint8Array, giftLink: string, invoice?: { number: string; pdf: Uint8Array }): Promise<void> {
  const cs = order.locale === "cs";
  const html = layout(
    p(cs ? `Dobrý den, ${esc(order.buyer.name)},` : `Hi ${esc(order.buyer.name)},`) +
      p(cs
        ? `platba dorazila, děkuju! Dárkový poukaz pro ${esc(order.recipient.name)} je hotový. Můžete ho darovat dvěma způsoby:`
        : `your payment has arrived, thank you! The gift voucher for ${esc(order.recipient.name)} is ready. There are two ways to give it:`) +
      p(cs
        ? `<strong>Elektronicky:</strong> pošlete obdarovanému tento odkaz. Otevře se karta poukazu, kterou jde otočit, a rovnou z ní domluvit termín.`
        : `<strong>Electronically:</strong> send the recipient this link. It opens the voucher card, which they can turn over and book a date from.`) +
      button(giftLink, cs ? "Otevřít kartu poukazu" : "Open the voucher card") +
      p(`<a href="${esc(giftLink)}" style="color:#6b625e;word-break:break-all">${esc(giftLink)}</a>`) +
      p(cs
        ? `<strong>Vytištěný:</strong> PDF v příloze vytiskněte na A4 bez zmenšení, vystřihněte podle značek a přeložte. Vznikne karta velikosti pohlednice (A6).`
        : `<strong>Printed:</strong> print the attached PDF on A4 at 100 %, cut along the marks and fold. You get a postcard-sized card (A6).`) +
      table([
        [cs ? "Kód poukazu" : "Voucher code", order.code ?? ""],
        [cs ? "Platí do" : "Valid until", order.validUntil ? formatDate(order.validUntil, order.locale) : ""],
      ]) +
      p(invoice
        ? cs ? `Přikládám i fakturu ${esc(invoice.number)} (uhrazeno).` : `The paid invoice ${esc(invoice.number)} is attached too.`
        : cs ? "Fakturu vám pošlu zvlášť v dalším e-mailu." : "The invoice follows in a separate e-mail.") +
      p(cs
        ? "Obdarovaný si termín focení domluví přes QR kód na poukazu nebo odpovědí na tento e-mail."
        : "The recipient books a date via the QR code on the voucher or by replying to this e-mail.") +
      button(orderUrl(token, order.locale), cs ? "Stáhnout poukaz znovu" : "Download the voucher again"),
  );
  await send(order.buyer.email, cs ? `Váš dárkový poukaz ${order.code}` : `Your gift voucher ${order.code}`, html, [
    { filename: `darkovy-poukaz-${order.code}.pdf`, content: voucherPdf },
    ...(invoice ? [{ filename: `faktura-${invoice.number}.pdf`, content: invoice.pdf }] : []),
  ]);
}

/** Invoice on its own — when Fakturáček was down while the voucher went out. */
export async function sendInvoice(order: VoucherOrder, invoice: { number: string; pdf: Uint8Array }): Promise<void> {
  const cs = order.locale === "cs";
  const html = layout(
    p(cs ? `Dobrý den, ${esc(order.buyer.name)},` : `Hi ${esc(order.buyer.name)},`) +
      p(cs
        ? `v příloze posílám fakturu ${esc(invoice.number)} k dárkovému poukazu ${esc(order.code ?? "")}. Je uhrazená, nic neplaťte.`
        : `attached is invoice ${esc(invoice.number)} for gift voucher ${esc(order.code ?? "")}. It is already paid.`),
  );
  await send(order.buyer.email, cs ? `Faktura ${invoice.number} — dárkový poukaz` : `Invoice ${invoice.number} — gift voucher`, html, [
    { filename: `faktura-${invoice.number}.pdf`, content: invoice.pdf },
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
    `Obdarovaný: ${order.recipient.name}`,
    `VS ${order.vs}${order.code ? ` · kód ${order.code}` : ""}`,
  ];
}
