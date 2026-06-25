# Coroplast Per-Piece Price Floor — Design

**Date:** 2026-06-25
**Status:** Approved design — pending implementation plan
**Pricing version target:** v1 (additive column, no version bump unless `/pricing-health` requires)

## Problem

Small coroplast signs are priced purely by sqft tier (single $8/sqft, double $14/sqft)
with no setup-cost floor. A 12×18" sign (1.5 sqft) bills **$12 single / $21 double per
piece** — below cost once setup, material handling, and cut time are included.

The leak is worst on **bulk small orders**, which the existing $25 order-total minimum
does NOT protect:

- 1× 12×18 single → $12 per piece, but tops up to $25 at checkout (order min) — looks OK
- 50× 12×18 single → 50 × $12 = **$600**, no protection — this is the real bleed
  (election yard signs, real-estate riders, event directional)

12×18 is also **not a standard coroplast preset** (presets are 18×24, 24×36, 4×8ft), so it
only reaches pricing as a hand-entered custom size — which is how it stayed invisible.

The old per-piece `min_charge` column was **globally disabled 2026-05-19** (replaced by the
single $25 order-total minimum) because, applied catalog-wide, it hid quantity scaling and
confused customers comparing sticker prices. It cannot be revived globally: every category
still carries a `min_charge` value (SIGN $30, RIGID $60, MAGNET $45, DECAL $45, FOAMBOARD
$45, BANNER $45…), so flipping the global flag would re-floor the entire catalog at once and
re-create the exact problem that was deleted. It is also a single value per row that cannot
express the needed single-vs-double split.

## Solution

A **new, explicit, per-row `min_piece_price` column** in `pricing_rules.v1.csv`, enforced
per-piece (before qty multiply), only on rows where it is set. Coroplast gets it now;
everything else stays blank until costed.

`price_per_piece = max(sqft × rate, min_piece_price)`

### 1. Data layer
- Add column `min_piece_price` to `data/tables/pricing_rules.v1.csv`.
- Set:
  - `PR-CORO-S-T1`, `PR-CORO-S-T2`, `PR-CORO-S-T3` → `20.00`
  - `PR-CORO-D-T1`, `PR-CORO-D-T2`, `PR-CORO-D-T3` → `30.00`
  - all other rows → blank (parsed to `null`).
- `src/lib/data/loader.ts`: parse the column onto the `PricingRule` type (blank → null).
- `src/lib/data/types.ts`: add `min_piece_price: number | null`.

### 2. Engine (`src/lib/engine/index.ts`)
- In the **sqft-tier path only** (Step 4b), after `basePrice = ceilCent(sqft * basePricePerSqft)`,
  apply `basePrice = Math.max(basePrice, tierRule.min_piece_price)` when non-null.
- Do **not** touch the fixed-SKU path (Step 3) or the lot-price path.
- Applied to the **per-piece** value, before Step 6 multiplies by qty → bulk is protected.
- The existing `min_charge` / `minChargeApplied = false` block stays exactly as-is (dead code,
  preserved for reference). This is a separate, additive mechanism.
- Engine remains pure — value comes from CSV via the loader.

### 3. Interaction with the $25 order-total minimum
No conflict. The per-piece floor is applied pre-qty inside the engine; the $25 order-total
top-up (`src/lib/pricing/order-min.ts`) still layers on at checkout. A single floored 12×18
($20) still tops to $25 at checkout. Bulk orders are floored per piece and exceed $25 on their
own.

### 4. Resulting prices

| Size | sqft | Current S/D | After S/D |
|------|------|-------------|-----------|
| 12×18 | 1.5 | $12 / $21 | **$20 / $30** |
| 18×24 | 3 | $24 / $42 | $24 / $42 (unchanged) |
| 24×36 | 6 | $48 / $84 | $48 / $84 (unchanged) |
| 4×8ft | 32 | $232 (locked) | $232 (unchanged) |
| 10× 12×18 S | — | $120 | **$200** |

Floor only bites under ~2.5 sqft (single) / ~2.1 sqft (double). Every larger size is already
above the floor, so the cheaper per-sqft on big signs is preserved — as required.

### 5. Configurator (`src/lib/data/product-config.ts`)
Add `{ value: "12x18", label: '12" × 18"' }` to the `SIGN` entry in
`SIZE_PRESETS_BY_CATEGORY` so 12×18 is a real preset, not a hand-entered custom size.

### 6. SEO impact — low, copy-only
- "Coroplast from $25" anchors: **unaffected** (floor $20 < $25 order min → customer still
  sees $25).
- "$8/sqft" references: still accurate for the larger signs they describe.
- Action: grep audit of SEO pages / gbp-products.json / products-content.ts for any literal
  sub-floor small-sign quote (e.g. "12×18 … $12"). None expected — verify only.
- **No** title / H1 / slug / schema edits on protected pages → no SEO-wave-rule risk, no
  protected-page cooldown impact.

### 7. Gates & tests (mandatory order)
1. `/pricing-review coroplast` — validate $20 / $30 against margin + Saskatoon competitors
   (OWNER APPROVAL gate before any CSV price change).
2. `/pricing-health` — baseline before CSV edit.
3. Add engine unit tests: 12×18 S=$20, D=$30; 18×24 unchanged $24/$42; bulk 10× 12×18 S = $200.
4. `npm test` + `npm run validate:pricing` — both must pass.
5. `/e2e-test` — before production push.
6. Push `main` → Railway auto-deploy.

### 8. Future work (captured, NOT built now)
ACP, foamboard, magnets, decals, and banners almost certainly share the same small-job leak.
`min_piece_price` is the reusable hook — fill each row in once that material's true floor is
costed (material + setup + handling). This is a known, deliberate follow-up, not an oversight.

## Files touched
- `data/tables/pricing_rules.v1.csv` — new column + 6 coroplast values
- `src/lib/data/types.ts` — `min_piece_price` field
- `src/lib/data/loader.ts` — parse new column
- `src/lib/engine/index.ts` — apply floor in sqft-tier path
- `src/lib/data/product-config.ts` — add 12×18 SIGN preset
- `src/lib/engine/__tests__/engine.test.ts` — new floor tests
- (verify-only) SEO pages / `gbp-products.json` / `products-content.ts`

## Non-goals
- No change to the dead `min_charge` mechanism.
- No change to the $25 order-total minimum.
- No change to fixed-SKU or lot-priced products.
- No re-pricing of 18×24 / 24×36 / 4×8ft or any non-coroplast category.
