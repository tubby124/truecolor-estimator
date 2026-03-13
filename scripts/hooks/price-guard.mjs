#!/usr/bin/env node
// PreToolUse Pricing Guard Hook (Skill-Aware)
// Detects the TYPE of file being edited and injects context that
// REFERENCES the correct skills, gates, and pricing rules.
//
// Triggers on: Edit | MultiEdit | Write
//
// Edit types:
//   src/app/[slug]/page.tsx (new)      -> NEW LANDING PAGE
//   src/app/[slug]/page.tsx (existing) -> EDITING LANDING PAGE
//   src/lib/data/products-content.ts   -> PRODUCT CONTENT
//   src/lib/data/gbp-products.json     -> GBP CONTENT
//   src/lib/email/                     -> EMAIL TEMPLATE
//   data/tables/*.csv                  -> PRICING CSV
//   src/lib/engine/                    -> PRICING ENGINE
//   src/components/estimator/          -> CONFIGURATOR UI

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// --- Read hook input ---
let input;
try {
  const raw = readFileSync("/dev/stdin", "utf8");
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath =
  input?.tool_input?.file_path ?? input?.tool_input?.path ?? "";
const cwd = input?.cwd ?? process.cwd();
const absPath = filePath.startsWith("/") ? filePath : join(cwd, filePath);

// --- Classify edit type ---
function classifyEdit(fp) {
  // Order matters — more specific patterns first
  if (/src\/lib\/data\/products-content\.ts$/.test(fp)) return "PRODUCT_CONTENT";
  if (/src\/lib\/data\/gbp-products\.json$/.test(fp)) return "GBP_CONTENT";
  if (/src\/lib\/email\//.test(fp)) return "EMAIL_TEMPLATE";
  if (/data\/tables\/.*\.csv$/.test(fp)) return "PRICING_CSV";
  if (/src\/lib\/engine\//.test(fp)) return "PRICING_ENGINE";
  if (/src\/components\/estimator\//.test(fp)) return "CONFIGURATOR_UI";
  if (/src\/app\/.*\/page\.tsx$/.test(fp)) {
    return existsSync(absPath) ? "EDITING_LANDING_PAGE" : "NEW_LANDING_PAGE";
  }
  return null;
}

const editType = classifyEdit(filePath);
if (!editType) {
  process.exit(0);
}

// --- Context templates per edit type ---
const KEY_PRICES = `KEY PRICES (verify against PRICING_QUICK_REFERENCE.md):
  Coroplast from=$30 | Banners from=$66 | ACP from=$60
  Magnets from=$45 | Decals=$11/sqft | Lettering from=$40
  Volume discounts=QTY-based ONLY ("5+ signs", never "8+ sqft")
  IndustryPage product cards: T1 sqft rates
  Rush=+$40 flat | Design=$35 flat | always separate`;

const CONTEXTS = {
  NEW_LANDING_PAGE: `SKILL GATE: You MUST be running /truecolor-page [keyword] to create a new landing page.
If you haven't loaded this skill, STOP and run it now.

Required skills chain: /truecolor-page -> /paa-faq -> /web-design-ux
Mandatory before shipping: /e2e-test
Price source of truth: data/PRICING_QUICK_REFERENCE.md
SEO safety: ~/.claude/rules/truecolor-seo-safety.md
Brand voice: ~/.claude/rules/brand-voice.md

${KEY_PRICES}
  Price in first paragraph | "Saskatoon" in first 100 words
  Minimum 400 words + 8 FAQs with prices`,

  EDITING_LANDING_PAGE: `PRICING GUARD — Editing a live customer-facing page.
Check ~/.claude/rules/truecolor-seo-safety.md — is this page in the baseline rankings table?
If YES: price-only fixes. Do NOT change meta title, H1, URL, or description structure.
If NO: full edits allowed but verify all prices.

Required skill gates before shipping: /web-design-ux + /e2e-test
Price source: data/PRICING_QUICK_REFERENCE.md
Brand voice: ~/.claude/rules/brand-voice.md

${KEY_PRICES}`,

  PRODUCT_CONTENT: `PRICING GUARD — Editing product content database.
Every fromPrice, FAQ answer, and description price MUST match data/PRICING_QUICK_REFERENCE.md.
Run /pricing-health after any changes.

fromPrice rules:
  Wide-format sqft products: use marketing "from" price (minimum order), NOT calculated sqft price
  Lot-priced products: use lowest tier flat total
  Product reference cards: use T1 sqft rate

fromPrice reference:
  Coroplast=$30 | Banners=$66 | ACP=$60 | Magnets=$45
  Decals=$45 | Foamboard=$45 | Lettering=$40
  BC=$45 | Flyers=$45 | Stickers=$25
  Postcards=$35 | Brochures=$70 | Posters=$15

${KEY_PRICES}

Required skill gates: /web-design-ux before shipping | /e2e-test before push`,

  GBP_CONTENT: `SKILL GATE: Use /gmb-update [niche] for GBP content changes.

Local SEO rules:
  Keyword-first opener with "Saskatoon" in first sentence
  Price in first 2 sentences — specific dollar amount
  NAP: (306) 954-8688 | 216 33rd St W | truecolorprinting.ca
  UTM: ?utm_source=gbp&utm_medium=post&utm_campaign=[niche]_[type]
  All prices from data/PRICING_QUICK_REFERENCE.md

${KEY_PRICES}`,

  EMAIL_TEMPLATE: `SKILL GATE: Run /ecommerce-ux before modifying email templates.
Email requirements: 7 email types must exist (order_confirmation, statusUpdate x3, proof_review, payment_failure_recovery, review_request).
All prices must match data/PRICING_QUICK_REFERENCE.md.
Use truecolorprinting.ca URLs, never vercel.app.

${KEY_PRICES}`,

  PRICING_CSV: `MANDATORY GATE: /pricing-review [category] MUST be completed before CSV changes.
This includes: competitor research, margin calculation, and OWNER APPROVAL.
After CSV changes: run /pricing-health (npm run validate:pricing + sanity checks).
Then update data/PRICING_QUICK_REFERENCE.md to match.
Then check if any page.tsx files need updating.

NEVER fix intentional boundary prices:
  BANNER-V13-2X6FT=$90 | RIGID-ACP3-24X36-S=$66 | SIGN-CORO4-4X8FT-S=$232

Engine architecture:
  Step 3 (exact match products.v1.csv) -> Step 4 (sqft formula pricing_rules) -> Step 4.5 (qty discount)
  qty_discounts rows have ZERO effect on lot-priced products (STICKER/POSTCARD/BROCHURE/FLYER/BC)

Material costs: data/tables/materials.v1.csv | Spicer reference: memory/spicer-costs.md`,

  PRICING_ENGINE: `PRICING ENGINE GUARD — Editing core pricing logic.
This code calculates every price customers see. Extreme caution required.

MANDATORY before shipping: npm run validate:pricing + npm test + /pricing-health + /e2e-test

Engine flow: loader.ts (CSV parse) -> engine/index.ts (5-step calc)
  Step 3: exact match (products.v1.csv) — returns verbatim
  Step 4: sqft formula (pricing_rules.v1.csv)
  Step 4.5: qty bulk discount — ONLY fires when basePricePerSqft !== null
  Step 5: lot price flag check (isLotPrice prevents qty multiplication)
  Step 6: minimum charge (order-level, not per-unit)

Tax: GST(5%)+PST(6%) on checkout ONLY. PST formula: (sell_price - design_fee) * 0.06
Rush fee is PST-exempt.

Read /truecolor pricing [category] for detailed engine walkthrough.`,

  CONFIGURATOR_UI: `SKILL GATES: /ecommerce-ux + /web-design-ux before configurator changes.
Price engine source: src/lib/engine/index.ts reads from data/tables/*.csv.
Never hardcode prices in UI components — engine calculates from CSVs.

Price display in configurator: always pre-tax sell_price. Tax shown on checkout only.
Required before push: /e2e-test`,
};

// --- Build output ---
const contextText = CONTEXTS[editType];
if (!contextText) {
  process.exit(0);
}

const output = {
  hookSpecificOutput: {
    additionalContext: contextText,
  },
};

process.stdout.write(JSON.stringify(output));
process.exit(0);
