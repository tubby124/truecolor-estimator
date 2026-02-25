# True Color Estimator — Next Steps
**Updated:** 2026-02-24 | Waiting on owner input or external assets.

---

## Smoke Tests

### Automated (run now)
```bash
npm test             # 36 pricing engine unit tests (always passing)
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

### Images — 5 New Product Pages (NEW — 2026-02-24 Sprint 2)

Five new product pages need hero images. Generate with ChatGPT DALL-E v3. Save as WebP 800×600 and drop into `public/images/products/product/`.

#### `stickers-800x600.webp`
> Sheet of 9 die-cut 4×4" vinyl stickers arranged in a 3×3 grid on a clean white background. Bold, colourful brand graphics on each sticker — different designs visible. Matte finish, square die-cut edges crisp and clean. Professional flat-lay product photography style. Teal/cyan and dark charcoal brand colours visible on some stickers.

#### `postcards-800x600.webp`
> Small stack of 4×6" glossy full-colour postcards fanned out on a clean white surface. Top card shows a real estate or retail promo design with vivid colours. Gloss finish visible on the card edges. Professional commercial photography, natural light. Teal/cyan accent colours in the design.

#### `brochures-800x600.webp`
> Two tri-fold brochures on a clean white surface — one open flat showing all 6 panels, one folded closed. Professional healthcare or real estate brochure design, teal and dark brand colours. Matte 100lb gloss stock visible from the folded edges. Commercial photography style, natural daylight.

#### `photo-posters-800x600.webp`
> Large 24×36" matte photo poster mounted on a clean white wall in a bright professional gallery or office setting. Vivid full-colour print — could be an event poster or landscape print. Frame-ready appearance, matte finish with no glare. Natural side light. Photorealistic commercial photography style.

#### `magnet-calendars-800x600.webp`
> Three 8.5×11" custom magnet calendars displayed on a stainless steel refrigerator door in a clean modern kitchen. Full-colour sports team schedule design visible on the magnets — one shows a hockey team schedule, one shows a real estate agent's branded calendar. One magnet held slightly off the fridge showing its flexibility. Professional photography, natural kitchen light.

---

### Images — Window & Vinyl Product Pages (NEW — 2026-02-24)

Three new product pages need hero images. Generate with ChatGPT DALL-E v3. Save as WebP 800×600 and drop into `public/images/products/product/`.

#### `window-perf-800x600.webp`
> Professional storefront window with one-way vision perforated vinyl graphic applied. Full-colour brand graphics visible on exterior glass of a modern retail store. Clean, professional commercial photography style. Brand colours teal/cyan and dark charcoal. Interior of store visible through the perforations from inside. Natural daylight. Photorealistic.

#### `vinyl-lettering-800x600.webp`
> Close-up of a glass door with clean white cut-vinyl lettering showing business hours — Monday through Friday 9am–5pm, Saturday 10am–4pm. Professional retail storefront. The letters are precision-cut vinyl, smooth white, applied directly to clear glass. Natural daylight, clean and sharp. Commercial photography style.

#### `window-decals-product-800x600.webp` *(optional upgrade — currently using gallery image)*
> Vivid full-colour printed adhesive vinyl decal applied to a shop window. The decal features a bold retail promotion graphic with bright colours. Clean glass, professional installation, photorealistic commercial photography. Teal and dark brand colours visible in the decal design.

---

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
| H-Stake & Grommet addon qty bug | ✅ Done — commit 1293157: now × qty (5 signs → 5 stakes) |
| FLYER 100× pricing bug (CRITICAL) | ✅ Done — commit 3d95a77: lot price not multiplied by qty |

### Known Gaps (engine) — Awaiting Owner Input

| Issue | Category | Impact | Fix needed |
|-------|----------|--------|------------|
| FLYER qty 25/50 not in products.v1.csv or rules | FLYER | Low — UI only offers 100/250/500/1000 presets | Confirm if 25/50 qty should be offered; add products + rules |
| MAGNET bulk discount caps at 10% for qty≥25 | MAGNET | Low — may be intentional | Confirm with owner if 25+ magnets should get a higher tier |
| PHOTO_POSTER qty>1 uses sqft fallback rate | PHOTO_POSTER | Low — page launched but shows qty=1 only | If bulk poster orders needed, add multi-qty products to products.v1.csv |
| DECAL / VINYL_LETTERING — pricing rules exist; pages launched 2026-02-24 | DECAL / VINYL | ✅ Resolved — window-decals, window-perf, vinyl-lettering all live | — |
| STICKER / POSTCARD / BROCHURE / PHOTO_POSTER / MAGNET_CALENDAR — pages launched 2026-02-24 | ALL | ✅ Resolved — all 5 product pages live | — |

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
