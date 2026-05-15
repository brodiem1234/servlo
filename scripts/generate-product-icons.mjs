/**
 * Generate monochrome product icons for the SERVLO marketing pages and
 * dashboard shells.
 *
 * Each product gets a simple white-on-transparent PNG at 256×256 so it scales
 * crisply from the 32px usage on landing cards up to the larger usage in
 * dashboard sidebars.
 *
 * The icons are inline SVG (no external file deps) so this script is
 * self-contained — just `node scripts/generate-product-icons.mjs` after a fresh
 * checkout and the public/*.png set is regenerated.
 *
 * Replaces the old coloured PNGs (blue Core, purple Grow, amber Leads, etc).
 * When you swap these in, you can remove the desaturating CSS rule in
 * globals.css that compensates for the old palette.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");

// ── Icon designs ───────────────────────────────────────────────────────────
// Each design renders a single Lucide-style monochrome glyph at 256×256.
// Stroke is 14px white on a transparent background, no fill, rounded joins.

const STROKE = `stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
const FILL_WHITE = `fill="#FFFFFF"`;

const ICONS = {
  // Core: 2×2 grid (operations)
  core: `
    <rect x="56" y="56" width="64" height="64" rx="8" ${STROKE} />
    <rect x="136" y="56" width="64" height="64" rx="8" ${STROKE} />
    <rect x="56" y="136" width="64" height="64" rx="8" ${STROKE} />
    <rect x="136" y="136" width="64" height="64" rx="8" ${STROKE} />
  `,

  // Grow: ascending bar chart + trend arrow
  grow: `
    <line x1="48" y1="208" x2="208" y2="208" ${STROKE} />
    <rect x="60" y="160" width="28" height="48" rx="4" ${STROKE} />
    <rect x="106" y="124" width="28" height="84" rx="4" ${STROKE} />
    <rect x="152" y="80" width="28" height="128" rx="4" ${STROKE} />
    <polyline points="60,144 100,108 140,124 200,60" ${STROKE} />
    <polyline points="180,60 200,60 200,80" ${STROKE} />
  `,

  // Leads: target / crosshair
  leads: `
    <circle cx="128" cy="128" r="80" ${STROKE} />
    <circle cx="128" cy="128" r="48" ${STROKE} />
    <circle cx="128" cy="128" r="14" ${FILL_WHITE} />
    <line x1="128" y1="24" x2="128" y2="56" ${STROKE} />
    <line x1="128" y1="200" x2="128" y2="232" ${STROKE} />
    <line x1="24" y1="128" x2="56" y2="128" ${STROKE} />
    <line x1="200" y1="128" x2="232" y2="128" ${STROKE} />
  `,

  // Pay: dollar sign
  pay: `
    <line x1="128" y1="40" x2="128" y2="216" ${STROKE} />
    <path d="M 180 80 q -20 -28 -56 -28 q -36 0 -36 36 q 0 28 36 36 q 56 8 56 40 q 0 36 -52 36 q -36 0 -56 -28" ${STROKE} />
  `,

  // Fleet: truck silhouette
  fleet: `
    <rect x="40" y="80" width="120" height="80" rx="6" ${STROKE} />
    <path d="M 160 110 L 200 110 L 220 140 L 220 160 L 160 160 Z" ${STROKE} />
    <circle cx="80" cy="172" r="20" ${STROKE} />
    <circle cx="184" cy="172" r="20" ${STROKE} />
  `,

  // Hire: person + plus
  hire: `
    <circle cx="100" cy="92" r="32" ${STROKE} />
    <path d="M 44 200 q 0 -48 56 -48 q 56 0 56 48" ${STROKE} />
    <line x1="180" y1="100" x2="220" y2="100" ${STROKE} />
    <line x1="200" y1="80" x2="200" y2="120" ${STROKE} />
  `,

  // Answer: speech bubble
  answer: `
    <path d="M 40 64 q 0 -16 16 -16 L 200 48 q 16 0 16 16 L 216 152 q 0 16 -16 16 L 120 168 L 76 208 L 76 168 L 56 168 q -16 0 -16 -16 Z" ${STROKE} />
    <circle cx="100" cy="108" r="6" ${FILL_WHITE} />
    <circle cx="128" cy="108" r="6" ${FILL_WHITE} />
    <circle cx="156" cy="108" r="6" ${FILL_WHITE} />
  `,

  // Finance: line chart
  finance: `
    <line x1="48" y1="208" x2="208" y2="208" ${STROKE} />
    <line x1="48" y1="48" x2="48" y2="208" ${STROKE} />
    <polyline points="64,180 96,140 128,158 160,96 196,76" ${STROKE} />
    <circle cx="64" cy="180" r="6" ${FILL_WHITE} />
    <circle cx="96" cy="140" r="6" ${FILL_WHITE} />
    <circle cx="128" cy="158" r="6" ${FILL_WHITE} />
    <circle cx="160" cy="96" r="6" ${FILL_WHITE} />
    <circle cx="196" cy="76" r="6" ${FILL_WHITE} />
  `,

  // Safe: shield
  safe: `
    <path d="M 128 32 L 56 64 L 56 128 q 0 64 72 96 q 72 -32 72 -96 L 200 64 Z" ${STROKE} />
    <polyline points="96,128 120,152 168,104" ${STROKE} />
  `,

  // Books: stacked books
  books: `
    <rect x="56" y="56" width="64" height="144" rx="4" ${STROKE} />
    <rect x="136" y="80" width="64" height="120" rx="4" ${STROKE} />
    <line x1="56" y1="92" x2="120" y2="92" ${STROKE} />
    <line x1="136" y1="112" x2="200" y2="112" ${STROKE} />
  `,

  // Connect: linked nodes
  connect: `
    <circle cx="64" cy="64" r="20" ${STROKE} />
    <circle cx="192" cy="64" r="20" ${STROKE} />
    <circle cx="64" cy="192" r="20" ${STROKE} />
    <circle cx="192" cy="192" r="20" ${STROKE} />
    <circle cx="128" cy="128" r="24" ${STROKE} />
    <line x1="82" y1="78" x2="110" y2="110" ${STROKE} />
    <line x1="174" y1="78" x2="146" y2="110" ${STROKE} />
    <line x1="82" y1="178" x2="110" y2="146" ${STROKE} />
    <line x1="174" y1="178" x2="146" y2="146" ${STROKE} />
  `,

  // Insurance: umbrella
  insurance: `
    <path d="M 40 128 q 0 -88 88 -88 q 88 0 88 88 Z" ${STROKE} />
    <line x1="128" y1="40" x2="128" y2="200" ${STROKE} />
    <path d="M 100 200 q 0 24 28 24 q 28 0 28 -24" ${STROKE} />
  `,

  // Academy: graduation cap
  academy: `
    <polygon points="128,48 240,96 128,144 16,96" ${STROKE} />
    <path d="M 64 116 L 64 168 q 0 24 64 24 q 64 0 64 -24 L 192 116" ${STROKE} />
    <line x1="220" y1="108" x2="220" y2="172" ${STROKE} />
  `,
};

// ── Combo icons (combinations of products) ────────────────────────────────
// These render two glyphs side-by-side so combo cards look distinctive.

const COMBO_ICONS = {
  "core-leads": ["core", "leads"],
  "core-grow": ["core", "grow"],
  "grow-leads": ["grow", "leads"],
  "core-grow-leads": ["core", "grow", "leads"],
};

function singleSvg(glyphMarkup) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  ${glyphMarkup}
</svg>`;
}

function comboSvg(parts) {
  const count = parts.length;
  // Pack N glyphs evenly across 256w. Each glyph renders at ~70% size scaled
  // and translated into its slot.
  const slotWidth = 256 / count;
  const scale = (slotWidth / 256) * 0.85;
  const pieces = parts.map((key, idx) => {
    const offsetX = idx * slotWidth + slotWidth / 2 - (256 * scale) / 2;
    const offsetY = 128 - (256 * scale) / 2;
    return `<g transform="translate(${offsetX} ${offsetY}) scale(${scale})">${ICONS[key]}</g>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  ${pieces}
</svg>`;
}

async function writeIcon(filename, svgString) {
  const outputPath = join(publicDir, filename);
  await sharp(Buffer.from(svgString))
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
  console.log(`✓ ${filename}`);
}

(async () => {
  for (const [name, glyph] of Object.entries(ICONS)) {
    await writeIcon(`${name}.png`, singleSvg(glyph));
  }
  for (const [name, parts] of Object.entries(COMBO_ICONS)) {
    await writeIcon(`${name}.png`, comboSvg(parts));
  }
  console.log("\nDone. Now you can:");
  console.log("  1. Remove the legacy product-icon-desaturating CSS rule from globals.css");
  console.log("  2. git add public/*.png && git commit && git push");
})();
