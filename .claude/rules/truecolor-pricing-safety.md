# Pricing Safety Gates — True Color Display Printing

## Locked Prices (NEVER "fix" these — they are intentionally priced)

| SKU | Sell Price | Why |
|-----|-----------|-----|
| BANNER-V13-2X6FT | $90 | Owner-set intentional price |
| RIGID-ACP3-24X36-S | $66 | Owner-set intentional price |
| SIGN-CORO4-4X8FT-S | $232 | Owner-set intentional price |

If a pricing check or linter flags these — IGNORE THE FLAG. Do not touch these rows.

## Before Editing data/tables/*.csv

1. Run `/pricing-health` first — captures baseline (required gate)
2. Make ONLY the requested change — do not adjust neighbouring rows
3. Run `npm run validate:pricing` — must pass 60 checks
4. Run `npm test` — must pass 47 tests
5. Only then: commit + push to Railway

## Disabled Products (do NOT re-enable without owner approval)

- ACP double-sided (ACP 2S)
- Business cards >1000 qty
- Postcards single-sided (1S)
- Brochure 100lb (PLACEHOLDER_100LB — waiting for Spicer quote)

## Price Display Rules

- All prices in CAD
- GST = 5% — read from `config.v1.csv gst_rate` — NEVER hardcode 0.05
- PST = `(sell_price - design_fee) * 0.06` — shown ONLY at checkout
- Rush fee = PST-EXEMPT — never apply PST to rush line
- fromPrice on product/SEO pages = lowest real CSV price for that category
- NEVER write "contact for pricing" — always show a real number
- Volume discounts = QTY-based only, never sqft-based

## Known fromPrice Minimums (post-edit-price-check.mjs enforces these)

| Category | Min fromPrice | Wrong Value to Watch For |
|----------|-------------|--------------------------|
| Banners | from $66 | "from $45" |
| ACP signs | from $60 | "from $39" |
| Coroplast signs | from $30 | "from $24" |
| Vehicle magnets | from $45 | "from $24/sqft" |
| Window decals | $11/sqft | "$8/sqft" |

## Three Pricing Models

1. **SQFT-based** — sell price calculated from sqft × tier rate (pricing_rules.v1.csv)
2. **LOT-price** (`is_lot_price=TRUE`) — fixed price per lot/bundle (products.v1.csv)
3. **Per-unit DISPLAY** — price shown per unit, calculated from products.v1.csv

The engine auto-selects: fixed-size product match first → sqft-tier match second.

## Engine Purity Rule

`src/lib/engine/index.ts` is a pure function — no DB, no API, no side effects.
All rates/fees/minimums come from CSV via `getConfigNum()`. Never hardcode numbers in engine code.
