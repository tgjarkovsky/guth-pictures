/**
 * Renders the gift voucher card in every variant into .voucher-preview/ for design work:
 * each creative-portrait package (its own photo + accent), with and without a dedication, CS and EN,
 * plus the print PDF and an index.html contact sheet.
 *
 *   npm run voucher:preview
 *
 * Edit modules/vouchers/lib/design.tsx and run it again.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { themeForProduct } from "@/modules/vouchers/lib/design";
import { productsFromPortraitPackages, voucherLineDetails } from "@/modules/vouchers/lib/portrait-products";
import { qrDataUri, renderCardPng, renderSpreadPng, renderVoucherPdf, type VoucherCardInput } from "@/modules/vouchers/lib/render";

const OUT = path.resolve(".voucher-preview");

// Mirrors the live packages (admin → Texty → Služby → Portréty), 21. 11. 2026.
const pk = (name: string, price: string, duration: string, includes: string[]) => ({ name, price, duration, includes });
const products = productsFromPortraitPackages(
  [
    pk("Standard", "2000", "60 minut", ["Standardní portrétní foto session", "Jedna lokace, jeden námět a úprava", "min. 5 upravených fotografií"]),
    pk("Rozšířený", "4000", "120-180 minut", ["Skoro půlden tvoření.", "Vícero outfitů, vícero lokací.", "Minimálně 15 upravených fotografií."]),
    pk("Deluxe", "4000", "90-120 minut", ["Session v profesionálním fotoateliéru.", "Make-up maskérka v ceně.", "Min. 7 upravených fotografií"]),
  ],
  [
    pk("Standard", "2000", "60 minutes", ["Standard portrait session", "One location, one theme, editing", "min. 5 edited photos"]),
    pk("Extended", "4000", "120-180 minutes", ["Almost half a day of creating.", "Several outfits and locations.", "At least 15 edited photos."]),
    pk("Deluxe", "4000", "90-120 minutes", ["Session in a professional studio.", "Make-up artist included.", "Min. 7 edited photos"]),
  ],
);

(async () => {
  mkdirSync(OUT, { recursive: true });
  const qrSrc = await qrDataUri("https://guthpictures.eu/cs/darkovy-poukaz/uplatnit?kod=GP-7KQ4-M2XD");
  const base = { code: "GP-7KQ4-M2XD", qrSrc, bookingUrlLabel: "guthpictures.eu/poukaz", validUntil: "21. 11. 2027" };

  const variants: { file: string; title: string; props: VoucherCardInput }[] = products.map((p, i) => ({
    file: `${p.id}-cs.png`,
    title: `${p.name.cs} · ${i % 2 ? "bez věnování" : "s věnováním"} · CS`,
    props: {
      ...base, locale: "cs", theme: themeForProduct(p.id),
      packageName: p.name.cs, packageDetails: voucherLineDetails(p.details.cs),
      recipientName: i % 2 ? "Martin" : "Jana Nováková",
      dedication: i % 2 ? undefined : "Ať máš konečně fotky, na kterých se líbíš sama sobě. Krásné Vánoce, Petr",
    },
  }));
  const deluxe = products.find((p) => /deluxe/.test(p.id)) ?? products[products.length - 1];
  variants.push({
    file: "deluxe-en.png", title: `${deluxe.name.en} · EN`,
    props: {
      ...base, locale: "en", theme: themeForProduct(deluxe.id), validUntil: "21 November 2027",
      packageName: deluxe.name.en, packageDetails: voucherLineDetails(deluxe.details.en),
      recipientName: "Jane", dedication: "For the photos you've always wanted. Love, Peter",
    },
  });
  variants.push({
    file: "long-cs.png", title: "Nejdelší věnování (160 znaků) a dlouhé jméno · Noir",
    props: {
      ...variants[0].props, theme: "noir",
      recipientName: "Kateřina Novotná-Procházková",
      dedication: "Milá Kateřino, ať máš konečně fotky, na kterých se líbíš sama sobě, a ať si focení užiješ stejně jako my všichni okolo tebe. Krásné Vánoce, Petr",
    },
  });

  for (const v of variants) writeFileSync(path.join(OUT, v.file), await renderSpreadPng(v.props, 1));
  writeFileSync(path.join(OUT, "front.png"), await renderCardPng(variants[0].props, "front"));
  writeFileSync(path.join(OUT, "poukaz.pdf"), await renderVoucherPdf(variants[0].props, "Dárkový poukaz"));
  writeFileSync(
    path.join(OUT, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Náhled poukazu</title>
<style>body{margin:0;padding:24px;background:#222;color:#eee;font:14px system-ui}h1{font-size:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:24px}figure{margin:0}
img{width:100%;display:block;box-shadow:0 10px 30px #0008}figcaption{margin-top:8px;opacity:.8}</style>
<h1>Náhled poukazu — ${new Date().toLocaleString("cs-CZ")} · <a style="color:#c98a4b" href="poukaz.pdf">PDF</a></h1>
<div class="grid">${variants.map((v) => `<figure><img src="${v.file}"><figcaption>${v.title}</figcaption></figure>`).join("")}</div>`,
  );
  console.log(`Hotovo: ${variants.length} variant → ${path.relative(process.cwd(), OUT)}/index.html`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
