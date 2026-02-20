# CLAUDE.md — True Color Estimator

## Project Identity
- **True Color Display Printing Ltd.** — wide-format + digital print shop, Saskatoon SK
- Internal staff estimator (Phase 1 COMPLETE) evolving into full public-facing production platform
- Target deployment: **Railway** | Future DB: **Supabase** | Payment: **Clover** (future) | Auth: **Clerk or NextAuth** (Phase 2)
- All prices in **CAD**. GST = 5% applied at subtotal. Pricing version `v1_2026-02-19`.
- This ships to production. Build it like it will be shown to customers from day one.

## Zero-Hallucination Policy
Every price, fee, rate, and business rule must trace to a row in `data/tables/*.csv`.
If a value has no CSV source, flag it with `// PLACEHOLDER — no CSV source` — **never silently assume a value**.

## Everything Is In Progress
All pricing data, invoice history, and cost rates are actively being reviewed and refined.
- Do not treat any number as final — it may be updated when Spicers data or invoice analysis arrives
- All thresholds, fees, and rates are provisional until owner explicitly confirms them
- Design the system to be revised without code deployments: CSV edits only

## Source Authority Hierarchy (highest → lowest)
1. `data/tables/config.v1.csv` — master business rules, fees, rates. **Overrides any hardcoded value.**
2. `data/tables/pricing_rules.v1.csv` — sell price tiers. Source of truth for sqft-based pricing.
3. `data/tables/products.v1.csv` — fixed-size product catalog. Overrides tier rules when exact match found.
4. `data/tables/services.v1.csv` — add-on sell prices (H-Stake, grommets, design, rush).
5. `data/tables/cost_rules.v1.csv` — cost logic for margin calculation only. Never affects sell price.
6. `data/tables/materials.v1.csv` — material costs. PLACEHOLDER rows are NOT authoritative — flag, never assume.

## /docs/ Folder Protocol
- `/docs/` is read-only reference. Do not write plan or working files there.
- All agent plan files go to `.claude/plans/` — NOT to `/docs/`.
- After each sprint, Orchestrator writes or updates `/docs/SYSTEM.md` as the handoff document.

## Design System — Apple-Clean, Premium Brand
- Maximum 2 font sizes per view.
- Single brand color: `var(--brand)` = #e63020. No decorative gradients, shadows, or ornaments.
- Generous whitespace. If it feels empty, that's correct.
- Proofs render like real printed documents, not UI widgets.
- Staff views: functional density. Customer views: simplicity and trust.
- No emojis in code unless already present.
- When uncertain about UI/UX best practices, use a web-search agent to research before guessing.

## Architecture Principles
- `src/lib/engine/index.ts` is a **pure function** — same input → same output, no side effects. Never break this.
- Wave line name format is frozen. Do not change `buildWaveName()` output format.
- No new npm packages without flagging to Orchestrator first with: package name + why it's needed + what it replaces.
- No database yet — CSV files stay flat until Supabase migration phase.
- Route split: `/staff/*` = internal tool (will be auth-gated) | `/` = public-facing site.

## Production Standards
**Security:**
- Staff routes will be auth-gated (Phase 2). Never expose cost/margin data to unauthenticated requests.
- API routes validate all input. No user input reaches the filesystem or database unvalidated.
- Environment variables for all secrets. No secrets in code or CSV files.

**Performance:**
- Core Web Vitals: LCP < 2.5s, CLS < 0.1. No layout shift on price update.
- CSV loader memoization is fine for Phase 1. Phase 3: move to Supabase edge queries.

**GitHub:**
- Commit messages follow Conventional Commits (feat/fix/chore/docs/refactor).
- Never commit `.env` files, CSV backups (*.csv.bak), or `node_modules`.

## Sub-Agent File Domain Boundaries (hard stops — agents do not cross these)
| Agent | Owns |
|---|---|
| proof-designer | `src/components/estimator/ProductProof.tsx` only |
| pricing-configurator | `data/tables/*.csv` + `src/lib/engine/` + `src/lib/data/` |
| ui-polish | `src/components/estimator/OptionsPanel.tsx` + `QuotePanel.tsx` + `src/app/globals.css` |
| architect | `.gitignore` + `railway.toml` + `.env.example` + `README.md` + `src/app/[new public routes]` |

Orchestrator coordinates cross-domain touches (e.g. page.tsx prop updates).

## Error Handling Standards
- Zero/invalid dimensions → inline field error, block estimate() call, never send bad data to API
- Malformed CSV row → surface named error with row ID, do not silently fallback
- API timeout/failure → show retry state in QuotePanel, never blank panel
- PLACEHOLDER material cost → yellow warning banner in QuotePanel (data from engine, visual from ui-polish)
- Missing category → BLOCKED status (already implemented — preserve it)

## Interface Contract: PLACEHOLDER Warning
`pricing-configurator` adds to `EstimateResponse`:
- `has_placeholder: boolean`
- `placeholder_materials: string[]`

`ui-polish` reads these fields to render the yellow warning banner in QuotePanel. No direct file overlap.

## Interface Contract: Margin Thresholds
`pricing-configurator` adds to `EstimateResponse`:
- `margin_green_threshold: number` (from config.v1.csv)
- `margin_yellow_threshold: number` (from config.v1.csv)

`ui-polish` reads these in QuotePanel's `MarginBadge`. Never hardcode threshold values.

## Known Gaps (do not fill with assumptions)
| Gap | Description | Status |
|---|---|---|
| GAP-01 | Foamboard 5mm material cost | PLACEHOLDER — awaiting Spicers |
| GAP-02 | 14pt card stock cost | PLACEHOLDER — awaiting Spicers |
| GAP-03 | 80lb gloss text paper cost | PLACEHOLDER — awaiting Spicers |
| GAP-04 | 100lb gloss text paper cost | PLACEHOLDER — awaiting Spicers |
| Q4 | Cards per sheet (imposition) | Add `cards_per_sheet` column to products.v1.csv; default 1 |
| Q6 | Booklet/menu pricing ($7,908 uncatalogued) | Leave as BLOCKED category |
| Q7 | INK HOUSE partner discount % | Do not apply until confirmed rate in CSV |

## Supplier Data Intake Protocol
The owner periodically adds new Spicers pricing files to the working folder.

When new supplier data arrives:
1. Orchestrator reads the new file(s) from `/Users/owner/Downloads/TRUE COLOR PRICING /`
2. Cross-references against `materials.v1.csv` and `cost_rules.v1.csv`
3. Fills in PLACEHOLDER rows with real costs (supplier_unit_cost, supplier_date, supplier_invoice_ref)
4. Sets `is_placeholder = FALSE` for updated rows
5. Runs sanity check to confirm margin calculations update correctly
6. Logs change in `/docs/SUPPLIER_LOG.md` with date, file name, and what changed

No code changes needed — CSV edits only. This closes GAP-01 through GAP-04.
