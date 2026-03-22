# True Color — Security Rules & OWASP Checklist

## Auth Model

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| Staff pages (`/staff/*`) | Middleware: Supabase session + `email === STAFF_EMAIL` | Redirects to `/staff/login` on fail |
| Staff API (`/api/staff/*`) | `requireStaffUser()` in every handler | Returns 401/403 — NEVER skip this |
| Customer API (`/api/account/*`) | Bearer token from Supabase session | Token passed in Authorization header |
| Public API (`/api/orders`, `/api/upload`, `/api/estimate`) | No auth — rate-limited + input-validated | Intentional: anonymous checkout flow |
| Webhooks (`/api/webhooks/*`) | HMAC-SHA256 (Clover, Wave) or Bearer token (Brevo) | Fail-closed: reject if secret missing. Brevo does NOT support HMAC — uses Bearer token in Authorization header via `auth.type=bearer` webhook config. |
| Cron (`/api/cron/*`) | `CRON_SECRET` in Authorization header | Railway/Vercel sends automatically |

## OWASP Top 10 — Current Status

### A01: Broken Access Control — PASS
- All `/api/staff/*` routes use `requireStaffUser()`
- Middleware blocks `/staff/*` pages for non-staff
- `createServiceClient()` (bypasses RLS) used only in server-side code
- Customer routes validate session token before returning data

### A02: Cryptographic Failures — PASS
- Webhook secrets in env vars, never hardcoded
- Clover webhook uses `timingSafeEqual` for signature comparison
- Payment tokens use HMAC-signed JWTs (`PAYMENT_TOKEN_SECRET`)
- HSTS enabled with preload

### A03: Injection — PASS
- No raw SQL or `.rpc()` calls — all queries via Supabase client (parameterized)
- `dangerouslySetInnerHTML` usage is safe: JSON-LD schemas (server-generated objects) + Trustindex widget (fetched from hardcoded CDN URL, server-side only)
- No string interpolation in queries

### A04: Insecure Design — PASS
- Server-side price revalidation prevents cart manipulation
- Discount codes re-validated server-side (client hint ignored)
- File uploads use UUID paths (no enumeration)

### A05: Security Misconfiguration — MINOR GAP
- CSP allows `unsafe-inline` + `unsafe-eval` for script-src (required by Trustindex widget + GTM)
- n8n social webhook: FIXED — now fail-closed (rejects if `N8N_WEBHOOK_SECRET` unset)

### A06: Vulnerable Components — CHECK PERIODICALLY
- Run `npm audit` before major deploys
- `@resvg/resvg-js` is native — pin version, don't auto-update

### A07: Auth Failures — PASS
- No password in URL params
- Session cookies set by Supabase SSR (HttpOnly, Secure, SameSite)
- No custom JWT implementation (Supabase handles it)

### A08: Data Integrity — PASS
- Webhook signatures verified before processing
- Order status transitions guarded (e.g., only `pending_payment` → `payment_received`)

### A09: Logging & Monitoring — ACCEPTABLE
- All webhook events logged with `[prefix]` tags
- Errors logged to Railway console
- No PII in logs (customer emails logged only on successful operations)

### A10: SSRF — PASS
- No user-controlled URLs passed to server-side `fetch()`
- All external fetch targets are hardcoded (Trustindex CDN, Wave API, Clover API, Brevo API)

## Known Accepted Risks

| Risk | Severity | Why Accepted |
|------|----------|-------------|
| CSP `unsafe-inline`/`unsafe-eval` | Low | Required by Trustindex widget + Google Tag Manager. Cannot remove without breaking reviews and analytics. |
| ~~n8n webhook fail-open~~ | ~~Medium~~ | FIXED 2026-03-13 — now fail-closed |
| ~~Wave webhook non-timing-safe comparison~~ | ~~Low~~ | FIXED 2026-03-13 — now uses `timingSafeEqual` |
| Upload route open to anonymous | Low | Rate-limited (10/min/IP), MIME allowlisted, 50MB cap, UUID paths. Required for anonymous checkout artwork upload. |

## Code Pattern Flagging Table

When reviewing or writing True Color code, flag these patterns:

| Pattern | Action | Why |
|---------|--------|-----|
| `createServiceClient()` in client component | BLOCK | Service client bypasses RLS — server-only |
| `getUser()` for UI rendering | BLOCK | Use `getSession()` — `getUser()` makes extra auth call |
| Missing `requireStaffUser()` in `/api/staff/*` | BLOCK | Auth bypass — every staff route MUST call this |
| `req.json()` without type validation | WARN | Validate shape or at minimum check required fields |
| `dangerouslySetInnerHTML` with user input | BLOCK | XSS — only use with server-generated data or trusted CDN content |
| Hardcoded webhook/API URLs | BLOCK | Use env vars — repo is PUBLIC |
| `process.env.SECRET` in client component | BLOCK | Leaks to browser bundle — use `NEXT_PUBLIC_` prefix only for public values |
| `fetch()` with user-supplied URL | BLOCK | SSRF risk — all fetch targets must be hardcoded or from env vars |
| String concatenation in Supabase `.eq()` / `.filter()` | BLOCK | Potential injection — always pass variables as separate arguments |
| `error.message` returned to client from webhook/external API | WARN | Leaks internal error details — return generic message |
| New public POST route without `rateLimit()` | WARN | Abuse risk — all public POST endpoints should be rate-limited |
| `timingSafeEqual` not used for secret comparison | WARN | Timing attack vector — use `crypto.timingSafeEqual` for all secret comparisons |
| Webhook auth with `if (secret)` (fail-open) | BLOCK | Must be fail-closed: reject if secret is not configured |

## Security Headers (next.config.ts)

Currently deployed on all routes:
- `X-Frame-Options: DENY` — clickjacking protection
- `X-Content-Type-Options: nosniff` — MIME sniffing prevention
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-XSS-Protection: 1; mode=block`
- `Cross-Origin-Opener-Policy: same-origin`
- `Content-Security-Policy` — restrictive with necessary exceptions

NEVER remove or weaken these headers without explicit owner approval.

## Pre-Deploy Security Checklist

Before any deploy touching auth, payments, webhooks, or API routes:
- [ ] All `/api/staff/*` routes call `requireStaffUser()`
- [ ] No secrets hardcoded in source (grep for API keys, tokens, passwords)
- [ ] No `createServiceClient()` imported in any `"use client"` file
- [ ] All webhook routes verify signatures (fail-closed)
- [ ] All public POST routes have rate limiting
- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] No user input passed to `dangerouslySetInnerHTML`
- [ ] No user-controlled URLs passed to server-side `fetch()`
