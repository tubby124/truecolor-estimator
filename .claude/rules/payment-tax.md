---
paths:
  - "src/app/staff/**/*.tsx"
  - "src/app/api/staff/**/*.ts"
  - "src/lib/email/**/*.ts"
  - "src/app/checkout/**/*.tsx"
  - "src/app/pay/**/*.tsx"
---

# Payment & Tax Consistency Rules

These rules apply automatically when editing staff portal, API routes, email templates, checkout, or payment pages.

## Tax Display

- GST (5%) + PST (6%) shown ONLY on checkout and in emails. All other pages show pre-tax `sell_price`.
- PST formula for itemized orders: `pst = (sell_price - design_fee) * 0.06` per item. Rush fee is PST-exempt.
- PST formula for manual orders (no itemized fees): `pst = subtotal * 0.06`.
- Total always = subtotal + gst + pst. Never subtotal + gst only.

## Modal ↔ API ↔ Email Consistency Check

When editing ANY of these files together — verify all four layers match:
1. **Modal preview** (`StaffOrdersActions.tsx`) — what staff SEE before submitting
2. **API calculation** (`manual-order/route.ts`) — what gets saved to DB and used in payment link
3. **Email HTML** (`paymentRequest.ts` or `staffNotification.ts`) — what customer/staff RECEIVE
4. **Email plain-text fallback** (same files) — the text-only version

If layer 1 differs from layers 2–4, staff are quoting customers a wrong total. This was the root cause of the 2026-03-09 PST bug.

## payment_method Enum Rules

Valid values in `StaffOrderNotificationParams`: `"clover_card" | "etransfer" | "wave"`

When adding a new payment_method value, ALL THREE of these must be updated:
- `paymentLabel` — the display label in subject line and log
- `paymentBlock` (HTML) — the banner in the HTML email
- `paymentBlock` (plain-text) — the text-only fallback

Failure to update all three was the root cause of the 2026-03-09 Wave notification bug (Wave orders showed "e-Transfer pending" banner to staff).

## Payment Method Semantics

- `"clover_card"` → card captured online via Clover. Safe to begin production immediately.
- `"etransfer"` → customer sends e-transfer to info@true-color.ca. DO NOT start printing until confirmed.
- `"wave"` → Wave hosted invoice sent. Customer pays online via Wave. Start production once Wave confirms payment.

## Key Files — Payment Flow

| File | Role |
|------|------|
| `src/app/staff/orders/StaffOrdersActions.tsx` | Request Payment modal — staff-facing preview |
| `src/app/api/staff/manual-order/route.ts` | Creates order, calculates tax, generates payment link |
| `src/lib/email/paymentRequest.ts` | Customer-facing payment request email |
| `src/lib/email/staffNotification.ts` | Staff notification email for all order types |
| `src/app/pay/[token]/page.tsx` | Clover payment gateway — decodes token, creates Clover session |
| `src/lib/payment/token.ts` | Signs/verifies payment tokens (30-day expiry) |
| `src/lib/wave/invoice.ts` | Wave invoice creation, approval, sending |
