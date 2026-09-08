import { readFile, mkdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Retain generated originals and produce smaller, web ready derivatives.
const root = process.cwd();
const entries = JSON.parse(await readFile(path.join(root, "docs/visual-assets.json"), "utf8"));
const originals = path.join(root, "docs/artwork-originals");
const output = path.join(root, "public/images/assignwork");
await mkdir(originals, { recursive: true });
await mkdir(output, { recursive: true });
for (const entry of entries) {
  const original = path.join(originals, `${entry.name}.png`);
  const target = path.join(output, `${entry.name}.webp`);
  try { await stat(original); } catch { await copyFile(entry.source, original); }
  try { await stat(target); continue; } catch { /* New asset. */ }
  await sharp(original).resize({ width: 1536, withoutEnlargement: true }).webp({ quality: 85 }).toFile(target);
  const info = await stat(target);
  console.log(`${entry.name}: ${Math.round(info.size / 1024)} KB`);
}
