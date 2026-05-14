/**
 * Generate icon-192.png and icon-512.png from servlo-master-white.svg
 * using Sharp (already installed in this project).
 *
 * The white wordmark SVG is placed on a solid dark navy background
 * with generous padding so the wordmark is centred and readable.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
const iconsDir = join(publicDir, "icons");

const BG_COLOUR = { r: 10, g: 15, b: 35, alpha: 1 }; // dark navy #0a0f23

async function generateIcon(svgPath, outputPath, size) {
  const svgBuffer = readFileSync(svgPath);

  // The SVG is 1500×1500 viewBox – render it then composite on bg
  // We render the SVG at a high resolution then resize to final size,
  // adding padding (20% each side) so the wordmark isn't edge-to-edge.
  const paddingFraction = 0.18; // 18% padding each side
  const innerSize = Math.round(size * (1 - paddingFraction * 2));

  // 1. Render SVG → PNG (white glyph, transparent bg) at innerSize
  const wordmark = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. Create solid dark-navy background canvas
  const offsetX = Math.round((size - innerSize) / 2);
  const offsetY = Math.round((size - innerSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG_COLOUR,
    },
  })
    .composite([{ input: wordmark, left: offsetX, top: offsetY }])
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated ${outputPath} (${size}×${size})`);
}

(async () => {
  const whiteSvg = join(publicDir, "servlo-master-white.svg");

  await generateIcon(whiteSvg, join(iconsDir, "icon-192.png"), 192);
  await generateIcon(whiteSvg, join(iconsDir, "icon-512.png"), 512);

  console.log("Done.");
})();
