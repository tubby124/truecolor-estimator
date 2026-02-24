# Codebase Prompt Context: True Color Display Printing — Estimator
**Generated:** 2026-02-24 from CODEBASE_AUDIT_20260224.md
**Purpose:** Paste this into Claude Code at session start to load full project context

---

## Project Identity
- **What it is:** Next.js 16 e-commerce + pricing estimator app for a Saskatoon print shop
- **What it does:** Customers get instant prices for signs, banners, magnets, and print products → add to cart → pay via Clover card or Interac eTransfer. Staff manage orders, upload proofs, create Wave invoices, and use an internal estimator with cost/margin visibility.
- **Who uses it:** Anonymous customers (pricing + checkout) · Authenticated customers (order history) · Owner/staff (order management dashboard + internal estimator at `/staff`)
- **Current state:** Production on Vercel. Domain: `truecolor-estimator.vercel.app`. Auth, payments, Wave invoicing, proof upload all working. Zero tests.

---

## Naming Conventions
- Files: `kebab-case` for pages/routes, `PascalCase` for components, `camelCase` for lib files
- Components: `PascalCase` (`ProductConfigurator`, `QuotePanel`, `OptionsPanel`)
- DB tables/columns: `snake_case` (`order_items`, `file_storage_path`, `wave_invoice_id`)
- API routes: `/api/[noun]/[id]/[action]` — e.g., `/api/staff/orders/[id]/status`
- CSV tables: `[name].v1.csv` in `data/tables/`
- Engine types: `SCREAMING_SNAKE` for categories (`SIGN`, `BANNER`, `RIGID`, `FOAMBOARD`, `MAGNET`, `FLYER`, `BUSINESS_CARD`)

---

## Core Domain Model

```
customers (1) ──→ (many) orders ──→ (many) order_items
orders.customer_id FK → customers.id
order_items.order_id FK → orders.id

No ORM. Raw Supabase JS client queries everywhere.

customers: id, email (unique), name, company, phone, address
orders: id, order_number (TC-YYYY-XXXXX), customer_id, status, is_rush,
        subtotal, gst, total, payment_method, wave_invoice_id,
        payment_reference, proof_storage_path, proof_sent_at,
        file_storage_paths TEXT[], paid_at, ready_at, completed_at, notes
order_items: id, order_id, category, product_name, material_code,
             width_in, height_in, sides, qty, addons TEXT[],
             is_rush, design_status, unit_price, line_total, file_storage_path
```

---

## Domain Vocabulary
- `"estimate"` = priced result from engine — NOT saved to DB; ephemeral
- `"quote"` = estimate emailed to customer with QR code + PDF (via `/api/email/send`)
- `"order"` = confirmed purchase in Supabase `orders` table with TC-YYYY-XXXXX number
- `"cart"` = sessionStorage `CartItem[]` — lost on tab close, never hits DB
- `"fixed-size product"` = row in `products.v1.csv` with exact dims → verbatim price, no formula
- `"sqft-tier pricing"` = `pricing_rules.v1.csv` matched by sqft range → $/sqft × sqft
- `"PRINT_READY"` = customer has print-ready file; no design fee
- `"proof"` = staff-uploaded preview image sent to customer before printing
- `"Wave DRAFT"` = accounting invoice created on every order (not sent to customer)
- `"durable pay link"` = `/pay/[token]` — HMAC-SHA256, 30-day TTL, creates fresh Clover session on each click
- `"pending_payment"` → `"payment_received"` → `"in_production"` → `"ready_for_pickup"` → `"complete"` = order status lifecycle

---

## Pricing Engine — The Most Critical Part

**File:** `src/lib/engine/index.ts`
**Type:** Pure function. Same inputs → same output. No side effects. No DB calls.
**Data source:** 6 CSVs read from `data/tables/` at startup via `src/lib/data/loader.ts` (Node.js `fs.readFileSync` — NOT edge-runtime compatible).

**11-step evaluation:**
1. Validate inputs (category required)
2. Calculate sqft from width_in / height_in
3. **Fixed-size exact match** in `products.v1.csv` → returns price **verbatim** (skips steps 4+)
4. Sqft-tier lookup in `pricing_rules.v1.csv` → `price_per_sqft × sqft`
4.5. Qty bulk discount (SIGN/BANNER/RIGID/FOAMBOARD/MAGNET only, from `qty_discounts.v1.csv`)
5. Add-ons: grommets from perimeter = `ceil((2×(W+H)in) / 24) × $2.00`; H-stake from `services.v1.csv`
6. Minimum charge (order-level, from `config.v1.csv`)
7. Design fee (MINOR_EDIT/FULL_DESIGN/LOGO_RECREATION from `config.v1.csv`)
8. Rush fee (+$40 flat from `config.v1.csv`)
9. GST (5% from `config.v1.csv` key `gst_rate`)
10. Cost estimate for margin (from `materials.v1.csv` — `margin_pct` always returns null from engine, but QuotePanel computes it client-side correctly)
11. Wave line name generation

**API:** `POST /api/estimate` → `EstimateRequest` → `EstimateResponse`
```ts
// Request
{ category, material_code, width_in, height_in, sides, qty, design_status,
  addons?: Addon[], is_rush?: boolean }

// Response
{ status: "QUOTED"|"BLOCKED"|"NEEDS_CLARIFICATION", sell_price, gst, line_items,
  qty_discount_applied, qty_discount_pct, price_per_unit,
  min_charge_applied, min_charge_value, cost: CostBreakdown,
  wave_line_name, has_placeholder, ... }
```

**CRITICAL:** Any wrong value in `products.v1.csv` flows directly to customer quotes with no recomputation.

---

## Two UI Calculators — Key Differences

### Client product page (`/products/[slug]`)
**File:** `src/components/product/ProductConfigurator.tsx`
- Sends to engine: category, material_code, W, H, sides, qty, design_status
- **Does NOT send addons** → addon costs computed client-side from hardcoded `unitPrice` in `products-content.ts`
- GST computed client-side: `(price + addonTotal) * 0.05` (hardcoded 0.05)
- `BULK_HINTS` hardcoded (not from CSV) — **MAGNET hints never show** (keys 5,10 but presets are [1,2,4])
- `DESIGN_FEES` hardcoded (display only — engine still computes real fee)
- Custom qty bug: clicking "Custom" shows price at `qtyPresets[0]` until user types

### Staff estimator (`/staff`)
**Files:** `src/app/staff/page.tsx` + `OptionsPanel.tsx` + `QuotePanel.tsx`
- Sends to engine: everything including `addons` (correct)
- Shows cost breakdown + margin badge (staff-only section in QuotePanel)
- GST hardcoded in QuotePanel: `sellPrice * 0.05`
- OptionsPanel custom qty input: `value={state.qty}` — shows current qty, must clear before typing
- Print → generates full HTML quote PDF in new window (with diagram via `buildSpecDiagramSvg`)
- Email → EmailModal → POST /api/email/send
- Wave → WaveModal → POST /api/staff/quote/wave

---

## The Golden Path — Adding a New Staff API Route

```ts
// src/app/api/staff/orders/[id]/example/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, getSessionUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  // 1. Auth check — ALWAYS first
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    // 2. Validate inputs
    if (!body.requiredField) {
      return NextResponse.json({ error: "requiredField is required" }, { status: 400 });
    }

    // 3. DB query with service client (bypasses RLS)
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, customers(name, email)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 4. Business logic here...

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    console.error("[staff/orders/example]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

---

## API Pattern

Every route follows this shape:
```ts
// Success
return NextResponse.json({ ok: true, data: ... });
// or
return Response.json({ success: true, field: value });

// Error
return NextResponse.json({ error: "Human-readable message" }, { status: 4xx|5xx });
```

Non-fatal external calls (Wave, email) are caught individually and logged — they never abort the main operation.

---

## Database Pattern

```ts
// Service client (bypasses RLS) — for all server writes and staff reads
const supabase = createServiceClient(); // from @/lib/supabase/server

// Upsert customer
const { data: customer } = await supabase
  .from("customers")
  .upsert({ email: email.toLowerCase(), name, phone }, { onConflict: "email" })
  .select("id").single();

// Insert with returning
const { data: order } = await supabase
  .from("orders")
  .insert({ customer_id, status: "pending_payment", ... })
  .select("id, order_number").single();

// Best-effort update (non-fatal)
supabase.from("orders").update({ wave_invoice_id: id }).eq("id", orderId)
  .then(() => {}).catch(() => {});
```

---

## Error Handling Pattern

```ts
// In route handlers:
try {
  // ... work
} catch (err) {
  const message = err instanceof Error ? err.message : "Failed to do X";
  console.error("[route/identifier]", message);
  return NextResponse.json({ error: message }, { status: 500 });
}

// HTML escaping in email templates (always use this):
function escHtml(str: string): string {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
```

---

## All External Services

| Service | Purpose | Env Vars | Notes |
|---------|---------|----------|-------|
| Supabase | DB + Auth + Storage | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | URL hardcoded as `https://dczbgraekmzirxknjvwe.supabase.co` in 5 files |
| Hostinger SMTP | Transactional email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_BCC` | smtp.hostinger.com:465 SSL |
| Clover | Card payments | `CLOVER_ECOMM_PRIVATE_KEY`, `CLOVER_MERCHANT_ID`, `CLOVER_ENVIRONMENT` | Hosted checkout, 15-min sessions; `/pay/[token]` creates fresh sessions |
| Wave Accounting | Invoicing (DRAFT) | `WAVE_API_TOKEN` | GraphQL API; business IDs hardcoded in `src/lib/wave/client.ts` |
| Supabase Storage | Artwork + proof files | (uses service key) | `print-files` bucket; `pending/{uuid}/` for artwork; `proofs/{orderId}/` for proofs |

---

## Critical Gotchas

1. **Trailing space in working directory path:** `/Users/owner/Downloads/TRUE COLOR PRICING /` — the space before the slash is real. Always quote paths.

2. **CSV = source of truth for pricing:** Every wrong value in `products.v1.csv` instantly affects customer quotes. No recomputation — verbatim values are returned.

3. **`data/tables/cost_rules.v1.csv` is dead:** It exists but the engine never loads it. The engine uses `materials.v1.csv` and `config.v1.csv` for costs.

4. **`src/lib/supabase/storage.ts` is dead:** Never imported. Real uploads go through `/api/upload` (server-side, service role). Don't use storage.ts — RLS will block it.

5. **Clover webhook signature bypass:** `if (signature && signature !== expected)` — an empty `signature` (no header) bypasses the check. Any caller can forge payment confirmation. **Not yet fixed.**

6. **Client product page addons bypass engine:** `ProductConfigurator.fetchPrice()` does NOT send `addons` to `/api/estimate`. Addon cost is computed client-side using hardcoded unit prices from `products-content.ts`, NOT the engine's perimeter-based grommet formula. This means client page grommet pricing can differ from what the engine (and Wave invoice) calculates.

7. **MAGNET bulk hints are broken:** `BULK_HINTS[MAGNET]` has keys `{5, 10}` but MAGNET qty presets are `[1, 2, 4]` — no hint ever renders. The CSV discounts DO apply when qty ≥ 5, but the UI never signals this.

8. **`@resvg/resvg-js` must be in `serverExternalPackages`** in `next.config.ts` or the build breaks.

9. **CSV loader uses `fs.readFileSync`** — incompatible with Vercel Edge Runtime. All routes using the pricing engine must run as Node.js serverless functions (not edge).

10. **Staff is identified by email only:** `STAFF_EMAIL` env var. No role column in DB. The middleware redirects that email to `/staff/orders`. Anyone who signs up with that email gets staff access.

11. **Phone number inconsistency:** JSON-LD and Wave memo use `(306) 954-8688`. Email templates (`orderConfirmation.ts`, `reply/route.ts`) use `(306) 652-8888`. One is wrong — confirm with owner.

12. **sessionStorage cart = lost on tab close:** Cart is NOT persisted to DB or localStorage. Closing the tab clears the entire cart.

13. **Wave DRAFT on every order, but send on pickup is NOT built yet.** The Wave invoice is created silently; the customer never receives it automatically.

---

## What This Codebase Is NOT

- "Wave sends invoices to customers on order" → WRONG. Wave DRAFT is created on every order but never sent. Send on pickup is a future feature.
- "The pricing engine reads from a database" → WRONG. It reads 6 CSV files via `fs.readFileSync` at startup.
- "Client product page addons use the same calculation as the engine" → WRONG. Addons are computed client-side with hardcoded unit prices; the engine's perimeter-based grommet formula is bypassed.
- "Magic link or social auth" → WRONG. Password-only auth. Magic link was removed.
- "MAGNET bulk discount hints show on the product page" → WRONG. The BULK_HINTS keys (5,10) don't match MAGNET qty presets [1,2,4] — hints never render.
- "There are tests" → WRONG. Zero test files. Zero coverage.
- "The `data/tables/cost_rules.v1.csv` is used by the engine" → WRONG. Dead file.

---

## Quick Start for New Session

> You are working on the True Color Display Printing estimator app.
>
> **Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Supabase · Nodemailer · Wave GraphQL · Clover Hosted Checkout
>
> **Working dir:** `/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/` (note trailing space before `/`)
>
> **Pricing engine:** `src/lib/engine/index.ts` — pure function, reads 6 CSVs from `data/tables/`. ANY wrong value in `products.v1.csv` goes directly to customer quotes.
>
> **Two calculators:** Client product pages (`ProductConfigurator.tsx`) and staff estimator (`/staff` → `OptionsPanel` + `QuotePanel`). Staff sends addons to engine (correct). Client product page does NOT send addons to engine (known bug).
>
> **Auth:** Supabase password-only. Staff = `STAFF_EMAIL` env var match. All `/api/staff/*` routes check `getSessionUser()`.
>
> **Deploy:** git push main → Vercel auto-deploys in ~2 min. Repo: `tubby124/truecolor-estimator` (public).
>
> **Critical open bugs:** (1) Clover webhook HMAC bypass — unauthenticated order confirmation possible. (2) Old Vercel URL hardcoded as fallback in orders/route.ts. (3) Client product page addons bypass engine. (4) MAGNET bulk hints never display.
>
> See `CODEBASE_AUDIT_20260224.md` for full context.

---

## Top 5 Improvements (Ranked by Impact × Effort)

| # | What to do | Why | Impact | Effort |
|---|------------|-----|--------|--------|
| 1 | Fix Clover webhook signature bypass (`if (!signature \|\| signature !== expected)`) | Any attacker can confirm fake payments | CRITICAL | LOW |
| 2 | Send addons to engine in `ProductConfigurator.fetchPrice()` | Client addon pricing diverges from engine; grommets especially wrong | HIGH | MEDIUM |
| 3 | Fix MAGNET qty presets to include 5 and 10 (or rewrite BULK_HINTS hint logic) | Bulk discount hints invisible for magnets; customers never prompted to order more | MEDIUM | LOW |
| 4 | Fix custom qty click UX (initialize `customQty` to current qty string) | Price jumps to qty 1 when Custom clicked — confusing | MEDIUM | LOW |
| 5 | Add database backups (Supabase paid tier or scheduled pg_dump) | Free tier has no point-in-time recovery — one bad migration = data loss | HIGH | MEDIUM |
