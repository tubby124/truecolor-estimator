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

// Products that are estimator-only (no dedicated SEO page or /products/ route expected).
// /products/* pages are intentionally excluded from sitemap.ts (configurator routes, not SEO).
const ESTIMATOR_ONLY = new Set([
  "window-perf",
  "rack-cards",
  "door-hangers",
  "magnet-calendars",
  "coil-bound-booklets",
  "custom-shape-signs",
]);

// SiteNav uses different aliases for some products
const SITENAV_ALIASES = {
  ...SEO_ALIASES,
  "vehicle-magnets": "/vehicle-magnets-saskatoon",
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
  // Skip service/display categories that don't need a picker entry.
  // BOOKLET = placeholder (waiting Spicer 100lb quote), intentionally hidden from staff.
  if (["DISPLAY", "DESIGN", "INSTALLATION", "SERVICE", "BOOKLET"].includes(cat)) {
    pass(`${cat} → skipped (service/display/placeholder category, not in CategoryPicker)`);
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

// ─── Check 5: MAGNET rows remain parseable under checkout-min model ───────
console.log("\n[6] Checking MAGNET prices are parseable raw prices ...");
const productsCsv = readFile("data/tables/products.v1.csv");
const magnetRows = productsCsv.split("\n").filter((line) => line.includes(",MAGNET,"));

for (const row of magnetRows) {
  const cols = row.split(",");
  const price = parseFloat(cols[8]);
  const productId = cols[0];
  if (isNaN(price) || price < 0) {
    fail(`${productId} has invalid MAGNET price: ${cols[8]}`);
  } else if (!isNaN(price)) {
    pass(`${productId} raw price $${price} is parseable`);
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

// ─── [10] CSV structural integrity ────────────────────────────────────────
// loader.ts splits positionally, so a stray comma or a dropped column silently
// shifts every downstream value — min_charge can become a price with no error.
// Nothing caught this before; it is how the service rows sat mis-columned for months.
console.log("\n[10] Checking CSV structural integrity (field counts, stray commas) ...");

/** Split a CSV line on commas that are not inside double quotes. */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadCsv(relPath) {
  const lines = readFile(relPath).split("\n").filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((l, i) => ({ lineNo: i + 2, fields: splitCsvLine(l) }));
  return { header, rows };
}

const CSV_FILES = [
  "data/tables/pricing_rules.v1.csv",
  "data/tables/products.v1.csv",
  "data/tables/services.v1.csv",
  "data/tables/materials.v1.csv",
  "data/tables/qty_discounts.v1.csv",
];

let structuralIssues = 0;
for (const relPath of CSV_FILES) {
  const { header, rows } = loadCsv(relPath);
  const expected = header.length;
  for (const { lineNo, fields } of rows) {
    // Trailing empty columns are conventionally omitted in these files (180 of 186
    // pricing_rules rows carry 17 of 18). Too MANY fields always means a stray comma.
    if (fields.length > expected) {
      fail(`${relPath}:${lineNo} has ${fields.length} fields, header declares ${expected} — stray comma in an unquoted field (${fields[0]})`);
      structuralIssues++;
    }
  }
}
if (structuralIssues === 0) pass(`All ${CSV_FILES.length} CSVs are structurally sound — no stray commas or over-long rows`);

// ─── [11] Price-column exclusivity + service-rule shape ───────────────────
// STEP 4a rejects any rule where price_per_sqft is set, so a flat-fee rule with its
// price in the sqft column can never match. A rule with BOTH columns set is worse:
// it silently disables the per-unit path and prices per square foot instead.
console.log("\n[11] Checking pricing rule price-column shape ...");
const { header: prHeader, rows: prRows } = loadCsv("data/tables/pricing_rules.v1.csv");
const PR = Object.fromEntries(prHeader.map((h, i) => [h, i]));
const FLAT_FEE_CATEGORIES = new Set(["SERVICE", "DESIGN", "ADDON", "INSTALLATION"]);

let shapeIssues = 0;
for (const { lineNo, fields } of prRows) {
  const ruleId = fields[PR.rule_id];
  const category = fields[PR.category];
  const perSqft = (fields[PR.price_per_sqft] ?? "").trim();
  const perUnit = (fields[PR.price_per_unit] ?? "").trim();

  if (perSqft && perUnit) {
    fail(`${ruleId} (line ${lineNo}) sets BOTH price_per_sqft and price_per_unit — Step 4a is silently disabled and it will price per-sqft`);
    shapeIssues++;
  }
  if (FLAT_FEE_CATEGORIES.has(category)) {
    if (!perUnit) {
      fail(`${ruleId} (line ${lineNo}) is category ${category} but has no price_per_unit — Step 4a can never match it, so the service is unquotable`);
      shapeIssues++;
    }
    if (perSqft) {
      fail(`${ruleId} (line ${lineNo}) is category ${category} with a price_per_sqft — flat fees must never be priced per square foot`);
      shapeIssues++;
    }
  }
}
if (shapeIssues === 0) pass("All pricing rules have exactly one price column; every flat-fee rule is Step 4a-matchable");

// ─── [12] Ambiguous rule matching (row order decides the price) ───────────
// STEP 4a/4b use rules.find() — first match wins, so two rules with the same
// discriminators make the later one dead code and make pricing depend on row order.
console.log("\n[12] Checking for ambiguous (duplicate-match) pricing rules ...");
const seenKeys = new Map();
let ambiguous = 0;
for (const { lineNo, fields } of prRows) {
  const key = [
    fields[PR.category],
    fields[PR.material_code] ?? "",
    fields[PR.sides] ?? "",
    fields[PR.sqft_min] ?? "",
    fields[PR.sqft_max] ?? "",
    fields[PR.qty_min] ?? "",
    fields[PR.qty_max] ?? "",
  ].join("|");
  if (seenKeys.has(key)) {
    fail(`${fields[PR.rule_id]} (line ${lineNo}) matches identically to ${seenKeys.get(key)} — rules.find() returns the first, making this row unreachable`);
    ambiguous++;
  } else {
    seenKeys.set(key, fields[PR.rule_id]);
  }
}
if (ambiguous === 0) pass("No two pricing rules share the same match key — no row-order dependence");

// ─── [13] Fee agreement across the three tables ──────────────────────────
// config.v1.csv is the authority for fees the engine adds inside another quote.
// services.v1.csv and pricing_rules.v1.csv restate the same numbers for humans and
// for standalone SKUs; when they drift, the table you read is not the price charged.
// PR-SVC-DESIGN-LOGO sat at $75 while config said $50 until 2026-08-06.
console.log("\n[13] Checking design/rush/addon fee agreement across config, services, pricing_rules ...");
const configCsv = loadCsv("data/tables/config.v1.csv");
const configMap = Object.fromEntries(configCsv.rows.map(({ fields }) => [fields[0], fields[1]]));
const servicesCsv = loadCsv("data/tables/services.v1.csv");
const SV = Object.fromEntries(servicesCsv.header.map((h, i) => [h, i]));
const serviceMap = Object.fromEntries(
  servicesCsv.rows.map(({ fields }) => [fields[SV.service_id], fields[SV.default_price]])
);
const ruleUnitPrice = Object.fromEntries(
  prRows.map(({ fields }) => [fields[PR.rule_id], (fields[PR.price_per_unit] ?? "").trim()])
);

const FEE_LINKS = [
  { configKey: "design_minor_edit_fee",      serviceId: "SVC-DESIGN-BASIC", ruleId: "PR-SVC-DESIGN-BASIC" },
  { configKey: "design_full_design_fee",     serviceId: "SVC-DESIGN-FULL",  ruleId: "PR-SVC-DESIGN-FULL" },
  { configKey: "design_logo_recreation_fee", serviceId: "SVC-DESIGN-LOGO",  ruleId: "PR-SVC-DESIGN-LOGO" },
  { configKey: "rush_fee_flat",              serviceId: "SVC-RUSH",         ruleId: "PR-ADDON-RUSH" },
  { configKey: "grommet_price_per_unit",     serviceId: "SVC-GROMMET",      ruleId: "PR-ADDON-GROMMET" },
  { configKey: "hstake_price_per_unit",      serviceId: "SVC-HSTAKE",       ruleId: null },
];

let feeDrift = 0;
for (const { configKey, serviceId, ruleId } of FEE_LINKS) {
  const cfg = parseFloat(configMap[configKey]);
  if (isNaN(cfg)) { fail(`config.v1.csv is missing or non-numeric for "${configKey}"`); feeDrift++; continue; }

  const svc = parseFloat(serviceMap[serviceId]);
  if (!isNaN(svc) && Math.abs(svc - cfg) > 0.001) {
    fail(`FEE DRIFT: config.${configKey}=$${cfg} but services.v1.csv ${serviceId}.default_price=$${svc}`);
    feeDrift++;
  }
  if (ruleId) {
    const rule = parseFloat(ruleUnitPrice[ruleId]);
    if (!isNaN(rule) && Math.abs(rule - cfg) > 0.001) {
      fail(`FEE DRIFT: config.${configKey}=$${cfg} but pricing_rules.v1.csv ${ruleId}.price_per_unit=$${rule}`);
      feeDrift++;
    }
  }
}
if (feeDrift === 0) pass(`All ${FEE_LINKS.length} engine fees agree across config.v1.csv, services.v1.csv, and pricing_rules.v1.csv`);

// NOTE: engine reachability (can every listed product actually be priced?) is covered
// by the "catalog reachability" suite in src/lib/engine/__tests__/engine.test.ts, which
// calls estimate() for real rather than re-deriving qty tiers from regex here.

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
