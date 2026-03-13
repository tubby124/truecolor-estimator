# True Color Display Printing — Pricing Quick Reference
**Updated:** 2026-03-12 | **Source of truth:** `data/tables/` CSVs
**How to update prices:** Edit the CSVs only — no code changes needed. Then `git push main` → live in ~2 min.

---

## Communication Rules — What Price to Use Where

**ALWAYS check this section before writing any price** in a landing page, email, campaign, FAQ, or social post.

### Minimum-Inflated Products (4 products)

These products have a per-product minimum order. The minimum IS the correct "from" price for marketing — it's the smallest amount a customer can pay.

| Product | Real Rate | Min Order | Marketing "from $X" | FAQ / Comparison Text | Configurator Shows |
|---------|-----------|-----------|--------------------|-----------------------|-------------------|
| Coroplast Signs | $8.00/sqft | $30 | "from $30" | "$8/sqft for orders above the $30 minimum" | Your item: $24 · Min order: $30 · You pay: $30 |
| ACP Aluminum | $13.00/sqft | $60 | "from $60" | "$13/sqft for orders above the $60 minimum" | Your item: $39 · Min order: $60 · You pay: $60 |
| Vehicle Magnets | $24.00/sqft | $45 | "from $45" | "$24/sqft for orders above the $45 minimum" | Your item: $36 · Min order: $45 · You pay: $45 |
| Vinyl Lettering | $8.50/sqft | $40 | "from $40" | "$8.50/sqft for orders above the $40 minimum" | Your item: $25 · Min order: $40 · You pay: $40 |

### NOT Minimum-Inflated (prices are real)

| Product | "From" Price | Why It's Real |
|---------|-------------|---------------|
| Vinyl Banners | from $66 | 2×4ft = $66, already above $45 minimum |
| Foamboard | from $45 | 18×24" = $45, exactly matches minimum (not inflated) |
| Window Decals | from $45 | Minimum applies but $45 IS the correct starting point |
| Window Perf | from $40 | Minimum applies but $40 IS the correct starting point |

### Lot-Priced Products (flat totals, no minimums)

| Product | "From" Price | Notes |
|---------|-------------|-------|
| Business Cards | from $45 | 250 qty 2-sided (1S = $40). Marketing default is $45 (2S) since 2S is the standard product. |
| Flyers | from $45 | 100 qty full-letter 2-sided 80lb. Secondary: $25 (100 half-letter 1S) for half-letter contexts. |
| Stickers | from $25 | 25 qty 2×2" |
| Postcards | from $35 | 50 qty 3×4" |
| Brochures | from $70 | 100 qty tri-fold |
| Photo Posters | from $15 | 12×18" |
| Retractable Banners | from $219 | Economy stand |
| Magnet Calendars | from $45 | 4×7" (min applies) |
| Rack Cards | from $25 | 100 qty 1-sided |

### Rules

1. **Landing pages / emails / campaigns:** Use the "Marketing from $X" column. This is the minimum order — the real starting price a customer will pay.
2. **FAQs / pricing breakdowns:** Use the "FAQ / Comparison Text" column. Show both the sqft rate AND the minimum so customers understand the structure.
3. **Never say "from $8/sqft" for coroplast in marketing headlines** — customers can't actually order for $8, the minimum is $30. Exception: FAQ context explaining how pricing works, product reference cards on IndustryPage (see rule 9), and **ranking pages that already use sqft rates in their title** (e.g. "From $8/sqft" in coroplast title ranks #5, "From $8.25/sqft" in banner title ranks #2 — do NOT change these titles).
4. **Banners "from $66" is correct** — the smallest standard size (2×4ft) costs $66, which is above the $45 minimum. Don't use "from $45".
5. **Foamboard "from $45" is correct** — it's not inflated, it's the real 18×24" price that happens to match the minimum.
6. **Rush +$40 flat** — always mention separately, never baked into "from" price.
7. **Design $35 flat** — always mention separately.
8. **All prices are pre-tax.** GST 5% + PST 6% shown only at checkout.
9. **Product reference cards** (`products` array on IndustryPage): use T1 sqft rates for wide-format products, flat totals for lot-priced. This matches ranking pages and product page pricing. Wide-format T1 rates: Coroplast $8/sqft, Banners $8.25/sqft, ACP $13/sqft, Foamboard $10/sqft, Window Decals $11/sqft, Vehicle Magnets $24/sqft.

---

## Wide Format (Roland) — Sqft-Based Pricing

### Coroplast Signs (SIGN · MPHCC020 · 4mm Corrugated)
| Sqft Range | Price/sqft | Min Charge |
|------------|-----------|------------|
| 0–12 sqft  | $8.00     | $30        |
| 12–32 sqft | $7.50     | $30        |
| 32+ sqft   | $7.25     | $30        |

**Double-sided:** T1=$14.00 · T2=$13.13 · T3=$12.69 /sqft

**Qty bulk discounts:** 5+=8% · 10+=17% · 25+=23%
> **IMPORTANT:** These are QTY discounts (ordering X+ signs), NOT sqft thresholds. Never present as "8+ sqft" or "17+ sqft" — always "5+ signs", "10+ signs", etc.

Common sizes:
| Size | Single | Double |
|------|--------|--------|
| 18×24" | $24 | $42 |
| 24×36" | $48 | $84 |
| 4×8 ft | $232* | — |

*Intentional boundary price — do NOT change.

---

### Vinyl Banners (BANNER · RMBF004 · 13oz Scrim)
| Sqft Range | Price/sqft | Min Charge |
|------------|-----------|------------|
| 0–12 sqft  | $8.25     | $45        |
| 12–32 sqft | $7.50     | $45        |
| 32+ sqft   | $6.75     | $45        |

**Qty bulk discounts:** 5+=5% · 10+=10% · 25+=15%

Common sizes:
| Size | Price |
|------|-------|
| 2×4 ft | $66 |
| 2×6 ft | $90* |
| 3×6 ft | $135 |
| 3×8 ft | $180 |
| 4×8 ft | $240 |
| 4×10 ft | $270 |
| 5×10 ft | $337.50 |
| 6×10 ft | $405 |

*Intentional boundary price — do NOT change.

Grommets: $2.50/each · auto-calculated by engine (max(4, ceil(perimeter_ft/2)))

---

### ACP Aluminum Signs (RIGID · RMACP002 · 3mm)
| Sqft Range | Price/sqft | Min Charge |
|------------|-----------|------------|
| 0–6 sqft   | $13.00    | $60        |
| 6–24 sqft  | $11.00    | $60        |
| 24+ sqft   | $10.00    | $60        |

**Qty bulk discounts:** 5+=3% · 10+=5% · 25+=8%

Common sizes:
| Size | Price |
|------|-------|
| 18×24" | $39 (min $60) |
| 24×36" | $66* |
| 4×8 ft | $320 |

*Intentional boundary price — do NOT change.

---

### Foamboard Displays (FOAMBOARD · GENERIC_FOAM · 5mm)
| Sqft Range | Price/sqft | Min Charge |
|------------|-----------|------------|
| 0–6 sqft   | $10.00    | $45        |
| 6–15 sqft  | $9.00     | $45        |
| 15+ sqft   | $8.50     | $45        |

**Qty bulk discounts:** 5+=8% · 10+=12% · 25+=15%

Common sizes:
| Size | Price |
|------|-------|
| 18×24" | $45 (min applies) |
| 24×36" | $65 |

---

### Vehicle Magnets (MAGNET · MAG302437550M · 30mil)
| Sqft Range | Price/sqft | Min Charge |
|------------|-----------|------------|
| 0–6 sqft   | $24.00    | $45        |
| 6–20 sqft  | $22.00    | $45        |
| 20+ sqft   | $18.00    | $45        |

**Qty bulk discounts:** 5+=5% · 10+=10%

> **Minimum $45 — no exceptions.** Validator enforces this.

Magnet Calendars (any size, sqft-based — $24/sqft): 4×7"=$45min · 5×7"=$45min · 5×8"=$60/10 · 8.5×11"=$140/10 · Custom size supported

---

### Window Decals (DECAL · ARLPMF7008 · Arlon DPF 510 Matte Vinyl)
| Sqft Range   | Price/sqft | Min Charge |
|--------------|-----------|------------|
| 0–6 sqft     | $11.00    | $45        |
| 6.01–20 sqft | $9.00     | $45        |
| 20.01+ sqft  | $7.50     | $45        |

**Qty bulk discounts:** 5+=5% · 10+=10%

---

### Perforated Window Vinyl (DECAL · RMVN006 · Vision Perf 70/30)
| Sqft Range | Price/sqft | Min Charge |
|------------|-----------|------------|
| 0–12 sqft  | $8.00     | $40        |
| 12–32 sqft | $7.50     | $40        |
| 32+ sqft   | $7.00     | $40        |

**Qty bulk discounts:** 5+=5% · 10+=10%

---

### Vinyl Lettering (VINYL_LETTERING · ARLPMF7008 · Cut Vinyl)
$8.50/sqft · Min $40

**Qty bulk discounts:** 5+=8%

---

## Digital Print (Konica) — Lot-Based Pricing

> Lot prices are flat totals — they are NOT multiplied by qty in the engine.
> Bulk savings are baked into tiered lot pricing (lower per-unit at higher qty).

### Vinyl Stickers (STICKER · Arlon DPF 510 · Die-Cut · 8 Sizes)

| Qty  | 2×2″ | 2×3″ | 3×3″ | 4×4″  | 4×6″ | 5×5″ | 6×6″ | 8×8″ |
|------|------|------|------|-------|------|------|------|------|
| 25   | $25  | $25  | $40  | $60   | $90  | $95  | $135 | $240 |
| 50   | $30  | $40  | $60  | $95   | $145 | $150 | $215 | $380 |
| 100  | $45  | $70  | $105 | $160  | $240 | $250 | $360 | $640 |
| 250  | $95  | $140 | $210 | $325  | $490 | $510 | $730 | $1300|
| 500  | $135 | $205 | $305 | $475  | $715 | $740 | $1070| $1900|
| 1000 | $185 | $280 | $420 | $650  | $975 | $1020| $1465| $2600|

4×4″ per-unit: 50=$1.90 · 100=$1.60 · 250=$1.30 · 500=$0.95 · 1000=$0.65
Material codes: 4×4″=ARLPMF7008 · all other sizes=PLACEHOLDER_STICKER_{SIZE}
Most popular: 100× 4×4″

---

### Business Cards (BUSINESS_CARD · PLACEHOLDER_14PT · 14pt Gloss)
| Qty   | 1-Sided | 2-Sided | Per Unit (2S) |
|-------|---------|---------|---------------|
| 250   | $40     | $45     | $0.18         |
| 500   | $50     | $65     | $0.13         |
| 1000  | $80     | $110    | $0.11         |
| 2000  | $150    | $210    | $0.105        |
| 5000  | $305    | $420    | $0.084        |

Most popular: 500 (2-sided)

---

### Flyers (FLYER · 8.5×11" full / 8.5×5.5" half-letter)
**80lb Gloss — Full 8.5×11":**
| Qty  | 2-Sided | 1-Sided |
|------|---------|---------|
| 100  | $45     | $32     |
| 250  | $110    | $79     |
| 500  | $135    | $97     |
| 1000 | $185    | $133    |

**100lb Gloss — Full 8.5×11":** *(market-corrected Mar 2026)*
| Qty  | 2-Sided | 1-Sided |
|------|---------|---------|
| 100  | $55     | $40     |
| 250  | $115    | $83     |
| 500  | $185    | $133    |
| 1000 | $250    | $180    |

**80lb Gloss — Half-letter 8.5×5.5":**
| Qty  | 2-Sided | 1-Sided |
|------|---------|---------|
| 100  | $35     | $25     |
| 250  | $87     | $62     |
| 500  | $105    | $76     |
| 1000 | $145    | $104    |

**100lb Gloss — Half-letter 8.5×5.5":**
| Qty  | 2-Sided | 1-Sided |
|------|---------|---------|
| 100  | $43     | $31     |
| 250  | $90     | $65     |
| 500  | $145    | $104    |
| 1000 | $196    | $141    |

Most popular: 500 (80lb 2S)

---

### Brochures (BROCHURE · 100lb Gloss)
**Tri-Fold (letter 8.5×11 folded to 3 panels):**
| Qty  | Total | Per Unit |
|------|-------|----------|
| 100  | $70   | $0.70    |
| 250  | $105  | $0.42    |
| 500  | $195  | $0.39    |
| 1000 | $320  | $0.32    |

**Half-Fold (letter folded in half):**
| Qty  | Total | Per Unit |
|------|-------|----------|
| 100  | $85   | $0.85    |
| 250  | $115  | $0.46    |
| 500  | $210  | $0.42    |
| 1000 | $360  | $0.36    |

Most popular: 250 (tri-fold)

---

### Postcards (POSTCARD · PLACEHOLDER_14PT · 14pt Gloss · **Always Double-Sided**)
**4×6":**
| Qty  | Total | Per Unit | Savings vs 50 |
|------|-------|----------|---------------|
| 50   | $40   | $0.80    | —             |
| 100  | $45   | $0.45    | save 44%      |
| 250  | $85   | $0.34    | save 58%      |
| 500  | $140  | $0.28    | save 65%      |
| 1000 | $220  | $0.22    | save 73%      |

**5×7":**
| Qty  | Total | Per Unit | vs 4×6 |
|------|-------|----------|--------|
| 50   | $45   | $0.90    | +13%   |
| 100  | $50   | $0.50    | +11%   |
| 250  | $95   | $0.38    | +12%   |
| 500  | $155  | $0.31    | +11%   |
| 1000 | $245  | $0.245   | +11%   |

**3×4":**
| Qty  | Total |
|------|-------|
| 50   | $35   |
| 100  | $60   |
| 250  | $110  |
| 500  | $175  |
| 1000 | $280  |

Most popular: 250 (4×6")

---

### Rack Cards (FLYER · PLACEHOLDER_100LB_RACK · 4×9" DL · 100lb Gloss)
| Qty  | 2-Sided | 1-Sided |
|------|---------|---------|
| 100  | $35     | $25     |
| 250  | $82     | $59     |
| 500  | $119    | $86     |
| 1000 | $205    | $148    |

Standard DL format. Single/double-sided toggle available.

---

### Door Hangers (4.25×11" · 100lb Gloss) — **COMING SOON**
Pricing TBD when press setup is complete.

---

### Photo Posters (PHOTO_POSTER · RMPS002 · Roland Photobase Matte 220gsm)
| Size   | Price | Per Sqft (approx) |
|--------|-------|-------------------|
| 12×18" | $15   | $12/sqft          |
| 16×20" | $18   | $9.72/sqft        |
| 18×24" | $22   | $7.33/sqft        |
| 20×30" | $28   | $8.06/sqft        |
| 24×36" | $35   | $5.83/sqft        |
| 30×40" | $48   | $5.76/sqft        |
| 36×48" | $65   | $5.42/sqft        |

No minimum charge. No bulk discount tiers. Each size = flat price.

---

## Retractable Banner Stands (DISPLAY)
| Model    | Price | SKU               |
|----------|-------|-------------------|
| Economy  | $219  | RBS33507875S      |
| Deluxe   | $299  | RBS33507900PSB    |
| Premium  | $349  | RBS33507900PREM   |

Graphic print included in price (33" wide banner).

---

## Add-ons & Services
| Item                  | Price       |
|-----------------------|-------------|
| Grommets              | $2.50/each (auto-calculated) |
| H-Stake               | $2.50/each |
| Rush/Same-Day         | +$40 flat  |
| Minor edit (design)   | +$35       |
| Design from scratch   | +$50       |
| Logo vectorization    | +$75       |
| Installation          | $75 base   |

---

## GST
All prices above are **pre-tax**.
GST = 5% applied at checkout.
Example: $100 order → $5 GST → $105 total.

---

## Updating Prices
1. Edit the relevant CSV in `data/tables/`
2. `git add data/tables/ && git commit -m "price update: [what changed]" && git push main`
3. Vercel auto-deploys in ~2 minutes
4. Verify at https://truecolor-estimator.vercel.app

**Never edit source code to change prices** — the engine reads CSVs directly.
