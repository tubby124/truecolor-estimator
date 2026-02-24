/**
 * gen-og.mjs — Generate public/og-image.png from public/og-image.svg
 *
 * Uses @resvg/resvg-js (already a project dependency) so no extra installs.
 * Run: node scripts/gen-og.mjs
 *
 * Re-run any time you edit og-image.svg.
 * Commit the resulting og-image.png (platform crawlers need a real raster image).
 */

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const svgPath = path.join(root, "public", "og-image.svg");
const pngPath = path.join(root, "public", "og-image.png");

const svg = readFileSync(svgPath, "utf8");

const resvg = new Resvg(svg, {
  fitTo: { mode: "original" },           // keep the 1200×630 viewBox size
  font: { loadSystemFonts: true },       // picks up Arial/Helvetica from macOS
  background: "#111111",
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

writeFileSync(pngPath, pngBuffer);
console.log(`✓ og-image.png written  (${Math.round(pngBuffer.length / 1024)} KB)`);
console.log(`  → ${pngPath}`);
