# True Color — How to Update Pricing
**Last updated:** 2026-02-24 (commit 5592fa2)

> **Golden rule:** Edit CSVs in `data/tables/` only. No code changes needed.
> After editing: `git add data/tables/ && git commit -m "price update: [what]" && git push main`
> Vercel auto-deploys in ~2 minutes. Done.

---

## The 3 Pricing Models — Know Which One Your Product Uses

### Model 1 — Sqft-Based (wide format Roland printer)
**Products:** Coroplast Signs, Vinyl Banners, ACP Aluminum, Foamboard, Magnets, Decals, Vinyl Lettering

How it works:
- Engine calculates area: `width_in / 12 × height_in / 12 = sqft`
- Looks up rate from `pricing_rules.v1.csv` (by sqft range)
- `sell_price = sqft × rate_per_sqft × qty`
- Qty bulk discounts apply (5%–23% depending on category)

To change a rate: edit `price_per_sqft` column in `pricing_rules.v1.csv`

---

### Model 2 — Lot Price (Konica digital press)
**Products:** Business Cards, Flyers, Stickers, Postcards, Brochures

How it works:
- Price is a flat total for the whole print run (e.g. "$110 for 250 flyers")
- Engine picks the exact row matching category + qty + sides
- `sell_price = that row's price` — never multiplied by qty again
- `is_lot_price = TRUE` in `pricing_rules.v1.csv` col 16

To change a price: edit `price_per_unit` column in `pricing_rules.v1.csv` AND `price` column in `products.v1.csv` (both must match)

---

### Model 3 — Per-Unit No Dimensions (retractable stands)
**Products:** Retractable Banner Stands (DISPLAY)

How it works:
- Price is per stand — no sqft calculation needed
- `sell_price = stand_price × qty` (e.g. $219 × 5 = $1,095)
- `is_lot_price = FALSE` in `pricing_rules.v1.csv` col 16 ← THIS is the key flag
- Works on staff side even without entering width/height

To change stand prices: edit `price_per_unit` in `pricing_rules.v1.csv` AND `price` in `products.v1.csv`

---

## Scenario A — Change a Single Price

### "I want to raise coroplast 18×24" from $24 to $26"

This is a fixed-size product in `products.v1.csv`. Edit ONE row:

```
products.v1.csv → find row SIGN-CORO4-18X24-S → change price column from 24 to 26
```

Also update the matching rule ref if there is one. Run `npm run validate:pricing` to confirm nothing broke. Push.

---

### "I want to raise the sqft rate for coroplast from $8 to $9"

Edit `pricing_rules.v1.csv`:
- Find rows with category=SIGN and material_code=MPHCC020
- Change `price_per_sqft` column for the T1 (0–12 sqft) row

This affects ALL non-fixed-size sign quotes automatically.

Note: Fixed-size prices in `products.v1.csv` are NOT automatically updated — update them manually too.

---

### "I want to raise all retractable stands by $20"

Edit TWO files:

1. `pricing_rules.v1.csv` — find PR-DISP-ECO, PR-DISP-DLX, PR-DISP-PREM rows → change `price_per_unit`
2. `products.v1.csv` — find DISP-ECO-1, DISP-DLX-1, DISP-PREM-1 rows → change `price`

Both files must match or Step 3 (exact-match) and Step 4a (qty>1) will disagree.

---

## Scenario B — Add a New Qty Tier

### "I want to add 2000-qty stickers at $800"

1. **`products.v1.csv`** — add a new row:
   ```
   STICK-4X4-2000,Vinyl Stickers 4×4" – Qty 2000,STICKER,ARLPMF7008,4,4,1,2000,800,fixed,PR-STICK-2000,TRUE,TRUE,,v1
   ```

2. **`pricing_rules.v1.csv`** — add a matching rule:
   ```
   PR-STICK-2000,v1,2026-02-24,STICKER,ARLPMF7008,,,,2000,2000,,800,0,,,,TRUE
   ```
   Note `is_lot_price=TRUE` (col 16) because stickers are lot-priced.

3. **`src/lib/data/products-content.ts`** — add 2000 to the stickers `qtyPresets` array:
   ```typescript
   qtyPresets: [50, 100, 250, 500, 1000, 2000],
   ```

4. Run `npm test` + `npm run validate:pricing` → push.

---

## Scenario C — Add a New Product Line

Example: "Square stickers 3×3" in addition to 4×4""

1. **`data/tables/pricing_rules.v1.csv`** — add rules for each qty tier (copy STICKER rows, change dimensions/prices)

2. **`data/tables/products.v1.csv`** — add a row for each qty preset (e.g. 50, 100, 250, 500, 1000)

3. **`src/lib/data/products-content.ts`** — if it's a new product page (new slug), add the product config object. If it's a new size option on an existing page, add a `sizePresets` entry.

4. **If new slug:** also add to `src/app/sitemap.ts` + `SiteNav.tsx` + `ProductIcons` map

5. Run validator: `npm run validate:pricing` — it will tell you if anything is missing.

---

## Scenario D — Add a New Sqft-Based Product (Wide Format)

Example: "Canvas prints, $12/sqft"

1. **`data/tables/materials.v1.csv`** — add the canvas material:
   ```
   CANVAS001,Canvas Material,RIGID,Matte,13oz,per_sqft,0.45,FALSE,FALSE,...
   ```

2. **`data/tables/pricing_rules.v1.csv`** — add pricing rule(s):
   ```
   PR-CANVAS-T1,v1,2026-02-24,CANVAS,CANVAS001,1,0,12,,, 12.00,,30,,,,
   PR-CANVAS-T2,v1,2026-02-24,CANVAS,CANVAS001,1,12,999,,,10.00,,30,,,,
   ```
   Leave `is_lot_price` column EMPTY (defaults to TRUE but sqft products never hit that path anyway — Step 4b uses price_per_sqft, not price_per_unit).

3. **`src/lib/data/products-content.ts`** — add a product config with `slug: "canvas-prints"`, `category: "CANVAS"`

4. Add to CategoryPicker, SiteNav, ProductIcons — validator will remind you if missing.

---

## CSV Column Reference

### `pricing_rules.v1.csv` — all 17 columns
| Col | Name | Example | Notes |
|-----|------|---------|-------|
| 0 | rule_id | PR-SIGN-T1 | Unique ID, no spaces |
| 1 | version | v1 | Always v1 for now |
| 2 | effective_date | 2026-02-19 | When price went live |
| 3 | category | SIGN | Matches engine category |
| 4 | material_code | MPHCC020 | Must exist in materials.v1.csv |
| 5 | sides | 1 or 2 | Leave blank = matches any |
| 6 | sqft_min | 0 | Sqft >= this value |
| 7 | sqft_max | 12 | Sqft <= this value (blank = no max) |
| 8 | qty_min | 100 | Qty >= this value |
| 9 | qty_max | 499 | Qty <= this value (blank = no max) |
| 10 | price_per_sqft | 8.00 | For sqft-based products — leave blank for lot/unit priced |
| 11 | price_per_unit | 110 | For lot or per-unit priced — leave blank for sqft |
| 12 | min_charge | 30 | Minimum order charge in $ |
| 13 | rounding | round_up_0.01 | Optional |
| 14 | conflict_note | | For tracking resolved conflicts |
| 15 | source_ref | | Where price came from |
| 16 | **is_lot_price** | TRUE or FALSE | **Critical flag** — see below |

#### `is_lot_price` flag (col 16):
- **`TRUE`** (or blank) = flat lot price — do NOT multiply by qty
  - Use for: BCs, Flyers, Stickers, Postcards, Brochures
  - Example: $110 is the total for 250 flyers
- **`FALSE`** = per-unit price — multiply by qty
  - Use for: Retractable stands (DISPLAY)
  - Example: $219/stand × 5 = $1,095

---

### `products.v1.csv` — fixed-size catalog (Step 3 exact match)
| Col | Name | Notes |
|-----|------|-------|
| 0 | product_id | e.g. BC-14PT-250-2S |
| 1 | product_name | Full display name |
| 2 | category | e.g. BUSINESS_CARD |
| 3 | material_code | e.g. PLACEHOLDER_14PT |
| 4 | width_in | Width in inches |
| 5 | height_in | Height in inches |
| 6 | sides | 1 or 2 |
| 7 | qty | Number of pieces in the lot |
| 8 | price | Sell price (pre-tax) |
| 9 | price_model | fixed or sqft |
| 10 | pricing_rule_ref | matching rule_id |
| 11 | is_active | TRUE = shown to customers |
| 12 | core_catalog | TRUE = main offering |
| 13 | source_ref | |
| 14 | pricing_version | v1 |

---

## Common Mistakes to Avoid

1. **Editing only one file** — if you change a price in `products.v1.csv` but not `pricing_rules.v1.csv`, qty=1 and qty>1 will show different prices. Always update both.

2. **Wrong `is_lot_price` value for DISPLAY** — retractable stands must have `is_lot_price=FALSE`. If you accidentally set TRUE, qty=5 stands will return $219 instead of $1,095.

3. **Adding a product page but forgetting CategoryPicker/SiteNav** — the validator (`npm run validate:pricing`) will catch this. Run it before pushing.

4. **Using `price_per_sqft` AND `price_per_unit` in the same row** — pick one. If both are filled, the engine always uses `price_per_sqft` first. For per-unit products (posters, stands), leave `price_per_sqft` blank.

5. **Photo poster pricing** — these use `price_per_unit` (not per_sqft) with sqft_min/sqft_max to pick the right size. Each size row covers a sqft range (e.g. 12×18 = 1.5 sqft lands in the 0–1.85 range). Don't move the price to the sqft column.

---

## Quick Git Commands

```bash
# Update a price + push live
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator"
# ... edit the CSV(s) ...
npm run validate:pricing
git add data/tables/
git commit -m "price update: [describe change]"
git push main
# Live in ~2 min at https://truecolor-estimator.vercel.app

# Run tests first if you changed engine code
npm test
```

---

## Disabled Features (as of 2026-02-24) — Need Owner Decision Before Re-enabling

| Feature | Why disabled | What's needed to re-enable |
|---------|-------------|---------------------------|
| ACP double-sided | No 2S pricing rules exist | Owner confirms T1/T2/T3 rates for 2S → add rows to pricing_rules.v1.csv → set `sideOptions: true` in products-content.ts |
| Postcards single-sided | No 1S pricing; size toggle was returning wrong size's price | Owner confirms 1S prices per size → add rows + sqft ranges to pricing_rules.v1.csv → set `sideOptions: true` |
| Business cards >1000 | Owner confirmed losing money above 1000 | Owner confirms new max qty + pricing → add rows back + set is_active=TRUE + restore qtyPresets |
| Brochure 100lb cost margin | Awaiting Spicer price on 100lb paper | Get $/M price from Spicer → update PLACEHOLDER_100LB, PLACEHOLDER_TF_100LB, PLACEHOLDER_HF_100LB in materials.v1.csv |
