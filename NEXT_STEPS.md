# True Color Estimator — Next Steps
**Updated:** 2026-02-24 | Waiting on owner input or external assets.

---

## Smoke Tests

### Automated (run now)
```bash
npm test             # 27 pricing engine unit tests (always passing)
npm run test:smoke   # HTTP smoke tests against live Vercel site
```
The smoke tests in `e2e/smoke.test.ts` cover:
- All 14 key pages return 200
- Estimate API: pricing, bulk discounts, addons, fixed-size CSV price
- Clover webhook: missing/bad signature → 401
- Staff API: unauthenticated requests → 401

### Manual — Do These Before Calling It Production-Stable

#### Smoke Test 1 — Card payment + account creation
1. Go to `/products/coroplast-signs`
2. Pick 18×24", qty 5 — confirm **"save 8%"** hint shows
3. Add H-Stakes (×2) — confirm price updates
4. Click "Custom" qty — confirm price doesn't reset to 1
5. Add to cart → Checkout
6. Fill in real info, check "Save my info & create a free account", enter password
7. Choose Clover card → complete payment
8. Confirm `/order-confirmed` page appears
9. Go to `/account` → confirm order shows up
10. Check your inbox: order confirmation email → phone should say (306) 954-8688

#### Smoke Test 2 — eTransfer + all status emails
1. Place a new order with eTransfer payment
2. Go to `/staff/orders` → find the order
3. Advance status → **payment_received** → check customer email received
4. Advance → **in_production** → check customer email
5. Advance → **ready_for_pickup** → check customer email AND Wave invoice email
6. Confirm Wave invoice was sent (check Wave dashboard or customer inbox)
7. Advance → **complete** → confirm no email (expected)

#### Smoke Test 3 — Staff estimator addons
1. Go to `/staff` → select BANNER 24×72 in, qty 1
2. Toggle GROMMETS on — confirm price increases
3. Check that price matches what `/products/vinyl-banners` shows for same config

#### Smoke Test 4 — MAGNET bulk hints
1. Go to `/products/vehicle-magnets`
2. Click qty 5 → confirm **"save 5%"** hint appears
3. Click qty 10 → confirm **"save 10%"** hint appears

---

## Waiting on Owner

### Retractable Banner Stand SKUs (FEAT-02)
**What:** Confirm exact stand model numbers with Spicer (your banner stand supplier).
**When you have the SKUs:** Tell me "I have the retractable banner SKUs" and give me the models + prices.
**I'll do:** Add rows to `data/tables/products.v1.csv` + update `src/lib/data/products-content.ts` → page becomes fully functional with real prices.
**Current state:** `src/app/products/retractable-banners/` page exists but stand pricing is placeholder.

### Images — You Generate, I'll Integrate
**Where the prompts are:**
- `research/content/truecolor-image-gen-instructions.md` — main generation guide
- `research/content/image_generation_brief.md` — brief + specs
- `research/content/truecolor-image-gen-nanobananapro.md` — product-specific prompts
- `research/content/truecolor-image-gen-v2-industries.md` — industry scene prompts

**Workflow:**
1. Open ChatGPT (GPT-4o or DALL·E 3)
2. Follow the prompts in `truecolor-image-gen-instructions.md`
3. Download generated PNGs
4. Drop them into this project folder — I'll convert to WebP + update the image paths

**Where images go:**
- Hero/product: `public/images/products/product/` (WebP, 800×600)
- Gallery: `public/images/gallery/` (WebP, any size)
- How It Works steps (3 icons/images): `public/images/how/` (create this folder)

**Naming convention:** `kebab-case-description-WIDTHxHEIGHT.webp`
Example: `coroplast-yard-sign-800x600.webp`

---

## Future / Lower Priority

### Brevo Lead Import (FEAT-04)
- Source: `research/leads/leads_master.csv` — 347 leads, 8 industry segments
- Lists ready in Brevo: RE=11, Con=12, Ag=13, HC=14, Ret=15, Ev=16, NP=17, Spt=18
- Email campaigns drafted: Day 0 (ID 28), Day 7 (ID 26), Day 14 (ID 27)
- Can do with MCP tools when you're ready to launch cold outreach

### Database Backups (CQ-04)
- Supabase free tier = no point-in-time recovery
- Option A: Upgrade to Supabase Pro ($25/month) — daily backups + PITR
- Option B: pg_dump via Vercel cron — more complex, free
- Recommendation: Pro tier if this is live revenue data

### Wave Invoice Send — Multi-send guard (FEAT-01 follow-up)
- Gap: if staff clicks `ready_for_pickup` twice, Wave may error on second approve
- Fix: check invoice status before approve (`invoice { status }` query) — low priority

### Window Decals page
- No product page yet — waiting on pricing confirmation from owner

### Realtor Kit bundle page
- Concept: coroplast sign + magnet + feature sheet bundle — waiting on owner confirmation

### OG Image — upgrade to designed version
- Current: code-generated SVG (`public/og-image.svg`) → rasterized to `public/og-image.png`
- To upgrade: design a 1200×630 PNG in Figma/Canva → drop into `public/og-image.png`
- To regenerate from SVG edits: `npm run gen-og`

---

## What's Done

| Fix | Status |
|-----|--------|
| Clover HMAC bypass (CRITICAL) | ✅ Done — commit f084d4e |
| Hardcoded Vercel preview URL | ✅ Done |
| Phone number unified to 954-8688 | ✅ Done |
| Addon pricing uses engine formula | ✅ Done |
| MAGNET bulk hints now show | ✅ Done |
| Custom qty no longer resets to 1 | ✅ Done |
| OptionsPanel qty: select-on-focus | ✅ Done |
| Dead files deleted (2 files) | ✅ Done |
| Supabase URL — env var with fallback | ✅ Done |
| Wave invoice send on pickup | ✅ Done |
| 27 → 30 pricing engine unit tests | ✅ Done (`npm test`) |
| HTTP smoke tests (14 routes + API + security) | ✅ Done (`npm run test:smoke`) |
| OG image — branded 1200×630 SVG → PNG | ✅ Done (`public/og-image.png`) |
| GST double-counting bug fixed | ✅ Done — price already includes addons; was adding addonTotal twice |
| line_items piped: engine → cart → checkout → email | ✅ Done — full breakdown visible everywhere |
| MAGNET MOST_POPULAR_QTY 4→5 (hint now shows) | ✅ Done |
| OptionsPanel MAGNET presets [1,2,4]→[1,2,4,5,10] | ✅ Done |
| PriceSummary shows engine addon sub-lines (not local calc) | ✅ Done |
| DB migration `line_items_json JSONB` | ✅ Done — run by owner 2026-02-24 |
| Grommet count suggestion (UX) | ✅ Done — live hint "~X for your size" on sign page |
| Banner grommets included note | ✅ Done — blue info box shows count + "included standard" |
| Addon tip text (H-stakes, Grommets) | ✅ Done — `tip` field in products-content.ts |

---

## Grommet Count Logic (for reference)

Engine formula (matches `config.v1.csv` — do NOT hardcode these elsewhere):
- `grommet_spacing_ft` = 2 ft between grommets
- `grommet_minimum_count` = 4 minimum regardless of size
- `count = max(4, ceil(perimeter_ft / 2))`
- `perimeter_ft = 2 × (width_in/12 + height_in/12)`

Example estimates:
| Sign size | Perimeter | Grommets | Cost |
|-----------|-----------|---------|------|
| 18×24 in | 7 ft | 4 | $8.00 |
| 24×36 in | 10 ft | 5 | $10.00 |
| 24×48 in | 12 ft | 6 | $12.00 |
| 48×96 in | 24 ft | 12 | $24.00 |
| 24×72 in (banner) | 16 ft | 8 | included |

Client-side estimate in `ProductConfigurator.tsx` mirrors this formula exactly (confirmed by unit test).
