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
 *  4. Every products-content.ts slug has an emoji in quote/page.tsx PRODUCT_ICONS
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
  if (sitemapContent.includes(`"${slug}"`) || sitemapContent.includes(`'${slug}'`) || sitemapContent.includes(`/products/${slug}`)) {
    pass(`${slug} → sitemap.ts`);
  } else {
    fail(`${slug} NOT FOUND in sitemap.ts — add it to the product routes array`);
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
  if (siteNavContent.includes(`/products/${slug}`)) {
    pass(`${slug} → SiteNav.tsx`);
  } else {
    fail(`${slug} NOT FOUND in SiteNav.tsx — product is invisible in nav!`);
  }
}

// ─── Check 4: Slugs have emoji in quote/page.tsx PRODUCT_ICONS ────────────
console.log("\n[5] Checking slugs have emoji in quote/page.tsx PRODUCT_ICONS ...");
const quotePage = readFile("src/app/quote/page.tsx");

for (const slug of slugs) {
  if (quotePage.includes(`"${slug}"`) || quotePage.includes(`'${slug}'`)) {
    pass(`${slug} → quote/page.tsx PRODUCT_ICONS`);
  } else {
    warn(`${slug} has no emoji in PRODUCT_ICONS (will show 🖨️ fallback)`);
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
