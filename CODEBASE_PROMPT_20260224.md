# True Color Display Printing — Claude Code Session Context
**Updated:** 2026-02-24 | **Commit:** ab6898e | **Live:** https://truecolor-estimator.vercel.app

---

## IDENTITY
Print shop e-commerce + live pricing estimator. Saskatoon SK. 16 product types. Customers quote → cart → checkout → track. Staff manage orders, upload proofs, send Wave invoices.

**Working dir:** `/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/` ← trailing space is real
**GitHub:** tubby124/truecolor-estimator | **Auto-deploy:** push `main` → Vercel ~2 min

---

## STACK
| Layer | Tech | Critical Notes |
|-------|------|----------------|
| Framework | Next.js 16.1.6 App Router | `serverExternalPackages:["@resvg/resvg-js"]` in next.config.ts — remove = build breaks |
| Language | TypeScript strict | No `any` escapes |
| DB + Auth | Supabase 2.97 | Service key server-side; anon key client-side |
| Email | nodemailer + Hostinger SMTP | smtp.hostinger.com:465, info@true-color.ca |
| Payments | Clover Hosted Checkout | Card only; eTransfer = manual |
| Invoicing | Wave Accounting GraphQL | DRAFT on order create; approve+send on `ready_for_pickup` |
| Storage | Supabase Storage | Bucket: `print-files` → `customer-uploads/{orderId}/`, `proofs/{orderId}/` |
| Styling | Tailwind v4 | No tailwind.config.js needed |
| Cart | sessionStorage | Key: `tc_cart`; lost on tab close — intentional |
| Testing | Vitest 4 | 36 tests against real CSVs — no mocks |

---

## PRICING ENGINE — THE MOST CRITICAL THING IN THIS CODEBASE

**File:** `src/lib/engine/index.ts` — pure function, reads 6 CSVs, same inputs → same output always

### CSV files (edit these to change prices — zero code needed):
```
data/tables/
  config.v1.csv          → 20 business rules (GST 5%, grommet $2.50, rush $40, design fees)
  pricing_rules.v1.csv   → sqft-tier + lot-price rules by category (84 rows)
  products.v1.csv        → fixed-size catalog: prices returned VERBATIM (73 rows)
  materials.v1.csv       → material costs for margin display (28 rows)
  qty_discounts.v1.csv   → bulk discount tiers: SIGN/BANNER/RIGID/FOAMBOARD/MAGNET/DECAL/VINYL_LETTERING
  services.v1.csv        → add-ons: grommets $2.50, H-stake $2.50, design $35/$50/$75, rush $40
```

### 11-step evaluation:
1. Validate category → 2. Compute sqft → **3. Exact match `products.v1.csv` → verbatim price (no recompute)** → 4. Sqft-tier or lot-price rule → 4.5 Bulk discount → 5. Add-ons → 6. Min charge (order-level) → 7. Design fee → 8. Rush $40 → 9. GST 5% → 10. Cost estimate → 11. Wave line name

### Pricing invariants (never violate):
- ❌ `isLotPrice=true` products (FLYER/STICKER/BROCHURE/POSTCARD/BUSINESS_CARD) — **NEVER multiply price_per_unit × qty again**
- ❌ Bulk discounts apply only when `basePricePerSqft !== null` (excludes fixed-size + lot-price)
- ✅ `min_charge` = order total minimum, NOT per-unit
- ✅ Grommets: `max(4, ceil(perimeterFt/2))` per unit × qty
- ✅ After any CSV edit: `npm run validate:pricing` (60 checks)

### Pricing coverage:
| Category | Method | Note |
|----------|--------|------|
| SIGN/BANNER/RIGID/FOAMBOARD/MAGNET | sqft-tier + bulk discount | |
| DECAL/VINYL_LETTERING | sqft-tier + bulk discount | DECAL = window decals + window perf |
| DISPLAY | fixed-size catalog | retractable banners |
| FLYER/STICKER/BROCHURE/POSTCARD/BUSINESS_CARD | lot-price by qty tier | |
| PHOTO_POSTER | sqft-tier | |
| STICKER | **BLOCKED — no pricing rules in CSV yet** | ⚠️ returns BLOCKED response |
| PLACEHOLDER_100LB | sell price ✅, cost ❌ | 100lb flyers/brochures — awaiting Spicer quote |

---

## DATABASE

**Tables confirmed:** `customers`, `orders`, `order_items`

### Pending migrations (NOT RUN — run in Supabase SQL editor):
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff_notes TEXT;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```
Until run: staff notes silently fail to save; Realtime doesn't fire (polling fallback active: 45s staff / 20s customer).

### Key column gaps (best-effort in code, may not exist yet):
- `customers.companies TEXT[]` — company list appended per order
- `orders.file_storage_paths TEXT[]` — multi-file artwork paths
- `orders.proof_storage_path TEXT` — proof file path
- `orders.line_items_json JSONB` — engine line item breakdown

---

## AUTH + SECURITY

```
Staff:    Supabase session cookie → getSessionUser() → 401 if null   [ALL /api/staff/* routes]
Customer: Bearer token in Authorization header → getUser() → 401 if null
Service:  createServiceClient() with SUPABASE_SECRET_KEY — bypasses RLS
```
- **Middleware:** `/staff/:path*` + `/account` only — staff email at `/account` → redirect `/staff/orders`
- **NEVER use `getSession()` server-side** — use `getUser()` (cryptographically verified)
- ⚠️ **Clover webhook fail-open**: if `PAYMENT_TOKEN_SECRET` env var deleted, accepts any payload without HMAC

---

## REQUIRED ENV VARS (all set in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY               PAYMENT_TOKEN_SECRET
SMTP_HOST/PORT/SECURE/USER/PASS   NEXT_PUBLIC_SITE_URL=https://truecolor-estimator.vercel.app
WAVE_API_TOKEN                    CLOVER_ECOMM_PRIVATE_KEY / MERCHANT_ID / ENVIRONMENT
STAFF_EMAIL=info@true-color.ca    CRON_SECRET
```

---

## ORDER FLOW (POST /api/orders)
```
upsert customer → generate TC-YYYY-NNNN → insert order + items → Wave DRAFT → Clover checkout URL → customer email (QR+eTransfer) → staff email
```
Status lifecycle: `pending_payment → payment_received → in_production → ready_for_pickup → complete`
- `complete` requires current = `ready_for_pickup` (server-enforced guard)
- `ready_for_pickup` triggers: Wave invoice approve + send to customer
- `complete` triggers: Google review request email

---

## EMAIL TRIGGERS
| Event | File | Recipient |
|-------|------|-----------|
| Order created | orderConfirmation.ts | Customer (QR code inline) |
| Order created | staffNotification.ts | Staff |
| Status → payment_received/in_production/ready_for_pickup | statusUpdate.ts | Customer |
| Status → ready_for_pickup | wave/invoice.ts | Customer (Wave PDF) |
| Status → complete | reviewRequest.ts | Customer (Google review) |
| Proof uploaded | proofSent.ts | Customer (7-day signed URL) |
| Customer uploads file revision | staffNotification.ts | Staff |

---

## UTILITIES — ALWAYS USE, NEVER RECREATE
```typescript
import { sanitizeError } from "@/lib/errors/sanitize";  // NEVER raw err.message to users
import { Skeleton, SkeletonCard, SkeletonPrice } from "@/components/ui";  // all loading states
import { useToast, ToastContainer, showToast } from "@/components/ui";    // all async feedback
```

---

## API PATTERN
```typescript
// Staff route template (src/app/api/staff/orders/[id]/status/route.ts)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const supabase = createServiceClient();
    // work...
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
```

---

## ADDING A NEW PRODUCT (golden path)
1. Add rows to `data/tables/pricing_rules.v1.csv` or `products.v1.csv`
2. Add entry to `PRODUCTS` in `src/lib/data/products-content.ts`
3. Add slug to `src/app/sitemap.ts` + category to `Category` union in `src/lib/data/types.ts`
4. Add to `SiteNav.tsx` megamenu + `quote/page.tsx` PRODUCT_ICONS + `CategoryPicker.tsx`
5. `npm run validate:pricing` → 60 checks must pass
6. `git push main` → live in ~2 min

---

## WHAT IS NOT TRUE (common wrong assumptions)
- ❌ "Customers must create an account to order" → checkout works as guest; account is optional checkbox
- ❌ "Price is recomputed from formula on every request" → `products.v1.csv` exact matches are verbatim
- ❌ "Wave invoices send automatically on order" → DRAFT only; send triggered at `ready_for_pickup`
- ❌ "Realtime sync is live" → requires `ALTER PUBLICATION` migration; polling fallback active
- ❌ "cost_rules.v1.csv is used" → legacy file, never loaded by engine
- ❌ "STICKER orders can be priced" → returns BLOCKED; no pricing rules in CSV

---

## QUICK REFERENCE
- **Validate pricing:** `npm run validate:pricing`
- **Run tests:** `npm test` (36 unit tests, real CSVs)
- **Supabase:** https://dczbgraekmzirxknjvwe.supabase.co
- **Wave Business ID:** `QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj`
- **Phone / address:** (306) 954-8688 · 216 33rd St W, Saskatoon SK
- **OG image:** public/og-image.png ✅ | **SEO domain:** truecolorprinting.ca (not live yet — Vercel serves truecolor-estimator.vercel.app)
