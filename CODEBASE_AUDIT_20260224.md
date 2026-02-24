# Codebase Audit: True Color Display Printing — Estimator & E-Commerce App
**Generated:** 2026-02-24
**Audited by:** Claude Code
**Git branch:** main
**Last commit:** 523ad25 — fix: services page title — use absolute to prevent template doubling
**Working directory:** `/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator`

---

## Executive Summary

This is a Next.js 16 e-commerce and pricing estimator app for True Color Display Printing, a Saskatoon print shop. It lets customers get instant online pricing for signs, banners, business cards, and other print products, add items to a cart, and pay online via Clover card or Interac e-Transfer. The backend integrates Supabase (database + auth + file storage), Wave Accounting (invoicing), and Clover (card payments). The codebase is **production-ready, clean, and well-structured** for a small business app — no framework misuse, TypeScript is strict, and the pricing engine is a well-isolated pure function. The single most important thing to know before working on this code: **the pricing engine reads from CSV files at runtime (`data/tables/*.csv`), and any wrong value in `products.v1.csv` flows directly to customer quotes with no recomputation.** There are two significant bugs: (1) a Clover webhook signature bypass that allows unauthenticated order confirmation, and (2) hardcoded old preview Vercel URL in the orders API that sends customers to a broken redirect when `NEXT_PUBLIC_SITE_URL` is not set. The domain is currently `truecolor-estimator.vercel.app` but metadata and SEO references point to `truecolorprinting.ca` (not yet live).

---

## 1. Project Structure

```
truecolor-estimator/
├── data/tables/             ← 6 CSV pricing tables (runtime-loaded, not bundled)
│   ├── config.v1.csv        (20 rows — business rules: GST, fees, thresholds)
│   ├── pricing_rules.v1.csv (84 rows — sqft tier pricing by category)
│   ├── products.v1.csv      (73 rows — fixed-size catalog products with verbatim prices)
│   ├── materials.v1.csv     (28 rows — material costs for margin calculation)
│   ├── qty_discounts.v1.csv (19 rows — bulk quantity discount tiers)
│   ├── services.v1.csv      (13 rows — add-on services: H-stake, installation)
│   └── cost_rules.v1.csv    (40 rows — UNUSED by engine — legacy reference only)
├── public/                  ← static assets (images, SVGs, logo)
├── scripts/test-clover.mjs  ← manual Clover API test script
├── src/
│   ├── app/                 ← Next.js App Router (pages + API routes)
│   ├── components/          ← React components (estimator, home, product, site)
│   └── lib/                 ← Core logic (engine, data, email, payment, supabase, wave)
├── vercel.json              ← Cron job config (keepalive at noon UTC daily)
├── railway.toml             ← Railway deploy config (not active — using Vercel)
├── .env.local               ← Local secrets (gitignored)
└── .env.example             ← Template (outdated — missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, STAFF_EMAIL, PAYMENT_TOKEN_SECRET, WAVE_API_TOKEN, CRON_SECRET, CLOVER_ECOMM_PRIVATE_KEY, CLOVER_MERCHANT_ID, CLOVER_ENVIRONMENT)
```

**Git state:** Branch `main`, clean working tree. 8 stale feature/fix branches remain (feat/clover-payment-links, feat/proof-upload, fix/bc-16pt-removal, fix/bc-ink-imposition, fix/flyer-pricing, fix/gap-01-foamboard, fix/gap-02-bc-card-stock, fix/gap-03-80lb-paper). These are completed work merged to main — safe to delete.

---

## 2. Tech Stack

| Layer          | Technology | Version | Config File | Notes/Gotchas |
|----------------|------------|---------|-------------|---------------|
| Runtime        | Node.js | via Vercel | — | Serverless on Vercel |
| Framework      | Next.js (App Router) | 16.1.6 | next.config.ts | `serverExternalPackages: ["@resvg/resvg-js"]` required — breaks without it |
| Language       | TypeScript | ^5 | tsconfig.json | strict mode on |
| Database       | Supabase (Postgres) | @supabase/supabase-js ^2.97.0 | — | Service role key for all server writes; no Prisma/Drizzle — raw Supabase client queries |
| Auth           | Supabase Auth | @supabase/ssr ^0.8.0 | src/middleware.ts | Password auth only. Magic link removed. Email confirm OFF. Staff identified by email match against STAFF_EMAIL env var |
| Hosting        | Vercel | — | vercel.json | Auto-deploy from GitHub main. Cron: keepalive daily at noon UTC |
| Styling        | Tailwind CSS v4 | ^4 | postcss.config.mjs | v4 — uses @tailwindcss/postcss, NOT v3 config format |
| State Mgmt     | sessionStorage (custom) | — | src/lib/cart/cart.ts | Cart is sessionStorage only — clears on tab close |
| API Layer      | Next.js Route Handlers | — | src/app/api/ | file-based, no tRPC/REST framework |
| Automation     | NOT IMPLEMENTED | — | — | No n8n/Zapier |
| Testing        | NOT IMPLEMENTED | — | — | Zero tests — zero coverage |
| Linting        | ESLint | ^9 | eslint.config.mjs | eslint-config-next |
| Error Tracking | NOT IMPLEMENTED | — | — | No Sentry/Datadog — only console.error |
| Analytics      | NOT IMPLEMENTED | — | — | No GA/Plausible |
| Email/Comms    | Nodemailer | ^8.0.1 | — | SMTP via Hostinger smtp.hostinger.com:465. Transporter recreated per send (no pooling) |
| File Storage   | Supabase Storage | — | — | `print-files` bucket. Customer artwork → `pending/{uuid}/`. Proofs → `proofs/{orderId}/` |
| AI/LLM         | NOT IMPLEMENTED | — | — | No AI features |
| Payments       | Clover Hosted Checkout | REST API | src/lib/payment/clover.ts | Sessions expire 15 min. Durable `/pay/[token]` links create fresh sessions on click |
| Invoicing      | Wave Accounting | GraphQL API | src/lib/wave/ | DRAFT invoices on every order. Send on pickup NOT YET BUILT |
| QR Codes       | qrcode + @resvg/resvg-js | ^1.5.4 / ^2.6.2 | — | Used in email quote PDF generation |

**npm audit results:** 15 vulnerabilities — 1 moderate (ajv ReDoS), 14 high (minimatch ReDoS). ALL are in dev dependencies (eslint chain). Zero production runtime vulnerabilities.

---

## 3. Architecture & Data Flow

### 3A — User-Facing Flows

**Flow: Get Instant Price**
```
Entry: /products/[slug] or /quote
Component chain: ProductPageClient → ProductConfigurator → POST /api/estimate
API: POST /api/estimate | EstimateRequest | EstimateResponse (status, sell_price, line_items, cost)
DB ops: none
External calls: none (engine reads CSVs loaded at startup)
State: estimate result displayed in QuotePanel; "Add to Cart" writes to sessionStorage
Error states: status="BLOCKED" (no dims or category), status="NEEDS_CLARIFICATION" (fallback rate)
```

**Flow: Checkout / Place Order**
```
Entry: /checkout
Component chain: CheckoutPage → POST /api/upload (artwork) → POST /api/orders
API: POST /api/orders | CreateOrderRequest | { orderId, orderNumber, checkoutUrl, waveInvoiceId }
DB ops: upsert customers → insert orders → insert order_items (+ best-effort updates for file_storage_paths, wave_invoice_id, payment_reference)
External calls: Wave GraphQL (create DRAFT invoice) → Clover REST (create checkout session)
State: cart cleared; user redirected to Clover checkout URL (card) or /order-confirmed (eTransfer)
Error states: All external call failures are non-fatal (order still created)
```

**Flow: Staff Order Management**
```
Entry: /staff/orders (protected by middleware)
Auth: middleware checks Supabase session; API routes call getSessionUser()
Staff actions:
  → PATCH /api/staff/orders/[id]/status — change status, trigger customer email
  → POST /api/staff/orders/[id]/reply — send custom message to customer
  → POST /api/staff/orders/[id]/proof — upload proof, save to storage, email customer
  → POST /api/staff/quote/wave — create Wave invoice from live estimator quote
```

**Flow: Customer Account / Order History**
```
Entry: /account
Auth: Supabase Auth (email+password). Staff email → redirect to /staff/orders
Component: AccountClientPage → GET /api/account/orders (Bearer token auth)
DB ops: lookup customer by email → select orders + order_items
State: orders displayed with status, pay links for pending_payment orders
```

**Flow: Payment via Clover**
```
Entry: /pay/[token] (durable 30-day link from emails)
Component: Decodes HMAC-signed token → calls POST /api/payment/clover → redirects to Clover checkout
On success: Clover redirects to /order-confirmed?oid={id}
Webhook: POST /api/webhooks/clover → updates order status → emails customer
```

### 3B — Backend/API Architecture

```
Route organization: file-based (Next.js App Router)
Auth middleware: src/middleware.ts — protects /staff/* and redirects owner /account → /staff/orders
API auth pattern: getSessionUser() called at top of every staff route handler (returns 401 if no session)
Rate limiting: NONE — no rate limiting on any endpoint
Validation: manual (check !items?.length, !contact?.email, etc.) — no Zod/Joi
Error handling: try/catch in every route; external failures are non-fatal (logged, not surfaced)
Response format: NextResponse.json({ ...data }) success | NextResponse.json({ error: string }, { status: N }) error
```

**All API routes:**
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| /api/estimate | POST | none | Run pricing engine |
| /api/orders | POST | none | Create order (customer checkout) |
| /api/upload | POST | none | Upload artwork to Supabase Storage |
| /api/account/orders | GET | Bearer token | Customer order history |
| /api/email/send | POST | none | Send quote email with QR code + PDF |
| /api/quote | POST | none | (check file) |
| /api/quote-request | POST | none | Submit quote request form |
| /api/payment/clover | POST | none | Create Clover checkout session |
| /api/webhooks/clover | POST | HMAC sig | Receive Clover payment events |
| /api/cron/keepalive | GET | CRON_SECRET | Ping Supabase to prevent free-tier pause |
| /api/staff/orders/[id]/status | PATCH | Supabase session | Update order status + email customer |
| /api/staff/orders/[id]/reply | POST | Supabase session | Email custom message to customer |
| /api/staff/orders/[id]/proof | POST | Supabase session | Upload + email proof to customer |
| /api/staff/quote/wave | POST | Supabase session | Create Wave invoice from live quote |

### 3C — External Integrations

**Supabase**
```
Purpose: Database + Auth + File Storage
Auth: Service role key (server writes), anon key + user JWT (client reads)
Env vars: SUPABASE_URL (hardcoded in files), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
Files: src/lib/supabase/server.ts, src/lib/supabase/client.ts, src/lib/supabase/storage.ts
Error handling: non-fatal best-effort updates (wave_invoice_id, file_storage_paths, address)
```

**Clover Hosted Checkout**
```
Purpose: Card payment processing
Auth: Bearer CLOVER_ECOMM_PRIVATE_KEY header
Env vars: CLOVER_ECOMM_PRIVATE_KEY, CLOVER_MERCHANT_ID, CLOVER_ENVIRONMENT
Files: src/lib/payment/clover.ts, src/lib/payment/token.ts
Error handling: throws on API error — caught by orders route (fatal — returns 500 if Clover fails)
Note: Clover sessions expire 15 min; /pay/[token] gateway creates fresh session on every click
```

**Wave Accounting**
```
Purpose: Invoice creation (DRAFT)
Auth: Bearer WAVE_API_TOKEN
Env vars: WAVE_API_TOKEN
Files: src/lib/wave/client.ts, src/lib/wave/invoice.ts
Error handling: non-fatal — Wave failure logged, order still created
Business IDs hardcoded: WAVE_BUSINESS_ID, WAVE_GST_TAX_ID, WAVE_PRINT_PRODUCT_ID in client.ts
```

**Hostinger SMTP**
```
Purpose: Transactional email (order confirmation, status updates, proofs, quotes)
Auth: user/pass SMTP
Env vars: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_BCC
Files: src/lib/email/*.ts
Error handling: non-fatal in orders route; fatal in direct email API
```

### 3D — Automation / Workflow Layer
NOT IMPLEMENTED. Vercel cron at noon UTC pings Supabase (keepalive only, not a workflow trigger).

---

## 4. Database Schema

**Provider:** Supabase (Postgres)
**Connection:** Supabase JS client — service role (server), anon+JWT (client reads)
**Schema management:** Raw SQL migrations run manually in Supabase SQL editor (no Prisma/Drizzle)

**WARNING:** The schema below is reconstructed from code reads — no migration files exist in the repo. The actual live schema may differ.

**Table: customers**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| email | TEXT UNIQUE | lowercased on upsert |
| name | TEXT | |
| company | TEXT NULL | |
| phone | TEXT NULL | |
| address | TEXT NULL | added migration 2026-02-23 |
| created_at | TIMESTAMPTZ | default now() |

**Table: orders**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_number | TEXT | format TC-YYYY-XXXXX |
| customer_id | UUID FK → customers | |
| status | TEXT | pending_payment / payment_received / in_production / ready_for_pickup / complete |
| is_rush | BOOLEAN | |
| subtotal | NUMERIC | pre-tax |
| gst | NUMERIC | 5% |
| total | NUMERIC | |
| payment_method | TEXT | clover_card / etransfer — added migration |
| wave_invoice_id | TEXT NULL | best-effort — migration required |
| payment_reference | TEXT NULL | Clover sessionId — migration required |
| proof_storage_path | TEXT NULL | Supabase storage path — migration required |
| proof_sent_at | TIMESTAMPTZ NULL | migration required |
| file_storage_paths | TEXT[] NULL | all artwork paths — migration required |
| paid_at | TIMESTAMPTZ NULL | set on payment_received |
| ready_at | TIMESTAMPTZ NULL | set on ready_for_pickup |
| completed_at | TIMESTAMPTZ NULL | set on complete |
| notes | TEXT NULL | |
| created_at | TIMESTAMPTZ | |

**Table: order_items**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_id | UUID FK → orders | |
| category | TEXT | SIGN / BANNER / etc. |
| product_name | TEXT | |
| material_code | TEXT NULL | |
| width_in | NUMERIC NULL | |
| height_in | NUMERIC NULL | |
| sides | INT | 1 or 2 |
| qty | INT | |
| addons | TEXT[] | |
| is_rush | BOOLEAN | |
| design_status | TEXT | PRINT_READY / MINOR_EDIT / etc. |
| unit_price | NUMERIC | sell_price / qty |
| line_total | NUMERIC | |
| file_storage_path | TEXT NULL | first artwork file only |

**RLS policies:** Not visible from code. Service role bypasses RLS for all server writes. Customer account orders read uses service role too (fetched by customer_id after verifying JWT).

**Indexes:** UNKNOWN — not defined in code, must check Supabase dashboard.

**Edge Functions / Triggers / Views:** NONE visible in codebase.

**Backup strategy:** Supabase free tier — point-in-time recovery NOT included. Manual backups only. RISK.

**Connection pooling:** NOT CONFIGURED. Supabase JS client handles connections internally.

---

## 5. Key Files & Business Logic

**`src/lib/engine/index.ts`** — The pricing engine. Pure function: same inputs → same output.
- STEP 1: Validate inputs (category required)
- STEP 2: Calculate sqft from width_in/height_in
- STEP 3: Fixed-size exact match in products.v1.csv → returns price verbatim (no recompute)
- STEP 4: Sqft-tier lookup in pricing_rules.v1.csv → price_per_sqft × sqft
- STEP 4.5: Qty bulk discount (SIGN/BANNER/RIGID/FOAMBOARD only when basePricePerSqft !== null)
- STEP 5: Add-ons (grommets auto-calculated from perimeter; H-stake from services CSV)
- STEP 6: Minimum charge (order-level, not per-unit)
- STEP 7: Design fee (MINOR_EDIT/FULL_DESIGN/LOGO_RECREATION from config)
- STEP 8: Rush fee (flat $40 from config)
- STEP 9: GST calculation
- STEP 10: Cost estimate (for margin display — uses materials.v1.csv)
- STEP 11: Wave line name generation

**`src/lib/data/loader.ts`** — CSV reader. Module-level singletons with lazy init (read once per process). Uses `fs.readFileSync` — incompatible with edge runtime. All 6 tables cached after first call.

**`src/middleware.ts`** — Auth middleware. Runs on `/staff/:path*` and `/account`. Uses `getUser()` (correct for middleware — server-side security check). Redirects staff email to `/staff/orders`.

**`src/lib/supabase/server.ts`** — Two exports: `createServiceClient()` (bypasses RLS), `getSessionUser()` (reads session cookie for API route auth).

**`src/lib/payment/token.ts`** — HMAC-SHA256 signed payment tokens. Format: `base64url(payload).sig`. 30-day TTL. Used in `/pay/[token]` durable links. Secret: `PAYMENT_TOKEN_SECRET`.

**`src/lib/cart/cart.ts`** — sessionStorage cart. Events via `window.dispatchEvent("tc_cart_updated")`. Cart is lost on tab close — not persisted to server.

**`src/app/api/orders/route.ts`** — The core order creation flow. 8 steps: customer upsert → order insert → order_items insert → Wave DRAFT → Clover checkout → encode durable pay token → customer email → staff email. All external calls are non-fatal except Clover (which returns null checkoutUrl on failure, not an error).

**`src/lib/email/*.ts`** — 5 email templates: orderConfirmation, statusUpdate, staffNotification, proofSent, quoteTemplate. All use inline HTML (email-safe). All use `escHtml()` helper for XSS prevention.

**No AI/LLM prompts in this codebase.**

---

## 5A. UI Calculator Components

There are **two separate price calculators** in this app, aimed at different users. Both talk to the same `/api/estimate` engine, but they handle addons, quantity UX, and display logic differently — and both have their own hardcoded constants that diverge from the CSV source of truth.

---

### Client-Side Product Configurator (`src/components/product/ProductConfigurator.tsx`)

Used on all `/products/[slug]` pages. Customer-facing — shows sell price only (no cost/margin).

**What it does:**
- Size presets or custom W×H inputs → `effectiveWidth`/`effectiveHeight`
- Qty presets or custom qty input → `effectiveQty`
- Sides toggle (if `product.sideOptions`)
- Tier selector for retractable banner stand types
- Addon counter (+ / − per addon label, tracked by label string)
- Design status selector (PRINT_READY / MINOR_EDIT / FULL_DESIGN / LOGO_RECREATION)
- Calls `fetchPrice` → `POST /api/estimate` → displays in `PriceSummary`

**Key wiring:**
- `fetchPrice` is debounced 300ms for custom inputs, immediate for preset clicks
- `sell_price` from engine = subtotal for all units (includes design fee, rush — but NOT addons)
- `addonTotal` computed client-side using `product.addons[].unitPrice × addonQtys[label]`
- `gst = (price + addonTotal) * 0.05` — computed client-side
- `total = price + addonTotal + gst`

**Hardcoded constants in this file (not reading from CSV):**
```ts
// Line 6-12 — bulk discount hints shown under qty buttons
const BULK_HINTS = {
  SIGN:      { 5:"save 8%", 10:"save 17%", 25:"save 23%" },
  BANNER:    { 5:"save 5%", 10:"save 10%", 25:"save 15%" },
  RIGID:     { 5:"save 3%", 10:"save 5%",  25:"save 8%"  },
  FOAMBOARD: { 5:"save 8%", 10:"save 12%", 25:"save 15%" },
  MAGNET:    { 5:"save 5%", 10:"save 10%" },  // ← BUG: MAGNET presets are [1,2,4] — 5 and 10 never appear
};

// Line 22-27 — design fee amounts (for display only — engine still computes the real fee)
const DESIGN_FEES = {
  PRINT_READY: 0, MINOR_EDIT: 35, FULL_DESIGN: 50, LOGO_RECREATION: 75,
};
```

**Key bugs (detailed in 6B):**
1. Addons NOT sent to engine → addon pricing diverges from engine grommet calculation
2. MAGNET `BULK_HINTS` keys (5, 10) never match MAGNET qty presets [1, 2, 4] → discount hints never display for magnets
3. Custom qty fallback: clicking "Custom" sets `effectiveQty = qtyPresets[0]` until user types
4. GST hardcoded as 0.05 (line 144) — not read from config CSV

---

### Staff Estimator (`src/app/staff/page.tsx` + `OptionsPanel.tsx` + `QuotePanel.tsx`)

Used at `/staff` (staff-only, protected by middleware). Shows cost + margin + Wave invoice line.

**`src/app/staff/page.tsx`:**
- Category picker → `OptionsPanel` → `fetchEstimate` → `QuotePanel`
- Default qty: 1 for sqft products, 250 for FLYER/BUSINESS_CARD/BROCHURE/POSTCARD/STICKER
- Default material codes in `MATERIAL_MAP` (hardcoded, not from CSV)
- `useEffect([category, state])` fires on every state change — creates new object reference each time, triggering re-render loop risk if deps don't stabilize
- `fetchEstimate` sends `addons: state.addons` to the engine — **staff estimator DOES send addons correctly** (unlike client configurator)
- `jobDetails` built for `QuotePanel`: includes `widthIn`, `heightIn`, `qty`, `sides`, `isRush`, `categoryLabel`, `materialName`

**`src/components/estimator/OptionsPanel.tsx`:**
- Dimensions: free-text W × H inputs with blur validation
- Qty:
  - Print products (FLYER/BC/etc.): `QTY_TIERS` preset buttons only — e.g., FLYER: [25,50,100,250,500,1000,2500,5000]
  - Sqft products with presets (SIGN/BANNER/RIGID/FOAMBOARD/MAGNET): preset buttons + always-visible custom text input
  - Other sqft products (DISPLAY/DECAL/VINYL_LETTERING/PHOTO_POSTER): plain number input only
- **Bug**: Custom qty input for sqft products uses `value={state.qty}` (line 194) — shows the currently selected preset value; user must clear the field before typing a custom qty
- `SQFT_QTY_PRESETS` for MAGNET: `[1, 2, 4]` — no qty in this list triggers a bulk discount (MAGNET discounts start at 5 in the CSV)
- Addons: binary toggles (checked/unchecked) for GROMMETS (BANNER only) and H_STAKE (SIGN only) — passed as `Addon[]` string array to engine

**`src/components/estimator/QuotePanel.tsx`:**
- Displays sell price from engine + cost breakdown (staff only) + margin badge
- Margin computed client-side: `((sellPrice - cost.total_cost) / sellPrice) × 1000 / 10` — correct formula; works because engine returns `cost` with actual `total_cost` (engine `margin_pct` is always null, but QuotePanel ignores it and computes its own)
- GST hardcoded: `sellPrice * 0.05` (line 46) — not reading from engine response
- Strikethrough "standard rate" back-calculation (line 298-299): `price_per_unit / (1 - qty_discount_pct / 100)` — approximate reverse; rounding may make it slightly wrong vs actual undiscounted rate
- Print button generates full HTML quote PDF with logo, spec diagram (via `buildSpecDiagramSvg`), line items, signature block — opens in new window
- Email button → `EmailModal` → calls `/api/email/send`
- Wave button → `WaveModal` → calls `/api/staff/quote/wave`

---

## 6. Health Assessment

### 6A. Strengths
- **Pricing engine isolation:** Pure function with no side effects, CSV-backed, well-typed. Easy to test and modify.
- **Non-fatal external calls:** Wave, email, and best-effort DB updates never kill an order. Customer always gets an order number.
- **Auth on all staff routes:** Every `/api/staff/*` route calls `getSessionUser()` at the top — no auth bypass possible via API.
- **Middleware uses `getUser()`:** Correct Supabase pattern for middleware (not `getSession()` which can be spoofed).
- **Durable pay links:** `/pay/[token]` pattern prevents expired Clover checkout URLs in emails — excellent UX.
- **Security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS`, `Permissions-Policy` all set in `next.config.ts`.
- **HTML escaping in emails:** All email builders use `escHtml()` — no XSS via order data.
- **CRON fail-closed:** If `CRON_SECRET` not set, keepalive returns 503 instead of running unauthenticated.

### 6B. Bugs

```
File: src/app/api/webhooks/clover/route.ts
Lines: 31-41
Severity: HIGH
Issue: Webhook signature check is bypassed when no x-clover-signature header is sent.
  Code: if (tokenSecret) { const sig = req.headers.get("x-clover-signature") ?? "";
        if (signature && signature !== expected) { ... } }
  "signature && ..." means empty string (no header sent) skips the check entirely,
  even when PAYMENT_TOKEN_SECRET is configured.
Impact: Any unauthenticated caller can POST to /api/webhooks/clover with a fake
  "captured" payment event and confirm an order without paying.
Fix: Change to: if (!signature || signature !== expected) { return 401 }
  (require signature always when tokenSecret is set)
```

```
File: src/app/api/orders/route.ts
Lines: 201, 253
Severity: MEDIUM
Issue: Hardcoded old preview Vercel URL as fallback:
  "https://truecolor-estimator-3rlzylwqm-tubby124s-projects.vercel.app"
Impact: If NEXT_PUBLIC_SITE_URL is not set, Clover redirects after payment
  go to the old preview URL (404), and staff notification emails link to the wrong URL.
Fix: Change fallback to "https://truecolor-estimator.vercel.app" or throw if env var missing.
```

```
File: src/lib/email/orderConfirmation.ts + src/app/api/staff/orders/[id]/reply/route.ts
Lines: orderConfirmation.ts:372,434 | reply/route.ts:122
Severity: MEDIUM
Issue: Phone number inconsistency. JSON-LD in layout.tsx uses (306) 954-8688,
  Wave invoice memo uses (306) 954-8688, but email templates use (306) 652-8888.
  One of these is wrong.
Impact: Customers calling the number in confirmation emails may reach a wrong number.
Fix: Confirm correct number with owner; standardize across all files.
```

```
File: src/lib/engine/index.ts
Line: ~408
Severity: LOW
Issue: margin_pct in CostBreakdown is always null. The field is declared in the
  interface and returned in EstimateResponse.cost, but the value is set to
  `let marginPct: number | null = null` and never computed.
Impact: Staff UI margin display (if implemented) will always show null.
Fix: Compute marginPct = round2(((sellPrice - totalCost) / sellPrice) * 100)
  after totalCost is determined.
```

```
File: src/lib/supabase/storage.ts
Lines: all
Severity: LOW
Issue: Dead code. This file exports uploadArtworkFile() using the anon key
  (direct browser → Supabase upload), but the actual checkout flow uses
  /api/upload which uploads server-side with the service role key.
  Nothing imports src/lib/supabase/storage.ts in the app.
Impact: Confusion for future developers. If mistakenly used, uploads would
  fail due to storage RLS restrictions on the anon key.
Fix: Delete the file.
```

```
File: src/app/layout.tsx
Line: 37
Severity: LOW
Issue: OG image uses logo PNG instead of proper 1200×630 branded image.
Impact: Poor social media preview when links are shared.
Fix: Design and save proper OG image to public/og-image.png, update metadata.
```

---

### UI-Specific Bugs

```
File: src/components/product/ProductConfigurator.tsx
Lines: 96-109 (fetchPrice), 85-87 (addonTotal)
Severity: HIGH
Issue: Addons are NOT sent to the pricing engine. fetchPrice() calls POST /api/estimate
  without an addons field. Addon cost is computed client-side using hardcoded
  unitPrice values from products-content.ts (e.g., Grommets: $2.00 each).
  However, the engine (STEP 5) calculates grommets based on banner perimeter:
  ceil((2 × (W + H) in inches) / 24) grommets. For a 3×6 ft banner the engine
  would charge ~$16 for grommets; the client lets the user pick a count manually.
  The two systems produce different numbers for grommets. H-Stake pricing from
  services.v1.csv is also bypassed on the client page.
Impact: Client product page addon pricing is disconnected from engine logic.
  If CSV prices change, client page does not update. Grommets for banners may
  show a different price than what the engine (and Wave invoice) calculates.
Fix: Add addons to the fetchPrice() API call body; remove client-side addonTotal
  computation; display the engine's addon costs from line_items instead.
```

```
File: src/components/product/ProductConfigurator.tsx
Line: 11
Severity: MEDIUM
Issue: MAGNET category in BULK_HINTS has keys { 5: "save 5%", 10: "save 10%" }.
  But MAGNET's qtyPresets in products-content.ts is [1, 2, 4]. Neither 5 nor 10
  appears in the button list, so these discount hints are NEVER rendered.
  MOST_POPULAR_QTY for MAGNET is 4, but 4 has no hint entry either.
Impact: Magnet bulk discount hints are silently invisible. The engine does apply
  qty discounts for MAGNET when qty >= 5, but the UI never signals this to customers.
  Customers ordering 4 magnets never see "order 1 more to save 5%".
Fix: Either add qty 5 and 10 to MAGNET qtyPresets, or remove MAGNET from BULK_HINTS
  and add a text hint like "Order 5+ to save 5%". Also align MOST_POPULAR_QTY[MAGNET]
  with a qty that has a hint.
```

```
File: src/components/product/ProductConfigurator.tsx
Line: 83
Severity: MEDIUM
Issue: When user clicks "Custom" qty button, isCustomQty=true and customQty="" (empty).
  effectiveQty = isCustomQty ? parseInt("", 10) || product.qtyPresets[0] : qty
  = qtyPresets[0] (e.g. 1). A price fetch fires immediately at qty=1, then the
  "Custom" button appears selected. Price shown is for qty 1 while the input is blank.
  User must type to change. If they dismiss without typing, price is now at qty 1
  even though they may have had a higher qty preset selected before.
Impact: Confusing UX — price appears to reset to qty 1 when Custom is clicked.
  Customers may misread pricing.
Fix: When "Custom" is clicked, initialize customQty to the currently selected qty
  as a string, so the price doesn't change and the field is pre-filled:
  onClick={() => { setCustomQty(String(qty)); setIsCustomQty(true); }}
```

```
File: src/components/estimator/OptionsPanel.tsx
Line: 194
Severity: LOW
Issue: The "Custom qty" text input for sqft-based staff products uses value={state.qty}.
  When a preset button (e.g., "10") is selected, the input also shows "10". If staff
  wants to type a custom qty, they must first clear the field — which triggers
  onChange({ qty: parseInt("") || 1 }) = qty:1, changing the price.
Impact: Staff must carefully clear the input before typing; accidentally submitting
  empty field sets qty to 1. Minor workflow friction.
Fix: Use a separate local state for the custom input string (like ProductConfigurator does
  with customQty/isCustomQty), or change placeholder to "Custom" and leave value=""
  until the user focuses the field.
```

```
File: src/components/product/ProductConfigurator.tsx + src/components/estimator/QuotePanel.tsx
Lines: ProductConfigurator:144 | QuotePanel:46
Severity: LOW
Issue: GST rate hardcoded as 0.05 in both files. Engine reads GST rate from
  config.v1.csv (key: gst_rate). If the rate ever changes (unlikely but possible),
  the engine and the client UI would diverge.
Impact: Low risk in practice (Canadian GST has been 5% since 2008), but the display
  would be wrong if config ever changes.
Fix: Return gst_rate from the engine in EstimateResponse and use it in client UI,
  or trust the engine's gst value from line_items and don't re-compute client-side.
```

### 6C. Security Vulnerabilities

**CRITICAL/HIGH:**
- **Webhook HMAC bypass** (see 6B above) — unauthenticated order confirmation possible.

**MEDIUM:**
- **`/api/upload` has no authentication.** Any user on the internet can upload files to the Supabase `print-files` bucket (up to 50 MB). There is no rate limiting. This could be used for storage cost abuse.
  - Mitigation: This is a known design choice (anonymous checkout users need to upload artwork before creating an account). Consider adding rate limiting or at minimum request origin checking.

- **`/api/estimate` has no authentication.** The pricing engine is fully public. Intentional (it's the product), but if a competitor wants to scrape all pricing, they can. No rate limiting.

- **Supabase URL hardcoded in 5 files** (`middleware.ts:4`, `server.ts:9`, `client.ts:5`, `storage.ts:8`, `account/orders/route.ts:10`). While the URL is publishable (not a secret), it's duplicated and should be read from `NEXT_PUBLIC_SUPABASE_URL` env var for consistency and easy migration.

**LOW:**
- **CSRF protection:** Not explicitly implemented, but Next.js App Router API routes are not vulnerable to traditional CSRF by default (no cookie-based auth on public routes; staff routes use Supabase session cookies but Supabase SDK handles CSRF via the `x-supabase-auth` flow).
- **No Content-Security-Policy header:** `next.config.ts` sets several security headers but not CSP. Low risk for this app but worth adding.
- **`npm audit`:** 15 vulnerabilities — ALL in dev dependencies (eslint). Zero prod runtime vulns. Run `npm audit fix` to resolve the ajv moderate issue; the 14 high minimatch issues require `npm audit fix --force` which bumps eslint (breaking change — test linting after).

### 6D. Performance Issues

- **No rate limiting anywhere.** `/api/orders`, `/api/upload`, `/api/estimate` are all unprotected. A bot could spam orders, fill up storage, or hammer the pricing API.
- **CSV hot-path on cold starts.** The loader uses module-level singletons, but in a serverless environment (Vercel), each cold start re-reads all 6 CSVs from disk. For a small dataset this is fast (~5ms), but it's worth knowing.
- **SMTP transporter recreated per email.** `getTransporter()` is called inside every email send function — creates a new TCP connection every time. For low volume (< 100 emails/day) this is fine. Could be optimized with a singleton transporter.
- **No image optimization on gallery/product images.** `<img>` tags instead of Next.js `<Image>` component likely used in some gallery components (not verified for every component). Next.js Image would provide automatic WebP conversion and lazy loading.
- **N+1 risk in staff orders page.** If the staff dashboard renders order_items per order in a loop, there may be N+1 query patterns (not confirmed — staff page component not read).
- **sessionStorage cart lost on tab close.** Not a performance issue per se, but a UX issue — customers who close the tab lose their cart. localStorage would persist across sessions.

### 6E. Technical Debt

- **`data/tables/cost_rules.v1.csv`** — 40 rows, never loaded by the engine. The engine uses `materials.v1.csv` and `config.v1.csv` for cost calculations instead. This CSV is dead weight — either the engine should use it or it should be deleted.
- **`.env.example` is outdated.** Missing: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `STAFF_EMAIL`, `PAYMENT_TOKEN_SECRET`, `WAVE_API_TOKEN`, `CRON_SECRET`, `CLOVER_ECOMM_PRIVATE_KEY`, `CLOVER_MERCHANT_ID`, `CLOVER_ENVIRONMENT`. New developer would not know what env vars to set.
- **Two active domain names in code.** `truecolorprinting.ca` (SEO/metadata/JSON-LD) and `truecolor-estimator.vercel.app` (some email links). Domain migration needs a single pass to normalize all references once `truecolorprinting.ca` is live and pointed.
- **Stale git branches.** 8 completed feature/fix branches exist on origin. Safe to delete.
- **`railway.toml` present but Vercel is the active platform.** Railway config is stale/unused.
- **`src/components/estimator/EmailModal.tsx`, `WaveModal.tsx`, `ProductProof.tsx`** — not read in this audit. May contain logic that duplicates what's in API routes.
- **No tests.** Zero test files. The pricing engine is the most critical component and is completely untested. A misconfigured CSV would pass silently.
- **Hardcoded Wave business constants** (`WAVE_BUSINESS_ID`, `WAVE_GST_TAX_ID`, `WAVE_PRINT_PRODUCT_ID`) in `src/lib/wave/client.ts`. These should be env vars for portability.
- **`src/lib/diagram.ts`** — Used by `QuotePanel.tsx` as `buildSpecDiagramSvg()` to generate the dimension diagram in printed quotes. Not a dead file.
- **`ProductConfigurator.tsx` constants duplicated from CSV:** `BULK_HINTS` duplicates `qty_discounts.v1.csv` tier percentages. `DESIGN_FEES` duplicates `config.v1.csv` design fee values. Any owner change to the CSVs does not automatically update the client-side UI hints.
- **Two separate qty preset systems exist:** `SQFT_QTY_PRESETS` in `OptionsPanel.tsx` (staff) and `qtyPresets` per product in `products-content.ts` (client). These can drift apart — MAGNET already differs: staff has [1,2,4], client product content must be checked separately.
- **Staff estimator `useEffect` with `[category, state]` dependency** (staff/page.tsx): `state` is a new object on every render, causing the effect to run more often than needed. Should use individual state fields as deps or wrap with `useCallback`.
- **`src/components/estimator/EmailModal.tsx`, `WaveModal.tsx`, `ProductProof.tsx`** — Read during UI audit context. These are non-trivial modal components; not deeply audited for logic bugs.

---

## 7. Deployment & Infrastructure

```
Platform: Vercel (active) + Railway (config exists, not active)
Deploy method: git push to main → Vercel auto-deploy (~2 min)
Build command: next build
Output directory: .next
Live URL: https://truecolor-estimator.vercel.app

Environment variables required:
  Boot-required:
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    SUPABASE_SECRET_KEY
    SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
    PAYMENT_TOKEN_SECRET
    CLOVER_ECOMM_PRIVATE_KEY
    CLOVER_MERCHANT_ID
    CLOVER_ENVIRONMENT
    NEXT_PUBLIC_SITE_URL
    CRON_SECRET
    STAFF_EMAIL
  Feature-required:
    WAVE_API_TOKEN (staff Wave invoicing)
  Optional:
    SMTP_FROM, SMTP_BCC (defaults to info@true-color.ca)

Domain/DNS: truecolor-estimator.vercel.app (Vercel). truecolorprinting.ca (not yet pointed here).
SSL: Auto via Vercel
Edge functions: None. All routes run as Node.js serverless functions (required for fs.readFileSync in loader.ts — edge runtime would break CSV loading).
Monitoring: NONE. No uptime monitoring, no error tracking, no alerting.
Logging: console.log/console.error only. Visible in Vercel function logs (ephemeral — not searchable).
Backup: Supabase free tier — NO automated point-in-time recovery. Manual export only.
Scaling: Vercel serverless — auto-scales. Supabase free tier: 500 MB DB, 1 GB storage, 50K monthly active users.
Cost: Vercel hobby (free) + Supabase free tier + Hostinger email (~$5/mo) + Clover transaction fees + Wave free tier.
Rollback: git revert + push to main, or Vercel dashboard → Deployments → Redeploy previous.
```

---

## 8. Domain & Business Logic Map

### Domain Terminology
- `"estimate"` = a priced quote computed by the engine from dimensions/category/options — NOT saved to DB
- `"quote"` = an estimate sent to a customer via email (with QR code + PDF)
- `"order"` = a confirmed purchase saved to Supabase `orders` table with an order number
- `"cart"` = sessionStorage list of CartItem objects — ephemeral, never hits the DB
- `"fixed-size product"` = a row in products.v1.csv with exact dimensions and verbatim price
- `"sqft-tier pricing"` = pricing_rules.v1.csv rows matched by sqft range
- `"PRINT_READY"` = customer has print-ready artwork files; no design fee applied
- `"pending_payment"` = order created, payment not yet confirmed
- `"proof"` = a staff-uploaded preview image/PDF sent to customer for approval before printing
- `"Wave invoice"` = a DRAFT accounting record in Wave — not sent to customer until pickup
- `"durable pay link"` = `/pay/[token]` URL — 30-day HMAC-signed token, creates fresh Clover session on click

### Business Rules
- "Fixed-size price verbatim": Products matched in products.v1.csv return their CSV price directly — no formula — `engine/index.ts:63-81`
- "Qty discount guard": Bulk discounts only apply when basePricePerSqft !== null (excludes unit-priced products like BCs and flyers) — `engine/index.ts:162`
- "Minimum order-level": Min charge compares total order value (unit × qty), not per unit — `engine/index.ts:235`
- "Rush is always +$40": Rush fee = flat $40 from config.v1.csv key `rush_fee_flat` — never free, never variable — `engine/index.ts:284`
- "eTransfer = no checkout URL": POST /api/orders returns `checkoutUrl: null` for etransfer — `orders/route.ts:191`
- "Wave DRAFT on every order": Every order creates a Wave DRAFT invoice silently — `orders/route.ts:159`
- "Wave send on pickup": NOT YET BUILT — Wave invoice sent to customer is a future feature
- "Order number format": TC-YYYY-XXXXX (year + base-36 timestamp suffix) — `orders/route.ts:93`
- "Staff redirect": Owner's email (`STAFF_EMAIL` env var) → /account redirects to /staff/orders — `middleware.ts:37`
- "Non-fatal external failures": Wave, email, and best-effort DB updates never abort an order — `orders/route.ts:185,219,245,276`

### User Roles
- **Customer (anonymous):** Can get estimates, add to cart, upload files, place orders, pay
- **Customer (authenticated):** All of above + view order history at /account + receive proof review
- **Staff/Owner:** All customer actions + /staff/orders dashboard + change order status + upload proofs + send messages + create Wave invoices from quotes
- **Note:** Role distinction is purely by email — `STAFF_EMAIL === user.email` grants staff access. No role column in DB.

### Feature Flags
NONE. No feature flag system.

### Pricing/Billing Logic
1. Customer gets instant price on product page (engine → CSV lookup)
2. Cart accumulates items; checkout captures contact info + optional account creation
3. On order submit: total = sum(sell_prices) + optional rush $40 + GST 5%
4. Card: Clover Hosted Checkout session → customer pays → webhook confirms → status → email
5. eTransfer: customer sends to info@true-color.ca → staff manually marks payment_received
6. Wave DRAFT invoice created for every order (accounting record)
7. Future: Wave invoice sent (approved + sent via Wave) when status → ready_for_pickup

### Email/Notification Triggers
| Event | Recipient | Template |
|-------|-----------|----------|
| Order created | Customer | orderConfirmation.ts |
| Order created | Staff | staffNotification.ts |
| Clover payment webhook | Customer | statusUpdate (payment_received) |
| Staff → payment_received | Customer | statusUpdate |
| Staff → in_production | Customer | statusUpdate |
| Staff → ready_for_pickup | Customer | statusUpdate |
| Staff uploads proof | Customer | proofSent.ts |
| Staff sends custom reply | Customer | reply/route.ts (inline HTML) |
| Quote email requested | Customer | quoteTemplate.ts |

### Data Lifecycle
- **Cart items:** Created on "Add to Cart"; deleted on checkout completion (`clearCart()`) or tab close
- **Files (artwork):** Uploaded to `pending/{uuid}/artwork.{ext}` before order; path saved to `order_items.file_storage_path` and `orders.file_storage_paths` — never cleaned up
- **Files (proofs):** Uploaded to `proofs/{orderId}/proof.{ext}` by staff — upsert (overwrites on re-upload)
- **Orders:** Created on checkout; status progresses through lifecycle; never deleted
- **Customers:** Upserted by email on every order — phone/name updated on conflict

### Compliance
- **GST:** 5% applied to all sales in Canada (enforced in engine + orders route)
- **GDPR/PIPEDA:** Customer email/name stored. No explicit consent mechanism or data deletion flow.
- **PCI:** Card processing fully delegated to Clover — no card data touches the app servers.
- **PST:** NOT collected (Saskatchewan PST is complex — owner decision)

---

## 9. Recommendations (Priority Order)

| Priority | Recommendation | Impact | Effort | Category |
|----------|----------------|--------|--------|----------|
| 1 | Fix Clover webhook signature bypass — require signature when secret is set; reject if absent | CRITICAL | LOW | Security |
| 2 | Replace hardcoded old Vercel URL fallback in orders/route.ts:201,253 with current URL | HIGH | LOW | Bug |
| 3 | Confirm correct phone number (954-8688 vs 652-8888); standardize across all email templates | HIGH | LOW | Bug |
| 4 | **Fix ProductConfigurator: send `addons` to engine** — remove client-side addon total computation; use engine line_items for addon display. Eliminates grommet/H-stake price divergence. | HIGH | MEDIUM | UI Bug |
| 5 | **Fix MAGNET bulk hints**: either add qty 5, 10 to MAGNET qtyPresets OR rewrite BULK_HINTS to show a "5+ saves 5%" text hint; align MOST_POPULAR_QTY[MAGNET] with actual presets | MEDIUM | LOW | UI Bug |
| 6 | **Fix custom qty UX**: initialize `customQty` to current `qty` as string when "Custom" clicked; prevents price jumping to qty 1 | MEDIUM | LOW | UI Bug |
| 7 | Add `npm audit fix` to resolve ajv moderate vuln; evaluate eslint bump for high vulns | MEDIUM | LOW | Security |
| 8 | Update `.env.example` to list all 15+ actual env vars needed to run the app | MEDIUM | LOW | Tech Debt |
| 9 | Add rate limiting to `/api/upload` (and optionally `/api/orders`) to prevent storage abuse | MEDIUM | MEDIUM | Security |
| 10 | Add monitoring: Vercel Analytics or Sentry for error alerting | MEDIUM | LOW | Ops |
| 11 | Compute `margin_pct` in engine instead of always returning null | LOW | LOW | Bug |
| 12 | Delete `src/lib/supabase/storage.ts` (dead code) and `data/tables/cost_rules.v1.csv` (unused) | LOW | LOW | Tech Debt |
| 13 | Design proper 1200×630 OG image → replace logo placeholder in layout.tsx | LOW | MEDIUM | SEO |
| 14 | Add database backup strategy (Supabase paid tier or pg_dump scheduled export) | HIGH | MEDIUM | Ops |
| 15 | Write smoke tests for pricing engine (fixed-size match, sqft tier, min charge, qty discount) | MEDIUM | MEDIUM | Testing |
| 16 | Move hardcoded Wave IDs to env vars (`WAVE_BUSINESS_ID`, `WAVE_GST_TAX_ID`, `WAVE_PRINT_PRODUCT_ID`) | LOW | LOW | Tech Debt |
| 17 | Single domain pass: normalize all truecolorprinting.ca vs truecolor-estimator.vercel.app once domain is live | MEDIUM | LOW | Tech Debt |
