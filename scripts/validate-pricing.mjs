#!/usr/bin/env node
/**
 * validate-pricing.mjs
 * True Color Display Printing — Pricing Consistency Validator
 *
 * Checks that all products are wired up across every file they need to exist in.
 * Run: npm run validate:pricing
 *
 * Checks performed:
 *  1. Every products-content.ts slug exists in sitemap.ts
 *  2. Every products-content.ts category exists in CategoryPicker.tsx
 *  3. Every products-content.ts slug exists in SiteNav.tsx PRODUCT_CATEGORIES
 *  4. Every products-content.ts slug has a Lucide icon in PrintIcons.tsx SLUG_ICON_MAP
 *  5. No MAGNET product in products.v1.csv has price < $45
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`  ✗ FAIL: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  ⚠ WARN: ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function readFile(relPath) {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

// ─── Slug-to-SEO-URL alias map ────────────────────────────────────────────
// products-content.ts uses short slugs, but SEO pages use different URL patterns.
// Products without an alias AND without a /products/[slug] route are estimator-only.
const SEO_ALIASES = {
  "vinyl-banners":      "/banner-printing-saskatoon",
  "flyers":             "/flyer-printing-saskatoon",
  "acp-signs":          "/aluminum-signs-saskatoon",
  "vehicle-magnets":    "/vehicle-magnets-saskatoon",
  "foamboard-displays": "/foamboard-printing-saskatoon",
  "stickers":           "/sticker-printing-saskatoon",
  "postcards":          "/postcard-printing-saskatoon",
  "brochures":          "/brochure-printing-saskatoon",
  "photo-posters":      "/photo-poster-printing-saskatoon",
};

// Products that are estimator-only (no dedicated SEO page or /products/ route expected)
const ESTIMATOR_ONLY = new Set([
  "window-perf",
  "rack-cards",
  "door-hangers",
  "magnet-calendars",
]);

// SiteNav uses different aliases for some products
const SITENAV_ALIASES = {
  ...SEO_ALIASES,
  "vehicle-magnets": "/custom-magnets-saskatoon",
};

// ─── Extract slugs from products-content.ts ───────────────────────────────
console.log("\n[1] Extracting slugs from products-content.ts ...");
const productsContent = readFile("src/lib/data/products-content.ts");

// Match: "slug-name": {  (quoted key followed by colon and brace)
const slugMatches = [...productsContent.matchAll(/^\s+"([a-z][a-z0-9-]+)"\s*:\s*\{/gm)];
const slugs = slugMatches.map((m) => m[1]);

// Also extract categories used (category: "SIGN", etc.)
const categoryMatches = [...productsContent.matchAll(/category\s*:\s*"([A-Z_]+)"/g)];
const categoriesUsed = [...new Set(categoryMatches.map((m) => m[1]))];

console.log(`  Found ${slugs.length} slugs: ${slugs.join(", ")}`);
console.log(`  Found ${categoriesUsed.length} categories: ${categoriesUsed.join(", ")}`);

// ─── Check 1: Slugs in sitemap.ts ─────────────────────────────────────────
console.log("\n[2] Checking slugs exist in sitemap.ts ...");
const sitemapContent = readFile("src/app/sitemap.ts");

for (const slug of slugs) {
  if (ESTIMATOR_ONLY.has(slug)) {
    pass(`${slug} → skipped (estimator-only, no SEO page expected)`);
  } else {
    const seoUrl = SEO_ALIASES[slug] || `/${slug}`;
    if (sitemapContent.includes(seoUrl)) {
      pass(`${slug} → sitemap.ts (via ${seoUrl})`);
    } else {
      fail(`${slug} NOT FOUND in sitemap.ts — expected ${seoUrl}`);
    }
  }
}

// ─── Check 2: Categories in CategoryPicker.tsx ────────────────────────────
console.log("\n[3] Checking categories exist in CategoryPicker.tsx ...");
const categoryPickerContent = readFile("src/components/estimator/CategoryPicker.tsx");

for (const cat of categoriesUsed) {
  // Skip service/display categories that don't need a picker entry
  if (["DISPLAY", "DESIGN", "INSTALLATION", "SERVICE"].includes(cat)) {
    pass(`${cat} → skipped (service/display category, not in CategoryPicker)`);
    continue;
  }
  if (categoryPickerContent.includes(`id: "${cat}"`) || categoryPickerContent.includes(`id: '${cat}'`)) {
    pass(`${cat} → CategoryPicker.tsx`);
  } else {
    fail(`${cat} NOT FOUND in CategoryPicker.tsx — staff cannot quote this product!`);
  }
}

// ─── Check 3: Slugs in SiteNav.tsx ────────────────────────────────────────
console.log("\n[4] Checking slugs exist in SiteNav.tsx ...");
const siteNavContent = readFile("src/components/site/SiteNav.tsx");

for (const slug of slugs) {
  if (ESTIMATOR_ONLY.has(slug)) {
    pass(`${slug} → skipped (estimator-only, no nav entry expected)`);
  } else {
    const navUrl = SITENAV_ALIASES[slug] || `/${slug}`;
    const fallbackUrl = `/products/${slug}`;
    if (siteNavContent.includes(navUrl)) {
      pass(`${slug} → SiteNav.tsx (via ${navUrl})`);
    } else if (siteNavContent.includes(fallbackUrl)) {
      warn(`${slug} → SiteNav.tsx uses ${fallbackUrl} — should migrate to ${navUrl}`);
    } else {
      fail(`${slug} NOT FOUND in SiteNav.tsx — expected ${navUrl}`);
    }
  }
}

// ─── Check 4: Slugs have an icon in PrintIcons.tsx SLUG_ICON_MAP ──────────
console.log("\n[5] Checking slugs have a Lucide icon in PrintIcons.tsx SLUG_ICON_MAP ...");
const printIconsContent = readFile("src/components/icons/PrintIcons.tsx");

for (const slug of slugs) {
  if (printIconsContent.includes(`"${slug}"`) || printIconsContent.includes(`'${slug}'`)) {
    pass(`${slug} → PrintIcons.tsx SLUG_ICON_MAP`);
  } else {
    warn(`${slug} has no icon in SLUG_ICON_MAP (will show Printer fallback)`);
  }
}

// ─── Check 5: MAGNET minimum $45 ──────────────────────────────────────────
console.log("\n[6] Checking MAGNET prices >= $45 minimum ...");
const productsCsv = readFile("data/tables/products.v1.csv");
const magnetRows = productsCsv.split("\n").filter((line) => line.includes(",MAGNET,"));

for (const row of magnetRows) {
  const cols = row.split(",");
  const price = parseFloat(cols[8]);
  const productId = cols[0];
  if (!isNaN(price) && price < 45) {
    fail(`${productId} price $${price} is below $45 MAGNET minimum`);
  } else if (!isNaN(price)) {
    pass(`${productId} price $${price} >= $45 ✓`);
  }
}

// ─── Check 6: Pricing rules exist for all categories in products-content ──
console.log("\n[7] Checking pricing rules exist for all categories ...");
const pricingRulesCsv = readFile("data/tables/pricing_rules.v1.csv");
const ruleCategories = [...new Set(
  pricingRulesCsv.split("\n").slice(1)
    .filter(Boolean)
    .map((r) => r.split(",")[3])
    .filter(Boolean)
)];

for (const cat of categoriesUsed) {
  if (["DESIGN", "INSTALLATION", "SERVICE"].includes(cat)) {
    pass(`${cat} → skipped (service, no standard pricing rule needed)`);
    continue;
  }
  if (ruleCategories.includes(cat)) {
    pass(`${cat} → has pricing rule in pricing_rules.v1.csv`);
  } else {
    fail(`${cat} has NO pricing rule in pricing_rules.v1.csv — engine will return null!`);
  }
}

// ─── Check 7: Size inversion detection ────────────────────────────────────
// Lot-priced rules where a larger size (by area) costs LESS than a smaller size at same qty
// KNOWN INTENTIONAL EXCEPTIONS: material codes in this list are priced at specialty premium
// and may intentionally cost more than larger sizes (e.g. mini-format specialty cards)
const INVERSION_EXEMPT = new Set([
  "PLACEHOLDER_14PT_3X4", // 3x4 mini postcard — intentionally priced at specialty premium vs 4x6/5x7
]);
console.log("\n[8] Checking for size inversions (larger size must not be cheaper) ...");

function extractSizeDims(materialCode) {
  const m = materialCode.match(/(\d+)X(\d+)$/i);
  if (!m) return null;
  return { w: parseInt(m[1]), h: parseInt(m[2]), area: parseInt(m[1]) * parseInt(m[2]) };
}
function getSizeBaseCode(materialCode) {
  return materialCode.replace(/_\d+X\d+$/i, "");
}

const prRulesLines = pricingRulesCsv.split("\n").filter(Boolean);
const lotRows = prRulesLines.slice(1).map((line) => {
  const c = line.split(",");
  return {
    rule_id: c[0], category: c[3], material_code: c[4],
    qty: parseInt(c[8]) || 0,
    price: parseFloat(c[11]) || 0,
    is_lot: c[16]?.trim().toUpperCase() === "TRUE",
  };
}).filter((r) => r.is_lot && r.material_code);

const sizeGroups = {};
for (const row of lotRows) {
  if (INVERSION_EXEMPT.has(row.material_code)) continue;
  const dims = extractSizeDims(row.material_code);
  if (!dims) continue;
  const key = `${row.category}__${getSizeBaseCode(row.material_code)}`;
  if (!sizeGroups[key]) sizeGroups[key] = {};
  if (!sizeGroups[key][row.qty]) sizeGroups[key][row.qty] = [];
  sizeGroups[key][row.qty].push({ ...row, area: dims.area });
}

let inversionsFound = 0;
for (const [, qtyMap] of Object.entries(sizeGroups)) {
  for (const [qty, entries] of Object.entries(qtyMap)) {
    if (entries.length < 2) continue;
    entries.sort((a, b) => a.area - b.area);
    for (let i = 1; i < entries.length; i++) {
      const smaller = entries[i - 1];
      const larger = entries[i];
      if (larger.price < smaller.price) {
        fail(`SIZE INVERSION @ qty ${qty}: ${larger.material_code} (${larger.area}sqin) $${larger.price} < ${smaller.material_code} (${smaller.area}sqin) $${smaller.price}`);
        inversionsFound++;
      }
    }
  }
}
if (inversionsFound === 0) pass("No size inversions — all larger sizes cost >= smaller sizes at every qty tier");

// ─── Check 8: Margin floor (lot-priced products with known material costs) ─
const MARGIN_FLOOR = 0.60;
console.log(`\n[9] Checking lot-priced margins >= ${MARGIN_FLOOR * 100}% floor ...`);

const materialsCsv = readFile("data/tables/materials.v1.csv");
const matCostMap = {};
for (const line of materialsCsv.split("\n").slice(1).filter(Boolean)) {
  const c = line.split(",");
  const code = c[0]; const model = c[5]; const rate = parseFloat(c[6]);
  if (model === "per_unit" && !isNaN(rate) && rate > 0) matCostMap[code] = rate;
}

let lowMarginCount = 0;
for (const row of lotRows) {
  const matCost = matCostMap[row.material_code];
  if (!matCost || row.price <= 0 || row.qty <= 0) continue;
  const totalCost = matCost * row.qty;
  const margin = (row.price - totalCost) / row.price;
  if (margin < MARGIN_FLOOR) {
    warn(`LOW MARGIN: ${row.rule_id} qty=${row.qty} sell=$${row.price} matCost=$${totalCost.toFixed(2)} margin=${(margin * 100).toFixed(1)}%`);
    lowMarginCount++;
  }
}
if (lowMarginCount === 0) pass(`All lot-priced products with known costs are above ${MARGIN_FLOOR * 100}% margin`);

// ─── Summary ──────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
if (errors === 0 && warnings === 0) {
  console.log("✅ All checks passed — pricing is consistent across all files.\n");
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠  ${warnings} warning(s), 0 errors — OK to ship but review warnings.\n`);
  process.exit(0);
} else {
  console.error(`❌ ${errors} error(s), ${warnings} warning(s) — fix before pushing!\n`);
  process.exit(1);
}
