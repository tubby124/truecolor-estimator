# True Color Display Printing — Estimator

Internal staff estimator and client quoting tool for True Color Display Printing Ltd., Saskatoon SK.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Updating Prices (No Code Needed)

All pricing lives in `data/tables/`. To update a price:

1. Open the relevant CSV in any spreadsheet app
2. Find the row by `rule_id` or `product_code`
3. Update the value
4. Save and restart the dev server (`npm run dev`)
5. The change takes effect immediately — no code deploy needed

Key files:
- `data/tables/config.v1.csv` — fees, rates, GST, margin thresholds
- `data/tables/pricing_rules.v1.csv` — sqft-based sell price tiers
- `data/tables/products.v1.csv` — fixed-size product prices
- `data/tables/services.v1.csv` — add-on prices (H-Stake, rush, design)
- `data/tables/materials.v1.csv` — supplier material costs
- `data/tables/cost_rules.v1.csv` — cost calculation rules

## Deploying to Railway

1. Push to GitHub
2. Connect repo to Railway
3. Set environment variables from `.env.example`
4. Railway auto-deploys on push to `main`

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | Complete | Staff estimator — live quote tool |
| 2 | Planned | PDF export, shareable quote links |
| 3 | Planned | Wave API integration, Supabase |
| 4 | Planned | Customer dashboard, Clover POS |

## Pricing Version

Current: `v1_2026-02-19`

All prices in CAD. GST 5% applied at subtotal.
