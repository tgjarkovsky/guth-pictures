/**
 * Hromadně uloží příspěvky do Vercel KV.
 * Pokud příspěvek nemá coverImage, automaticky vygeneruje SVG cover a nahraje do Cloudinary.
 *
 * Použití:
 *   npx tsx modules/blog/scripts/batch-post.ts --file posts.json
 *   npx tsx modules/blog/scripts/batch-post.ts --file posts.json --no-covers   # přeskočit generování coverů
 *
 * posts.json musí být pole BlogPostInput[] — viz posts.example.json.
 */

import { readFileSync } from "fs";
import { loadEnvLocal, savePost, uploadCover, type BlogPostInput } from "./shared";

loadEnvLocal();

async function main() {
  const fileArg = process.argv.indexOf("--file");
  if (fileArg === -1 || !process.argv[fileArg + 1]) {
    console.error("Použití: npx tsx modules/blog/scripts/batch-post.ts --file posts.json");
    process.exit(1);
  }

  const skipCovers = process.argv.includes("--no-covers");
  const inputs: BlogPostInput[] = JSON.parse(
    readFileSync(process.argv[fileArg + 1], "utf-8")
  );

  if (!Array.isArray(inputs)) {
    console.error("posts.json musí být pole []");
    process.exit(1);
  }

  console.log(`
Načteno ${inputs.length} příspěvků
`);

  let saved = 0;

  for (const input of inputs) {
    let coverImage = input.coverImage;

    if (!coverImage && !skipCovers) {
      process.stdout.write(`  ↳ generuji cover pro "${input.cs.title}"...`);
      try {
        coverImage = await uploadCover(input.cs.title, input.slug);
        process.stdout.write(` ✓
`);
      } catch (e) {
        process.stdout.write(` ✗ přeskakuji (${(e as Error).message})
`);
      }
    }

    const post = await savePost({ ...input, coverImage });

    console.log(
      `✓ [${++saved}/${inputs.length}] "${post.cs.title}" → /${post.slug} (${post.published ? "published" : "draft"})`
    );
  }

  console.log(`
✅ Hotovo — uloženo ${saved} příspěvků`);
}

main().catch((err) => {
  console.error("Chyba:", err.message);
  process.exit(1);
});
