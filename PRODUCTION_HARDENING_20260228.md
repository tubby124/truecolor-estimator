# Production Hardening — True Color Display Printing
**Session Date:** 2026-02-28
**Commits:** `24c75f7` (security) + `76e9442` (rate limiting / cleanup)
**Status:** ✅ DEPLOYED — Railway + Vercel both green

---

## What Was Done

### Full Codebase Audit
- Ran 8-phase audit across all API routes, auth, payments, email, DB, infrastructure
- Output: `CODEBASE_AUDIT_20260228.md` in repo root
- Found 3 CRITICAL, 4 HIGH, 5 MEDIUM, 3 LOW severity issues

---

## Fixes Applied

### CRITICAL — commit `24c75f7`

#### 1. Price Manipulation Attack — FIXED
**File:** `src/app/api/orders/route.ts`
**What was wrong:** Server trusted every `sell_price` value the browser sent. Anyone could edit the cart in DevTools, set prices to $0.01, and get a real order processed for pennies.
**Fix:** Added `revalidateItemPrices()` — re-runs the pricing engine server-side for every item, overrides the client price. If the engine can't price an item, accepts client price and logs a warning for manual review.

#### 2. Any Customer Could Call Staff API Routes — FIXED
**Files:** `src/lib/supabase/server.ts` + all 6 `/api/staff/*` routes
**What was wrong:** Staff routes used `getSessionUser()` which only checked "is there a logged-in user?" — any customer who created an account at checkout had a valid session and could call `/api/staff/orders/[id]/status` to change their own order status, or POST to `/api/staff/orders/[id]/reply` to send emails as staff.
**Fix:** Added `requireStaffUser()` helper that checks session AND verifies `email === STAFF_EMAIL`. All 6 staff routes updated:
- `/api/staff/orders/[id]/status`
- `/api/staff/orders/[id]/reply`
- `/api/staff/orders/[id]/archive`
- `/api/staff/orders/[id]/proof`
- `/api/staff/orders/[id]/notes`
- `/api/staff/quote/wave`

#### 3. Unauthenticated Email Endpoint — FIXED
**File:** `src/app/api/email/send/route.ts`
**What was wrong:** Zero authentication. Any script on the internet could POST to this endpoint and send emails from the business Brevo account — burning quota, getting the account suspended, or sending phishing emails in the business's name.
**Fix:** Added `requireStaffUser()` at the top of the handler. Only the logged-in staff account can use this endpoint.

#### 4. Unauthenticated Clover Payment Session — FIXED
**File:** `src/app/api/payment/clover/route.ts`
**What was wrong:** Zero authentication. Anyone could create Clover Hosted Checkout sessions for arbitrary amounts — creating noise in transaction logs and potentially abusing the merchant account.
**Fix:** Added `requireStaffUser()` guard.

---

### HIGH — commit `24c75f7`

#### 5. Timing Attack on HMAC — FIXED
**Files:** `src/lib/payment/token.ts`, `src/app/api/webhooks/clover/route.ts`
**What was wrong:** HMAC signature comparison used `sig === expectedSig` (regular string equality). String comparison short-circuits on the first mismatched character, leaking timing information that could be used to forge tokens over many requests.
**Fix:** Both files now use `crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))` — constant-time comparison regardless of where the strings differ.

#### 6. Clover Webhook Accepted All Requests If Secret Missing — FIXED
**File:** `src/app/api/webhooks/clover/route.ts`
**What was wrong:** HMAC verification was inside `if (tokenSecret) { ... }` — if `PAYMENT_TOKEN_SECRET` env var was missing or deleted, the webhook would accept every incoming request without any verification. Any actor could POST fake payment events and mark orders as paid.
**Fix:** Fail-closed pattern — returns `401` immediately if secret is not configured.

#### 7. Anonymous Checkout Artwork Upload — FIXED
**File:** `src/app/api/upload/route.ts`
**What was wrong:** The upload endpoint required a Supabase session cookie. Anonymous checkout users (who haven't created an account) had no session, got a silent `401`, and their order was created with no artwork files. Staff saw orders with missing files.
**Fix:** Removed auth requirement. Protection is via strict MIME type + file extension allowlist (only PDF/AI/EPS/JPG/PNG/WebP) and UUID-based file paths that are hard to enumerate.

#### 8. XSS in Quote Request Email — FIXED
**File:** `src/app/api/quote-request/route.ts`
**What was wrong:** User-submitted `name`, `email`, `phone`, `product`, `description` were interpolated directly into an HTML email template with no escaping. A malicious user could inject `<script>` or `<img onerror=>` tags into the staff's email client.
**Fix:** Added `esc()` function that replaces `& < > " '` with HTML entities. Applied to all user inputs before interpolation.

---

### MEDIUM — commits `24c75f7` + `76e9442`

#### 9. Removed Unused nodemailer — FIXED
**What was wrong:** `nodemailer` and `@types/nodemailer` were still in `package.json` even though the app switched to Brevo REST API months ago. Added bundle weight and npm audit flagged `minimatch HIGH` + `ajv MODERATE` vulnerabilities in nodemailer's dependency tree.
**Fix:** `npm uninstall nodemailer @types/nodemailer` + `npm audit fix` → **0 vulnerabilities**.

#### 10. Raw Error Messages Exposed — FIXED
**File:** `src/app/api/orders/route.ts`
**What was wrong:** Catch block returned raw `err.message` to the client, potentially leaking internal DB errors, stack traces, or table names.
**Fix:** Now uses `sanitizeError(err)` from `src/lib/errors/sanitize.ts`.

#### 11. Order Number Race Condition — FIXED (partial)
**File:** `src/app/api/orders/route.ts`
**What was wrong:** Order number generated as `count + 1`. Two simultaneous POST requests would both read the same count and generate `TC-2026-0042` for two different orders.
**Fix (code):** Wrapped insert in a retry loop (up to 3 attempts) — if the insert fails with Postgres error `23505` (unique violation), re-fetches the count and retries.
**Fix (DB — manual step required):** See `migrations/20260228_db_indexes.sql` — adds `UNIQUE INDEX` on `order_number` so the DB enforces uniqueness and makes the retry meaningful.

---

### MEDIUM — commit `76e9442`

#### 12. No Rate Limiting on Any Endpoint — FIXED
**New file:** `src/lib/rateLimit.ts`
**What was wrong:** No rate limiting anywhere. Anyone could spam `/api/orders` (creating hundreds of fake orders) or `/api/quote-request` (exhausting Brevo quota).
**Fix:** In-memory sliding window rate limiter — no Redis required. Reads `cf-connecting-ip` (Cloudflare) then `x-forwarded-for` (Railway). Self-cleaning every 10 minutes.
- `/api/orders`: **5 requests per IP per minute**
- `/api/quote-request`: **3 requests per IP per minute**

#### 13. No Input Length Limits — FIXED
**What was wrong:** No server-side limits on field lengths. A bad actor could POST a 10MB string in `contact.name` causing memory/DB issues.
**Fix applied to both `/api/orders` and `/api/quote-request`:**
| Field | Max |
|-------|-----|
| name | 100 chars |
| email | 254 chars (RFC 5321) |
| company | 100 chars |
| phone | 20 chars |
| notes / description | 1000 / 2000 chars |
| items (cart) | 20 items max |

---

## Cleanup — commit `76e9442`

- Deleted 4 stale doc files from repo root (superseded by this session's audit):
  - `CALCULATOR_FIX_PROMPT_20260224.md`
  - `CODEBASE_PROMPT_20260224.md`
  - `CODEBASE_PROMPT_20260224_LYRA.md`
  - `CODEBASE_AUDIT_20260224.md`

---

## One Remaining Manual Step

**Run the DB index migration in Supabase SQL Editor:**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project → **SQL Editor** → **New query**
2. Paste the contents of `migrations/20260228_db_indexes.sql`
3. Click **Run**

This adds 5 indexes (faster staff portal, account page, order lookups) and the `UNIQUE` constraint on `order_number` that makes the race condition retry actually work.

```sql
CREATE INDEX IF NOT EXISTS orders_created_at_desc   ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_id        ON orders (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON orders (order_number);
CREATE INDEX IF NOT EXISTS orders_is_archived        ON orders (is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS order_items_order_id      ON order_items (order_id);
```

**Safe to run on a live database** — all statements use `IF NOT EXISTS`.

---

## Build Status

| Commit | Railway | Vercel | Build time |
|--------|---------|--------|-----------|
| `24c75f7` | ✅ Success | ✅ Success | ~2 min / ~50s |
| `76e9442` | ✅ Success | ✅ Success | ~2 min / ~50s |

---

## Files Changed (full list)

### New files
- `src/lib/rateLimit.ts` — in-memory rate limiter utility
- `migrations/20260228_db_indexes.sql` — Supabase SQL migration (run manually)
- `CODEBASE_AUDIT_20260228.md` — full 8-phase audit output
- `PRODUCTION_HARDENING_20260228.md` — this document

### Modified files
- `src/lib/supabase/server.ts` — added `requireStaffUser()`
- `src/app/api/orders/route.ts` — price revalidation, rate limit, input limits, sanitizeError, order# retry
- `src/app/api/quote-request/route.ts` — XSS fix, rate limit, input limits
- `src/app/api/email/send/route.ts` — auth guard
- `src/app/api/payment/clover/route.ts` — auth guard
- `src/app/api/upload/route.ts` — removed auth (anonymous upload fixed)
- `src/app/api/webhooks/clover/route.ts` — fail-closed, timingSafeEqual
- `src/lib/payment/token.ts` — timingSafeEqual
- `src/app/api/staff/orders/[id]/status/route.ts` — requireStaffUser
- `src/app/api/staff/orders/[id]/reply/route.ts` — requireStaffUser
- `src/app/api/staff/orders/[id]/archive/route.ts` — requireStaffUser
- `src/app/api/staff/orders/[id]/proof/route.ts` — requireStaffUser
- `src/app/api/staff/orders/[id]/notes/route.ts` — requireStaffUser
- `src/app/api/staff/quote/wave/route.ts` — requireStaffUser
- `package.json` + `package-lock.json` — nodemailer removed, 0 audit vulns

### Deleted files
- `CALCULATOR_FIX_PROMPT_20260224.md`
- `CODEBASE_PROMPT_20260224.md`
- `CODEBASE_PROMPT_20260224_LYRA.md`
- `CODEBASE_AUDIT_20260224.md`
