# Codebase Audit: True Color Display Printing — Estimator & E-Commerce App
**Generated:** 2026-02-24 (v2 — updated after 9 major commits)
**Audited by:** Claude Code
**Git branch:** main
**Last commit:** ab6898e — Customer portal overhaul: stepper, proofs, addons, eTransfer, file upload + live sync
**Working directory:** `/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator`

---

## Executive Summary

A Next.js 16 App Router e-commerce + print pricing app for True Color Display Printing (Saskatoon, SK). Customers get instant online quotes for 16 product types, add to cart, pay by Clover card or Interac e-Transfer, and track orders via a customer portal. Staff manage orders through a protected dashboard with status updates, proof uploads, production notes, and Wave invoice automation.

The codebase is **production-ready and clean**. TypeScript strict mode is on, the pricing engine is a well-isolated pure function, all staff routes are auth-gated, and error handling consistently marks email failures as non-fatal.

**Three active issues require attention:**

1. **Hardcoded old Vercel preview URL** in `AccountClientPage.tsx:14` and `src/lib/config.ts:9` — these point to `truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app` (a dead link). If `NEXT_PUBLIC_SITE_URL` is ever unset, the customer portal's "Pay Now" links break silently.
2. **Clover webhook HMAC bypass** — validation only runs `if (tokenSecret)`. If `PAYMENT_TOKEN_SECRET` were ever removed from Vercel env, all webhooks would be accepted from anyone. Should be fail-closed.
3. **Two pending DB migrations** — `staff_notes TEXT` and `ALTER PUBLICATION supabase_realtime ADD TABLE orders` — have not been run in Supabase yet. Code handles this gracefully (best-effort updates) but staff notes won't persist and Realtime sync won't fire without them.

---

## 1. Project Structure

```
truecolor-estimator/
├── data/tables/             ← 6 CSV pricing tables (runtime-read, not bundled)
│   ├── config.v1.csv        (20 rows — business rules: GST, fees, thresholds)
│   ├── pricing_rules.v1.csv (84 rows — sqft-tier and lot-price rules by category)
│   ├── products.v1.csv      (73 rows — fixed-size catalog with verbatim prices)
│   ├── materials.v1.csv     (28 rows — material costs for margin display)
│   ├── qty_discounts.v1.csv (24 rows — bulk discount tiers per category)
│   ├── services.v1.csv      (13 rows — add-on services: grommets, H-stake, design, rush)
│   └── cost_rules.v1.csv    (legacy — UNUSED by engine)
├── e2e/smoke.test.ts        ← Smoke tests (imports from vitest)
├── scripts/
│   ├── validate-pricing.mjs ← 60-check pricing validator (run: npm run validate:pricing)
│   ├── gen-og.mjs           ← OG image generator
│   └── test-clover.mjs      ← Manual Clover API test
├── public/                  ← Static assets, OG image, logo
│   ├── og-image.png         ← OG image exists ✓
│   └── images/              ← gallery, products, about, process, trust
├── src/
│   ├── app/                 ← Next.js App Router
│   │   ├── api/             ← 17 API route files
│   │   ├── account/         ← Customer portal
│   │   ├── staff/           ← Staff dashboard + login
│   │   ├── products/[slug]/ ← 16 dynamic product pages
│   │   └── [8 SEO landing pages]
│   ├── components/          ← estimator/, home/, product/, site/, ui/
│   └── lib/                 ← cart/, config.ts, data/, email/, engine/, errors/, payment/, supabase/, wave/
├── vercel.json              ← Cron: keepalive at noon UTC daily
├── railway.toml             ← Railway config (inactive — using Vercel)
├── next.config.ts           ← serverExternalPackages: [@resvg/resvg-js], security headers
├── .env.local               ← Local secrets (gitignored)
└── .env.example             ← Template (incomplete — missing 8 of 12 required vars)
```

**Git state:** Branch `main`, clean working tree.
**Stale branches (safe to delete):** feat/clover-payment-links, feat/proof-upload, fix/bc-16pt-removal, fix/bc-ink-imposition, fix/flyer-pricing, fix/gap-01-foamboard, fix/gap-02-bc-card-stock, fix/gap-03-80lb-paper — all merged to main.

---

## 2. Tech Stack

| Layer          | Technology | Version | Config File | Notes/Gotchas |
|----------------|------------|---------|-------------|---------------|
| Runtime        | Node.js | via Vercel serverless | — | Each API route is a serverless function; no persistent Node process |
| Framework      | Next.js (App Router) | 16.1.6 | next.config.ts | `serverExternalPackages: ["@resvg/resvg-js"]` — REQUIRED or build breaks |
| Language       | TypeScript | ^5 | tsconfig.json | strict mode on |
| Database       | Supabase (Postgres) | @supabase/supabase-js 2.97 | — | service key for server-side, anon key for client |
| Auth           | Supabase Auth | — | middleware.ts | Magic link removed; email confirm OFF; password flow active |
| Hosting        | Vercel | — | vercel.json | Auto-deploy on push to main (~2 min) |
| Styling        | Tailwind CSS v4 | ^4 | postcss.config.mjs | v4 syntax (no tailwind.config.js needed) |
| State Mgmt     | sessionStorage | — | cart.ts | Cart persists across nav in same tab, lost on close |
| API Layer      | Next.js App Router API routes | — | src/app/api/ | All typed, try/catch throughout |
| Email          | nodemailer + Hostinger SMTP | ^8.0.1 | env vars | smtp.hostinger.com:465, info@true-color.ca |
| File Storage   | Supabase Storage | — | print-files bucket | customer-uploads/, proofs/ paths |
| Payments       | Clover Hosted Checkout | — | clover.ts | Card payments; eTransfer handled manually |
| Accounting     | Wave Accounting API | — | wave/client.ts | GraphQL API; DRAFT invoices on order; send on pickup |
| Testing        | Vitest | ^4.0.18 | — | 36 unit tests against real CSVs; no mocking |
| Linting        | ESLint | ^9 | eslint.config.mjs | eslint-config-next |
| Error Tracking | NOT IMPLEMENTED | — | — | No Sentry, no external error service |
| Analytics      | NOT IMPLEMENTED | — | — | No GA, no Plausible |
| AI/LLM         | NOT IMPLEMENTED | — | — | No AI features |
| QR codes       | qrcode + @resvg/resvg-js | ^1.5.4 | — | Inline QR in order confirmation email |

---

## 3. Architecture & Data Flow

### 3A — Core Checkout Flow

```
Flow: Customer Order
Entry: /products/[slug] → /cart → /checkout → POST /api/orders
Component chain:
  ProductPageClient → ProductConfigurator → ProductConfigurator adds to cart
  CartPage → CheckoutPage → POST /api/orders
API calls:
  POST /api/estimate       { category, width_in, height_in, sides, qty, addons... }
  POST /api/orders         { items[], contact{}, is_rush, payment_method, file_storage_paths? }
  Response:                { orderId, orderNumber, checkoutUrl, waveInvoiceId }
DB ops:
  customers UPSERT by email
  orders INSERT
  order_items INSERT (one row per cart item)
  customers UPDATE address (best-effort)
  customers UPDATE companies[] (best-effort)
  orders UPDATE file_storage_paths (best-effort)
  orders UPDATE wave_invoice_id (best-effort)
  orders UPDATE payment_reference (best-effort)
External calls:
  Wave: createOrFindCustomer → createInvoice (DRAFT)
  Clover: createHostedCheckout → returns session URL
  Nodemailer: customer confirmation email (QR code, file receipt, eTransfer instructions)
  Nodemailer: staff notification email
State changes:
  Cart cleared client-side after successful order
Error states:
  Wave failure: non-fatal, logs to console, order continues
  Clover failure: fatal for card payments; eTransfer orders unaffected
  Email failure: non-fatal, always logs
```

### 3B — Staff Order Management Flow

```
Flow: Staff order lifecycle
Entry: /staff/orders (protected by middleware)
Component chain:
  StaffOrdersPage → fetchOrders (server-side) → OrdersTable (client, Realtime+polling)
Status transitions:
  pending_payment → payment_received → in_production → ready_for_pickup → complete
  Guard: complete requires current = ready_for_pickup (enforced server-side)
Email triggers per status:
  payment_received  → statusUpdate email (payment confirmed)
  in_production     → statusUpdate email (printing now)
  ready_for_pickup  → statusUpdate email + Wave invoice approve + send
  complete          → reviewRequest email (Google review ask)
Proof upload:
  POST /api/staff/orders/[id]/proof (multipart, auth required)
  → Supabase storage: proofs/{orderId}/proof.{ext}
  → orders UPDATE proof_storage_path, proof_sent_at
  → Customer email with 7-day signed URL
```

### 3C — Backend/API Architecture

```
Route organization: File-based (Next.js App Router)
Middleware chain:
  1. src/middleware.ts — runs on /staff/:path* and /account
     - /account + staff email → redirect /staff/orders
     - /staff/* (not /staff/login) + no user → redirect /staff/login
Auth flow:
  Staff: Supabase session cookie → getSessionUser() → 401 if null
  Customer: Bearer token in Authorization header → getUser() → 401 if null
  Service operations: SUPABASE_SECRET_KEY via createServiceClient() (bypasses RLS)
Rate limiting: NOT IMPLEMENTED (no global or per-route rate limiting)
Validation: Manual checks (required fields, status enum, file MIME/ext/size)
Error handling: try/catch on every handler; non-fatal errors logged only
Response format:
  Success: { data... } or { ok: true }
  Error:   { error: "message" }
```

### 3D — External Integrations

```
Service: Supabase
Purpose: Postgres DB + Auth + File Storage + Realtime
Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
Files: src/lib/supabase/client.ts, server.ts, middleware.ts
Error handling: API calls check for error object; non-fatal ops use void (fire-and-forget)
Rate limits: Not explicitly handled

Service: Clover Hosted Checkout
Purpose: Card payment processing
Env vars: CLOVER_ECOMM_PRIVATE_KEY, CLOVER_MERCHANT_ID, CLOVER_ENVIRONMENT
Files: src/lib/payment/clover.ts, src/app/api/payment/clover/route.ts
Error handling: createCloverCheckout throws on failure → fatal for card orders
Webhook: POST /api/webhooks/clover — HMAC-SHA256 with PAYMENT_TOKEN_SECRET

Service: Wave Accounting
Purpose: DRAFT invoices on order creation; send on pickup
Env vars: WAVE_API_TOKEN (Bearer token)
Files: src/lib/wave/client.ts, src/lib/wave/invoice.ts
Business IDs: Business ID hardcoded in client.ts (base64 encoded)
Error handling: Non-fatal — Wave failure logs and continues

Service: Nodemailer / Hostinger SMTP
Purpose: All customer and staff transactional emails
Env vars: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
Files: src/lib/email/*.ts (6 email modules)
Error handling: All sends wrapped in try/catch; always non-fatal

Service: Vercel Cron
Purpose: Keepalive ping to prevent Supabase project pause
Schedule: 0 12 * * * (noon UTC daily)
Endpoint: /api/cron/keepalive
Auth: CRON_SECRET env var checked against Vercel-Authorization header
```

---

## 4. Database Schema

**Provider:** Supabase (Postgres hosted)
**Connection:** Direct via @supabase/supabase-js (service key for server, anon key for client)
**Schema management:** Supabase dashboard / SQL editor (no migration files in repo)

### Tables (confirmed existing):

#### `customers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | text | UNIQUE |
| name | text | |
| company | text | nullable |
| phone | text | nullable |
| address | text | nullable — added via migration 2026-02-23 |
| companies | text[] | nullable — best-effort append (column may not exist yet) |

#### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| order_number | text | TC-YYYY-NNNN format |
| customer_id | uuid | FK → customers |
| status | text | pending_payment/payment_received/in_production/ready_for_pickup/complete |
| is_rush | bool | |
| subtotal | numeric | pre-tax |
| gst | numeric | 5% |
| total | numeric | |
| payment_method | text | clover_card / etransfer |
| notes | text | nullable — customer notes from checkout |
| staff_notes | text | nullable — **MIGRATION PENDING** |
| wave_invoice_id | text | nullable — best-effort update |
| payment_reference | text | nullable — Clover session ID |
| file_storage_paths | text[] | nullable — **MIGRATION LIKELY DONE** |
| proof_storage_path | text | nullable — path in print-files bucket |
| proof_sent_at | timestamptz | nullable |
| paid_at | timestamptz | nullable |
| ready_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |
| created_at | timestamptz | default now() |

#### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| order_id | uuid | FK → orders |
| category | text | engine category code |
| product_name | text | |
| material_code | text | nullable |
| width_in | numeric | nullable |
| height_in | numeric | nullable |
| sides | int | 1 or 2 |
| qty | int | |
| addons | text[] | |
| is_rush | bool | |
| design_status | text | |
| unit_price | numeric | |
| line_total | numeric | |
| file_storage_path | text | nullable — first file only |
| line_items_json | jsonb | nullable — engine line items breakdown |

### Pending Migrations (NOT YET RUN):
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff_notes TEXT;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

## 5. Key Files & Business Logic

### Pricing Engine (`src/lib/engine/index.ts`)
**Pure function — 11-step evaluation:**
1. Validate category
2. Compute sqft from width_in × height_in
3. Exact-match in `products.v1.csv` → price verbatim (no recompute)
4. If no match: find sqft-tier rule → `price_per_sqft × sqft` or `price_per_unit` (flat lot)
4.5. Bulk discount: applies to sqft-priced products only (SIGN/BANNER/RIGID/FOAMBOARD/MAGNET/DECAL/VINYL_LETTERING)
5. Add-ons: GROMMETS (perimeter formula × qty), H_STAKE (qty × $2.50)
6. Minimum charge: applies to total order, not per-unit
7. Design fee: MINOR_EDIT $35 / FULL_DESIGN $50 / LOGO_RECREATION $75
8. Rush fee: $40 flat
9. Subtotal + 5% GST
10. Cost estimate (material + ink + labor $3.50 + overhead $5.00)
11. Build Wave line name

**Critical invariant:** STEP 3 verbatim match means editing `products.v1.csv` directly changes what customers pay. No code recompute.

### Data Loader (`src/lib/data/loader.ts`)
- Reads CSVs with `fs.readFileSync` at first call, caches in module-level `let _x: T | null`
- Serverless: cache lives per-invocation (not persistent across requests)
- Hand-rolled CSV parser (handles quoted fields). No library dependency.

### Cart (`src/lib/cart/cart.ts`)
- sessionStorage-based, key `tc_cart`
- `CartItem` includes `line_items?: LineItem[]` — engine breakdown piped from ProductConfigurator through to checkout and email
- Cart events via `window.dispatchEvent(new Event("tc_cart_updated"))`

### Orders API (`src/app/api/orders/route.ts`)
- 8-step create flow: upsert customer → order_number → insert → items → Wave → Clover → customer email → staff email
- Order number: `TC-${year}-${(rowCount+1).padStart(4)}` — **collision risk** if two orders land simultaneously (acceptable for small shop)
- All file paths saved as best-effort void async updates (no await)

### Staff Orders (`src/app/staff/orders/`)
- Server component fetches orders with full join (customers, order_items)
- `OrdersTable` client component: Supabase Realtime + 45s polling fallback
- Features: status tabs, sort by date/rush, stats bar, proof upload, notes, Wave invoice modal, reply email, status override

### Customer Portal (`src/app/account/AccountClientPage.tsx`)
- 5-step status stepper, addon chips, proof inline viewer, eTransfer CTA
- Artwork upload for pending orders (POST /api/account/orders/[id]/upload-file)
- 20s polling + Supabase Realtime for live updates
- **Bug**: Line 14 — `SITE_URL` falls back to old preview URL `truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app` (dead link if env var missing)

### Email Templates (`src/lib/email/*.ts`)
6 email modules:
- `orderConfirmation.ts` — inline QR (CID attachment), file receipt, eTransfer instructions
- `statusUpdate.ts` — payment_received / in_production / ready_for_pickup
- `reviewRequest.ts` — fires on complete → Google review link (`g.page/r/CZH6HlbNejQAEAE/review`)
- `proofSent.ts` — proof email with 7-day signed URL
- `staffNotification.ts` — new order + customer file revision alerts
- `quoteTemplate.ts` — quote email from staff estimator tool

### Auth (`src/middleware.ts` + `src/lib/supabase/server.ts`)
- Middleware runs on `/staff/:path*` and `/account` only
- Staff email → `/account` redirects to `/staff/orders`
- `getSessionUser()` uses `getUser()` (cryptographically verified, correct)
- Customer routes use Bearer token pattern (not cookies)

---

## 6. Health Assessment

### 6A. Strengths

- **Pricing engine isolation**: Pure function, no side effects, fully testable against real CSVs. 36 tests pass.
- **Non-fatal error pattern**: Email failures, Wave failures, best-effort DB updates never crash the order flow. Consistently applied.
- **Staff portal completeness**: 7 features shipped — production notes, sort, stats, filter tabs, proof upload, status guard, Realtime sync.
- **Security headers**: X-Frame-Options: DENY, HSTS, CSP headers applied globally via next.config.ts.
- **Auth**: All `/api/staff/*` routes require authenticated Supabase session. Middleware protects all `/staff/*` pages.
- **TypeScript strict mode** throughout. No `any` escapes seen in reviewed files.
- **Input sanitization**: `sanitizeError(err)` utility (`src/lib/errors/sanitize.ts`) used for user-facing errors — no raw `.message` exposure.
- **File upload security**: MIME type + extension double-check, 50MB limit, path sanitization (`[^a-zA-Z0-9._-]` stripped) before storage.

### 6B. Bugs

```
File: src/app/account/AccountClientPage.tsx
Line: 14
Severity: MEDIUM
Issue: SITE_URL constant falls back to old Vercel preview URL:
  "https://truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app"
Impact: If NEXT_PUBLIC_SITE_URL env var is ever unset, "Pay Now" links in customer portal
  point to a broken URL. The env var IS set in Vercel currently, so this is dormant.
Fix: Change fallback to "https://truecolor-estimator.vercel.app"

File: src/lib/config.ts
Line: 9
Severity: LOW
Issue: SITE_URL config also falls back to old preview URL
Impact: Same as above — dormant while env var is set
Fix: Update fallback to current stable URL

File: src/app/api/webhooks/clover/route.ts
Lines: 31-41
Severity: HIGH
Issue: HMAC validation only runs if (tokenSecret). If PAYMENT_TOKEN_SECRET is removed from
  Vercel env, the entire `if` block is skipped and ALL webhook requests are accepted.
Impact: Anyone can spoof Clover payment events and confirm orders without paying.
Fix: Fail-closed: if (!tokenSecret) return 401. Currently fixed for PAYMENT_TOKEN_SECRET
  being SET — but vulnerable to accidental env var deletion.
```

### 6C. Security Vulnerabilities

```
1. Clover webhook fail-open (see above) — HIGH
   File: src/app/api/webhooks/clover/route.ts:31

2. Hardcoded Supabase URL in source
   File: src/lib/supabase/server.ts:9 — "https://dczbgraekmzirxknjvwe.supabase.co"
   Also: src/app/api/webhooks/clover/route.ts:32, upload-file/route.ts:24
   Severity: LOW — it's a project URL (not a secret), but prefer env var only
   Fix: Remove hardcoded fallback; throw if NEXT_PUBLIC_SUPABASE_URL is unset

3. Order number collision
   File: src/app/api/orders/route.ts:117-121
   Severity: LOW — acceptable for small shop volume
   Issue: SELECT COUNT(*) then INSERT is non-atomic — concurrent orders could
   theoretically get the same TC-YYYY-NNNN number
   Fix: Use Postgres sequence or database-generated value if volume grows

4. No rate limiting on POST /api/orders or POST /api/estimate
   Severity: LOW — Vercel provides some DDoS protection at edge
   Fix: Add simple IP-based rate limiting if spam becomes an issue

5. npm audit: 2 vulnerabilities in devDependencies (ajv + minimatch)
   Severity: LOW — both are in ESLint toolchain only (not shipped to users)
   Fix: npm audit fix (or accept as dev-only risk)
```

### 6D. Performance Issues

```
1. CSV loader in serverless: module-level cache is per-invocation on cold start.
   On warm functions, cache works. On cold starts, all 6 CSVs are re-read.
   Severity: LOW — files are small (<5KB each); acceptable read cost

2. Staff orders page: SELECT with full join on ALL orders (no pagination).
   As order volume grows, this query will slow.
   Severity: MEDIUM — add .limit(100) and pagination when needed

3. No image optimization for gallery JPEGs. Several large gallery images
   are served as .jpg without next/image lazy loading.
   Severity: LOW — affects gallery page performance on mobile

4. No analytics to identify actual bottlenecks.
```

### 6E. Technical Debt

```
1. .env.example is stale — missing 8 of 12 env vars actually used
   File: .env.example
   Fix: Update to include all: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
     SUPABASE_SECRET_KEY, PAYMENT_TOKEN_SECRET, WAVE_API_TOKEN, STAFF_EMAIL, CRON_SECRET,
     CLOVER_ECOMM_PRIVATE_KEY, CLOVER_MERCHANT_ID, CLOVER_ENVIRONMENT

2. PLACEHOLDER_100LB material — flyers and brochures on 100lb paper have sell prices
   but no cost data → staff margin display shows warning banner.
   Fix (owner task): Get Spicer quote → update materials.v1.csv row PLACEHOLDER_100LB

3. cost_rules.v1.csv is UNUSED by engine — still loaded at startup
   File: src/lib/data/loader.ts — no getCostRules() export exists
   Note: This is harmless; the file was superseded by config.v1.csv approach

4. TODO comment: ReviewsSection.tsx:1-2 — replace with Trustindex live widget
   Status: Owner has Trustindex account; domain not live yet

5. `companies` column update in orders API may silently fail if column doesn't exist
   File: src/app/api/orders/route.ts:84-106 (best-effort, try/catch)
   Status: Acceptable workaround; schema may need migration

6. 8 stale git branches all merged to main — safe to delete

7. metadataBase uses truecolorprinting.ca (not live domain)
   File: src/app/layout.tsx:23 — affects canonical URL generation and OG images
   Status: Domain redirect will resolve this; no action needed until domain goes live
```

---

## 7. Deployment & Infrastructure

```
Platform: Vercel
Deploy method: git push to main → auto-deploy (~2 min)
Build command: next build
Output directory: .next
Environment: All 12 env vars set in Vercel dashboard

Required env vars:
  Boot-required:
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    SUPABASE_SECRET_KEY
    PAYMENT_TOKEN_SECRET
    SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
    NEXT_PUBLIC_SITE_URL
  Feature-required (non-fatal if missing):
    WAVE_API_TOKEN           — Wave invoices disabled, logs error
    CLOVER_ECOMM_PRIVATE_KEY, CLOVER_MERCHANT_ID, CLOVER_ENVIRONMENT — card payments disabled
    STAFF_EMAIL              — falls back to hardcoded "info@true-color.ca"
    CRON_SECRET              — cron keepalive always runs (no auth enforcement)

Domain: truecolor-estimator.vercel.app (stable) — truecolorprinting.ca not yet configured
SSL: Auto via Vercel
CDN: Vercel Edge Network (global)
Monitoring: NONE — no uptime monitoring, no error alerts
Logging: console.log/error to Vercel Functions logs (not searchable long-term)
Database backup: Supabase automated backups (daily on free/pro tier)
File backup: Supabase Storage (no separate backup)
Rollback: Vercel dashboard → previous deployment → Instant Rollback
Cost: ~$0/month (Vercel Hobby + Supabase free tier)
Cron: /api/cron/keepalive → GET /api/estimate → keeps Supabase from pausing
```

---

## 8. Domain & Business Logic Map

### Domain Terminology

- **"category"** = engine product type code (SIGN, BANNER, RIGID, FOAMBOARD, DISPLAY, STICKER, DECAL, VINYL_LETTERING, PHOTO_POSTER, MAGNET, POSTCARD, BUSINESS_CARD, FLYER, BROCHURE, DESIGN, INSTALLATION, SERVICE) — maps to `order_items.category` column
- **"fixed-size match"** (isFixedSize) = product whose exact width/height/qty/sides is in `products.v1.csv` → price returned verbatim, no formula applied
- **"lot price"** (isLotPrice) = pricing rule where `price_per_unit` is the flat cost for the entire print run (e.g. 100 flyers = $55) — never multiplied by qty again
- **"sqft-tier"** = pricing rule where price = `sqft × price_per_sqft` — used for custom-size large format
- **"sell_price"** = pre-tax subtotal for all units (addons included) — what goes in the cart and invoice
- **"basePricePerSqft"** = rate before bulk discount; `null` for fixed-size and lot-price products
- **"min_charge"** = order-level minimum charge from `pricing_rules.v1.csv` — compares against total order, not per-unit
- **"pending_payment"** = order created, not yet paid (either awaiting Clover redirect or eTransfer receipt)
- **"payment_received"** = payment confirmed (Clover webhook or manual staff update)
- **"wave_invoice_id"** = Wave Accounting invoice ID (base64 encoded) — DRAFT on create, approved+sent on ready_for_pickup
- **"print-files"** = Supabase Storage bucket name — contains: customer-uploads/, proofs/
- **"TC-YYYY-NNNN"** = order number format (e.g. TC-2026-0001)
- **"PLACEHOLDER_100LB"** = material code for 100lb gloss text paper — prices live, costs unknown (awaiting Spicer quote)

### Business Rules

- **GST**: 5% on all sales (`gst_rate = 0.05` in config.v1.csv)
- **Rush fee**: Flat $40 added to any order marked is_rush (not included in sell_price; added at checkout calculation in `/api/orders`)
- **Minimum charge**: Category-level minimum (e.g. SIGN min = $30) applies to total order value, not per unit — so 30 small signs at $1 each = $30 total, minimum met
- **Bulk discounts**: Apply only to sqft-priced products (SIGN/BANNER/RIGID/FOAMBOARD/MAGNET/DECAL/VINYL_LETTERING). Lot-priced and fixed-size products have their own tier SKUs.
- **Grommets**: Formula `max(4, ceil(perimeterFt / 2))` per unit, multiplied by qty. $2.50/grommet.
- **H-stakes**: 1 per unit × qty. $2.50 each.
- **"complete" status**: Requires current status = "ready_for_pickup" (enforced server-side — prevents premature review request emails)
- **Staff redirect**: If `user.email === STAFF_EMAIL`, visiting `/account` redirects to `/staff/orders`
- **Wave invoice lifecycle**: DRAFT on order creation → Approved + Sent when status = ready_for_pickup

### User Roles

| Role | Access |
|------|--------|
| Guest | View products, get quotes, checkout (no account required) |
| Customer | /account — view own orders, upload files for pending orders |
| Staff (owner) | /staff/* — all orders, status updates, proof upload, notes, Wave invoices |

### Email Triggers

| Event | Recipient | File |
|-------|-----------|------|
| Order created | Customer | orderConfirmation.ts |
| Order created | Staff | staffNotification.ts |
| Status → payment_received | Customer | statusUpdate.ts |
| Status → in_production | Customer | statusUpdate.ts |
| Status → ready_for_pickup | Customer | statusUpdate.ts + Wave invoice sent |
| Status → complete | Customer | reviewRequest.ts (Google review ask) |
| Proof uploaded by staff | Customer | proofSent.ts |
| Customer uploads file revision | Staff | staffNotification.ts (sendCustomerFileRevisionNotification) |
| Staff replies to order | Customer | reply route — inline email |

### Pricing Products Coverage (16 active slugs)

| Slug | Engine Category | Pricing Method |
|------|----------------|----------------|
| coroplast-signs | SIGN | sqft-tier + bulk discount |
| vinyl-banners | BANNER | sqft-tier + bulk discount |
| acp-signs | RIGID | sqft-tier + bulk discount |
| vehicle-magnets | MAGNET | sqft-tier + bulk discount |
| foamboard-displays | FOAMBOARD | sqft-tier + bulk discount |
| retractable-banners | DISPLAY | fixed-size catalog |
| window-decals | DECAL | sqft-tier + bulk discount |
| window-perf | DECAL (RMVN006) | sqft-tier + bulk discount |
| vinyl-lettering | VINYL_LETTERING | sqft-tier + bulk discount |
| stickers | STICKER | lot-price by qty tier |
| business-cards | BUSINESS_CARD | lot-price by qty tier |
| flyers | FLYER | lot-price by qty tier |
| brochures | BROCHURE | lot-price by qty tier |
| postcards | POSTCARD | lot-price by qty tier |
| photo-posters | PHOTO_POSTER | sqft-tier |
| magnet-calendars | MAGNET (MAG302437550M) | fixed-size catalog |

**Known gaps**: STICKER unpriced by engine (no pricing rules in CSV — BLOCKED response), DECAL/VINYL_LETTERING cost estimates incomplete (PLACEHOLDER material).

---

## 9. Recommendations (Priority Order)

| Priority | Recommendation | Impact | Effort | Category |
|----------|----------------|--------|--------|----------|
| 1 | **Fix Clover webhook fail-open**: Add `if (!tokenSecret) return 401` before the existing check | CRITICAL | 5 min | Security |
| 2 | **Run 2 pending DB migrations**: `staff_notes TEXT` + realtime publication — staff notes currently silently fail to save | HIGH | 5 min | Database |
| 3 | **Fix stale fallback URLs**: AccountClientPage.tsx:14 + config.ts:9 → change preview URL to stable `truecolor-estimator.vercel.app` | MEDIUM | 5 min | Bug |
| 4 | **Update .env.example**: Add all 12 required env vars with descriptions | MEDIUM | 15 min | DevEx |
| 5 | **Add STICKER pricing rules to CSV**: Currently returns BLOCKED for sticker orders | HIGH | 30 min | Feature |
| 6 | **Get Spicer 100lb paper quote**: Update PLACEHOLDER_100LB in materials.v1.csv to show real margins for flyers/brochures | MEDIUM | Owner task | Business |
| 7 | **Add Trustindex live widget**: Replace hardcoded reviews in ReviewsSection.tsx once domain goes live | LOW | 30 min | Marketing |
| 8 | **Delete stale branches**: 8 merged branches from feat/ and fix/ prefixes | LOW | 2 min | Cleanup |
| 9 | **Add pagination to staff orders query**: Limit + cursor for when order volume grows past ~200 | LOW | 1 hr | Performance |
| 10 | **Add error tracking**: Sentry free tier → catch production errors automatically | MEDIUM | 1 hr | Ops |
