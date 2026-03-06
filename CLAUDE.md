@~/.claude/rules/truecolor-domain.md
@~/.claude/rules/seo-standards.md
@~/.claude/rules/brand-voice.md
@~/.claude/rules/content-pipeline.md
@~/.claude/rules/content-formats.md
@~/.claude/rules/mcp-usage.md

## Mandatory Skill Gates
- /web-design-ux   → before any UI component
- /ecommerce-ux    → before any checkout/order/email feature
- /pricing-health  → before any pricing CSV or engine deploy
- /e2e-test        → before every production push to Railway

## Auth Rules
- getSession() for UI — never getUser()
- requireStaffUser() on ALL /api/staff/* routes
- Staff = email === STAFF_EMAIL (env var)

# CLAUDE.md — True Color Display Printing Estimator

> **Shared brain for all Claude agents and sessions working on this codebase.**
> Read this entire file before touching any code. Zero-hallucination policy is always active.

---

## Project Overview

**True Color Display Printing Ltd.** — Internal staff estimator for wide-format and digital printing.
Staff open a browser URL, select a product, enter dimensions/qty/options, and get an instant quote.
The quote shows sell price, GST, total, margin %, and a Wave invoice line name — all from CSV rules.
Staff can email the quote directly to a customer. The email includes an optional **Pay Now** button
(green Clover-style) + QR code linking to a live Clover Hosted Checkout page.

**Pricing version:** `v1_2026-02-19`
**All prices in CAD. GST = 5%.**
**Stack:** Next.js 16.1.6 · TypeScript · Tailwind CSS v4 · nodemailer (SMTP) · qrcode

---

## Zero-Hallucination Policy

Every price, fee, rate, and business rule must trace to a CSV source file.
Never invent numbers. Never assume a rate. If you don't have a CSV source, mark it PLACEHOLDER.

**Allowed sources (in priority order):**
1. `data/tables/config.v1.csv` — master business rules (GST, fees, thresholds)
2. `data/tables/pricing_rules.v1.csv` — sqft-tier sell prices by category + material
3. `data/tables/products.v1.csv` — fixed-size catalog with exact prices
4. `data/tables/services.v1.csv` — add-on prices (H-Stake, rush, design fees)
5. `data/tables/cost_rules.v1.csv` — cost logic for margin calculation
6. `data/tables/materials.v1.csv` — supplier costs (some are PLACEHOLDER)

If a value conflicts between sources, **higher in the list wins.**

---

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx                    — Root layout (Geist fonts, metadata)
│   ├── page.tsx                      — Main estimator UI (staff + customer overlay)
│   ├── globals.css                   — Design system CSS tokens + utilities
│   ├── api/
│   │   ├── estimate/route.ts         — POST /api/estimate → pricing engine
│   │   ├── email/send/route.ts       — POST /api/email/send → nodemailer SMTP + QR gen
│   │   ├── payment/
│   │   │   └── clover/route.ts       — POST /api/payment/clover → Clover Hosted Checkout
│   │   └── quote/route.ts            — Phase 3 stub (Supabase quote storage)
│   ├── pay/
│   │   └── [token]/page.tsx          — Gateway page: decode HMAC token → fresh Clover session → redirect
│   ├── quote/[id]/page.tsx           — Phase 3 stub (shareable quote links)
│   └── staff/                        — Phase 3 stub (auth-gated staff route)
│
├── components/estimator/
│   ├── CategoryPicker.tsx            — Product category grid (17 categories)
│   ├── OptionsPanel.tsx              — Dimensions, qty, sides, add-ons, design, rush
│   ├── ProductProof.tsx              — SVG proof diagram + customer quote card
│   ├── QuotePanel.tsx                — Live quote display + action buttons
│   └── EmailModal.tsx                — Email quote modal + Pay Now toggle checkbox
│
└── lib/
    ├── config.ts                     — LOGO_PATH, SITE_URL, logoAbsoluteUrl()
    ├── engine/
    │   ├── index.ts                  — estimate(req) → EstimateResponse (PURE FUNCTION)
    │   └── types.ts                  — EstimateRequest, EstimateResponse, LineItem, CostBreakdown
    ├── data/
    │   ├── types.ts                  — Category, DesignStatus, Addon, PricingRule, etc.
    │   └── loader.ts                 — CSV parser + memoized singletons
    ├── email/
    │   └── quoteTemplate.ts          — buildQuoteEmailHtml() — inline-CSS HTML email (+ Pay Now block)
    └── payment/
        ├── clover.ts                 — createCloverCheckout() → Clover Hosted Checkout API client
        └── token.ts                  — encodePaymentToken() / decodePaymentToken() — HMAC-SHA256, 30d TTL

data/tables/                          — CSV source of truth (git-tracked, edit to update prices)
public/truecolorlogo.webp             — Canonical logo (used in app + emails + future PDF)
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
8. Rush fee (+$40 flat)
9. Totals: sell_price (pre-tax), gst = sell_price × gst_rate, total = sell_price + gst
10. Cost estimate: material + ink (Roland $0.16/sqft or Konica per-sheet) + labor + overhead
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
**Restarting the dev server reloads CSVs.** Production: redeploy to reload.

### Email System (Phase 2 — Complete)

`POST /api/email/send` accepts `{ to, customerName?, note?, quoteData, jobDetails, includePaymentLink? }`.
Uses **nodemailer** + **Hostinger SMTP** (`smtp.hostinger.com:465 SSL`).
HTML template in `src/lib/email/quoteTemplate.ts` — inline CSS only (Gmail-safe).
Logo served from `NEXT_PUBLIC_SITE_URL + LOGO_PATH`. BCC to `SMTP_BCC` env var.

When `includePaymentLink=true`:
- Encodes total-with-GST + description into a 30-day HMAC-signed token
- Builds `NEXT_PUBLIC_SITE_URL/pay/[token]` gateway URL
- Generates QR code as inline base64 PNG (Gmail-safe, no external hosting)
- Injects green Pay Now button + QR into the HTML email

### Payment System (Phase 2 — Complete)

**Gateway pattern** — solves Clover's 15-minute checkout session expiry:
- Email link points to `/pay/[token]` (permanent URL on Vercel)
- On every click: decode HMAC token → call `createCloverCheckout()` → server-side redirect to fresh Clover URL
- Token encodes: `{ amountCents, description, exp (30d), v: 1 }`
- Token signed with `PAYMENT_TOKEN_SECRET` (HMAC-SHA256)

`src/lib/payment/clover.ts` — `POST https://www.clover.com/invoicingcheckoutservice/v1/checkouts` with `Authorization: Bearer CLOVER_ECOMM_PRIVATE_KEY` + `X-Clover-Merchant-Id` header

`src/lib/payment/token.ts` — `encodePaymentToken(totalWithGst, description)` / `decodePaymentToken(token)`

---

## Clover MCP Server

Custom MCP server at `/Users/owner/clover-mcp/index.mjs` — gives Claude Code live access to the Clover merchant account during sessions.

**Tools available:**
- `clover_get_merchant` — merchant name, address, plan
- `clover_list_orders` — recent orders (filterable by date, state, limit)
- `clover_list_payments` — recent payments/transactions
- `clover_list_customers` — customer list / search by name or email
- `clover_list_items` — inventory/catalog items
- `clover_sales_summary` — revenue, order count, avg value, top items for a date range

**Key implementation notes:**
- Auth: `CLOVER_API_KEY` + `CLOVER_MERCHANT_ID` env vars (no OAuth)
- Base URL: `https://api.clover.com/v3/merchants/{mId}/`
- Filter syntax: Clover requires **separate `filter=` query params**, NOT AND-joined strings
  - CORRECT: `url.searchParams.append("filter", "createdTime>=X"); url.searchParams.append("filter", "createdTime<Y")`
  - WRONG: `filter=createdTime>=X and createdTime<Y`
- Order state "locked" = completed/paid terminal transaction (not "paid")
- Configured in `~/.claude.json` under `mcpServers.clover`
- **Requires Claude Code restart** to pick up changes to `index.mjs`

---

## Design System

**Brand color:** `#e63020` (CSS var: `--brand`)
**Background:** `#f8f8f8` · **Foreground:** `#111111` · **Border:** `#e5e5e5`
**Fonts:** Geist (body) · Geist Mono + SF Mono (prices, mono data)

**Margin badge colors** (thresholds from config.v1.csv):
- Green: margin > `margin_green_threshold` (default 50%)
- Yellow: margin ≥ `margin_yellow_threshold` (default 30%)
- Red: margin < yellow threshold

**PLACEHOLDER warning:** Yellow banner — shown when `has_placeholder=true` in response.
**No decorative ornaments.** Apple-clean aesthetic. Every element earns its place.

---

## Environment Variables

All live in `.env.local` (gitignored) locally and in Vercel dashboard for production.
**Never commit real values. `.env.example` has placeholders only.**

```
NEXT_PUBLIC_SITE_URL      — deployed URL (https://truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app)
SMTP_HOST                 — smtp.hostinger.com
SMTP_PORT                 — 465
SMTP_SECURE               — true
SMTP_USER                 — info@true-color.ca
SMTP_PASS                 — [Hostinger email password]
SMTP_FROM                 — True Color Display Printing <info@true-color.ca>
SMTP_BCC                  — info@true-color.ca
CLOVER_ECOMM_PRIVATE_KEY  — [Clover ecomm private key — creates checkout sessions]
CLOVER_ENVIRONMENT        — production
PAYMENT_TOKEN_SECRET      — [HMAC secret — 64 hex chars — signs payment gateway tokens]
```

---

## Deployment

**Platform:** Vercel (free hobby tier — zero cost for staff internal tool)
**Auto-deploy:** Every push to `main` branch → Vercel redeploys automatically (~2 min)
**Health check:** `/api/estimate` (Railway toml also configured as fallback)

**Change workflow:**
1. Ask Claude to make a change
2. Claude edits the file + runs `git add . && git commit -m "..." && git push`
3. Vercel detects push → redeploys (~2 min)
4. Staff refreshes browser → sees the change

For pricing changes only: edit the CSV in `data/tables/`, commit, push. No code changes needed.

---

## Known Gaps (Awaiting Supplier Data)

| ID | Gap | File | Flag |
|----|-----|------|------|
| ~~GAP-01~~ | ~~Foamboard 5mm material cost~~ | ~~materials.v1.csv~~ | RESOLVED — $1.024/sqft (INSR314489610) |
| ~~GAP-02~~ | ~~14pt card stock cost~~ | ~~materials.v1.csv~~ | RESOLVED — $0.016/card (PACDIGC10812FSC) |
| ~~GAP-03~~ | ~~80lb gloss text paper cost~~ | ~~materials.v1.csv~~ | RESOLVED — $0.055/flyer (PACDIGI36FSC) |
| GAP-04 | 100lb gloss text paper cost | materials.v1.csv | NOT in Spicer history — ask owner |
| Q6 | Booklet/menu pricing ($7,908 uncatalogued) | — | BLOCKED category |
| Q7 | INK HOUSE partner discount % | — | Do not apply until confirmed |

When Spicers data arrives: update `materials.v1.csv`, set `is_placeholder=FALSE`, commit, push.

---

## Sub-Agent Domain Boundaries

| Agent | Owns | Do NOT touch |
|-------|------|--------------|
| `pricing-configurator` | `data/tables/*.csv` · `src/lib/engine/` · `src/lib/data/` | UI components |
| `proof-designer` | `src/components/estimator/ProductProof.tsx` | Engine logic |
| `ui-polish` | `src/components/estimator/` (except ProductProof) · `src/app/page.tsx` · `globals.css` | Engine, CSVs |
| `email-agent` | `src/lib/email/` · `src/app/api/email/` · `EmailModal.tsx` | Engine, pricing rules |
| `payment-agent` | `src/lib/payment/` · `src/app/api/payment/` · `src/app/pay/` | Engine, email template |
| `deploy-agent` | `railway.toml` · `.env.example` · `next.config.ts` | Any src/ |

---

## SEO Standards — Always Enforce

> **Every page you build or edit is an SEO asset.** This site competes in Saskatoon's local print market. No competitor has a content grade above C. We answer every question they refuse to answer. Always check SEO before shipping.

Run `/truecolor-seo` before building or editing any page. The command contains: keyword targets, competitor intel, schema templates, a page checklist, and links to all pre-written copy.

### Auto-Checklist for Any Page Edit

Before committing any change to a page:

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
| Sitemap | New page added to `src/app/sitemap.ts` |
| Internal links | ≥2 links to product pages |

### Priority Landing Pages (NOT YET BUILT — build these in order)

| # | Page | Keyword | Vol/mo | Copy source |
|---|---|---|---|---|
| 1 | `/coroplast-signs-saskatoon` | coroplast signs saskatoon | 100–300 | `seo_keywords.md` L304 |
| 2 | `/same-day-printing-saskatoon` | same day printing saskatoon | 200–400 | `seo_keywords.md` L224 |
| 3 | `/agribusiness-signs-saskatchewan` | agribusiness signs sask | 50–150 | `website_copy.md` L249 ← FULL COPY READY |
| 4 | `/healthcare-signs-saskatoon` | healthcare signs saskatoon | 20–80 | `website_copy.md` L403 ← FULL COPY READY |
| 5 | `/banner-printing-saskatoon` | banner printing saskatoon | 200–500 | `seo_keywords.md` L278 |
| 6 | `/business-cards-saskatoon` | business cards saskatoon | 150–350 | `seo_keywords.md` L252 |

### Schema Required on Every Landing Page

Three schema types — all JSON-LD in `<script type="application/ld+json">`:
1. **Service** — `serviceType`, `areaServed: Saskatoon`, `offers.price` (real price from CSV)
2. **FAQPage** — minimum 3 questions from the 50-question list in `competitor_content_audit.md`
3. **BreadcrumbList** — home → this page

### SEO Research Files

All copy is pre-written. Never write copy from scratch — use these:
- `research/content/website_copy.md` — complete copy for 6 industry pages
- `research/content/seo_keywords.md` — keyword map + copy briefs for all Tier 1 pages
- `research/content/competitor_content_audit.md` — 50 questions to answer + competitor gaps
- `research/website/SEO_DOMINATION_PLAN_20260228.md` — master competitive strategy + page briefs

---

## UX Standards — Always Enforce

Run these skills before shipping any UI or order feature:

| Skill | When to use | Checks |
|-------|-------------|--------|
| `/web-design-ux` | Before any component PR | Accessibility (WCAG 2.1 AA), loading states, error sanitization, mobile 44px targets, toast feedback, form labels |
| `/ecommerce-ux` | Before any checkout/order/email change | Checkout UX, 7-email sequence completeness, B2B patterns, trust signals, security |

**Always import these utilities — never recreate:**
```tsx
import { sanitizeError } from "@/lib/errors/sanitize";       // safe error messages
import { Skeleton, SkeletonCard, SkeletonPrice } from "@/components/ui"; // loading states
import { useToast, ToastContainer } from "@/components/ui";  // async feedback
```

**Email sequence (7 required — verify all exist before shipping order features):**
order_confirmation → payment_received → in_production → ready_for_pickup → proof_review → payment_failure_recovery (cron 24h) → review_request (cron day 5)

---

## Architecture Rules

1. **No new npm packages** without explicit approval. Current approved deps: `qrcode` (added for payment QR).
2. **Engine stays pure.** No database calls, no API calls, no side effects in `src/lib/engine/`.
3. **CSV is the database.** No Supabase, no Postgres until Phase 3.
4. **No hardcoded prices in TypeScript.** All numbers come from CSV via `getConfigNum()`.
5. **PLACEHOLDER is not an error.** It means margin calculation is partial — UI warns, quote still works.
6. **GST = 5%** read from `config.v1.csv gst_rate`, not hardcoded in components.
7. **Logo = `public/truecolorlogo.webp`.** Referenced via `src/lib/config.ts LOGO_PATH`. Change there only.
8. **Email HTML = inline CSS only.** No Tailwind, no classes, no external stylesheets. Gmail requires it.
9. **TypeScript strict.** No `any` casts. Types mirror CSV schemas exactly.
10. **Commits = git push = Vercel redeploy.** One concern per commit. Conventional Commits format.
11. **Payment tokens are HMAC-signed.** Never trust raw amount from URL. Always decode via `decodePaymentToken()`.
12. **Clover filter syntax = multiple `filter=` params.** Do NOT join with `AND` — it breaks the API.
13. **Next.js `redirect()` MUST be outside try/catch.** It works by throwing `NEXT_REDIRECT` internally. If you wrap it in a try/catch, the catch block intercepts the throw and the redirect never fires — you get ErrorPage instead. Always store the URL in a variable inside try, then call `redirect(url)` after the block.

---

## Supplier Data Intake Protocol

When new Spicers pricing files arrive:
1. Read the new file from `/Users/owner/Downloads/TRUE COLOR PRICING /`
2. Cross-reference against `materials.v1.csv` and `cost_rules.v1.csv`
3. Fill in PLACEHOLDER rows (supplier_unit_cost, supplier_date, supplier_invoice_ref)
4. Set `is_placeholder = FALSE` for updated rows
5. Commit + push → Vercel redeploys → margin calculations update live

No code changes needed — CSV edits only.

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ COMPLETE | Staff estimator — category picker, live pricing, proof, customer overlay, print |
| 2 | ✅ COMPLETE | Email quote system — nodemailer SMTP, branded HTML email, BCC shop |
| 2 (payments) | ✅ COMPLETE | Clover Hosted Checkout — Pay Now button + QR code in emails, HMAC gateway |
| 2b | 🔲 Planned | PDF quote export — `@react-pdf/renderer`, `/api/pdf/generate` route |
| 3 | 🔲 Planned | Supabase (quote storage), shareable links, Wave API invoice sync |
| 4 | 🔲 Planned | Auth gate for /staff, customer-facing dashboard, approval logging |

---

## Quick Reference

| Task | Command / Location |
|------|--------------------|
| Dev server | `npm run dev` → http://localhost:3000 |
| Type check | `npx tsc --noEmit` |
| Production build | `npm run build` |
| Update a price | Edit `data/tables/pricing_rules.v1.csv` → commit → push |
| Update a fee | Edit `data/tables/config.v1.csv` → commit → push |
| Update a product | Edit `data/tables/products.v1.csv` → commit → push |
| Change logo | Replace `public/truecolorlogo.webp` → update `src/lib/config.ts LOGO_FILENAME` |
| Add env var | Add to `.env.local` locally + Vercel dashboard for production |
| Push changes | `git add . && git commit -m "feat: ..." && git push` |
| Query Clover data | Use `clover_*` MCP tools (restart Claude Code to reload MCP changes) |
| Test payment flow | Send email with Pay Now → click button → verify Clover redirect + correct $ amount |
