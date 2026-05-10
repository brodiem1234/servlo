/**
 * Generates PWA home screen icons from the SERVLO mark SVG.
 * Outputs: public/icons/icon-192.png and public/icons/icon-512.png
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 * Requires: sharp  (bundled with Next.js — no extra install needed)
 */

import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const markSvg = readFileSync(join(root, "public/servlo-mark-white.svg"));

mkdirSync(join(root, "public/icons"), { recursive: true });

async function generateIcon(size) {
  // Padding = 22% of size (tight but with breathing room)
  const padding = Math.round(size * 0.22);
  const markSize = size - padding * 2;

  // Rasterise the white mark SVG at the inner size, transparent background
  const markBuffer = await sharp(markSvg)
    .resize(markSize, markSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Create a solid #0A0A0A background, composite the mark centred on it
  const outPath = join(root, `public/icons/icon-${size}.png`);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  })
    .composite([{ input: markBuffer, top: padding, left: padding }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`✓ ${outPath}`);
}

await generateIcon(192);
await generateIcon(512);
console.log("PWA icons generated.");
