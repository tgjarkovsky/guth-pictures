/**
 * Vygeneruje SVG cover obrázek a nahraje ho do Cloudinary.
 * Užitečné pro regeneraci coveru u existujícího příspěvku.
 *
 * Použití:
 *   npx tsx modules/blog/scripts/generate-cover.ts --title "Název článku" --slug muj-clanek
 *
 * Výstup: Cloudinary public_id (vložte jako coverImage v adminu nebo posts.json)
 */

import { loadEnvLocal, uploadCover } from "./shared";

loadEnvLocal();

async function main() {
  const titleArg = process.argv.indexOf("--title");
  const slugArg = process.argv.indexOf("--slug");

  if (titleArg === -1 || !process.argv[titleArg + 1] || slugArg === -1 || !process.argv[slugArg + 1]) {
    console.error('Použití: npx tsx modules/blog/scripts/generate-cover.ts --title "Název článku" --slug muj-clanek');
    process.exit(1);
  }

  const title = process.argv[titleArg + 1];
  const slug = process.argv[slugArg + 1];

  process.stdout.write(`Generuji cover pro "${title}"...`);
  const publicId = await uploadCover(title, slug);

  console.log(` ✓
`);
  console.log(`coverImage: "${publicId}"`);
}

main().catch((err) => {
  console.error("Chyba:", err.message);
  process.exit(1);
});
