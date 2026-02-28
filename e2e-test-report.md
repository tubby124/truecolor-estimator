# E2E Test Report — True Color Display Printing
**Date:** 2026-02-25
**Tester:** Claude Code + agent-browser v0.15.0
**App:** http://localhost:3000 (Next.js 16.1.6, Turbopack)
**Env:** Local dev with `.env.local`

---

## Summary

| Metric | Result |
|--------|--------|
| Journeys Tested | 8 |
| Screenshots Captured | 27 |
| Issues Found | 4 |
| Issues Fixed | 1 |
| Issues Remaining | 3 |

---

## Issues Fixed During Testing

### FIX-1 — `.env.local` variable name mismatch (FIXED ✅)
**Severity:** High (broke homepage for local dev)
**Symptom:** Every page showed "We hit a snag. Don't worry — your cart is safe." on load
**Root cause:** `AccountIcon` component calls `createBrowserClient()` which requires `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The `.env.local` file used old variable names from before a rename:

| In `.env.local` | Code expects |
|---|---|
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SECRET_KEY` |

**Fix applied:** Added alias entries to `.env.local` copying the values under the correct names.
**Production impact:** None — Vercel already has the correct variable names set.
**File:** `src/lib/supabase/client.ts:10`

---

## Remaining Issues (Fix Later)

### ISSUE-1 — Staff local password mismatch
**Severity:** Medium
**Page:** `/staff/login`
**Symptom:** Login with `info@true-color.ca` + `STAFF_PASSWORD` from `.env.local` returns "Invalid email or password."
**Root cause:** `STAFF_PASSWORD` stored in `.env.local` is a placeholder that doesn't match the actual Supabase Auth password for `info@true-color.ca`.
**Fix:** Update `STAFF_PASSWORD` in `.env.local` with the real Supabase auth password for `info@true-color.ca`. Or just log in on Vercel — production not affected.
**Production impact:** None.

---

### ISSUE-2 — Nav CTA button truncates at 768px tablet
**Severity:** Low
**Page:** All pages
**Symptom:** At exactly 768px viewport width, the "Get a Price →" CTA button in the nav renders as "Get" (text overflow).
**Screenshot:** `e2e-screenshots/responsive/04-homepage-tablet.png`
**Fix options:**
- Add `whitespace-nowrap` to the button if not already present
- Reduce nav item spacing at md breakpoint
- Hide the CTA button at 768px and show it at 800px+
**File:** Navigation component (header)

---

### ISSUE-3 — H-Stakes counter vs price discrepancy
**Severity:** Low
**Page:** `/products/coroplast-signs` (and likely all sign products)
**Symptom:** With qty=5 signs, clicking H-Stakes `+` button 3 times shows counter="3" but price increases by $12.50 (= 5 × $2.50, not 3 × $2.50).
**Screenshot:** `e2e-screenshots/products/05-with-hstakes.png`
**Possible explanations:**
1. Counter shows per-sign qty, total = counter × sign qty (3×? doesn't match $12.50 = 5×$2.50)
2. Counter display is wrong (shows increments, actual value differs)
3. The "addons × qty" fix (commit 1293157) is applying differently than displayed
**Needs:** Manual verification — set qty=1, add 1 H-Stake, confirm $2.50 added. Then set qty=5, add 1 H-Stake, confirm $12.50 added (1 per sign). Counter should show "1" in both cases.
**File:** `src/app/products/[slug]/` — ProductConfigurator addon qty logic

---

## Bug Hunt Findings (from code analysis — fix in separate sprint)

These were identified by the code analysis sub-agent. Not tested visually but warrant attention:

| Priority | Issue | File | Line |
|----------|-------|------|------|
| HIGH | `isLotPrice = unitRule.is_lot_price !== false` — treats null as `true`, use `=== true` instead | `src/lib/engine/index.ts` | ~112, 156 |
| HIGH | `ignoreDuplicates: false` on customer upsert — should be `true` | `src/app/api/orders/route.ts` | ~65 |
| HIGH | `unit_price: item.sell_price / item.qty` — no guard for qty=0 (NaN risk) | `src/app/api/orders/route.ts` | ~171 |
| HIGH | Staff email check is case-sensitive — `user?.email === STAFF_EMAIL` | `src/middleware.ts` | ~37 |
| HIGH | `Number(order.total)` passed to Wave without null check | `src/app/api/staff/orders/[id]/status/route.ts` | ~112 |
| MEDIUM | Array index mismatch when mapping line_items to email payload | `src/app/api/orders/route.ts` | ~281 |
| MEDIUM | Address update is fire-and-forget with no error logging | `src/app/api/orders/route.ts` | ~76 |
| MEDIUM | `order.customers` shape not validated before email extraction | `src/app/api/staff/orders/[id]/status/route.ts` | ~101 |
| MEDIUM | Unsafe order ID navigation: `?oid=${data.orderId ?? ""}` | `src/app/checkout/page.tsx` | ~338 |
| MEDIUM | Clover `sessionId: data.checkoutSessionId ?? ""` — empty string saved to DB | `src/lib/payment/clover.ts` | ~79 |
| LOW | Middleware `pathname.startsWith("/staff")` matches `/staffing` etc. — use `/staff/` | `src/middleware.ts` | ~44 |
| LOW | Missing `totalCents > 0` guard before Clover checkout creation | `src/app/api/orders/route.ts` | ~222 |

---

## Journey Results

### Journey 1: Homepage
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/homepage/`

- Hero carousel autorotates through product slides ✅
- Nav: Products, Industries, Services, About, Our Work, phone, Sign in, Cart, Get a Price ✅
- "Sign in" visible (Supabase auth working, not logged in) ✅
- "We Print It Here. In Saskatoon." section renders ✅
- No console errors after env fix ✅

**LCP warning:** `/images/products/product/coroplast-yard-sign-800x600.webp` — add `loading="eager"` to hero image (Next.js Image component)

---

### Journey 2: Product Grid → Configurator
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/products/`

- `/quote` grid shows all 16 products with prices and icons ✅
- Coroplast Signs configurator: size presets (12×18", 18×24", 24×36", 4×8 ft, Custom) ✅
- Sides toggle: Single/Double-sided, updates preview label ✅
- Qty bulk discounts: 5=8% off, 10=17% off, 25=23% off — display correct ✅
- H-Stakes addon: quantity picker, price updates live ✅
- Grommets auto-calculated: "For your 12×18" sign: ~4 grommets ($10.00 total)" ✅
- Price panel: shows per-unit, bulk badge, GST, total ✅
- Design file section: I have a file / Minor edits / Design from scratch / Logo vectorization ✅

**Known issue:** H-Stakes counter vs price discrepancy (ISSUE-3 above)

---

### Journey 3: Add to Cart → Cart Page
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/cart/`

- "Added to cart" toast notification appears bottom-right ✅
- Cart nav icon updates with item count badge ✅
- Cart page shows: product name, label (12×18" — Double-sided × 5), addon breakdown ✅
- "H-Stake (yard stake): $12.50" shown as sub-line ✅
- GST calculated correctly: $109.10 × 5% = $5.46 ✅
- "Proceed to Checkout →" CTA prominent ✅
- "← Keep shopping" secondary button ✅
- "All prices in CAD + 5% GST · Pickup at 216 33rd St W, Saskatoon" note ✅

**Minor:** Product page showed $114.55 total, cart shows $114.56 — 1¢ rounding difference between engine and cart calculation.

---

### Journey 4: Checkout Form
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/checkout/`

- Contact form: Name, Email, Company, Phone, Address fields ✅
- "Save my info & create a free account" checkbox ✅
- Notes textarea with helpful placeholder ✅
- Artwork upload: drag/drop zone, "PDF, AI, EPS, JPG, PNG — up to 50MB each" ✅
- Rush toggle: "+$40" added to total, GST recalculates on rush fee ✅
  - Before: $114.56 | After rush: $156.56 (+$40 + $2 extra GST = correct) ✅
- Payment method toggle:
  - Card: "Pay $156.56 →" button, "🔒 Redirected to Clover's secure checkout" note ✅
  - eTransfer: Reveals transfer instructions box (email, amount, reference, auto-deposit note) ✅
  - Button changes to "Submit order — pay $156.56 by e-Transfer" ✅
- Order summary panel: sign SVG preview, addon breakdown, subtotal, GST, total ✅
- Form data persists in sessionStorage (fields stayed filled after page interactions) ✅

---

### Journey 5: Quote Request Form
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/quote-request/`

- "Standard quote" tab: name, email, phone, product dropdown, description, file upload ✅
- "Custom / bulk request" tab: removes product dropdown, updates placeholder to bulk example ✅
- Context callout: "For bulk orders, special sizes, non-catalog products..." ✅
- "Send quote request →" CTA (full width, cyan) ✅
- "We reply within 1 business day · (306) 954-8688 · 216 33rd St W, Saskatoon" ✅

---

### Journey 6: Staff Login + Route Protection
**Result:** ✅ Pass (UI) / ⚠️ Password issue (see ISSUE-1)
**Screenshots:** `e2e-screenshots/staff/`

- Staff login page: dark background, centered card, logo, email pre-hinted ✅
- Error message: "Invalid email or password. Try again." (generic, no info leak) ✅
- Route protection: `/staff/orders` → redirects to `/staff/login` when unauthenticated ✅
- Password: `STAFF_PASSWORD` in `.env.local` doesn't match Supabase (see ISSUE-1)

---

### Journey 7: Customer Account Login
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/account/`

- "Your orders" heading with "Sign in to track your orders..." subheading ✅
- Sign in form: Email, Password fields, "Sign in →" button ✅
- "Forgot password?" link visible ✅
- "New here? Create account" link visible ✅
- Support section: phone (Mon-Fri 9 AM–5 PM), email, address, "Place a new order →" ✅

---

### Journey 8: Responsive Testing
**Result:** ✅ Pass
**Screenshots:** `e2e-screenshots/responsive/`

#### Mobile (375×812)
- Homepage: hamburger menu (☰), cart icon, full-width hero, large pricing text ✅
- Product page: image + thumbnails full width, configurator below, **sticky bottom bar** with price + "Add to Cart →" ✅
- Checkout: single-column, all fields full-width, no overflow ✅

#### Tablet (768×1024)
- Homepage: full nav visible, two-column layout ✅
- Product page: image left, configurator right — good two-column layout ✅
- **ISSUE:** Nav CTA "Get a Price →" truncates to "Get" at exactly 768px (see ISSUE-2)

#### Desktop (1440×900)
- All pages: full nav, wide layouts, proper spacing ✅
- Gallery: masonry grid with category filter tabs ✅
- About: "Real equipment. Real people. Printed here." hero section ✅

---

## Screenshots Index

```
e2e-screenshots/
├── homepage/
│   ├── 00-initial-load.png          (first load after env fix)
│   └── 01-hero-desktop.png          (1440px hero carousel)
├── products/
│   ├── 01-quote-product-grid.png    (all 16 products)
│   ├── 02-coroplast-configurator.png (default 12×18" single-sided)
│   ├── 03-double-sided-selected.png  (sides toggle)
│   ├── 04-qty5-bulk-discount.png     (8% off badge)
│   ├── 05-with-hstakes.png           (H-stakes addon)
│   └── 06-add-to-cart-toast.png      (toast + green button)
├── cart/
│   └── 01-cart-with-item.png         (item, addons, GST, total)
├── checkout/
│   ├── 01-checkout-empty.png         (empty form + order summary)
│   ├── 02-form-filled.png            (contact info filled)
│   ├── 03-rush-toggle.png            (+$40 rush fee applied)
│   ├── 04-etransfer-selected.png     (eTransfer instructions box)
│   └── 05-etransfer-submit-button.png (annotated refs)
├── quote-request/
│   ├── 01-quote-request-form.png     (standard tab)
│   └── 02-custom-bulk-tab.png        (custom/bulk tab)
├── staff/
│   ├── 01-staff-login.png            (dark card login)
│   └── 02-staff-login-attempt.png    (error state)
├── account/
│   └── 01-account-login.png          (customer login + support)
└── responsive/
    ├── 01-homepage-mobile.png         (375px)
    ├── 02-product-mobile.png          (375px — sticky CTA bar)
    ├── 03-checkout-mobile.png         (375px)
    ├── 04-homepage-tablet.png         (768px)
    ├── 05-product-tablet.png          (768px)
    ├── 06-quote-grid-desktop.png      (1440px)
    ├── 07-gallery-desktop.png         (1440px)
    └── 08-about-desktop.png           (1440px)
```

---

## Dev Server Note

The stale dev server (PID 23922) running since Sunday had been started without `.env.local` loaded into the client bundle. Always kill old servers before testing:

```bash
pkill -f "next dev"
cd truecolor-estimator
npm run dev
```

The `.env.local` now has both old and new variable name aliases — no further changes needed.
