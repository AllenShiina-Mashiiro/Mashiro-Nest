// Rasterise the generated SVG artwork for a quick visual check.
// Usage: node scripts/render-art.mjs [name ...]
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const targets = process.argv.slice(2);
const files = targets.length
  ? targets
  : ["banner", "avatar", "og", "covers/markdown", "covers/database", "covers/sakura"];

mkdirSync(".preview", { recursive: true });

for (const name of files) {
  const input = `public/images/${name}.svg`;
  const output = `.preview/${name.replace(/\//g, "-")}.png`;
  const width = name === "banner" ? 1600 : name === "og" ? 1200 : 640;
  await sharp(input, { density: 144 })
    .resize({ width, fit: "inside" })
    .png()
    .toFile(output);
  console.log("rendered", output);
}
