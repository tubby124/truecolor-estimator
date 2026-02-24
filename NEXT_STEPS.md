# True Color Estimator — Next Steps
**Updated:** 2026-02-24 | All items from Lyra audit that need owner input or external assets.

---

## Smoke Tests (Manual) — Do These First

Run through these on the live site before calling it production-stable.

### Smoke Test 1 — Card payment + account creation
1. Go to `/products/coroplast-signs`
2. Pick 18×24", qty 5 — confirm **"save 8%"** hint shows ✓
3. Add H-Stakes (x2) — confirm price updates (now uses engine formula)
4. Click "Custom" qty — confirm price doesn't reset to 1 ✓
5. Add to cart → Checkout
6. Fill in real info, check "Save my info & create a free account", enter password
7. Choose Clover card → complete payment
8. Confirm `/order-confirmed` page appears
9. Go to `/account` → confirm order shows up
10. Check your inbox: order confirmation email → phone number should say (306) 954-8688

### Smoke Test 2 — eTransfer + all status emails
1. Place a new order with eTransfer payment
2. Go to `/staff/orders` → find the order
3. Advance status → **payment_received** → check customer email received
4. Advance → **in_production** → check customer email
5. Advance → **ready_for_pickup** → check customer email AND Wave invoice email (new!)
6. Confirm Wave invoice was sent (check Wave dashboard or customer inbox)
7. Advance → **complete** → confirm no email (expected)

### Smoke Test 3 — Staff estimator addons
1. Go to `/staff` → select BANNER 24×72 in, qty 1
2. Toggle GROMMETS on — confirm price increases
3. Check that price matches what `/products/vinyl-banners` shows for same config

### Smoke Test 4 — MAGNET bulk hints
1. Go to `/products/vehicle-magnets`
2. Click qty 5 → confirm **"save 5%"** hint appears
3. Click qty 10 → confirm **"save 10%"** hint appears

---

## Waiting on Owner

### OG Image (FEAT-03)
**What:** 1200×630 px branded image for social sharing (Twitter, iMessage, Google previews).
**Options:**
- A: I generate a code-based one using SVG/canvas (text + brand colors + logo) — can do now
- B: You provide a designed image → save as `public/og-image.png`
**Current state:** Logo is used as placeholder in `src/app/layout.tsx`. Works but not ideal.

### Retractable Banner Stand SKUs (FEAT-02)
**What:** Owner to confirm exact stand model numbers with supplier (Spicer).
**Then:** Add rows to `data/tables/products.v1.csv` + update `src/lib/data/products-content.ts` → retractable banner page becomes fully functional with real prices.
**Current state:** `src/app/products/retractable-banners/` page exists but stand pricing is placeholder.

### Phone Number — Confirmed ✓
**(306) 954-8688** — fixed sitewide in this sprint.

---

## Images — You Generate, I'll Integrate

### Hero + Product Images
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
- Option A: Upgrade to Supabase Pro ($25/month) — gets you daily backups + PITR
- Option B: Set up pg_dump via Vercel cron — more complex, free
- Recommendation: Pro tier if this is production revenue data

### Wave Invoice Send — Multi-send guard (FEAT-01 follow-up)
- Current: `ready_for_pickup` approves + sends the DRAFT invoice to customer
- Gap: if staff accidentally clicks `ready_for_pickup` twice, Wave may error on second approve
- Fix: check invoice status before approve (Wave API: `invoice { status }`) — low priority for now

### Window Decals page
- No product page exists yet — waiting on pricing confirmation

### Realtor Kit bundle page
- Concept: coroplast sign + magnet + feature sheet bundle — waiting on owner confirmation

---

## What's Done (This Sprint)

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
| 27 pricing engine unit tests | ✅ Done (npm test) |
