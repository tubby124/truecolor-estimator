# Order Flow Audit Prompt
# Paste this into a fresh Claude Code session to audit and fix the full order/payment/receipt flow.
# Generated: 2026-03-30

---

```
<investigate_before_answering>
Never speculate about code you have not opened. Read every relevant file before
making any claim about what works or what is broken. Make zero assumptions about
what any function does until you have read it.
</investigate_before_answering>

<default_to_action>
Implement fixes directly. Do not suggest changes — make them. Infer intent from
context and proceed. Use file reads and grep to discover missing details rather
than asking. The only exception is a decision that would delete data or change
a payment amount — pause and confirm those only.
</default_to_action>

<role>
You are a senior full-stack engineer performing a production audit and fix on a
Next.js 16 print shop (True Color Display Printing, truecolorprinting.ca). You
have deep expertise in Supabase, Brevo REST email, Clover payments, Wave
accounting webhooks, and Next.js App Router patterns.
</role>

<context>
Working directory: /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/
Stack: Next.js 16.1.6 · TypeScript strict · Tailwind CSS v4 · Supabase ·
Brevo REST API · Clover online payments · Wave accounting

ORDER LIFECYCLE (orders.status in DB):
pending_payment → payment_received → in_production → ready_for_pickup → complete

THREE PAYMENT METHODS — each has a different trigger path:
1. Clover card (online) — customer clicks Pay Now in email → /pay/[token] →
   server creates Clover checkout → customer pays → Clover webhook should
   fire → status updates automatically
2. Wave invoice — staff creates Wave invoice from staff portal → customer pays
   online → Wave webhook should fire → status should update automatically
3. eTransfer — customer sends Interac eTransfer to info@true-color.ca →
   NO automatic detection possible — staff must manually confirm receipt in
   the portal. Currently NO UI exists for this.

EMAIL SYSTEM:
All email via Brevo REST API in src/lib/email/smtp.ts (Railway Hobby blocks
all SMTP ports — nodemailer is NOT used, ever).
Verified Brevo senders:
  - info@true-color.ca (ID 1) — all customer-facing email
  - hello@outreach.true-color.ca (ID 2) — all staff notification email
    CRITICAL: staff notifications MUST use hello@outreach.true-color.ca as
    FROM — Brevo blocks sends where FROM == TO (both would be info@true-color.ca).

Key email files:
  src/lib/email/paymentReceipt.ts
  src/lib/email/orderConfirmation.ts
  src/lib/email/statusUpdate.ts
  src/lib/email/proofSent.ts
  src/lib/email/staffNotification.ts
  src/lib/email/smtp.ts

Required email sequence:
order_confirmation → payment_received → in_production → ready_for_pickup →
proof_review → payment_failure_recovery (cron 24h) → review_request (cron day 5)

Key UI/API files:
  src/app/staff/orders/ — staff orders page and actions
  src/components/staff/orders/StaffOrderCard.tsx
  src/components/staff/orders/ — all order card components
  src/app/api/staff/ — all staff API routes
  src/app/api/webhooks/ — Clover + Wave webhook handlers
  src/app/api/orders/ — any customer-facing order endpoints
  src/app/account/ — client dashboard (order tracking)

Security rules (non-negotiable):
  - requireStaffUser() on EVERY /api/staff/* route — no exceptions
  - createServiceClient() only in server components/routes
  - getSession() for UI, never getUser()
  - All email HTML = inline CSS only, no Tailwind classes
  - Webhook routes must verify signatures (fail-closed — reject if secret missing)
</context>

<task>
Audit the complete order/payment/receipt flow and fix every broken or missing
piece. Work in strict sequence.

PHASE 1 — READ AND MAP (no edits yet)
Read every file listed in context. For each payment method, trace and document:
  - What event triggers payment confirmation?
  - Does a receipt email fire? Which function? Does it call sendEmail()?
  - Does order status update in DB?
  - Does the customer get notified at each status change?
  - What does staff see in the portal at each step?

PHASE 2 — GAP REPORT (output this before any edits)
  - Per payment method: what works end-to-end vs. what is broken/missing
  - Per status transition: is a customer email triggered? Staff notified?
  - Ordered fix list, highest customer impact first

PHASE 3 — IMPLEMENT ALL FIXES

FIX 1 — eTransfer confirmation UI (highest priority)
No UI currently exists for staff to confirm eTransfer receipt. Build:
  a) "Confirm eTransfer Received" button on order cards where
     payment_method = 'etransfer' AND status = 'pending_payment'
  b) Confirmation dialog: "Have you confirmed receipt of the eTransfer
     payment in your info@true-color.ca inbox?"
  c) On confirm: POST to new /api/staff/orders/[id]/confirm-etransfer that:
       - requireStaffUser() — mandatory
       - Updates orders.status = 'payment_received' in Supabase
       - Sends customer a payment receipt via paymentReceipt.ts
       - Sends staff a notification FROM hello@outreach.true-color.ca
  d) UI updates optimistically with success toast

FIX 2 — Payment receipt delivery
Verify paymentReceipt.ts fires after ALL confirmed payments:
  - Clover webhook → receipt sent to customer?
  - Wave webhook → receipt sent to customer?
  - eTransfer confirm (Fix 1) → receipt sent to customer?
  Add any missing sendEmail() calls.

FIX 3 — Status transition emails
For every status change staff can trigger (in_production, ready_for_pickup,
complete): verify a customer email fires via statusUpdate.ts.
"Ready for pickup" is highest priority — customer must be notified.
Add all missing calls.

FIX 4 — Wave webhook
Verify the Wave webhook handler:
  - Correctly identifies paid invoices
  - Updates order status to payment_received
  - Triggers paymentReceipt.ts
  Fix any gaps.

FIX 5 — Client dashboard accuracy
Verify /account shows live, correct order status to customers.
If DB status changes aren't reflecting in the dashboard, fix the fetch.

FIX 6 — Any other gaps found during audit
Fix them. Do not log and defer — implement.

After every fix: run npm run build. Do not proceed to the next fix if build fails.
</task>

<constraints>
NEVER touch:
  - data/tables/*.csv (pricing — owner-only changes)
  - src/lib/engine/ (pure pricing function — no side effects)
  - /staff/login auth flow
  - Title tags, H1s, meta descriptions on any SEO landing page
  - Sitemap entries or lastmod dates in sitemap.ts

ALWAYS:
  - requireStaffUser() on every /api/staff/* route added or modified
  - Use sendEmail() from src/lib/email/smtp.ts — no new email libraries
  - Staff notification FROM = "True Color Display Printing <hello@outreach.true-color.ca>"
  - Customer email FROM = default SMTP_FROM (info@true-color.ca via env var)
  - TypeScript strict — no `any`, no unsafe type assertions
  - Reuse shared email components from src/lib/email/components/
  - Webhook routes fail-closed (reject if secret env var is not set)
</constraints>

<output_format>
## Gap Report
[Findings per payment method and per status transition]

## Fixes Implemented
[File-by-file: what changed and why]

## Test Plan
[Exact steps to verify each fix — what to click, what email arrives, what DB row changes]
</output_format>
```
