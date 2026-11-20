import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { defaultColors as P } from "@/lib/theme-presets";
import { VoucherArt, VOUCHER_GRID, type VoucherArtProps } from "./design";

// next.config.ts traces this folder into the serverless bundle.
const FONT_DIR = path.join(process.cwd(), "modules/vouchers/fonts");

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" | "italic" };
let fontsPromise: Promise<FontSpec[]> | null = null;

export function loadFonts(): Promise<FontSpec[]> {
  fontsPromise ??= (async () => {
    const file = async (f: string) => {
      const buf = await readFile(path.join(FONT_DIR, f));
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    };
    return [
      { name: "Epilogue", data: await file("Epilogue-Regular.ttf"), weight: 400, style: "normal" },
      { name: "Epilogue", data: await file("Epilogue-SemiBold.ttf"), weight: 600, style: "normal" },
      { name: "Epilogue", data: await file("Epilogue-Italic.ttf"), weight: 400, style: "italic" },
      { name: "Syne", data: await file("Syne-Bold.ttf"), weight: 700, style: "normal" },
      { name: "DM Mono", data: await file("DMMono-Regular.ttf"), weight: 400, style: "normal" },
    ];
  })();
  return fontsPromise;
}

export function qrDataUri(text: string, dark: string = P.bg, light: string = P.accent): Promise<string> {
  return QRCode.toDataURL(text, { margin: 0, width: 400, errorCorrectionLevel: "M", color: { dark, light } });
}

/** A5 landscape at ~212 dpi — sharp in print, small enough for an e-mail attachment. */
export const VOUCHER_SCALE = 1.415;

export async function renderVoucherPng(props: Omit<VoucherArtProps, "scale">, scale = VOUCHER_SCALE): Promise<Uint8Array> {
  const res = new ImageResponse(<VoucherArt {...props} scale={scale} />, {
    width: Math.round(VOUCHER_GRID.width * scale),
    height: Math.round(VOUCHER_GRID.height * scale),
    fonts: await loadFonts(),
  });
  return new Uint8Array(await res.arrayBuffer());
}

// A5 landscape in PDF points
const A5 = { width: 595.28, height: 419.53 };

export async function renderVoucherPdf(props: Omit<VoucherArtProps, "scale">, title: string): Promise<Uint8Array> {
  const png = await renderVoucherPng(props);
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor("Guth Pictures");
  pdf.setCreator("guthpictures.eu");
  const img = await pdf.embedPng(png);
  const page = pdf.addPage([A5.width, A5.height]);
  page.drawImage(img, { x: 0, y: 0, width: A5.width, height: A5.height });
  return pdf.save();
}
