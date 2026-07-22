# Order Message Tracking and Reply Ingestion Plan

**Goal:** Give staff a durable, order-linked email timeline showing outbound content, Resend delivery state, failures, and inbound customer replies received by `info@true-color.ca`.

**Branch:** `codex/order-message-tracking`, isolated from the active PPC worktree.

## Phase 0 — Documentation discovery and allowed APIs

### Existing repo patterns to copy

- Staff auth: `requireStaffUser()` from `src/lib/supabase/server.ts` on every `/api/staff/*` route.
- Safe staff errors: `sanitizeError()` from `src/lib/errors/sanitize.ts`.
- Resend transport: `sendEmail()` in `src/lib/email/smtp.ts`.
- Resend delivery events: signed Svix handler in `src/app/api/webhooks/resend/route.ts`.
- Gmail DWD auth and message reads: `src/lib/blitz/gmail-replies.ts`.
- Cron auth: bearer `CRON_SECRET`, Node runtime, force-dynamic route, and `recordCronRun()` heartbeat.
- Lazy staff widget: loading/error/cancellation behavior in `src/app/staff/orders/CustomerHistoryWidget.tsx`.
- Audit trail: `recordAuditEvent()` in `src/lib/audit/record.ts`.
- Order/customer email linkage: `sendOrderRepriceEmail()` in `src/lib/email/orderReprice.ts`.

### Allowed provider APIs

- Resend `POST /emails` supports `reply_to`, custom `headers`, and an `Idempotency-Key` request header. Keys are retained for 24 hours and must be no more than 256 characters: https://resend.com/docs/api-reference/emails/send-email and https://resend.com/docs/dashboard/emails/idempotency-keys
- Resend webhook `email_id` correlates send and delivery events. `email.delivered` means the recipient mail server accepted the message; it does not prove a human read it: https://resend.com/docs/webhooks/event-types
- Gmail `users.messages.list({ userId: "me", q, maxResults, pageToken })` returns Gmail message IDs/thread IDs. Full headers and MIME payload require `users.messages.get({ userId: "me", id, format: "full" })`: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list and https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get
- Gmail's immutable message `id` is not the RFC `Message-ID` header. Gmail API search also differs from the UI and does not guarantee Workspace alias expansion.

### Architecture decisions

1. Add a dedicated `order_messages` ledger. Do not overload `email_log`, which remains the generic transactional delivery log.
2. Store a random 128-bit `reply_token` in a service-only one-to-one `order_reply_tokens` table. Outbound custom messages use `Reply-To: info+o_<token>@true-color.ca` only after routing is verified.
3. Link outbound messages by `order_id`, `customer_id`, provider ID, and client request UUID.
4. Deduplicate outbound sends with both a database unique request key and Resend's `Idempotency-Key`.
5. Deduplicate inbound replies by Gmail mailbox + immutable Gmail message ID.
6. Associate inbound replies primarily by the opaque recipient token. Preserve RFC `Message-ID`, `In-Reply-To`, and `References` for evidence/fallback, but never equate them with Resend's API ID.
7. Store sender-match evidence. A reply from a different address is visible but flagged for staff review.
8. Keep the existing seven-email order lifecycle unchanged.

### Anti-pattern guards

- Never auto-associate replies by sender alone, subject alone, or Gmail thread alone.
- Never expose raw Resend, Supabase, Gmail, or Railway errors to the browser.
- Never treat `sent` as `delivered`, or `opened` as proof a person read the email.
- Never retry with a new provider idempotency key after an ambiguous timeout.
- Never mark an inbound Gmail message processed before a durable unique row exists.
- Never change SEO pages, pricing data, checkout totals, payment behavior, or order statuses in this feature.

## Phase 1 — Durable database model

### Implement

Create three standard, transaction-compatible additive migrations that:

- Creates `order_reply_tokens` with one cryptographically random unique token per order, an insert trigger for new orders, and a separate backfill into the new table for existing orders. This avoids rewriting or indexing the live `orders` table.
- Creates `order_messages` with:
  - `id uuid` primary key
  - `order_id uuid` and `customer_id uuid` foreign keys
  - `direction` (`outbound` or `inbound`)
  - `status` (`sending`, `pending_confirmation`, `sent`, `delivered`, `delivery_delayed`, `bounced`, `complained`, `failed`, `received`)
  - sender/recipient/subject/plain-text body
  - staff actor, client request UUID, Resend provider ID
  - Gmail mailbox/message/thread IDs and RFC threading headers
  - recipient header, sender-match flag, auto-reply flag
  - durable processing and notification markers so overlapping Gmail scans resume interrupted work
  - sent/received/delivered/opened/bounced/complained/delayed/replied timestamps
  - last event detail and created/updated timestamps
- Adds unique constraints for client request UUID, provider ID when present, and mailbox + Gmail message ID when present.
- Adds order/timestamp and status indexes.
- Enables RLS with no public policies; all access stays behind authenticated staff routes and service-role crons/webhooks.
- Creates all token indexes on the new table while it is empty, so the normal Supabase transactional migration runner remains reproducible.

### Verification

- Apply migration to a local/ephemeral database first.
- Confirm repeat migration is safe where `IF NOT EXISTS` is used.
- Confirm anon and authenticated customer clients cannot read `order_messages`.
- Confirm service-role insert/select/update and foreign keys work.

## Phase 2 — Outbound exact-once tracking

### Implement

1. Extend `SendEmailOptions` with an optional `idempotencyKey` and return `{ providerMessageId }` from `sendEmail()`.
2. Send `Idempotency-Key` as an HTTP request header, not an email MIME header.
3. Await/check the `email_log` insert where practical, but never convert a delivered customer email into a failure solely because secondary logging failed.
4. Update `POST /api/staff/orders/[id]/reply` to:
   - require staff auth and a UUID `clientRequestId`;
   - load order ID, customer ID/email, and reply token server-side;
   - claim or reuse the unique outbound `order_messages` row;
   - reject a reused request UUID with a different order/subject/body;
   - call Resend with the same idempotency key on safe retries;
   - pass explicit `orderId`, `customerId`, and rollout-gated tokenized `replyTo`;
   - update the ledger with provider ID/status/timestamps;
   - persist a sanitized internal failure state and return a generic staff-safe error;
   - record the existing audit event with the message ledger ID.
5. Extend the Resend webhook to update both `email_log` and `order_messages`, including `email.sent`, `email.failed`, and `email.suppressed`, without regressing terminal states on out-of-order events.

### Verification

- Unit-test success, provider rejection, timeout/retry, duplicate request UUID, and payload mismatch.
- Assert the same Resend idempotency key is reused.
- Assert order/customer IDs and provider ID are stored.
- Replay signed webhook fixtures twice and prove idempotent final state.

## Phase 3 — Inbound Gmail reply ingestion

### Implement

1. Extract reusable Gmail client/header/MIME helpers from the blitz-specific reader without changing blitz classification behavior.
2. Add an order reply synchronizer that:
   - lists recent inbox mail using overlapping windows and pagination;
   - fetches full messages;
   - inspects `To`, `Delivered-To`, and `X-Original-To` for the opaque token;
   - rejects malformed/wrong-domain tokens;
   - finds the exact `order_reply_tokens` row by `reply_token`, then loads that order;
   - stores Gmail and RFC IDs, cleaned message text, timestamps, and sender-match evidence;
   - claims each Gmail message exactly once before alerts/side effects;
   - marks the latest related outbound message `replied_at`;
   - records an audit event and sends one staff Telegram notification for each new human reply;
   - captures but does not alert on auto-replies.
3. Add `GET /api/cron/order-replies` using `CRON_SECRET`, dry-run support, bounded lookback, heartbeat, and sanitized errors.
4. Add an hourly GitHub Actions schedule with manual dry-run dispatch.

### Rollout gate

Before enabling tokenized Reply-To or the cron in production, send one controlled probe to `info+probe@true-color.ca` and verify:

- it reaches the `info@true-color.ca` Workspace mailbox;
- at least one inspected recipient header preserves the token;
- the service account can read it;
- the dry-run cron reports the probe without inserting an order message.

If plus addressing is not preserved, configure Workspace routing or a dedicated inbound alias before activation. Do not fall back to automatic sender-only association.

### Verification

- Unit-test token extraction, HTML/plain MIME extraction, quoted-history trimming, auto-reply detection, wrong-domain rejection, sender mismatch, and Gmail-ID dedupe.
- Dry-run against production mailbox before enabling writes.
- Confirm overlapping cron windows do not duplicate messages or alerts.

## Phase 4 — Staff order message timeline

### Implement

1. Add a staff-authenticated `GET /api/staff/orders/[id]/messages` endpoint with rate limiting and server-side order validation.
2. Add `OrderMessagesPanel` as a lazy component inside the expanded order card.
3. Replace the ephemeral composer with the panel while preserving its subject/body workflow.
4. Show:
   - clear direction (`Staff → Customer`, `Customer → Staff`);
   - sent, delivered, delayed, bounced, failed, received, and replied states;
   - exact timestamps and delivery explanations;
   - sender, recipient, subject, and plain-text body;
   - warning when an inbound sender differs from the order customer;
   - refresh and retry controls that reuse the same request UUID after ambiguous failures.
5. Refresh the timeline after sends and poll briefly while a message remains `sending`/`sent`.

### UX rules

- `Sent` means Resend accepted the request.
- `Delivered` means the recipient mail server accepted it.
- `Opened` is informational only and must not be presented as reliable proof of reading.
- `Replied` is definitive customer interaction.
- Render message content as text; never inject stored HTML.

### Verification

- Component/API tests for loading, empty, sent, delivered, failed, inbound, and sender-mismatch states.
- Mobile/desktop inspection inside an expanded order card.
- Confirm keyboard focus, disabled states, and errors are accessible.

## Phase 5 — Release verification and operations

### Required checks

- `npx tsc --noEmit`
- focused Vitest suites for mail transport, route, webhook, Gmail parsing, and UI contracts
- existing full `npm test`
- `npm run build`
- production unauthenticated staff-route smoke test remains 401
- project-specific `tc-db-reviewer`, `tc-code-reviewer`, and build resolver if needed

### Ecommerce gate

- Checkout UX: unchanged.
- Seven lifecycle emails: unchanged and verified present.
- Order confirmation page: unchanged.
- B2B/local trust signals: unchanged.
- Security: staff auth, sanitized external errors, service-only message ledger.
- Payment flow: unchanged.
- Pricing: N/A; no pricing files or calculations touched.
- SEO: N/A; no indexed pages, metadata, schema, links, sitemap, or redirects touched.

### Deployment sequence

1. Review and merge the code without deploying it.
2. Replay the three additive migrations on a branch database, then apply them in a controlled production change.
3. Verify token count equals order count, the new-order trigger works, and anon/authenticated roles cannot access either new table.
4. Deploy the code with both reply flags disabled.
5. Verify Resend variables/webhook events and Gmail DWD variables.
6. Run the plus-address probe and dry-run Gmail cron.
7. Enable tokenized Reply-To.
8. Enable the order-reply cron.
9. Send one controlled staff-order message to an owned test address, reply to it, and verify the full timeline.
10. Monitor cron heartbeat, bounce/failure states, and duplicate counts for the first day.

Application rollback should disable both flags and leave the additive tables and
trigger intact. If schema removal is ever required, disable/drop
`orders_create_reply_token` before removing its function or token table.

### No-ship conditions

- Plus-address token is not preserved.
- Resend webhook secret/events are not configured.
- Gmail DWD cannot read `info@true-color.ca`.
- Duplicate-send or duplicate-reply tests fail.
- Staff API authorization or RLS checks fail.
- Existing order/email/payment tests regress.
