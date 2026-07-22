# Pricing Safety Gates — True Color Display Printing

## Locked Prices (NEVER "fix" these — they are intentionally priced)

| SKU | Sell Price | Why |
|-----|-----------|-----|
| BANNER-V13-2X6FT | $90 | Owner-set intentional price |
| SIGN-CORO4-4X8FT-S | $232 | Owner-set intentional price |

If a pricing check or linter flags these — IGNORE THE FLAG. Do not touch these rows.

**Retired locks (do NOT re-lock):**
- `RIGID-ACP3-24X36-S` — was locked at $66; retired 2026-05-20 because the
  frozen price caused a per-unit INCREASE at qty 2+ (qty1 used frozen $66
  but qty2+ fell through to the sqft tier @ $13/sqft × 6 sqft = $78). Engine
  now uses T1 sqft @ $13/sqft consistently for all qty. The retired SKU
  stays in CSV with `is_active=FALSE`. Surfaced via the price-consistency
  drift panel (`/staff/lifecycle`) until the doc-drift entry clears.

Authoritative drift detector: `src/lib/data/price-consistency.ts` — extend
`LOCKED_SKUS` there whenever a new intentional fixed price is added so the
CI test guards it automatically.

## Before Editing data/tables/*.csv

1. Run `/pricing-health` first — captures baseline (required gate)
2. Make ONLY the requested change — do not adjust neighbouring rows
3. Run `npm run validate:pricing` — must pass 60 checks
4. Run `npm test` — must pass 47 tests
5. Only then: commit + push to Railway

## Disabled Products (do NOT re-enable without owner approval)

- Business cards >1000 qty
- Postcards single-sided (1S)
- Brochure 100lb (PLACEHOLDER_100LB — waiting for Spicer quote)

## Enabled 2026-05-10 (formerly disabled)

- ACP double-sided (ACP 2S) — owner approved 2026-05-10. Pricing uses **+$6/sqft additive uplift** over 1S tier rate (NOT Coroplast's 1.75× multiplier — ACP panel dominates cost so additive is the cost-honest method). Rules: PR-ACP-D-T1/T2/T3 in pricing_rules.v1.csv.

## Price Display Rules

- All prices in CAD
- GST = 5% — read from `config.v1.csv gst_rate` — NEVER hardcode 0.05
- PST = `(sell_price - design_fee) * 0.06` — shown ONLY at checkout
- Rush fee = PST-EXEMPT — never apply PST to rush line
- fromPrice on product/SEO pages = lowest real CSV price for that category
- NEVER write "contact for pricing" — always show a real number
- Volume discounts = QTY-based only, never sqft-based

## Current marketing anchors (post-edit-price-check.mjs enforces these)

Marketing anchors include the $25 order-total checkout floor. Sqft rates remain
valid when clearly labelled as rates; see `truecolor-pricing-comms.md`.

| Category | Marketing fromPrice | Wrong Value to Watch For |
|----------|---------------------|--------------------------|
| Banners | from $66 | "from $45" |
| ACP signs | from $39 | "from $60" |
| Coroplast signs | from $25 | "from $30" or "from $24" |
| Vehicle magnets | from $25 | "from $45" |
| Window decals | from $25 | "from $45" or "$8/sqft" |
| Vinyl lettering | from $25 | "from $40" |

## Three Pricing Models

1. **SQFT-based** — sell price calculated from sqft × tier rate (pricing_rules.v1.csv)
2. **LOT-price** (`is_lot_price=TRUE`) — fixed price per lot/bundle (products.v1.csv)
3. **Per-unit DISPLAY** — price shown per unit, calculated from products.v1.csv

The engine auto-selects: fixed-size product match first → sqft-tier match second.

## Engine Purity Rule

`src/lib/engine/index.ts` is a pure function — no DB, no API, no side effects.
All rates/fees/minimums come from CSV via `getConfigNum()`. Never hardcode numbers in engine code.
