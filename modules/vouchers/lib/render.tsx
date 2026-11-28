import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import { voucherConfig } from "./config";
import { getVoucherSettings } from "./settings";
import { CARD, CREAM, CardBack, CardFront, HINT, INK, PrintHint, type CardProps, type VoucherContact, type VoucherTheme } from "./design";

// next.config.ts traces these folders into the serverless bundle.
const FONT_DIR = path.join(process.cwd(), "modules/vouchers/fonts");
const PHOTO_DIR = path.join(process.cwd(), "modules/vouchers/photos");

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 800; style: "normal" | "italic" };
let fontsPromise: Promise<FontSpec[]> | null = null;

const toArrayBuffer = (buf: Buffer) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

export function loadFonts(): Promise<FontSpec[]> {
  fontsPromise ??= (async () => {
    const file = async (f: string) => toArrayBuffer(await readFile(path.join(FONT_DIR, f)));
    return [
      { name: "Epilogue", data: await file("Epilogue-Regular.ttf"), weight: 400, style: "normal" },
      { name: "Epilogue", data: await file("Epilogue-SemiBold.ttf"), weight: 600, style: "normal" },
      { name: "Syne", data: await file("Syne-ExtraBold.ttf"), weight: 800, style: "normal" },
      { name: "Playfair", data: await file("PlayfairDisplay-Medium.ttf"), weight: 500, style: "normal" },
      { name: "Playfair", data: await file("PlayfairDisplay-Italic.ttf"), weight: 400, style: "italic" },
    ];
  })();
  return fontsPromise;
}

const photoCache = new Map<string, Promise<string>>();
const cached = (key: string, load: () => Promise<Buffer>) => {
  let p = photoCache.get(key);
  if (!p) {
    p = load().then((b) => `data:image/jpeg;base64,${b.toString("base64")}`);
    p.catch(() => photoCache.delete(key));
    photoCache.set(key, p);
  }
  return p;
};
const bundledPhoto = (theme: VoucherTheme) => cached(`file:${theme}`, () => readFile(path.join(PHOTO_DIR, `${theme}.jpg`)));

/**
 * The card photo: the portfolio photo picked in the admin (Cloudinary, sharp enough for print),
 * or the bundled one when none is picked or Cloudinary doesn't answer.
 */
export async function themePhoto(theme: VoucherTheme): Promise<{ src: string; position?: string }> {
  const picked = (await getVoucherSettings()).themePhotos[theme];
  if (picked) {
    // 2× the card grid (1240 × 1748) is what the print render needs; a bit more leaves room for the crop.
    const url = cloudinaryUrl(picked.publicId, "c_limit,w_1600,h_2400,q_90,f_jpg");
    try {
      const src = await cached(url, async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
      });
      return { src, position: `${picked.x}% ${picked.y}%` };
    } catch (err) {
      console.error(`[vouchers] card photo for ${theme} failed, using the bundled one`, err);
    }
  }
  return { src: await bundledPhoto(theme) };
}

async function withPhoto(props: VoucherCardInput, scale: number): Promise<CardProps> {
  const photo = await themePhoto(props.theme);
  return { ...props, photoSrc: photo.src, photoPosition: photo.position, contact: voucherContact(), scale };
}

export function qrDataUri(text: string, dark: string = INK, light: string = CREAM): Promise<string> {
  return QRCode.toDataURL(text, { margin: 0, width: 400, errorCorrectionLevel: "M", color: { dark, light } });
}

export type CardSide = "front" | "back";
export type VoucherCardInput = Omit<CardProps, "scale" | "photoSrc" | "photoPosition" | "contact">;

/** "+420728113966" → "+420 728 113 966"; anything else is printed as given. */
export const prettyPhone = (phone: string) => phone.replace(/^\+420\s*(\d{3})\s*(\d{3})\s*(\d{3})$/, "+420 $1 $2 $3");

function voucherContact(): VoucherContact {
  const c = voucherConfig();
  return { name: c.payeeName, phone: prettyPhone(c.phone), email: c.replyTo };
}

/** 2× the grid ≈ 300 dpi at A6 — sharp in print, ~1 MB per side. */
export const PRINT_SCALE = 2;

async function png(node: React.ReactElement, w: number, h: number): Promise<Uint8Array> {
  const res = new ImageResponse(node, { width: Math.round(w), height: Math.round(h), fonts: await loadFonts() });
  return new Uint8Array(await res.arrayBuffer());
}

export async function renderCardPng(props: VoucherCardInput, side: CardSide, scale = PRINT_SCALE): Promise<Uint8Array> {
  const full = await withPhoto(props, scale);
  const Side = side === "front" ? CardFront : CardBack;
  return png(<Side {...full} />, CARD.w * scale, CARD.h * scale);
}

/** Back and front side by side (1240 × 874 grid) — the sample on the sales page and in link previews. */
export async function renderSpreadPng(props: VoucherCardInput, scale = 0.8): Promise<Uint8Array> {
  const full = await withPhoto(props, scale);
  return png(
    <div style={{ display: "flex" }}>
      <CardBack {...full} />
      <CardFront {...full} />
    </div>,
    CARD.w * 2 * scale,
    CARD.h * scale,
  );
}

const mm = (n: number) => (n * 72) / 25.4;

/**
 * Page 1: A4 landscape with the fold card (back | front) at real size, crop marks and a fold mark —
 * print, cut, fold. Pages 2–3: front and back as A6 pages for a print shop or for sharing.
 */
export async function renderVoucherPdf(props: VoucherCardInput, title: string): Promise<Uint8Array> {
  const [frontPng, backPng, hintPng] = await Promise.all([
    renderCardPng(props, "front"),
    renderCardPng(props, "back"),
    png(<PrintHint locale={props.locale} scale={2} />, HINT.w * 2, HINT.h * 2),
  ]);
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor("Guth Pictures");
  pdf.setCreator("guthpictures.eu");
  const [front, back, hint] = await Promise.all([pdf.embedPng(frontPng), pdf.embedPng(backPng), pdf.embedPng(hintPng)]);

  const A4 = { w: mm(297), h: mm(210) }, cw = mm(105), ch = mm(148);
  const page = pdf.addPage([A4.w, A4.h]);
  const x0 = (A4.w - 2 * cw) / 2, y0 = (A4.h - ch) / 2 + mm(6);
  page.drawImage(back, { x: x0, y: y0, width: cw, height: ch });
  page.drawImage(front, { x: x0 + cw, y: y0, width: cw, height: ch });

  const grey = rgb(0.55, 0.55, 0.55), L = mm(6), gap = mm(2);
  for (const cx of [x0, x0 + 2 * cw]) {
    for (const cy of [y0, y0 + ch]) {
      const dx = cx === x0 ? -1 : 1, dy = cy === y0 ? -1 : 1;
      page.drawLine({ start: { x: cx + dx * gap, y: cy }, end: { x: cx + dx * (gap + L), y: cy }, thickness: 0.4, color: grey });
      page.drawLine({ start: { x: cx, y: cy + dy * gap }, end: { x: cx, y: cy + dy * (gap + L) }, thickness: 0.4, color: grey });
    }
  }
  for (const y of [y0 - gap - L, y0 + ch + gap]) {
    page.drawLine({ start: { x: x0 + cw, y }, end: { x: x0 + cw, y: y + L }, thickness: 0.4, color: grey, dashArray: [2, 2] });
  }
  page.drawImage(hint, { x: x0, y: y0 - mm(16), width: 2 * cw, height: (2 * cw * HINT.h) / HINT.w });

  for (const img of [front, back]) pdf.addPage([cw, ch]).drawImage(img, { x: 0, y: 0, width: cw, height: ch });
  return pdf.save();
}
