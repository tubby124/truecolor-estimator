# True Color Display Printing — Pricing Quick Reference
**Updated:** 2026-02-24 | **Source of truth:** `data/tables/` CSVs
**How to update prices:** Edit the CSVs only — no code changes needed. Then `git push main` → live in ~2 min.

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
| 18×24" | $39 |
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
$11.00/sqft · Min $45

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

### Vinyl Stickers (STICKER · ARLPMF7008 · 4×4" Die-Cut)
| Qty  | Total  | Per Unit | Savings vs 50 |
|------|--------|----------|---------------|
| 50   | $95    | $1.90    | —             |
| 100  | $160   | $1.60    | save 16%      |
| 250  | $325   | $1.30    | save 32%      |
| 500  | $475   | $0.95    | save 50%      |
| 1000 | $650   | $0.65    | save 66%      |

Most popular: 100 stickers

---

### Business Cards (BUSINESS_CARD · PLACEHOLDER_14PT · 14pt Gloss)
| Qty   | 1-Sided | 2-Sided | Per Unit (2S) |
|-------|---------|---------|---------------|
| 250   | $40     | $45     | $0.18         |
| 500   | $50     | $65     | $0.13         |
| 1000  | $80     | $110    | $0.11         |

**Max qty: 1000** — owner confirmed unprofitable above this. Call for larger runs.
Most popular: 500 (2-sided)

---

### Flyers (FLYER · PLACEHOLDER_80LB or PLACEHOLDER_100LB · 8.5×11")
**80lb Gloss:**
| Qty  | Total | Per Unit | Savings vs 100 |
|------|-------|----------|----------------|
| 100  | $45   | $0.45    | —              |
| 250  | $110  | $0.44    | —              |
| 500  | $135  | $0.27    | save 40%       |
| 1000 | $185  | $0.185   | save 59%       |

**100lb Gloss:**
| Qty  | Total |
|------|-------|
| 100  | $55   |
| 250  | $130  |
| 500  | $185  |
| 1000 | $325  |

Most popular: 500 (80lb)

---

### Brochures (BROCHURE · PLACEHOLDER_TF_100LB / PLACEHOLDER_HF_100LB · 100lb Gloss)
**Tri-Fold (letter 8.5×11 folded to 3 panels):**
| Qty  | Total | Per Unit | Savings vs 100 |
|------|-------|----------|----------------|
| 100  | $70   | $0.70    | —              |
| 250  | $105  | $0.42    | save 40%       |
| 500  | $195  | $0.39    | save 44%       |

**Half-Fold (letter folded in half):**
| Qty  | Total | Per Unit |
|------|-------|----------|
| 100  | $85   | $0.85    |
| 250  | $115  | $0.46    |
| 500  | $210  | $0.42    |

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
| Qty  | Total |
|------|-------|
| 50   | $35   |
| 100  | $45   |
| 250  | $85   |
| 500  | $135  |
| 1000 | $220  |

**3×4":**
| Qty  | Total |
|------|-------|
| 100  | $60   |
| 250  | $110  |
| 500  | $175  |
| 1000 | $280  |

Most popular: 250 (4×6")

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
| H-Stake               | $3.00/each |
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
