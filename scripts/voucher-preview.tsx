/**
 * Renders the gift voucher in every variant into .voucher-preview/ for design work:
 * the three creative-portrait packages × Christmas on/off, with and without a dedication, CS and EN,
 * plus one PDF and an index.html contact sheet.
 *
 *   npm run voucher:preview                     # photo: public/hero.jpg
 *   npm run voucher:preview -- --photo portfolio/scppmskdespdikncpzhz   # Cloudinary ID (needs network)
 *   npm run voucher:preview -- --photo ./some/local.jpg
 *
 * Edit modules/vouchers/lib/design.tsx and run it again.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { productsFromPortraitPackages, voucherLineDetails } from "@/modules/vouchers/lib/portrait-products";
import { qrDataUri, renderVoucherPdf, renderVoucherPng } from "@/modules/vouchers/lib/render";
import { voucherPhotoSrc } from "@/modules/vouchers/lib/settings-photo";
import type { VoucherArtProps } from "@/modules/vouchers/lib/design";

const OUT = path.resolve(".voucher-preview");
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

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

function photo(): string {
  const p = arg("photo") ?? "public/hero.jpg";
  if (/^https?:\/\//.test(p) || !/[./\\]/.test(p.slice(-5))) return voucherPhotoSrc(p); // URL or Cloudinary ID
  return `data:image/jpeg;base64,${readFileSync(p).toString("base64")}`;
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const photoSrc = photo();
  const qrSrc = await qrDataUri("https://guthpictures.eu/cs/darkovy-poukaz/uplatnit?kod=GP-7KQ4-M2XD");
  const base = { code: "GP-7KQ4-M2XD", photoSrc, qrSrc, bookingUrlLabel: "guthpictures.eu/poukaz" };

  type Variant = { file: string; title: string; props: Omit<VoucherArtProps, "scale"> };
  const variants: Variant[] = [];
  for (const p of products) {
    for (const christmas of [true, false]) {
      variants.push({
        file: `${p.id}-${christmas ? "xmas" : "plain"}-cs.png`,
        title: `${p.name.cs} · ${christmas ? "vánoční" : "běžný"} · CS`,
        props: {
          ...base, locale: "cs", christmas,
          packageName: p.name.cs, packageDetails: voucherLineDetails(p.details.cs),
          recipientName: christmas ? "Jana Nováková" : "Martin",
          dedication: christmas ? "Ať máš konečně fotky, na kterých se líbíš sama sobě. Krásné Vánoce, Petr" : undefined,
          validUntil: "21. 11. 2027",
        },
      });
    }
  }
  const deluxe = products.find((p) => /deluxe/i.test(p.id)) ?? products[products.length - 1];
  variants.push({
    file: `${deluxe.id}-xmas-en.png`,
    title: `${deluxe.name.en} · Christmas · EN`,
    props: {
      ...base, locale: "en", christmas: true,
      packageName: deluxe.name.en, packageDetails: voucherLineDetails(deluxe.details.en),
      recipientName: "Jane", dedication: "For the photos you've always wanted. Love, Peter", validUntil: "21 November 2027",
    },
  });
  variants.push({
    file: "long-dedication-cs.png",
    title: "Nejdelší věnování (160 znaků) a dlouhé jméno",
    props: {
      ...variants[0].props,
      recipientName: "Kateřina Novotná-Procházková",
      dedication: "Milá Kateřino, ať máš konečně fotky, na kterých se líbíš sama sobě, a ať si focení užiješ stejně jako my všichni okolo tebe. Krásné Vánoce, Petr",
    },
  });

  for (const v of variants) writeFileSync(path.join(OUT, v.file), await renderVoucherPng(v.props));
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
