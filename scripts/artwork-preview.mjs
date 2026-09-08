import { readFile } from "node:fs/promises";
import sharp from "sharp";

const entries = JSON.parse(await readFile("docs/visual-assets.json", "utf8"));
const width = 300, height = 230, columns = 4;
const tiles = await Promise.all(entries.map(async (entry, index) => {
  const image = await sharp(`public/images/assignwork/${entry.name}.webp`)
    .resize(280, 186, { fit: "contain", background: "#f1f1f1" }).toBuffer();
  const label = Buffer.from(`<svg width="300" height="34"><rect width="300" height="34" fill="#f1f1f1"/><text x="10" y="23" font-family="Arial" font-size="14" fill="#0d0d0d">${String(index + 1).padStart(2, "0")} ${entry.name}</text></svg>`);
  const tile = await sharp({ create: { width, height, channels: 3, background: "#f1f1f1" } })
    .composite([{ input: image, top: 4, left: 10 }, { input: label, top: 192, left: 0 }]).png().toBuffer();
  return { input: tile, top: Math.floor(index / columns) * height, left: index % columns * width };
}));
await sharp({ create: { width: columns * width, height: Math.ceil(entries.length / columns) * height, channels: 3, background: "#f1f1f1" } })
  .composite(tiles).png().toFile("docs/artwork-contact-sheet.png");
console.log(`Previewed ${entries.length} images.`);
