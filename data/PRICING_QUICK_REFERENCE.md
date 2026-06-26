# True Color Display Printing — Pricing Quick Reference
**Updated:** 2026-05-20 | **Source of truth:** `data/tables/` CSVs
**How to update prices:** Edit the CSVs only — no code changes needed. Then `git push main` → live in ~2 min.

---

## Communication Rules — What Price to Use Where

**ALWAYS check this section before writing any price** in a landing page, email, campaign, FAQ, or social post.

### 2026-05-19 → 2026-05-20 system change (read this first)

The old **per-product min charge** model is GONE. Engine returns honest sqft × rate × qty for every product, every size, every quantity — with ONE deliberate, scoped exception added 2026-06-26: **coroplast (SIGN) has a per-piece price floor** ($20 single / $30 double) via the new `min_piece_price` column, so very small coroplast signs (≈ under 2.5 sqft single / 2.1 sqft double) don't price below cost. This is an explicit per-category floor, NOT the dead global `min_charge`. Everything else still returns honest sqft × rate. Customers see real per-piece prices browsing the site.

Replaced by a single **$25 order-total minimum** that fires only at customer cart checkout. Below $25 raw subtotal → transparent "Small order setup fee" tops up to $25. Above $25 → no surcharge. Staff `/staff` portal + manual-order route are NOT surcharged (concierge mode).

### Product "from $X" table (post-2026-05-20)

The "from $X" is the smallest amount a customer can realistically be quoted online for that product, including the $25 order-total minimum where relevant.

| Product | Sqft Rate (T1) | Smallest size raw | What customer pays | Marketing "from $X" |
|---------|---------------|-------------------|--------------------|---------------------|
| Coroplast Signs | $8.00/sqft | 12×18" = $20 (floor) | $25 (cart min) | **"from $25"** or "from $8/sqft" |
| ACP Aluminum | $13.00/sqft | 18×24" = $39 | $39 (above min) | **"from $39"** or "from $13/sqft" |
| Vehicle Magnets | $24.00/sqft | 12×12" = $24 | $25 (cart min) | **"from $25"** or "from $24/sqft" |
| Vinyl Lettering | $8.50/sqft | 6×18" = $6.38 | $25 (cart min) | **"from $25"** or "from $8.50/sqft" |
| Vinyl Banners | $8.25/sqft | 2×4 ft = $66 | $66 (above min) | **"from $66"** |
| Foamboard | $10.00/sqft | 18×24" fixed SKU = $45 | $45 (above min) | **"from $45"** or "18×24 from $45" |
| Window Decals | $11.00/sqft | 12×12" = $11 | $25 (cart min) | **"from $25"** or "from $11/sqft" |
| Window Perf | $8.00/sqft | 12×12" = $8 | $25 (cart min) | **"from $25"** or "from $8/sqft" |

### Lot-Priced Products (flat totals)

| Product | "From" Price | Notes |
|---------|-------------|-------|
| Business Cards | from $45 | 250 qty 2-sided 14pt gloss (1S = $40). 2S is the standard product. |
| Flyers | from $45 | 100 qty full-letter 2-sided 80lb. Secondary: $25 (100 half-letter 1S). |
| Stickers | from $25 | 25 qty 2×2" |
| Postcards | from $35 | 50 qty 3×4" |
| Brochures | from $70 | 100 qty tri-fold |
| Photo Posters | from $15 | 12×18" |
| Retractable Banners | from $219 | Economy stand |
| Magnet Calendars | from $45 | 4×7" |
| Rack Cards | from $25 | 100 qty 1-sided |

### Rules (locked 2026-05-20)

1. **Landing pages / emails / campaigns:** Use the "Marketing from $X" column. For products where the smallest size triggers the $25 cart min (coroplast, magnets, vinyl lettering, window decals, window perf), `"from $25"` is the honest minimum customers actually pay. Per-sqft framing ("from $8/sqft") is also fine in headlines + meta.
2. **FAQs / pricing breakdowns:** Show the sqft rate AND mention the **$25 order-total minimum applies at checkout**. Don't say "$30 minimum" or "$60 minimum" or any per-product floor — those are dead.
3. **Stickers area-scale.** Engine multiplies the catch-all price by (w × h) / 16 sqin for custom dimensions on ARLPMF7008. 1×3" + 2×4" + every size between gets a distinct price.
4. **Retired SKUs.** RIGID-ACP3-24X36-S frozen $66 intro retired 2026-05-20. ACP 24×36 is now $78 ($13 × 6 sqft) at every qty. Do not re-enable.
5. **Banners "from $66" is correct** — smallest 2×4ft = $66, already above $25 cart min.
6. **Foamboard "from $45" is correct for the standard 18×24 fixed SKU**. Custom smaller foamboard can price by sqft, but landing pages should anchor the common 18×24 at $45 unless the page explicitly says custom sqft pricing.
7. **Rush +$40 flat** — always mention separately. PST-exempt.
8. **Design $35 flat** — always mention separately. PST-exempt.
9. **All prices are pre-tax.** GST 5% + PST 6% at checkout. PST formula = `(sell_price − design_fee − rush_fee) × 0.06`.
10. **Product reference cards** (`products` array on IndustryPage): use T1 sqft rates for wide-format. Wide-format T1: Coroplast $8/sqft, Banners $8.25/sqft, ACP $13/sqft, Foamboard $10/sqft, Window Decals $11/sqft, Vehicle Magnets $24/sqft.
11. **FROZEN ranking page titles** (do NOT change H1/title/slug): coroplast-signs-saskatoon ("From $8/sqft"), banner-printing-saskatoon ("From $8.25/sqft"), sign-company-saskatoon, business-cards-saskatoon, flyer-printing-saskatoon, sticker-printing-saskatoon, aluminum-signs-saskatoon. Body copy + FAQ updates allowed per SEO wave system.

---

## Wide Format (Roland) — Sqft-Based Pricing

**Important:** `min_charge` values remain in `data/tables/pricing_rules.v1.csv` as legacy reference columns only. They are not enforced by the engine. Customer checkout uses the single $25 order-total minimum described above.

**Exception — coroplast per-piece floor (2026-06-26):** the separate `min_piece_price` column IS enforced by the engine, but only on rows where it is set. Currently coroplast only: **$20 single / $30 double**. It floors the per-piece price in the sqft-tier path (`price = max(sqft × rate, floor)`), before qty multiply, so small signs (≈ under 2.5 sqft single / 2.1 sqft double) can't price below cost — and it holds at every quantity (no qty-1-vs-qty-2 cliff). This is NOT the dead `min_charge`; it's a new, explicit, per-category column. Other categories: blank = no floor. Extending it to ACP/foamboard/magnets/decals is blocked until the "from $39 vs from $60" rule contradiction is reconciled — see `.claude/rules/truecolor-pricing-comms.md`.

### Coroplast Signs (SIGN · MPHCC020 · 4mm Corrugated)
| Sqft Range | Price/sqft |
|------------|-----------|
| 0–12 sqft  | $8.00     |
| 12–32 sqft | $7.50     |
| 32+ sqft   | $7.25     |

**Double-sided:** T1=$14.00 · T2=$13.13 · T3=$12.69 /sqft

**Qty bulk discounts:** 5+=8% · 10+=17% · 25+=23%
> **IMPORTANT:** These are QTY discounts (ordering X+ signs), NOT sqft thresholds. Never present as "8+ sqft" or "17+ sqft" — always "5+ signs", "10+ signs", etc.

Common sizes:
| Size | Single | Double |
|------|--------|--------|
| 12×18" | $20† | $30† |
| 18×24" | $24 | $42 |
| 24×36" | $48 | $84 |
| 4×8 ft | $232* | — |

*Intentional boundary price — do NOT change.
†Per-piece floor (`min_piece_price`). 12×18" is 1.5 sqft; raw sqft would be $12/$21 but floors to $20/$30 to cover small-job cost. The floor only affects coroplast signs under ~2.5 sqft (single) / ~2.1 sqft (double); larger sizes use the sqft rate unchanged.

---

### Vinyl Banners (BANNER · RMBF004 · 13oz Scrim)
| Sqft Range | Price/sqft |
|------------|-----------|
| 0–12 sqft  | $8.25     |
| 12–32 sqft | $7.50     |
| 32+ sqft   | $6.75     |

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
| Sqft Range | 1S Price/sqft | 2S Price/sqft |
|------------|---------------|---------------|
| 0–6 sqft   | $13.00        | $19.00        |
| 6–24 sqft  | $11.00        | $17.00        |
| 24+ sqft   | $10.00        | $16.00        |

**2S formula:** 1S rate + **$6/sqft flat** uplift across all tiers (additive, NOT 1.75× multiplier).
Reason: ACP panel cost ($1.86/sqft) is ~50% of total cost. Doubling the rate would charge for two panels when one is used. Coroplast uses 1.75× because its panel is much cheaper. ACP enabled 2026-05-10 with owner approval.

**Qty bulk discounts:** 5+=3% · 10+=5% · 25+=8% (apply to both 1S and 2S)

Common sizes:
| Size | 1S | 2S |
|------|----|----|
| 18×24" (3 sqft) | $39 | $57 |
| 24×30" (5 sqft) | $65 | $95 |
| 24×36" (6 sqft) | $66* | $114 |
| 4×8 ft (32 sqft) | $320 | $512 |

*Intentional boundary price — do NOT change.

---

### Foamboard Displays (FOAMBOARD · GENERIC_FOAM · 5mm)
| Sqft Range | Price/sqft |
|------------|-----------|
| 0–6 sqft   | $10.00    |
| 6–15 sqft  | $9.00     |
| 15+ sqft   | $8.50     |

**Qty bulk discounts:** 5+=8% · 10+=12% · 25+=15%

Common sizes:
| Size | Price |
|------|-------|
| 18×24" | $45 (fixed SKU) |
| 24×36" | $65 |

---

### Vehicle Magnets (MAGNET · MAG302437550M · 30mil)
| Sqft Range | Price/sqft |
|------------|-----------|
| 0–6 sqft   | $24.00    |
| 6–20 sqft  | $22.00    |
| 20+ sqft   | $18.00    |

**Qty bulk discounts:** 5+=5% · 10+=10%

Magnet Calendars (any size, sqft-based — $24/sqft): 4×7" raw $4.67 each · 5×7" raw $5.83 each · 5×8" raw $6.67 each · 8.5×11" raw $15.58 each · $25 order-total minimum applies at checkout to small carts · Custom size supported

---

### Window Decals (DECAL · ARLPMF7008 · Arlon DPF 510 Matte Vinyl)
| Sqft Range   | Price/sqft |
|--------------|-----------|
| 0–6 sqft     | $11.00    |
| 6.01–20 sqft | $9.00     |
| 20.01+ sqft  | $7.50     |

**Qty bulk discounts:** 5+=5% · 10+=10%

---

### Perforated Window Vinyl (DECAL · RMVN006 · Vision Perf 70/30)
| Sqft Range | Price/sqft |
|------------|-----------|
| 0–12 sqft  | $8.00     |
| 12–32 sqft | $7.50     |
| 32+ sqft   | $7.00     |

**Qty bulk discounts:** 5+=5% · 10+=10%

---

### Vinyl Lettering (VINYL_LETTERING · ARLPMF7008 · Cut Vinyl)
$8.50/sqft · $25 order-total minimum applies at checkout to small carts

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

**130lb Cougar Uncoated Cover — Full 8.5×11":** *(added 2026-05-11 — Remai Modern / Reuben Bugera)*
| Qty  | 2-Sided | 1-Sided* |
|------|---------|----------|
| 100  | $95     | $70      |
| 250  | $185    | $135     |
| 500  | $295    | $215     |
| 1000 | $395    | $285     |

*1-sided tier not in products.v1.csv yet — quote manually if asked.*

Most popular: 500 (80lb 2S)

### When to use 130lb Cougar Uncoated Cover

Premium uncoated cover stock from Domtar. Use ONLY for:
- Art programs, gallery invitations, museum collateral (Remai Modern, MacKenzie Art Gallery)
- Fine stationery, fundraiser cards, high-end event programs
- Anything where the client mentions "uncoated", "natural feel", "premium paper", "art-grade"

**Don't substitute on standard flyer jobs** — the price gap is +70% over 100lb gloss and only justified when the client specifically values the tactile premium stock. Default flyers stay on 80lb gloss.

### Paper tier upgrade rule (teach this to staff)

When a customer asks for a paper upgrade on flyers, use this anchor:

| Base price | × this multiplier | = upgrade price |
|------------|-------------------|------------------|
| 80lb gloss | 1.00× (base) | $45 / 100 / 2S letter |
| 100lb gloss | 1.20-1.25× | $55 / 100 / 2S letter |
| **130lb Cougar uncoated** | **1.70× over 80lb (or 1.40× over 100lb)** | $95 / 100 / 2S letter |

**Spicer cost (locked 2026-05-11):** $461.039/M ($0.461/sheet) for 18×12 sheets. Case = 375 sheets, includes $25 min order + $15 service fee. **First job out of a fresh case absorbs $40 in overhead — quote accordingly or expect a $40 margin haircut.**

**Source ref:** Spicer quote GN1X5/00 2026-05-11 (info@true-color.ca inbox).

### Common pricing mistakes to avoid (Albert reference)

These mistakes have all happened in real quotes — don't repeat them:

1. **Quoting standard flyer price for premium stock.** 130lb Cougar costs ~44% more in paper alone, plus harder to print on uncoated. Always check what stock the customer asked for BEFORE pricing.
2. **Forgetting the rush fee.** Any deadline inside 1-3 business days = +$40 rush. Customer says "I need it by Friday" on a Tuesday = rush. Quote it, customer almost always accepts.
3. **Not factoring case-fee overhead on first-job-out-of-case.** When True Color buys a new paper stock for the first time, the $40 in Spicer min order + service fees comes out of the FIRST job's margin. Add ~$40 to first quote, then drop back to standard tier on repeat orders.
4. **Sub-$30 margin on premium jobs.** Anything under 30% margin needs explicit owner approval. Above 50% is target. Use the margin badge in the staff portal to verify before sending.

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
