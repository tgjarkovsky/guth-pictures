#!/usr/bin/env node
// Resize generated pose images from output/poses into public/poses/<id>.jpg for the /pozy page.
// Usage: node tools/pose-pack/export-web.mjs

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "..", "output", "poses");
const outDir = join(here, "..", "..", "public", "poses");

const source = (id) => [`${id}.jpg`, `${id}.png`].map((f) => join(srcDir, f)).find(existsSync);

const poses = JSON.parse(await readFile(join(here, "poses.json"), "utf8"));
await mkdir(outDir, { recursive: true });

const missing = [];
for (const { id } of poses) {
  const src = source(id);
  if (!src) { missing.push(id); continue; }
  await sharp(src).resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(join(outDir, `${id}.jpg`));
}
console.log(`Exported ${poses.length - missing.length}/${poses.length} to ${outDir}`);
if (missing.length) console.log(`Missing: ${missing.join(", ")}`);
