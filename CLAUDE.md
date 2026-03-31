@.claude/rules/truecolor-domain.md
@.claude/rules/truecolor-pricing-safety.md
@.claude/rules/truecolor-seo-safety.md
@.claude/rules/truecolor-security.md
@.claude/rules/truecolor-pricing-comms.md
@.claude/rules/seo-standards.md
@.claude/rules/seo-protected-pages.md
@.claude/rules/brand-voice.md
@.claude/rules/content-pipeline.md
@.claude/rules/content-formats.md
@.claude/rules/payment-tax.md
@~/.claude/rules/mcp-usage.md

## Mandatory Skill Gates
- /pricing-health       → before any pricing CSV or engine deploy
- /pricing-review [cat] → before any new product/size (researches competitors + calculates margins)
- /web-design-ux        → before any UI component ships
- /ecommerce-ux         → before any checkout/order/email feature ships
- /e2e-test             → before every production push to Railway
- /truecolor-page       → before any new SEO landing page

## SEO Sprint Log — NON-NEGOTIABLE RULE
After ANY of the following, you MUST immediately update:
`~/.claude/projects/-Users-owner-Downloads-TRUE-COLOR-PRICING-/memory/seo-sprints.md`

Triggers (update on ALL of these, no exceptions):
- Any SEO page created, expanded, or content changed
- Any title tag, meta description, or H1 changed
- Any internal link updated (href destination changes)
- Any schema added, modified, or removed
- Any redirect added to next.config.ts
- Any sitemap.ts entry added or date changed
- Any opportunity identified but deferred (wave scheduling, "not yet shipped")
- Any ranking movement recorded from GSC

Entry format (append to bottom of file under a new ## heading):
```
## SEO Phase [N] — [Short Title] ([YYYY-MM-DD])
- Files changed: list them
- What shipped: bullets
- What was deferred/flagged: separate bullets with reason
- Next steps / trigger date
```

Do not end any True Color SEO session without this being current.

## Auth Rules
- getSession() for UI — NEVER getUser()
- requireStaffUser() on ALL /api/staff/* routes
- Staff = email === STAFF_EMAIL (env var)
- signUp() returns session immediately — no email confirmation step

# CLAUDE.md — True Color Display Printing Estimator

> **Shared brain for all Claude agents and sessions working on this codebase.**
> Read this entire file before touching any code. Zero-hallucination policy is always active.

---

## Project Overview

**True Color Display Printing Ltd.** — Full e-commerce print shop at [truecolorprinting.ca](https://truecolorprinting.ca).
Customers browse products, configure orders, check out via Clover, and track jobs in their account.
Staff manage orders and quotes through an auth-gated portal.

**Deploy:** Push `main` → Railway auto-deploys (~2 min). Live at `https://truecolorprinting.ca`.
GitHub: `tubby124/truecolor-estimator` (PUBLIC)
Railway CNAME: `cc0c74ro.up.railway.app` | Cloudflare orange cloud

**Stack:** Next.js 16.1.6 · TypeScript strict · Tailwind CSS v4 · motion v12.x
- motion: `import { motion, AnimatePresence } from "motion/react"` — only in "use client" files
- `@resvg/resvg-js` must be in `serverExternalPackages` in next.config.ts
- Email: Brevo REST API (`src/lib/email/smtp.ts`) — Railway Hobby blocks all SMTP

**Pricing version:** `v1_2026-02-19` | **All prices CAD** | **GST = 5%**

---

## Zero-Hallucination Policy

Every price, fee, rate, and business rule must trace to a CSV source file.
Never invent numbers. Never assume a rate. If you don't have a CSV source, mark it PLACEHOLDER.

**Allowed sources (priority order):**
1. `data/tables/config.v1.csv` — master business rules (GST, fees, thresholds)
2. `data/tables/pricing_rules.v1.csv` — sqft-tier sell prices by category + material
3. `data/tables/products.v1.csv` — fixed-size catalog with exact prices
4. `data/tables/services.v1.csv` — add-on prices (H-Stake, rush, design fees)
5. `data/tables/cost_rules.v1.csv` — cost logic for margin calculation
6. `data/tables/materials.v1.csv` — supplier costs (some are PLACEHOLDER)

If a value conflicts between sources, **higher in the list wins.**

---

## Route Map

### Public / Customer
`/` `/quote` `/products/[slug]` `/cart` `/checkout` `/order-confirmed`
`/gallery` `/services` `/about` `/contact`
`/account` `/account/callback`
`/pay/[token]` `/quote/[id]`

### SEO Landing Pages
`/banner-printing-saskatoon` `/flyer-printing-saskatoon` `/sign-company-saskatoon`
`/coroplast-signs-saskatoon` `/business-cards-saskatoon` `/sticker-printing-saskatoon`
`/vinyl-lettering-saskatoon` `/vehicle-magnets-saskatoon` `/window-decals-saskatoon`
`/agriculture-signs-saskatoon` `/retail-signs-saskatoon` `/healthcare-signs-saskatoon`
`/restaurant-signs-saskatoon` `/election-signs` `/event-banners` (+ others in sitemap.ts)

### Staff Portal (auth-gated, noindex)
`/staff` `/staff/login` `/staff/orders` `/staff/coupons` `/staff/quotes`
`/staff/social` `/staff/social/blitz` `/staff/social/image-prompts` `/staff/social/gmb`

### Active Product Slugs (for /products/[slug])
coroplast-signs · vinyl-banners · acp-signs · vehicle-magnets · flyers · business-cards
foamboard-displays · retractable-banners · window-decals · window-perf · vinyl-lettering
stickers · postcards · brochures · photo-posters · magnet-calendars

### noindex Headers Applied To
`/cart` `/checkout` `/order-confirmed` `/pay/:path*` `/staff/:path*`
`/account` `/account/:path*` `/products/:path+` `/api/:path*`

---

## Architecture

### Component Hierarchy (post-2026-03-26 refactor)

```
src/app/
├── account/AccountClientPage.tsx        — thin shell; delegates to components/account/*
├── staff/orders/OrdersTable.tsx         — thin shell; delegates to components/staff/orders/*
├── staff/quotes/QuotesTable.tsx         — thin shell; delegates to components/staff/quotes/*

src/components/
├── account/
│   ├── AuthGate.tsx                     — Supabase session gate + sign-in/sign-up form
│   ├── OrderCard.tsx                    — single order row with receipt + status stepper
│   ├── OrdersList.tsx                   — paginated order history list
│   ├── PasswordResetForm.tsx            — password change form
│   ├── ProfileForm.tsx                  — name/email update form
│   ├── QuotesList.tsx                   — quote request history
│   ├── ReceiptModal.tsx                 — order receipt overlay
│   ├── StatusStepper.tsx                — order status progress bar
│   └── WelcomeBanner.tsx                — returning customer badge + autofill trigger
├── staff/
│   ├── orders/StaffOrderCard.tsx        — per-order card with all order actions
│   └── quotes/
│       ├── QuoteCard.tsx                — single quote card with reply/status controls
│       ├── QuoteBuilderModal.tsx        — convert quote → estimator prefill
│       └── QuoteReplyModal.tsx          — staff reply composer
├── estimator/
│   ├── CategoryPicker.tsx               — product category grid
│   ├── OptionsPanel.tsx                 — dimensions, qty, sides, add-ons, design, rush
│   ├── ProductProof.tsx                 — SVG proof diagram
│   ├── QuotePanel.tsx                   — live quote display + action buttons
│   ├── EmailModal.tsx                   — email quote modal + Pay Now toggle
│   ├── MultiQuoteCart.tsx               — multi-item cart
│   └── WaveModal.tsx                    — Wave invoice creation
├── product/
│   ├── ProductPageClient.tsx            — product configurator shell
│   ├── ProductConfigurator.tsx          — options + pricing on product pages
│   ├── ProductGallery.tsx               — image gallery
│   ├── ProductAccordion.tsx             — FAQ accordion
│   ├── ProductTabs.tsx                  — specs/FAQ tabs
│   ├── PriceSummary.tsx                 — price display
│   └── CustomerProof.tsx                — customer-facing proof
├── site/
│   ├── IndustryPage.tsx                 — SEO landing page server component (schema + FAQs)
│   ├── DesignDirectionGrid.tsx          — niche mockup grid (used on SEO pages)
│   ├── SiteNav.tsx / SiteFooter.tsx     — global layout
│   └── AccountIcon.tsx / CartIcon.tsx   — nav icons
├── home/
│   ├── HeroSlider.tsx                   — homepage hero (motion/react)
│   └── (ReviewsSection, GalleryStrip, etc.)
└── social/
    └── (BlitzPipeline, LeadsTable, NicheTable, etc. — /staff/social/* only)
```

### The Pricing Engine (Core)

`src/lib/engine/index.ts` — pure function, no side effects, no database, idempotent.

```
estimate(EstimateRequest) → EstimateResponse
```

**11-step algorithm:**
1. Validate inputs (category required → BLOCKED if missing)
2. Compute sqft from width_in/12 × height_in/12
3. Fixed-size product lookup (exact match: category + material + sides + dimensions + qty)
4. Sqft-tier pricing (match rule by category + material + sqft range)
5. Add-ons: GROMMETS (auto from perimeter), H_STAKE ($2.50), CARD_STOCK_16PT (+$10)
6. Apply minimum charge (min_charge from rule, or category default)
7. Design fee (MINOR_EDIT +$35, FULL_DESIGN +$50, LOGO_RECREATION +$75)
8. Rush fee (+$40 flat, PST-exempt)
9. Totals: sell_price (pre-tax), gst = sell_price × gst_rate, total = sell_price + gst
10. PST at checkout only: pst = (sell_price - design_fee) * 0.06 per item
11. Wave line name: "CATEGORY – MATERIAL – SIZE – SIDES" format

All rates/fees/minimums read from config.v1.csv via `getConfigNum()`. Never hardcode.

### Data Layer

`src/lib/data/loader.ts` — CSV parser with memoized singletons.

```typescript
getPricingRules()  → PricingRule[]     // pricing_rules.v1.csv
getProducts()      → Product[]         // products.v1.csv (is_active only)
getMaterials()     → Material[]        // materials.v1.csv
getServices()      → Service[]         // services.v1.csv (is_active only)
getConfig()        → Record<string, string>   // config.v1.csv
getConfigNum(key)  → number            // throws if missing/non-numeric
```

CSV files live at `data/tables/`. DATA_DIR = `path.join(process.cwd(), "data", "tables")`.
**Restarting the dev server reloads CSVs.** Production: push main → Railway redeploys.

### Database Tables

**Customer/order tables:** `customers` · `orders` · `order_items` · `discount_codes` · `discount_redemptions` · `quote_requests`
**Industry blitz tables:** `tc_leads` · `tc_campaigns` · `tc_niche_registry` · `tc_email_templates` · `tc_email_sends`

RLS: enabled on `quote_requests` (service role only). All blitz tables have RLS.

### Email System

All email via Brevo REST API — `src/lib/email/smtp.ts`.
Railway Hobby blocks all SMTP — nodemailer is NOT used.
Shared components in `src/lib/email/components/` (Header, Footer, Button, Section, Card).
Never duplicate header/footer HTML — always use shared components.
BCC: always BCC hasan.sharif.realtor@gmail.com + albert@true-color.ca on customer emails.

### Payment System

**Gateway pattern** — solves Clover's 15-minute checkout session expiry:
- Email link points to `/pay/[token]` (permanent URL on Railway)
- On every click: decode HMAC token → `createCloverCheckout()` → server-side redirect to fresh Clover URL
- Token: `{ amountCents, description, exp (30d), v: 1 }` signed with PAYMENT_TOKEN_SECRET (HMAC-SHA256)

`src/lib/payment/clover.ts` — `POST https://www.clover.com/invoicingcheckoutservice/v1/checkouts`
`src/lib/payment/token.ts` — `encodePaymentToken()` / `decodePaymentToken()`

**IMPORTANT:** `redirect()` must be OUTSIDE try/catch. It throws `NEXT_REDIRECT` internally — wrapping in try/catch intercepts it and you get ErrorPage instead. Store URL in variable inside try, call `redirect(url)` after the block.

---

## Clover MCP Server

Custom MCP server at `/Users/owner/clover-mcp/index.mjs`.

**Tools:** `clover_get_merchant` · `clover_list_orders` · `clover_list_payments` · `clover_list_customers` · `clover_list_items` · `clover_sales_summary`

**Key notes:**
- Auth: `CLOVER_API_KEY` + `CLOVER_MERCHANT_ID` (no OAuth)
- Filter syntax: **separate `filter=` params** — NEVER AND-join
  - CORRECT: `url.searchParams.append("filter", "createdTime>=X"); url.searchParams.append("filter", "createdTime<Y")`
  - WRONG: `filter=createdTime>=X and createdTime<Y`
- Order state "locked" = completed/paid (not "paid")
- Requires Claude Code restart to pick up index.mjs changes

---

## Design System

**Brand:** `#e63020` (CSS var: `--brand`)
**Background:** `#f8f8f8` · **Foreground:** `#111111` · **Border:** `#e5e5e5`
**Fonts:** Geist (body) · Geist Mono (prices, mono data)

**Margin badge colors** (thresholds from config.v1.csv):
- Green: margin > `margin_green_threshold` (default 50%)
- Yellow: margin ≥ `margin_yellow_threshold` (default 30%)
- Red: margin < yellow threshold

**PLACEHOLDER warning:** Yellow banner when `has_placeholder=true` in response.
Apple-clean aesthetic. Every element earns its place. No decorative ornaments.

---

## Environment Variables (Railway — NEVER commit)

Full list in `memory/railway.md`. Key vars:

```
NEXT_PUBLIC_SITE_URL          — https://truecolorprinting.ca
NEXT_PUBLIC_SUPABASE_URL      — https://dczbgraekmzirxknjvwe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY — anon key for client-side Supabase
SUPABASE_SECRET_KEY           — service role key (server-side only)
BREVO_API_KEY                 — Brevo REST API key (email sending)
CLOVER_ECOMM_PRIVATE_KEY      — creates Clover checkout sessions
CLOVER_MERCHANT_ID            — merchant ID
CLOVER_ENVIRONMENT            — production
PAYMENT_TOKEN_SECRET          — 64 hex chars — signs payment gateway tokens
STAFF_EMAIL                   — staff auth gate email check
WAVE_BUSINESS_ID              — Wave accounting integration
CRON_SECRET                   — protects /api/cron/* routes
```

---

## Deployment

**Platform:** Railway | Auto-deploy on push to `main` (~2 min)
**Health check:** `/api/estimate`
**Custom domain:** truecolorprinting.ca | Cloudflare orange cloud (CNAME → cc0c74ro.up.railway.app)

**Change workflow:**
1. Edit files locally
2. `npm run build` — verify clean
3. `git add [files] && git commit -m "..." && git push`
4. Railway detects push → redeploys (~2 min)
5. Refresh browser → change is live

**Pricing-only changes:** Edit CSV in `data/tables/` → commit → push. No code changes needed.

---

## Architecture Rules

1. **No new npm packages** without explicit approval.
2. **Engine stays pure.** No database calls, no API calls, no side effects in `src/lib/engine/`.
3. **CSV is pricing truth.** All prices from CSV via `getConfigNum()`. Never hardcode numbers.
4. **PLACEHOLDER is not an error.** Margin calculation is partial — UI warns, quote still works.
5. **GST = 5%** from `config.v1.csv gst_rate` — never hardcode.
6. **PST = `(sell_price - design_fee) * 0.06`** — shown only at checkout. Rush = PST-exempt.
7. **Email HTML = inline CSS only.** No Tailwind, no classes, no external stylesheets. Gmail requires it.
8. **TypeScript strict.** No `any` casts. Types mirror CSV schemas exactly.
9. **Push main = Railway redeploy.** One concern per commit. Conventional Commits format.
10. **Payment tokens are HMAC-signed.** Never trust raw amount from URL. Always decode via `decodePaymentToken()`.
11. **Clover filter syntax = multiple `filter=` params.** Do NOT join with `AND` — it breaks the API.
12. **`redirect()` outside try/catch.** It throws internally — wrapping kills it.
13. **getSession() not getUser() for UI.** getUser() makes an extra network call and is for server-side verification only.
14. **Wave: NEVER invoiceCreatePayment.** Use moneyTransactionCreate.

---

## Known Open TODOs

| ID | Task | Notes |
|----|------|-------|
| TODO-1 | `/staff/quotes` admin view | Model after /staff/orders. `quote_requests` table exists, RLS active. |
| TODO-2 | SMTP_BCC Railway env | smtp.ts supports comma-separated BCCs. Set Railway var: `SMTP_BCC=hasan.sharif.realtor@gmail.com,albert@true-color.ca` |
| TODO-3 | DECAL RMVN006 bug | Can't select window perf in OptionsPanel. Investigation needed. |
| TODO-5 | Spicer quote | 100lb gloss text + 15mil magnet cost — call Spicer before enabling PLACEHOLDER_100LB |

---

## Supplier Data Intake Protocol

When new Spicers pricing files arrive:
1. Read the new file from `/Users/owner/Downloads/TRUE COLOR PRICING /`
2. Cross-reference against `materials.v1.csv` and `cost_rules.v1.csv`
3. Fill in PLACEHOLDER rows (supplier_unit_cost, supplier_date, supplier_invoice_ref)
4. Set `is_placeholder = FALSE` for updated rows
5. Run `npm run validate:pricing` + `npm test` — must both pass
6. Commit + push → Railway redeploys → margin calculations update live

---

## SEO Standards — Always Enforce

> Every page you build or edit is an SEO asset. Rankings: banner #1 Maps | flyer #3 | sign #4 | coroplast #3 | BC #1.

Run `/truecolor-seo` before building or editing any page.

### Auto-Checklist for Any Page Edit

| Check | Requirement |
|---|---|
| `title` | 50–60 chars · starts with primary keyword · ends with `\| True Color Printing Saskatoon` |
| `description` | 150–160 chars · keyword + price mention + location |
| H1 | Contains primary keyword · ONE per page only |
| URL | `/keyword-saskatoon` or `/keyword-saskatchewan` format |
| Pricing | Real prices from CSV — NEVER "contact for pricing" |
| CTA above fold | "Get an instant price" → `/products/[slug]` |
| Schema | Service + FAQPage + BreadcrumbList on every landing page |
| noindex | MUST be on: `/pay/[token]`, `/cart`, `/checkout`, `/order-confirmed`, `/staff/*` |
| Sitemap | New page added to `src/app/sitemap.ts` with hardcoded date |
| Internal links | ≥2 links to product pages |

### Schema Required on Every Landing Page

Three schema types — all JSON-LD in `<script type="application/ld+json">`:
1. **Service** — `serviceType`, `areaServed: Saskatoon`, `offers.price` (real price from CSV)
2. **FAQPage** — minimum 3 questions
3. **BreadcrumbList** — home → this page

---

## UX Standards — Always Enforce

| Skill | When to use |
|-------|-------------|
| `/web-design-ux` | Before any component PR |
| `/ecommerce-ux` | Before any checkout/order/email change |

**Always import — never recreate:**
```tsx
import { sanitizeError } from "@/lib/errors/sanitize";
import { Skeleton, SkeletonCard, SkeletonPrice } from "@/components/ui";
import { useToast, ToastContainer } from "@/components/ui";
```

**Email sequence (7 required):**
order_confirmation → payment_received → in_production → ready_for_pickup → proof_review → payment_failure_recovery (cron 24h) → review_request (cron day 5)

---

## Quick Reference

| Task | Command / Location |
|------|--------------------|
| Dev server | `npm run dev` → http://localhost:3000 |
| Type check | `npx tsc --noEmit` |
| Production build | `npm run build` |
| Validate pricing | `npm run validate:pricing` (60 checks) |
| Run tests | `npm test` (47 tests) |
| Update a price | Edit `data/tables/pricing_rules.v1.csv` → commit → push |
| Update a fee | Edit `data/tables/config.v1.csv` → commit → push |
| Update a product | Edit `data/tables/products.v1.csv` → commit → push |
| Deploy | `git push` → Railway auto-deploys (~2 min) |
| Env vars (full list) | `memory/railway.md` or `railway variables --json` |
| Query Clover | Use `clover_*` MCP tools (restart Claude Code after index.mjs changes) |
| Test payment | Send email → click Pay Now → verify Clover redirect + correct $ amount |

---

## Hooks + Skills Integration

Hooks wired in `.claude/settings.json`. Scripts in `scripts/hooks/`.

### PreToolUse: price-guard.mjs
Fires before every Edit/Write. Injects context based on file type:
- `src/app/[slug]/page.tsx` (new) → reminds to use /truecolor-page skill
- `src/app/[slug]/page.tsx` (existing) → loads pricing rules + checks SEO protection
- `src/lib/data/products-content.ts` → loads fromPrice rules
- `src/lib/data/gbp-products.json` → reminds to use /gmb-update
- email templates → reminds /ecommerce-ux
- `data/tables/*.csv` → reminds /pricing-review gate (OWNER APPROVAL required)
- engine code → reminds /e2e-test gate

### PostToolUse: post-edit-price-check.mjs
Fires after every Edit/Write on page.tsx files. BLOCKS if wrong patterns found:
- Banner "from $45" (should be $66)
- ACP "from $39" (should be $60)
- Coroplast "from $24" (should be $30)
- Magnet "from $24/sqft" (should be from $45)
- Decals "from $8/sqft" (should be $11/sqft)
- Sqft-based volume discounts (must be QTY-based)
- `railway.app` URLs in email templates

### Stop: stop-price-validation.mjs
Fires when Claude finishes any task. Detects what changed and:
- Runs `npm run validate:pricing` on page/CSV changes
- Runs `npm test` on engine changes
- Reminds about mandatory gates (/web-design-ux, /e2e-test, /pricing-health, /ecommerce-ux)
- BLOCKS on validation failures or railway.app URLs in emails

### Key principle
Hooks are DETERMINISTIC gates (pattern matching, validation runs).
Skills are INTELLIGENT workflows (research, generation, review).
Hooks remind you to use skills. Skills do the actual work.
