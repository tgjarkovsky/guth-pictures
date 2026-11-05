/**
 * Uloží článek do Vercel KV jako draft.
 *
 * Použití:
 *   npm run post-article -- --file article.json
 *   npx tsx modules/blog/scripts/post-article.ts < article.json
 *
 * article.json musí mít strukturu BlogPostInput (viz shared.ts).
 * Env proměnné se načtou z .env.local automaticky.
 */

import { readFileSync } from "fs";
import { loadEnvLocal, savePost, type BlogPostInput } from "./shared";

loadEnvLocal();

function readInput(): BlogPostInput {
  const fileArg = process.argv.indexOf("--file");
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    return JSON.parse(readFileSync(process.argv[fileArg + 1], "utf-8"));
  }
  // stdin
  return JSON.parse(readFileSync("/dev/stdin", "utf-8"));
}

async function main() {
  const post = await savePost(readInput());

  console.log(`✓ Článek uložen jako ${post.published ? "published" : "draft"}`);
  console.log(`  id:   ${post.id}`);
  console.log(`  slug: ${post.slug}`);
  console.log(`  cs:   ${post.cs.title}`);
  console.log(`  en:   ${post.en.title}`);
}

main().catch((err) => {
  console.error("Chyba:", err.message);
  process.exit(1);
});
