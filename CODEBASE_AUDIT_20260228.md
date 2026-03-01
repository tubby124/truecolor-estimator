# Codebase Audit: True Color Display Printing — Estimator & Order System
**Generated:** 2026-02-28
**Audited by:** Claude Code
**Git branch:** main
**Last commit:** 357cc46 — feat: sort text reviews first so mobile always shows 3 with written content
**Working directory:** /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator

---

## Executive Summary

This is a Next.js 16.1.6 ecommerce + staff management app for True Color Display Printing (Saskatoon, SK). The system handles print order quoting, checkout (Clover card + eTransfer), staff order management, Wave accounting integration, and Supabase file storage. The app is live on Railway at truecolorprinting.ca with Cloudflare CDN.

**State:** Functional and live, but 3 CRITICAL security vulnerabilities must be fixed before processing real money. Most notably, the `/api/orders` endpoint trusts client-submitted prices (price manipulation attack possible) and two staff-only API routes (`/api/email/send`, `/api/payment/clover`) have no authentication — anyone on the internet can send emails from your Brevo account and create Clover checkout sessions. The architecture is otherwise sensible for a small-shop system: good auth patterns on staff routes, non-fatal error handling, HMAC-signed payment tokens, and solid email delivery via Brevo REST API.

**SINGLE MOST IMPORTANT THING:** A bad actor can submit a POST to `/api/orders` with `sell_price: 0.01` on every item and the system will create a Clover checkout for $0.01 + GST, charge their card $0.01, mark the order as paid, and notify staff to print it. Fix price revalidation server-side before processing any real orders.

---

## 1. Project Structure

```
truecolor-estimator/
├── src/
│   ├── app/
│   │   ├── api/                     ← All API routes
│   │   │   ├── orders/              ← POST: create order
│   │   │   ├── estimate/            ← POST: pricing engine
│   │   │   ├── upload/              ← POST: artwork upload (BROKEN for anon users)
│   │   │   ├── quote-request/       ← POST: quote form (XSS vulnerability)
│   │   │   ├── email/send/          ← POST: quote email (NO AUTH — CRITICAL)
│   │   │   ├── payment/clover/      ← POST: Clover session (NO AUTH — CRITICAL)
│   │   │   ├── cron/keepalive/      ← GET: Supabase keepalive
│   │   │   ├── health/              ← GET: health check
│   │   │   ├── account/             ← Customer account routes (auth required)
│   │   │   ├── staff/               ← Staff routes (auth required via getSessionUser)
│   │   │   └── webhooks/clover/     ← Clover payment webhooks
│   │   ├── checkout/                ← Customer checkout page
│   │   ├── order-confirmed/         ← Post-checkout confirmation
│   │   ├── pay/[token]/             ← Signed payment link gateway
│   │   ├── staff/                   ← Staff dashboard (middleware protected)
│   │   ├── quote/                   ← Staff quote tool
│   │   ├── products/[slug]/         ← 16 product pages
│   │   └── [10 SEO landing pages]
│   ├── components/
│   ├── lib/
│   │   ├── engine/index.ts          ← Pricing engine (pure function, CSV-backed)
│   │   ├── supabase/server.ts       ← Server Supabase clients
│   │   ├── payment/token.ts         ← HMAC payment tokens
│   │   ├── payment/clover.ts        ← Clover API client
│   │   ├── email/smtp.ts            ← Brevo REST email sender
│   │   └── wave/                    ← Wave accounting API
│   └── middleware.ts                ← Route protection (/staff/*, /account)
├── data/tables/                     ← Pricing CSVs (the source of truth for prices)
├── public/                          ← Static assets
├── next.config.ts                   ← Security headers, CSP, redirects
└── railway.toml                     ← Railway deployment config
```

**Package manager:** npm (package-lock.json)
**Node version:** 20 (.node-version)

---

## 2. Tech Stack

| Layer          | Technology               | Version  | Config File          | Notes/Gotchas                                                    |
|----------------|--------------------------|----------|----------------------|------------------------------------------------------------------|
| Runtime        | Node.js                  | 20       | .node-version        | Required by Railway                                              |
| Framework      | Next.js                  | 16.1.6   | next.config.ts       | App router, standalone output, SSR                              |
| Language       | TypeScript               | ^5       | tsconfig.json        | Strict mode                                                     |
| Database       | Supabase (Postgres)      | ^2.97.0  | env vars             | Service role used in all API routes; RLS not enforced server-side|
| Auth           | Supabase Auth            | ssr^0.8.0| middleware.ts        | Cookie sessions; staff = single email match                     |
| Hosting        | Railway (primary)        | Hobby    | railway.toml         | SMTP blocked — must use Brevo REST API                          |
| Styling        | Tailwind CSS             | ^4       | postcss.config.mjs   | v4 (Oxide engine)                                               |
| State Mgmt     | React useState + localStorage | —   | —                    | Cart in localStorage; form in sessionStorage                    |
| API Layer      | Next.js route handlers   | —        | src/app/api/         | No tRPC, no REST framework                                      |
| Automation     | NOT IMPLEMENTED          | —        | —                    | —                                                               |
| Testing        | Vitest                   | ^4.0.18  | vitest.config.ts     | 36 unit tests (engine); no integration tests                   |
| Linting        | ESLint                   | ^9       | eslint.config.mjs    | eslint-config-next                                              |
| Error Tracking | NOT IMPLEMENTED          | —        | —                    | console.error only; no Sentry/Datadog                          |
| Analytics      | NOT IMPLEMENTED          | —        | —                    | No GA4, no Posthog                                             |
| Email/Comms    | Brevo REST API           | v3       | src/lib/email/smtp.ts| BREVO_API_KEY required; SMTP blocked by Railway                |
| File Storage   | Supabase Storage         | —        | —                    | print-files bucket; service role bypasses RLS                  |
| AI/LLM         | NOT IMPLEMENTED          | —        | —                    | —                                                               |
| Payments       | Clover Hosted Checkout   | v1       | src/lib/payment/     | 15-min session; /pay/[token] creates fresh sessions            |
| Accounting     | Wave Accounting API      | GraphQL  | src/lib/wave/        | WAVE_API_TOKEN required                                        |

**npm audit results:**
- `ajv <6.14.0` — Moderate (ReDoS via $data option) — dev dep, not runtime-critical
- `minimatch <=3.1.3` — HIGH (ReDoS via wildcards) — also dev dep; run `npm audit fix`

---

## 3. Architecture & Data Flow

### 3A — User-Facing Flows

**Flow: Checkout (card payment)**
```
Entry: /checkout (client page)
1. Cart loaded from localStorage
2. Contact form filled (name, email, company, phone, address)
3. Artwork files selected (PDF/AI/EPS/JPG/PNG/WebP, max 50MB each)
4. For each file: POST /api/upload (FormData) → Supabase print-files/pending/{uuid}/
5. POST /api/orders (JSON) → {items, contact, is_rush, payment_method:"clover_card", file_storage_paths}
   Server-side: upsert customer → create order row → create Wave DRAFT invoice → create Clover session
   Returns: {orderId, orderNumber, checkoutUrl (=>/pay/{token})}
6. Redirect to /pay/{token} → decode token → create fresh Clover session → redirect to Clover
7. Customer pays on Clover-hosted page → Clover redirects to /order-confirmed?oid={orderId}
8. /order-confirmed: updates status to payment_received (idempotent guard)
   OR: Clover webhook fires first → updates status automatically
```

**CRITICAL ISSUE IN STEP 5:** Server trusts client-submitted `sell_price` per item. No server-side price revalidation.

**CRITICAL ISSUE IN STEP 4:** `/api/upload` requires Supabase session (cookie-based). Anonymous users → silent 401 → order created without artwork file.

**Flow: eTransfer payment**
```
Same as above through step 5, but:
5b. POST /api/orders with payment_method:"etransfer"
    Creates order, generates /pay/{token} fallback URL (stored in payment_reference)
    Returns: {orderId, orderNumber, checkoutUrl: null} — no Clover call
6b. /order-confirmed shows eTransfer instructions
    Order stays in pending_payment until staff manually marks paid
7b. Staff marks payment_received → Wave approve + record → customer email sent
```

### 3B — Backend/API Architecture

**Route organization:** File-based (Next.js App Router)

**Middleware chain:**
```
middleware.ts → runs on /staff/:path* and /account
1. Create Supabase SSR client from request cookies
2. getUser() — validates session
3. If /account AND user.email === STAFF_EMAIL → redirect to /staff/orders
4. If /staff/* (not /staff/login) AND (no user OR wrong email) → redirect to /staff/login
```

**Auth pattern (staff routes):**
- Middleware: cookie-based session validation
- API routes (/api/staff/*): `getSessionUser()` → validates user, checks if session exists
- NOTE: `getSessionUser()` does NOT check if email === STAFF_EMAIL. Any authenticated Supabase user can call staff APIs if they bypass the middleware (e.g., direct API call with a valid JWT from a customer account).

**Auth pattern (customer account routes):**
- Bearer token in Authorization header
- `createClient(SUPABASE_URL, anonKey)` with token in global headers → validates session
- Pattern repeated in: /api/account/orders, /api/account/profile, /api/account/orders/[id]/upload-file

**UNAUTHENTICATED endpoints (should be authenticated):**
- `POST /api/email/send` — no auth check
- `POST /api/payment/clover` — no auth check

**Rate limiting:** NOT IMPLEMENTED anywhere

**Validation:** Manual (no Zod/Joi)

**Error handling:** try/catch everywhere, non-fatal pattern for side effects (emails, Wave, Clover)

**Response format:**
- Success: `NextResponse.json({ ok: true, ...data })`
- Error: `NextResponse.json({ error: "message" }, { status: N })`

### 3C — External Integrations

**Clover Hosted Checkout:**
- Purpose: Card payment sessions, webhook events
- API version: v1
- Auth: Bearer CLOVER_ECOMM_PRIVATE_KEY
- Files: src/lib/payment/clover.ts, src/app/api/payment/clover/route.ts, src/app/api/webhooks/clover/route.ts
- Error handling: createCloverCheckout throws → caller catches (non-fatal in most cases)
- Rate limits: Unknown, not handled

**Supabase:**
- Purpose: Database (orders, customers, order_items), Auth, Storage (print-files bucket)
- Auth: Service role key (bypasses RLS) in all API routes
- Files: src/lib/supabase/server.ts, src/lib/supabase/client.ts
- Error handling: checked per-operation

**Brevo:**
- Purpose: Transactional email
- API version: v3
- Auth: BREVO_API_KEY header
- Files: src/lib/email/smtp.ts
- 15-second timeout via AbortSignal
- BCC: SMTP_BCC env var auto-BCCs all outgoing emails to staff

**Wave:**
- Purpose: Accounting (create invoices, record payments, send receipts)
- API: GraphQL
- Files: src/lib/wave/client.ts, src/lib/wave/invoice.ts
- Error handling: non-fatal in most places

---

## 4. Database Schema

**Provider:** Supabase (PostgreSQL)
**Connection:** Via Supabase SDK (no direct pg connection)
**Schema management:** Manual SQL migrations (run via Supabase SQL editor)

**NOTE:** Some columns were added via migrations but the schema doc may be out of date. Some code uses `as Record<string, unknown>` to work around TypeScript not knowing about new columns — fragile pattern.

**Tables:**

`customers`
- id (uuid, PK)
- email (text, unique) — stored lowercase
- name (text)
- company (text, nullable)
- phone (text, nullable)
- address (text, nullable) — added via migration
- companies (text[], nullable) — added via migration

`orders`
- id (uuid, PK)
- order_number (text) — format: TC-YYYY-NNNN — RACE CONDITION risk (see bugs)
- customer_id (uuid, FK → customers)
- status (text) — pending_payment | payment_received | in_production | ready_for_pickup | complete
- is_rush (boolean)
- subtotal (numeric)
- gst (numeric)
- total (numeric)
- payment_method (text) — clover_card | etransfer
- notes (text, nullable)
- wave_invoice_id (text, nullable)
- payment_reference (text, nullable) — Clover session ID or /pay/ URL
- is_archived (boolean)
- archived_at (timestamptz, nullable)
- file_storage_paths (text[], nullable)
- proof_storage_path (text, nullable)
- proof_sent_at (timestamptz, nullable)
- staff_notes (text, nullable) — added via migration
- wave_invoice_approved_at (timestamptz, nullable)
- wave_payment_recorded_at (timestamptz, nullable)
- ready_at (timestamptz, nullable)
- paid_at (timestamptz, nullable)
- completed_at (timestamptz, nullable)
- created_at (timestamptz)

`order_items`
- id (uuid, PK)
- order_id (uuid, FK → orders)
- category (text)
- product_name (text)
- material_code (text, nullable)
- width_in (numeric, nullable)
- height_in (numeric, nullable)
- sides (int)
- qty (int)
- addons (text[])
- is_rush (boolean)
- design_status (text)
- unit_price (numeric)
- line_total (numeric)
- file_storage_path (text, nullable) — first artwork file only
- line_items_json (jsonb, nullable) — added via migration

**RLS policies:** NOT configured for server-side access (service role bypasses all RLS). Customer-facing data access is done by matching authenticated user's email to customer email — no RLS enforcement.

**Backup strategy:** Supabase automated backups (paid tier). Current tier: unknown. If on free tier: NO AUTOMATED BACKUPS.

---

## 5. Key Files & Business Logic

### Pricing Engine (src/lib/engine/index.ts)
**Purpose:** Calculate price for any print job configuration
**Inputs:** EstimateRequest { category, qty, material_code, width_in, height_in, sides, addons, is_rush, design_status }
**Outputs:** EstimateResponse { status, sell_price, line_items[], ... }
**Data source:** CSVs in data/tables/ — loaded at startup, pure function

**Three pricing models:**
1. SQFT-based: rate × sqft × qty (coroplast, banners, ACP, magnets, decals, vinyl lettering, foamboard)
2. Lot-price: flat price per print run, NOT multiplied by qty (business cards, flyers, stickers, postcards, brochures)
3. Per-unit: price_per_unit × qty, no dimensions (retractable banners — DISPLAY category)

**Pricing CSVs → to update live prices, edit CSVs only, no code changes needed**

### Payment Token (src/lib/payment/token.ts)
**Purpose:** Sign/verify payment links in quote emails — 30-day TTL
**Format:** base64url(payload).HMAC-SHA256(payload)
**Secret:** PAYMENT_TOKEN_SECRET env var
**VULNERABILITY:** Signature comparison uses `===` instead of `crypto.timingSafeEqual()` — timing attack possible

### Middleware (src/middleware.ts)
**Protects:** /staff/* (not /staff/login), /account
**Auth method:** Supabase SSR cookie session
**Staff check:** user.email must === STAFF_EMAIL env var
**Gap:** Only runs on /staff/* and /account — does NOT protect /api/staff/* routes

### Email (src/lib/email/smtp.ts)
**Sends via:** Brevo v3 REST API
**BCC:** Auto-BCCs SMTP_BCC (staff inbox) on all outgoing emails
**Attachments:** base64-encoded content, CID for inline images

---

## 6. Health Assessment

### 6A. Strengths

1. Non-fatal error handling pattern throughout — order creation survives email/Wave failures
2. Good file type + size validation on all upload endpoints
3. HMAC-signed payment tokens prevent amount tampering in email links
4. Idempotent guards on order status updates (.eq("status", "pending_payment") before update)
5. Service client pattern — SUPABASE_SECRET_KEY validated at call time (throws clearly if missing)
6. Clover webhook HMAC verification (when secret is configured)
7. Good security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy
8. noindex on all transactional/private pages
9. Artwork file path sanitization: `file.name.replace(/[^a-zA-Z0-9._-]/g, "_")`
10. escHtml() function for staff-to-customer email body

### 6B. Bugs

```
File: src/app/api/orders/route.ts
Line: 109
Severity: CRITICAL
Issue: Server trusts client-submitted sell_price for every cart item. Subtotal = sum of client-provided prices.
Impact: Any user can submit a cart with sell_price: 0.01 and pay $0.01 (+ GST) for any order. Clover charges
        whatever amount the server passes. Business loses full production cost on every manipulated order.
Fix: Re-run estimate() on the server using item.config to get server-authoritative prices. Compare/override
     client-submitted sell_price. Reject if difference > 1%.

File: src/app/api/email/send/route.ts
Line: 21 (POST handler — no auth check)
Severity: CRITICAL
Issue: No authentication required. Any public internet request can send emails from the business Brevo account.
Impact: Brevo quota exhausted, account suspended, spam/phishing sent in business's name.
Fix: Add getSessionUser() check at the top. This endpoint is called only from staff quote tool.

File: src/app/api/payment/clover/route.ts
Line: 9 (POST handler — no auth check)
Severity: CRITICAL
Issue: No authentication required. Anyone can create Clover Hosted Checkout sessions for arbitrary amounts.
Impact: Clover merchant account could be abused; creates noise in transaction logs.
Fix: Add getSessionUser() check at the top.

File: src/lib/payment/token.ts
Line: 76
Severity: HIGH
Issue: HMAC signature comparison uses `===` (string equality) instead of crypto.timingSafeEqual().
Impact: Timing attack could leak signature bits, potentially enabling token forgery over many requests.
Fix: Convert both sigs to Buffer, use crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig)).

File: src/app/api/upload/route.ts
Line: 28-31
Severity: HIGH
Issue: Endpoint requires authenticated Supabase session (cookie-based via getSessionUser()).
       Checkout page calls this endpoint without any auth headers — only cookies are sent.
       Anonymous checkout users have no Supabase session cookie → 401 → silent fail → order created without artwork.
Impact: Every anonymous checkout user trying to upload artwork silently fails. Staff sees orders with no files.
Fix: Remove the auth requirement from /api/upload since file type/size validation already prevents abuse.
     The path is already UUID-based (hard to enumerate). OR: pass the Bearer token from checkout and
     check it in the upload route.

File: src/app/api/webhooks/clover/route.ts
Line: 31-42
Severity: HIGH
Issue: HMAC verification is wrapped in `if (tokenSecret)`. If PAYMENT_TOKEN_SECRET is not set, the webhook
       accepts ALL requests with no verification — any actor can fake payment events and confirm orders.
Fix: Remove the conditional. If tokenSecret is missing, return 401 with "Webhook not configured".

File: src/app/api/quote-request/route.ts
Lines: 51-58
Severity: HIGH
Issue: User-submitted name, email, phone, product, description are interpolated directly into HTML email string
       with NO escaping. HTML injection in staff email.
Impact: Malicious quote request could inject HTML/scripts into the staff's email client.
Fix: Escape all user input: replace & < > " ' with HTML entities before interpolating into HTML.

File: src/app/api/orders/route.ts
Lines: 117-121
Severity: MEDIUM
Issue: Order number generation: count all orders → +1. Two concurrent POSTs can read the same count
       and generate duplicate order numbers. TC-2026-0042 for two different orders.
Impact: Duplicate order numbers cause confusion in staff portal and Wave accounting.
Fix: Use a Postgres sequence or a DB function for atomic order number generation.
     Quick fix: add a UNIQUE constraint on order_number column; let DB reject duplicates (app retries).

File: src/middleware.ts
Line: 45-50
Severity: MEDIUM
Issue: Staff middleware only runs on /staff/* and /account. The /api/staff/* routes use getSessionUser()
       for auth, but getSessionUser() only checks if a Supabase session exists — it does NOT verify
       user.email === STAFF_EMAIL. A customer with a valid Supabase account could call staff APIs directly.
Impact: Authenticated customers (who created accounts during checkout) can access staff API endpoints:
        PATCH status, POST reply, POST proof, etc. — they can change their own order status!
Fix: Add staffEmail check in getSessionUser() or add a separate requireStaffUser() helper.

File: src/lib/supabase/client.ts (+ middleware.ts, server.ts)
Severity: LOW
Issue: Supabase URL hardcoded as fallback: "https://dczbgraekmzirxknjvwe.supabase.co" — this is a public
       identifier but exposes the specific Supabase project. Not a secrets leak (it's NEXT_PUBLIC anyway)
       but the hardcoded fallback can mask missing env var issues.
Fix: Remove hardcoded fallbacks; throw if NEXT_PUBLIC_SUPABASE_URL is missing.
```

### 6C. Security Vulnerabilities

| Severity | Issue | Location | Fix |
|----------|-------|----------|-----|
| CRITICAL | Price manipulation — server trusts client sell_price | /api/orders:109 | Server-side price revalidation |
| CRITICAL | Unauthenticated email send | /api/email/send | Add getSessionUser() |
| CRITICAL | Unauthenticated Clover session creation | /api/payment/clover | Add getSessionUser() |
| HIGH | Timing-unsafe HMAC comparison | /lib/payment/token.ts:76 | crypto.timingSafeEqual() |
| HIGH | Anonymous upload blocked (silently) | /api/upload | Remove auth requirement |
| HIGH | Clover webhook skips auth if secret missing | /api/webhooks/clover:31 | Fail hard if no secret |
| HIGH | XSS in quote email template | /api/quote-request:51-58 | Escape HTML |
| MEDIUM | Any authed user can call staff APIs | /api/staff/* + middleware | requireStaffUser() |
| MEDIUM | Order number race condition | /api/orders:117 | DB sequence or UNIQUE constraint |
| MEDIUM | CSP has unsafe-inline + unsafe-eval | next.config.ts:57 | Use nonces (complex) or accept |
| MEDIUM | No rate limiting on any endpoint | All APIs | Add basic rate limiting |
| LOW | npm audit: minimatch HIGH, ajv MODERATE | devDeps | npm audit fix |
| LOW | nodemailer still installed (unused) | package.json | npm uninstall nodemailer |
| LOW | No server-side input length limits | /api/orders, /api/quote-request | Add max lengths |

### 6D. Performance Issues

1. **No caching on pricing engine** — CSVs reloaded on every `estimate()` call. Fine for current scale, watch at 1000+ rps.
2. **Wave API in critical checkout path** — if Wave is slow, checkout response delays. Non-fatal but adds latency.
3. **No image optimization on gallery** — 58 gallery images served as raw JPG/WEBP. Next.js Image would improve.
4. **Missing indexes on orders table** — `created_at` descending queries and `customer_id` lookups likely do full table scans. Add indexes.
5. **No error tracking** — console.error only. Impossible to know production error rates.

### 6E. Technical Debt

1. `nodemailer` and `@types/nodemailer` still in dependencies — unused, adds bundle bloat
2. `as Record<string, unknown>` casts used for columns added via migration — fragile, should update types
3. `void supabase.from("orders").update(...)` pattern used in many places — fire-and-forget updates mean failures are completely invisible
4. `healthcare-printing-saskatoon` directory exists but is empty (no page.tsx) — dead directory
5. `retail-signs-saskatoon` and `sports-banners-saskatoon` directories exist but are empty — dead directories
6. `src/app/api/auth/magic-link` directory exists but is empty — orphan directory
7. Wave invoice payment flow: `approveWaveInvoice` called, then `recordWavePayment` — if approval succeeds but recording fails, Wave shows invoice approved but no payment — manual reconciliation needed
8. Session token comparison for HMAC uses `===` — should be `crypto.timingSafeEqual()`
9. No E2E integration tests — only unit tests for pricing engine
10. CODEBASE_PROMPT_20260224_LYRA.md, CALCULATOR_FIX_PROMPT_20260224.md — stale doc files in repo root

---

## 7. Deployment & Infrastructure

```
Platform: Railway (primary, live)
Deploy method: git push main → Railway auto-deploy (~2 min)
Build command: next build (output: standalone)
Environment: Node 20, PORT env var
Domain: truecolorprinting.ca (Cloudflare CDN, orange-cloud)
DNS: Cloudflare → cc0c74ro.up.railway.app CNAME
SSL: Railway auto-cert (Let's Encrypt) + Cloudflare edge SSL

Environment variables (Railway):
  Boot-required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
                 SUPABASE_SECRET_KEY, BREVO_API_KEY, CLOVER_ECOMM_PRIVATE_KEY,
                 CLOVER_MERCHANT_ID, PAYMENT_TOKEN_SECRET
  Feature-required: WAVE_API_TOKEN, WAVE_INCOME_ACCOUNT_ID, WAVE_BANK_ACCOUNT_ID,
                    SMTP_BCC, STAFF_EMAIL, SMTP_FROM
  Optional: CRON_SECRET (keepalive), CLOVER_ENVIRONMENT (default: production)

Monitoring: NONE (no Sentry, no Datadog, no uptime monitoring beyond cron-job.org keepalive)
Logging: Railway console logs only (console.log/error in route handlers)
Backup: Supabase automated (if paid tier); Railway: no separate backup
Scaling: Railway Hobby — single instance, sleeps after 30 min inactivity (keepalive cron prevents this)
Rollback: git revert + push (2-min deploy)
Cost: Railway Hobby ~$5/mo; Supabase (tier unknown); Brevo (free tier or paid)

Keepalive: cron-job.org pings /api/cron/keepalive every 15 min (requires Authorization: Bearer CRON_SECRET)
```

---

## 8. Domain & Business Logic Map

### Domain Vocabulary
- "order" = confirmed customer print job (exists in DB, has order_number, Wave invoice)
- "quote" = staff tool to price and email estimate to customer (no DB row, no order — just email)
- "estimate" = pricing engine output for a given job config (transient, not stored)
- "pending_payment" = order created, awaiting payment (initial state)
- "payment_received" = card payment confirmed OR staff manually marks eTransfer received
- "cart" = localStorage array of CartItem objects (client-only, no DB)
- "rush" = $40 flat fee, same-day if ordered before 10 AM (staff confirms via phone)
- "lot price" = flat price for a print run (not per-unit): flyers, business cards, etc.
- "sqft" = square footage, basis for sign/banner pricing
- "print-files" = Supabase Storage bucket for all customer artwork and proofs

### Business Rules
1. **Rush fee:** +$40 flat, added to all items, not per-item — /api/orders:38
2. **GST:** 5% on (subtotal + rush), not on items individually — /api/orders:111
3. **Order number format:** TC-YYYY-NNNN — /api/orders:121
4. **Clover session TTL:** 15 minutes — /pay/[token] creates fresh session each click
5. **Payment token TTL:** 30 days — /lib/payment/token.ts:13
6. **eTransfer auto-deposit:** info@true-color.ca, no security question
7. **Staff email match:** single email from STAFF_EMAIL env var (defaults to info@true-color.ca)
8. **Archive = soft delete:** orders never deleted; is_archived flag hides from normal view
9. **Wave DRAFT flow:** invoice created DRAFT on order → approved on payment_received → sent on ready_for_pickup
10. **Same-day rush rule:** if ordered before 10 AM (not enforced in code — staff confirms by phone)

### User Roles
| Role | Access |
|------|--------|
| Anonymous | Place orders, submit quote requests, use estimator |
| Customer (logged in) | All anonymous + view own orders, upload files post-order, pre-fill checkout |
| Staff (owner) | All customer + staff dashboard: update status, archive, reply, upload proof, create Wave invoice, send quote emails |

### Email Triggers
| Event | Recipient | Template |
|-------|-----------|---------|
| Order created | Customer | orderConfirmation.ts |
| Order created | Staff (BCC) | staffNotification.ts |
| payment_received | Customer | statusUpdate.ts |
| in_production | Customer | statusUpdate.ts |
| ready_for_pickup | Customer | statusUpdate.ts + Wave receipt |
| complete | Customer | reviewRequest.ts (Google review ask) |
| Quote sent | Customer | smtp.ts (quote email with QR code) |
| Proof uploaded | Customer | proofSent.ts |
| File uploaded (post-order) | Staff | staffNotification.ts |

### Pricing / Billing Logic
- Price calculated by engine (CSV-backed) → displayed on product page → added to cart
- Cart items carry sell_price, config (dimensions, qty, addons)
- On checkout POST: server should re-validate prices (CURRENTLY NOT DONE — CRITICAL BUG)
- Wave invoice = accounting record (parallel to Supabase order)
- Clover = payment processor (card only); eTransfer = manual bank transfer

---

## 9. Recommendations (Priority Order)

| Priority | Recommendation | Impact | Effort | Category |
|----------|----------------|--------|--------|----------|
| 1 | Server-side price revalidation in /api/orders | HIGH | MEDIUM | Security |
| 2 | Add auth to /api/email/send | HIGH | LOW | Security |
| 3 | Add auth to /api/payment/clover | HIGH | LOW | Security |
| 4 | Fix timing-safe HMAC comparison in token.ts | HIGH | LOW | Security |
| 5 | Fix anonymous checkout file upload | HIGH | LOW | Bug |
| 6 | Fix Clover webhook — require secret always | HIGH | LOW | Security |
| 7 | Escape HTML in quote-request email template | HIGH | LOW | Security |
| 8 | requireStaffUser() helper for /api/staff/* routes | HIGH | LOW | Security |
| 9 | Add DB UNIQUE constraint on order_number | MEDIUM | LOW | Bug |
| 10 | npm audit fix (remove nodemailer, fix minimatch) | MEDIUM | LOW | Deps |
| 11 | Add Sentry or basic error tracking | HIGH | MEDIUM | Ops |
| 12 | Add DB indexes (orders.customer_id, orders.created_at) | MEDIUM | LOW | Performance |
| 13 | Add basic rate limiting on /api/orders and /api/quote-request | HIGH | MEDIUM | Security |
| 14 | Delete orphan empty directories | LOW | LOW | Cleanup |
