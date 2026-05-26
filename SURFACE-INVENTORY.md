# SURFACE-INVENTORY.md — True Color Pricing & Lifecycle Harness

> **Phase 0 living census.** Source plan: `Obsidian Vault/Projects/true-color/2026-05-25-pricing-lifecycle-harness-plan.md`.
> Every row's job is to be driven to **Covered = Y** by the harness. A new surface (new `estimate(` / `sendEmail(` / Wave / Clover / webhook / status-writer call site) with no row here = the next silent bug. **Re-run Phase 0 whenever a feature ships.**
>
> Generated: 2026-05-25 · branch `main` · nothing in the harness built yet, so Covered = N everywhere.
>
> Census method = grep over `src/`. This is a floor, not a ceiling — keep extending it.

---

## Domain A — Price reads / calcs (drift surfaces)

| Surface | File | Touches | Covered |
|---|---|---|---|
| Engine (single source of truth) | `src/lib/engine/index.ts` | price | N (101 engine tests exist, not harness-wired) |
| Estimate API | `src/app/api/estimate/route.ts` | price | N |
| Orders API price calc | `src/app/api/orders/route.ts` (`estimate(`) | price, order | N |
| Flyer catalog (SKU enumeration — the pattern to generalize → `getProductConfig`) | `src/lib/data/flyer-catalog.ts` | price | N |
| Customer estimator config | `src/components/estimator/OptionsPanel.tsx` (→ `/api/estimate`) | price | N |
| Product configurator | `src/components/product/ProductConfigurator.tsx` (→ `/api/estimate`) | price | N |
| Staff estimator | `src/app/staff/page.tsx` (→ `/api/estimate`) | price | N |
| Staff flyer pricing API | `src/app/api/staff/flyer-pricing/route.ts` (`getFlyerCatalog`) | price | N |
| Staff flyer picker UI | `src/components/staff/FlyerPicker.tsx` | price | N |
| **Marketing anchors (hand-typed `from $X`)** | `src/lib/data/products-content.ts` lines 179, 291, 419, 813, 868, 923, 1012 (+ inline `$` prices) | price (drift) | N |
| Marketing anchors | `src/lib/data/gbp-products.json` | price (drift) | N |
| Marketing anchors | `public/llms.txt` | price (drift) | N |
| Regex price guard (to be DELETED once anchors computed) | `scripts/hooks/post-edit-price-check.mjs` | price guard | N/A |
| Existing validator (60 checks) | `scripts/validate-pricing.mjs` | price | partial (not a cross-surface contract) |
| **$25 order-total minimum** (replaced ALL per-product mins 2026-05-19) | `src/lib/pricing/order-min.ts` (`ORDER_MINIMUM_DOLLARS = 25`) | price | N — **NEW, was missing from v1** |
| Tax four-layer render (modal preview) | `src/app/staff/orders/StaffOrdersActions.tsx` | price/tax | N |
| Tax four-layer (API calc) | `src/app/api/staff/manual-order/route.ts` | price/tax | N |
| Tax four-layer (email HTML + plain-text) | `src/lib/email/paymentRequest.ts`, `staffNotification.ts` | price/tax | N — assert all 4 match (2026-03-09 PST bug class) |

**Domain A gap:** no contract test asserting `engine == /api/estimate == each configurator's input-mapping == marketing anchors`. Four configurators independently gather options (flyer width/height bug class). Tax four-layer match (modal == API == email HTML == email text, GST 5% + PST 6%, rush PST-exempt) not asserted.

---

## Domain B — Order/quote creation surfaces

| Surface | File | Touches | Covered |
|---|---|---|---|
| Customer order create | `src/app/api/orders/route.ts` | order, price, wave, email, state | N |
| Staff manual order (Clover) | `src/app/api/staff/manual-order/route.ts` | order, wave, state | N |
| Quote request | `src/app/api/quote-request/route.ts` | quote, email | N |
| Staff quote send (Pay Now email) | `src/app/api/staff/quotes/[id]/send-quote/route.ts` | quote, email, pay link | N |
| Staff reply (Pay Now email) | `src/app/api/staff/quotes/[id]/send-reply/route.ts` | quote, email, pay link | N |
| Staff quote → Wave | `src/app/api/staff/quote/wave/route.ts` | quote, wave | N |
| Portal / brokerage orders | `PortalOrderForm` (`brokerage_slug`) — locate exact file | order, price, state | N (off main funnel — easy to forget) |
| Payment / Clover checkout | `src/app/api/payment/clover/route.ts` | payment | N |
| Pay link gateway | `/pay/[token]` + `src/lib/payment/token.ts` (HMAC, 30-day) | payment, pay link | N |

## Domain B — Side-effects: email (map to 7-step sequence)

7-step sequence: order_confirmation → payment_received → in_production → ready_for_pickup → proof_review → payment_failure_recovery (cron 24h) → review_request (cron day5). Plus 2 Pay Now emails (send-quote, send-reply).

| Email module | File | Covered |
|---|---|---|
| Order confirmation | `src/lib/email/orderConfirmation.ts` | N |
| Payment receipt | `src/lib/email/paymentReceipt.ts` | N |
| Status update (in_production / ready_for_pickup) | `src/lib/email/statusUpdate.ts` | N |
| Proof sent | `src/lib/email/proofSent.ts` | N |
| Payment request (Pay Now) | `src/lib/email/paymentRequest.ts` | N |
| Review request (cron day5) | `src/lib/email/reviewRequest.ts` | N |
| Signup welcome / account welcome | `src/lib/email/signupWelcome.ts`, `accountWelcome.ts` | N |
| Staff notification | `src/lib/email/staffNotification.ts` | N |
| SMTP transport | `src/lib/email/smtp.ts` | N |

Other `sendEmail(` call sites: `api/auth/signup-notify`, `api/notify-me`, `api/staff/customers/[id]/assign-discount`, `api/staff/orders/[id]/confirm-etransfer`, `api/staff/orders/[id]/reply`, `api/staff/send-customer-email`, `api/email/send`, crons (`stale-quotes`, `payment-followup`, `aging-orders`).

## Domain B — Side-effects: Wave + Clover

| Surface | File | Covered |
|---|---|---|
| Wave client | `src/lib/wave/client.ts` | N |
| Wave invoice (DRAFT create + `moneyTransactionCreate` — never `invoiceCreatePayment`) | `src/lib/wave/invoice.ts` | N (seed scripts exist) |
| Clover payment | `src/lib/payment/clover.ts` | N |
| Payment token (HMAC) | `src/lib/payment/token.ts` | N |
| Order stats increment | `src/lib/customers/incrementOrderStats.ts` | N |
| **Seed harness scripts (promote these)** | `scripts/test-stuck-wave-order.mjs`, `scripts/test-stuck-wave-verify.mjs` | seed |
| Backfill utilities | `scripts/backfill-clover-stuck-orders.mjs`, `scripts/backfill-wave-invoice-ids.mjs`, `scripts/debug-wave.mjs` | tooling |

---

## Domain B — Inbound events (the real spine — highest priority)

One rotated/misconfigured secret = every payment for that channel silently dropped.
**CORRECTION (2026-05-25): the three webhooks use THREE DIFFERENT auth schemes — not "all HMAC."** Harness must test each scheme differently.

| Webhook | File | Auth scheme | Secret | Covered |
|---|---|---|---|---|
| Clover payment | `src/app/api/webhooks/clover/route.ts` | shared-secret **query param** `?k=` (Clover doesn't sign bodies) | `CLOVER_WEBHOOK_SECRET` | **Y** — fail-closed probe (401) ✅ |
| Wave invoice paid | `src/app/api/webhooks/wave/route.ts` | **HMAC-SHA256** `x-wave-signature: sha256=<hex>` | `WAVE_WEBHOOK_SECRET` | **Y** — fail-closed probe (401) ✅ |
| Brevo email events | `src/app/api/webhooks/brevo/route.ts` | **Bearer token** `Authorization: Bearer` | `BREVO_WEBHOOK_SECRET` | **Y** — fail-closed probe (401) ✅ |

> Harness: `scripts/harness/webhook-health.mjs` (`npm run harness:webhooks:probe`). Proves each endpoint alive + rejects forged creds. Does NOT send valid paid events.
> **Already-built guards found in clover route:** amount-mismatch detection + Telegram alert (lines 115-126), idempotent update guarded by `.eq("status","pending_payment")`. So part of Domain B idempotency/double-charge is already covered.
> **STILL N:** valid-signature happy-path → correct state transition (needs the synthetic-order test, promote `test-stuck-wave-*.mjs`); 3-way reconciliation; cron heartbeat.

| Cron | File | Covered |
|---|---|---|
| reconcile-payments | `src/app/api/cron/reconcile-payments/route.ts` | N |
| daily-payment-digest | `src/app/api/cron/daily-payment-digest/route.ts` | N |
| payment-followup (24h recovery) | `src/app/api/cron/payment-followup/route.ts` | N |
| aging-orders | `src/app/api/cron/aging-orders/route.ts` | N |
| stale-quotes | `src/app/api/cron/stale-quotes/route.ts` | N |
| keepalive | `src/app/api/cron/keepalive/route.ts` | N |
| gsc-sync / gsc-backfill | `src/app/api/cron/gsc-sync`, `gsc-backfill` | N (SEO, not payment) |
| process-blitz-replies | `src/app/api/cron/process-blitz-replies/route.ts` | N (campaign) |

All crons gated by `CRON_SECRET`. No cron heartbeat / last-ran timestamp yet → silent stop = recovery/review emails never fire.

---

## Order status state machine (state writers — assert valid transitions, detect stuck)

| Transition write | File:line |
|---|---|
| → `pending_payment` (manual order) | `staff/manual-order/route.ts:192` |
| → `pending_payment` (customer order) | `orders/route.ts:354` |
| → `payment_received` (clover webhook) | `webhooks/clover/route.ts:132` |
| → `payment_received` (wave webhook) | `webhooks/wave/route.ts:98` |
| → `payment_received` (etransfer confirm) | `staff/orders/[id]/confirm-etransfer/route.ts:76` |
| → `ready_for_pickup` | `staff/orders/[id]/status/route.ts:142` |
| `design_status: PRINT_READY` | `manual-order` 236/461/569, `orders` 486 |
| Status constants / enum | `src/lib/data/order-constants.ts` |

**Stuck-state detection (dashboard's key column):** `pending_payment` > 24h (should trigger recovery), paid-but-never-moved-to-production. **Net-30/brokerage orders are legitimately unpaid 30 days — must NOT alert** (different "paid?" definition).

---

## Payment channels (each its own lifecycle branch)

| `payment_method` | Handler | Reconcile rule | Covered |
|---|---|---|---|
| `clover_card` | clover webhook → payment_received | in 3-way recon | N |
| `clover_pending` | manual, awaiting | in 3-way recon | N |
| `wave` | wave invoice + webhook | in 3-way recon | N |
| `etransfer` | `confirm-etransfer` (manual, pay to info@true-color.ca, hold production until confirmed) | manual confirm | N |
| **Deposits / partial payments** | UNKNOWN — confirm if exists (2 payment events/order) | needs own state | ❓ Phase 0 TODO |
| **Net-30 / invoice terms (brokerage)** | UNKNOWN — confirm | overdue-AR, no stuck alert | ❓ Phase 0 TODO |
| **In-person POS / Clover terminal** | exists in Clover, maybe no Supabase order | include/exclude from recon? | ❓ Phase 0 TODO |
| cash / cheque / store credit / Wave-hosted pay | UNKNOWN | TBD | ❓ Phase 0 TODO |

---

## Config / secrets referenced (validate at boot)

`PAYMENT_TOKEN_SECRET` (rotating invalidates ALL outstanding pay links), `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` (no `railway.app` URLs in emails), `CLOVER_ECOMM_PRIVATE_KEY` / `CLOVER_MERCHANT_ID` / `CLOVER_WEBHOOK_SECRET` / `CLOVER_ENVIRONMENT`, `WAVE_API_TOKEN` / `WAVE_BUSINESS_ID` / `WAVE_GST_TAX_ID` / `WAVE_PST_TAX_ID` / `WAVE_BANK_ACCOUNT_ID` / `WAVE_INCOME_ACCOUNT_ID` / `WAVE_PRINT_PRODUCT_ID` / `WAVE_WEBHOOK_SECRET`, `BREVO_API_KEY` / `BREVO_WEBHOOK_SECRET`.

---

## Open Phase 0 TODOs (discovery is ongoing, not one-time)

- [ ] Locate exact `PortalOrderForm` file + brokerage order creation path.
- [ ] Confirm deposits/partial-payment support (does a half-paid state exist?).
- [ ] Confirm net-30/brokerage terms handling + overdue definition.
- [ ] Decide POS terminal sales rule for 3-way reconciliation (in/out of scope).
- [ ] Enumerate ALL `payment_method` enum values from a single source (vs. scattered string literals).
- [ ] Map refund path (Clover refund → Wave adjustment → status → email) — likely manual, gap.
- [ ] Map proof approval loop state (proof_review → approved → production).
- [ ] Map artwork upload integrity (UUID storage paths, links live at fulfillment).
- [ ] Map discount/coupon server-side revalidation (`discount_codes`, $25 minimum).
- [ ] Consider a hook flagging new `sendEmail(`/`estimate(`/Wave/Clover/webhook sites absent from this inventory.

---

## Phase 1 progress (2026-05-25)

**Done:**
- `scripts/harness/webhook-health.mjs` + `npm run harness:webhooks[:probe]`. Live prod probe: Clover/Wave/Brevo all **alive + fail-closed (401)**. ✅ This answers "are the payment webhooks up and rejecting forgeries."

**NEW findings → folded into next phase (were not in the plan before):**
1. **Wave webhook setup doc points at a `vercel.app` URL** (`webhooks/wave/route.ts` lines 10-12) — but prod is Railway/truecolorprinting.ca. **VERIFY the actual URL registered in the Wave dashboard.** If stale → every Wave payment silently fails to sync. Highest-priority manual check.
2. **Clover webhook URL must include `?k=<CLOVER_WEBHOOK_SECRET>`** in the Clover dashboard registration. Verify it's present and matches Railway. Missing/wrong `k` → all card webhooks 401 silently.
3. **Local `.env.local` drift caught:** `PAYMENT_TOKEN_SECRET` = 36 chars (should be 64 hex), `NEXT_PUBLIC_SITE_URL` = a vercel preview URL. Local-only (prod is Railway), but confirms the drift class is real. Add a Railway-env assertion (can't read Railway env from a local script — needs `railway variables` or a `/api/health` echo endpoint).
4. **Harness gap:** fail-closed proves rejection; it does NOT prove a *valid* signed event drives the correct state transition. Next: promote `test-stuck-wave-*.mjs` into a synthetic happy-path test (isolated/torn-down test order).

## Next per plan sequencing
0. **(this file)** Surface census — keep current.
1. Webhook + reconciliation health FIRST (Domain B webhooks, Domain C 3-way recon + Telegram alerts) — promote `test-stuck-wave-*.mjs`. Answers "are payments actually received."
2. Domain A Layer 1 contract test + config/secret validation at boot.
3. Domain A Layer 2 central option model (`getProductConfig`), collapse configurators.
4. Domain A Layer 3 build-time anchors; delete regex hooks.
5. Domain B remaining e2e (proof, refund, quote→order, artwork) + `/staff` green/red dashboard.
