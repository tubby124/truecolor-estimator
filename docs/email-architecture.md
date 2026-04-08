# Email Architecture — True Color Display Printing

Last updated: 2026-03-30
Audit prompt: see docs/order-audit-prompt.md

---

## Email Addresses & Their Roles

| Address | Purpose | Who monitors it |
|---|---|---|
| `info@true-color.ca` | Primary business inbox. Receives eTransfers, customer replies, quote approvals. All transactional emails send FROM this address. | Albert (Hostinger webmail / email client) |
| `hello@outreach.true-color.ca` | Industry blitz / mass outreach campaigns ONLY. Keeps main domain reputation clean. | Not monitored directly — track via Brevo dashboard |

**Rule:** Transactional emails (quotes, orders, welcome, receipts) always send from `info@true-color.ca`. Marketing blasts use `hello@outreach.true-color.ca`. Never swap these.

---

## How Email Actually Sends (Railway + Brevo)

Railway Hobby ($5/mo) **blocks all SMTP ports** (25, 465, 587, 2525) at the firewall. So we cannot use nodemailer or any SMTP relay. Instead: Brevo REST API over HTTPS port 443, which Railway does NOT block.

Code path: `src/lib/email/smtp.ts` → `POST https://api.brevo.com/v3/smtp/email`

### Required Railway Variables

| Variable | Value | Notes |
|---|---|---|
| `BREVO_API_KEY` | `key-...` (v3 key from Brevo) | Brevo → Settings → API Keys |
| `SMTP_FROM` | `True Color Display Printing <info@true-color.ca>` | Must match a verified Brevo sender |
| `SMTP_BCC` | `info@true-color.ca` | Auto-BCCs all outgoing so staff sees sent mail |
| `SMTP_REPLY_TO` | `info@true-color.ca` | **Set this.** Without it customer replies go nowhere useful |

### How to set these in Railway
1. Railway dashboard → your project → Variables
2. Add/verify each of the 4 vars above
3. Redeploy (Railway auto-redeploys on variable changes)

---

## Brevo Sender Verification

Two senders are currently verified in Brevo (confirmed 2026-03-30):

| ID | Email | Name | Use |
|---|---|---|---|
| 1 | `info@true-color.ca` | True Color Display Printing Ltd. | All transactional email |
| 2 | `hello@outreach.true-color.ca` | True Color Display Printing | Industry blitz campaigns |

**If sending fails with a 400/401 from Brevo:** The `sender.email` in the request doesn't match a verified sender. Fix: verify the address in Brevo → Senders & IPs → Senders.

---

## Email Flow by Type

### 1. Customer Quote (the most important)

**Trigger:** Staff sends quote from `/staff` portal → `POST /api/email/send`

**From:** `True Color Display Printing <info@true-color.ca>`  
**To:** customer email  
**Reply-To:** `info@true-color.ca` (via `SMTP_REPLY_TO` env var)  
**BCC:** `info@true-color.ca` (via `SMTP_BCC` env var — staff sees all sent quotes)  

**What the email contains:**
- Quote pricing breakdown with GST + PST
- Spec diagram / proof artwork (if attached)
- "Reply Approved" button → `mailto:info@true-color.ca` (hardcoded in quoteTemplate.ts:270)
- "Pay Now" button if payment link generated
- eTransfer address: `info@true-color.ca`

**How approval works (current):**  
Customer clicks "Reply to Approve" → opens their email client → sends to `info@true-color.ca` → Albert sees it in Hostinger webmail → manually marks order in staff portal.

This is intentional — there is no automatic approval parsing. Brevo transactional is outbound-only and cannot receive replies. The `mailto:` button and the reply-to header both point to `info@true-color.ca` so Albert receives it directly.

### 2. Signup Welcome Email

**Trigger:** User creates account → `/api/auth/signup-notify` → `sendSignupWelcomeEmail()`

**From:** `True Color Display Printing <info@true-color.ca>`  
**To:** new customer  
**Reply-To:** `info@true-color.ca` (via `SMTP_REPLY_TO`)  
**BCC:** `info@true-color.ca`  

**Contains:** WELCOME10 coupon, Browse Products / Get Quote CTAs, phone + email.

**Gap:** Staff has no in-app notification when a new signup occurs. The BCC to `info@true-color.ca` serves as the notification — Albert sees the welcome email and knows someone signed up.

### 3. Account Welcome (post-manual-order)

**Trigger:** Staff creates order for a customer manually → system auto-creates Supabase account → `sendAccountWelcomeEmail()`

**From:** `info@true-color.ca`  
**Reply-To:** `info@true-color.ca` (via `SMTP_REPLY_TO`)  
**BCC:** `info@true-color.ca`  

### 4. Order Confirmation

**Trigger:** Customer completes checkout → `sendOrderConfirmationEmail()`

**From:** `info@true-color.ca`  
**Reply-To:** `info@true-color.ca` (via `SMTP_REPLY_TO`)  
**BCC:** `info@true-color.ca`  

### 5. Staff Notifications

**Trigger:** New order, new quote request, etc. → `sendStaffNotificationEmail()`

**From:** `info@true-color.ca`  
**To:** staff email (from `STAFF_EMAIL` env var)  
**Reply-To:** not needed (internal only)  

### 6. Industry Blitz (outreach)

**NOT handled by smtp.ts.** These go through Brevo campaign API (sender ID 2: `hello@outreach.true-color.ca`). Completely separate from transactional email. See `industry-blitz-n8n-handoff.md`.

---

## Supabase Auth Emails (separate system)

Supabase sends its own emails for:
- Email confirmation on signup
- Password reset
- Magic link

These are **completely separate** from Brevo. They use Supabase's own infrastructure unless you configure custom SMTP.

### Current state
Unknown — likely using Supabase default sender (`noreply@mail.supabase.io`), which is unbranded and goes to spam frequently.

### How to fix (recommended)
Configure Supabase to send auth emails through Brevo SMTP:

1. Brevo → Settings → SMTP & API → SMTP tab → get SMTP credentials
2. Supabase Dashboard → Authentication → Email → Custom SMTP:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: your Brevo account email
   - Password: Brevo SMTP key (NOT the API key — different key)
   - From: `info@true-color.ca`
3. Supabase → Authentication → Email Templates → customize each template to match True Color branding

This makes ALL emails (transactional + auth) come from `info@true-color.ca` through Brevo.

---

## Observability — How to Know Emails Are Delivering

### 1. email_log table (Supabase)
Every `sendEmail()` call writes a row to `email_log`:
- `to_address` — recipient
- `subject` — email subject (used as email_type too)
- `status` — always "sent" (means the API call succeeded, not that it was delivered)

Check: Supabase → Table Editor → `email_log`

### 2. Brevo dashboard
Brevo → Transactional → Email Activity → shows delivered/bounced/opened per email.  
This is the authoritative delivery status.

### 3. BCC to info@true-color.ca
Every outgoing email is BCC'd to `info@true-color.ca`. If a customer reports not receiving an email, check if the BCC copy is in Albert's inbox. If yes → delivery issue on their end (spam filter, wrong address). If no → the send itself failed (check `email_log` + Brevo activity).

---

## What Brevo Can and Cannot Do

| Feature | Supported |
|---|---|
| Send transactional email | ✅ |
| Delivery/open/click webhooks | ✅ |
| Bounce/complaint handling | ✅ |
| Reply-to routing (set a reply-to header) | ✅ (now fixed in smtp.ts) |
| **Receive inbound email replies** | ❌ — transactional API is outbound-only |
| Parse "Reply Approved" and auto-update order | ❌ — not possible with Brevo alone |

**Bottom line:** Customer replies land directly in Albert's `info@true-color.ca` inbox via their email client. There is no automatic parsing. This is the correct and simple architecture for this scale.

---

## Common Issues & Fixes

**"Client replied but we never saw it"**  
→ Check Railway: is `SMTP_REPLY_TO=info@true-color.ca` set?  
→ Check Brevo: is `info@true-color.ca` a verified sender?  
→ Check Hostinger webmail: is the reply in the `info@true-color.ca` inbox (not spam)?

**"Client says they never got the welcome email"**  
→ Check `email_log` table — did the row get written?  
→ Check Brevo Transactional → Email Activity for that address  
→ Ask them to check spam — Supabase auth emails (confirmation) are from `noreply@mail.supabase.io` until custom SMTP is set up

**"Brevo returns 400 on send"**  
→ The `SMTP_FROM` address is not a verified Brevo sender  
→ Fix: verify the address in Brevo or update `SMTP_FROM` to match a verified sender

**"Getting error: BREVO_API_KEY not configured"**  
→ Railway Variable is missing or named wrong  
→ Must be named exactly `BREVO_API_KEY`

---

## Checklist — Verify This System Is Fully Operational

- [x] Railway var `BREVO_API_KEY` is set (Brevo v3 key)
- [x] Railway var `SMTP_FROM` = `True Color Display Printing <info@true-color.ca>`
- [x] Railway var `SMTP_BCC` = `info@true-color.ca`
- [x] Railway var `SMTP_REPLY_TO` = `info@true-color.ca` — added 2026-03-30
- [x] Railway var `STAFF_EMAIL` = staff login email
- [x] Brevo: `info@true-color.ca` sender is active — confirmed 2026-03-30
- [x] Brevo: `hello@outreach.true-color.ca` sender active — used for staff notifications
- [x] Supabase: Custom SMTP configured → Brevo SMTP relay, sender info@true-color.ca — 2026-03-30
- [ ] Supabase: Auth email templates updated with True Color branding (subject lines at minimum)
- [ ] Test: send a quote to external email, hit reply → lands in `info@true-color.ca`
- [ ] Test: Supabase forgot-password email arrives from `info@true-color.ca` (not noreply@mail.supabase.io)
