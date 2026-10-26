#!/usr/bin/env node
// Build output/poses/index.html from poses.json + generated JPGs.
// Usage: node tools/pose-pack/build-gallery.mjs

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "..", "output", "poses");

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const card = (p) => {
  const has = existsSync(join(outDir, `${p.id}.jpg`));
  const media = has
    ? `<img src="${esc(p.id)}.jpg" alt="${esc(p.label)}" loading="lazy">`
    : `<div class="missing">chybí</div>`;
  const tags = p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  return `<figure data-tags="${esc(p.tags.join(" "))}">${media}<figcaption><strong>${esc(p.id)}</strong> · ${esc(p.shot)}<br>${esc(p.label)}<div>${tags}</div></figcaption></figure>`;
};

const filters = (poses) =>
  ["vše", ...new Set(poses.flatMap((p) => p.tags))]
    .map((t) => `<button data-tag="${esc(t)}">${esc(t)}</button>`)
    .join("");

const page = (poses) => `<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pose pack</title>
<style>
body{margin:0;padding:24px 16px;background:#f4f1ea;color:#11100e;font:15px/1.4 'DM Sans',system-ui,sans-serif}
h1{font-weight:500}
nav{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
button{font:inherit;padding:4px 12px;border:1px solid #11100e;border-radius:999px;background:none;cursor:pointer}
button.on{background:#11100e;color:#f4f1ea}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
figure{margin:0}figure[hidden]{display:none}
img,.missing{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:4px;background:#e8e3d8}
.missing{display:grid;place-items:center;color:#6b6760;border:1px dashed #6b6760}
figcaption{margin-top:6px;color:#4a4740;font-size:13px}
.tag{display:inline-block;margin:4px 4px 0 0;padding:0 8px;border-radius:999px;background:#e8e3d8;color:#c93a2b}
</style>
<h1>Pose pack</h1><nav>${filters(poses)}</nav><div class="grid">${poses.map(card).join("")}</div>
<script>
const pick = (tag) => {
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b.dataset.tag === tag));
  document.querySelectorAll("figure").forEach((f) => (f.hidden = tag !== "vše" && !f.dataset.tags.split(" ").includes(tag)));
};
document.querySelector("nav").onclick = (e) => e.target.dataset.tag && pick(e.target.dataset.tag);
pick("vše");
</script></html>`;

const poses = JSON.parse(await readFile(join(here, "poses.json"), "utf8"));
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "index.html"), page(poses));
const done = poses.filter((p) => existsSync(join(outDir, `${p.id}.jpg`))).length;
console.log(`Gallery: ${join(outDir, "index.html")}  (${done}/${poses.length} hotovo)`);
