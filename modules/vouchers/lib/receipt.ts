import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatCzk, formatDate } from "./dates";
import type { VoucherOrder } from "./types";

const FONT_DIR = path.join(process.cwd(), "modules/vouchers/fonts");

export type Seller = { name: string; ico: string; address: string };

const ink = rgb(0.07, 0.06, 0.055);
const muted = rgb(0.42, 0.38, 0.36);
const copper = rgb(0.72, 0.45, 0.2);

/**
 * "Doklad o přijetí platby" for a non-VAT payer (neplátce DPH): seller, number,
 * date of payment, item and amount. Text stays selectable for bookkeeping.
 */
export async function renderReceiptPdf(order: VoucherOrder, seller: Seller): Promise<Uint8Array> {
  if (!order.docNumber || !order.paidAt) throw new Error("Receipt needs docNumber and paidAt");
  const cs = order.locale === "cs";
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(await readFile(path.join(FONT_DIR, "Epilogue-Regular.ttf")), { subset: true });
  const bold = await pdf.embedFont(await readFile(path.join(FONT_DIR, "Epilogue-SemiBold.ttf")), { subset: true });
  const title = cs ? "Doklad o přijetí platby" : "Payment receipt";
  pdf.setTitle(`${title} ${order.docNumber}`);
  pdf.setAuthor(seller.name);

  const page = pdf.addPage([595.28, 841.89]); // A4
  const left = 64;
  let y = 770;
  const text = (s: string, opts: { x?: number; size?: number; font?: typeof regular; color?: typeof ink } = {}) =>
    page.drawText(s, { x: opts.x ?? left, y, size: opts.size ?? 11, font: opts.font ?? regular, color: opts.color ?? ink });

  text("GUTH PICTURES", { size: 9, color: copper, font: bold });
  y -= 34;
  text(title, { size: 24, font: bold });
  y -= 22;
  text(`${cs ? "Číslo dokladu" : "Number"}: ${order.docNumber}`, { color: muted });
  y -= 50;

  const paid = order.paidAt.slice(0, 10);
  const rows: [string, string][] = [
    [cs ? "Prodávající" : "Seller", seller.name],
    ["IČO", seller.ico],
    ...(seller.address ? [[cs ? "Sídlo" : "Address", seller.address] as [string, string]] : []),
    ["", cs ? "Nejsem plátce DPH." : "Not a VAT payer."],
    ["", ""],
    [cs ? "Kupující" : "Buyer", order.buyer.name],
    ["E-mail", order.buyer.email],
    ["", ""],
    [cs ? "Datum přijetí platby" : "Payment received", formatDate(paid, order.locale)],
    [cs ? "Způsob úhrady" : "Payment method", cs ? "bankovní převod" : "bank transfer"],
    [cs ? "Variabilní symbol" : "Variable symbol", order.vs],
  ];
  for (const [label, value] of rows) {
    if (label) text(label, { color: muted, size: 10 });
    if (value) text(value, { x: left + 150 });
    y -= 20;
  }

  y -= 24;
  page.drawLine({ start: { x: left, y: y + 14 }, end: { x: 531, y: y + 14 }, thickness: 0.6, color: muted });
  text(cs ? "Položka" : "Item", { color: muted, size: 10 });
  text(cs ? "Cena" : "Price", { x: 470, color: muted, size: 10 });
  y -= 24;
  text(`${cs ? "Dárkový poukaz" : "Gift voucher"}: ${order.product.name}`);
  text(formatCzk(order.product.priceCzk, order.locale), { x: 470 });
  y -= 16;
  if (order.code) {
    text(`${cs ? "Kód poukazu" : "Voucher code"} ${order.code}${order.validUntil ? ` · ${cs ? "platí do" : "valid until"} ${formatDate(order.validUntil, order.locale)}` : ""}`, { size: 9, color: muted });
    y -= 16;
  }
  y -= 14;
  page.drawLine({ start: { x: left, y: y + 14 }, end: { x: 531, y: y + 14 }, thickness: 0.6, color: muted });
  text(cs ? "Celkem uhrazeno" : "Total paid", { font: bold });
  text(formatCzk(order.paidAmount ?? order.product.priceCzk, order.locale), { x: 470, font: bold });

  y = 90;
  text(cs ? "Doklad byl vystaven elektronicky a je platný bez podpisu." : "This receipt was issued electronically and is valid without a signature.", { size: 9, color: muted });
  y -= 14;
  text("guthpictures.eu", { size: 9, color: muted });

  return pdf.save();
}
