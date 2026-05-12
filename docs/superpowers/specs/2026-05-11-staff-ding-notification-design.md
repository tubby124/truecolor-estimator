# Staff Ding Notification System — Design Spec

**Date:** 2026-05-11
**Status:** Approved (Hasan, 2026-05-11)
**Project:** truecolor-estimator (truecolorprinting.ca)
**Revision:** v2 — switched from Postgres CDC Realtime to Supabase Broadcast channels to avoid RLS policy changes on `quote_requests` (currently service-role-only per domain rule).

## Goal

When a customer submits a quote request OR a paid order lands, True Color staff get notified in two channels:
1. Audible ding + visual badge in the `/staff` dashboard (any logged-in staff member, browser tab open).
2. Telegram message to Hasan's personal chat via the existing `@truecolorprintingbot`.

No quiet hours, no per-staff routing, no mute toggles, no event-type sound differentiation. Smallest possible surface.

## Why

Quotes and paid orders that sit unseen for hours cost real money. A 2-second ding while staff are already at the dashboard collapses the response gap from hours to seconds. Telegram fallback covers when no one is at the screen (Hasan on the floor, after-hours, walk-around).

## Scope

### In scope
- Real-time client-side notification listener mounted in the staff dashboard layout.
- Supabase Broadcast channel `tc-staff-notifs` — server-side emit on the events; staff browser clients subscribe.
- Server-side Telegram `sendMessage` ping after a successful quote-request insert and after the Clover webhook flips an order from `pending_payment` to `payment_received`.
- Both the Broadcast emit and the Telegram ping run server-side in the same handlers (no client-side row subscription, no RLS policy changes).
- One royalty-free MP3 ding asset under `public/sounds/ding.mp3`.

### Out of scope (deliberately deferred)
- Web push / service worker notifications (closed-tab support).
- Per-staff Telegram DMs or shop group channels.
- Quiet hours / DND windows.
- Mute toggles, sound chooser, volume controls.
- Different sounds for quotes vs orders.
- Notifications for unpaid order drafts, status changes, customer signups, coupon redemptions.

## Architecture

```
┌─────────────────────────┐         INSERT          ┌────────────────────────┐
│  Public quote form      │  ────────────────────►  │  quote_requests table  │
│  POST /api/quote-request│                          │  (Supabase)            │
└───────────┬─────────────┘                          └──────────┬─────────────┘
            │                                                   │
            │ POST                                              │ Realtime
            │ Telegram                                          │ broadcast
            ▼                                                   ▼
┌─────────────────────────┐                          ┌────────────────────────┐
│  Telegram Bot API       │                          │  <NotificationListener│
│  @truecolorprintingbot  │                          │  /> in /staff dashboard│
│  → Hasan's chat_id      │                          │  → play ding.mp3       │
└─────────────────────────┘                          │  → badge counter ++    │
                                                     │  → toast               │
                                                     └────────────────────────┘

┌─────────────────────────┐    UPDATE status=paid    ┌────────────────────────┐
│  Clover webhook         │  ────────────────────►  │  orders table          │
│  POST /api/webhooks/    │                          │  payment_status='paid' │
│  clover/route.ts        │                          └──────────┬─────────────┘
└───────────┬─────────────┘                                     │
            │ POST Telegram                                     │ Realtime
            ▼                                                   ▼
        (same as above)                                  (same as above)
```

## Components

### 1. `NotificationListener` client component
**Path:** `src/components/staff/NotificationListener.tsx` (NEW)

**Responsibilities:**
- Subscribe to the Supabase Broadcast channel `tc-staff-notifs` and listen for events `quote.created` and `order.paid`.
- On event: play `/sounds/ding.mp3` (single shared `HTMLAudioElement`), increment a counter in localStorage (`tc.notifBadge`), dispatch a CustomEvent so a header badge can re-render, show a sliding toast for 4 seconds with the event summary.
- Handle browser autoplay policy: if `audio.play()` rejects (tab in background, user hasn't interacted), swallow the error — Telegram still covers it.
- Auto-reconnect handled by Supabase client defaults; no custom retry logic.
- Mounts once per layout, deduped via a top-level ref.

**Public interface:** No props. Mount once in `src/app/staff/layout.tsx`.

**Dependencies:** `@supabase/ssr` browser client, browser `Audio()` API.

### 2. Staff layout update
**Path:** `src/app/staff/layout.tsx` (EDIT)

Add `<NotificationListener />` inside the layout body. The current layout returns `<>{children}</>` — change to `<><NotificationListener />{children}</>`.

### 3. Quote-request route — Broadcast + Telegram trigger
**Path:** `src/app/api/quote-request/route.ts` (EDIT, after the existing `quote_requests` insert near line 274 where `insertedId` is captured)

After successful insert:
1. Fire-and-forget `broadcastStaffNotification('quote.created', { id, name, email, summary })` (non-blocking).
2. Fire-and-forget `sendTelegramNotification(...)` (non-blocking).

Both wrapped in `.catch(() => {})`. Never block the response. Both swallow on failure — Telegram failing must not break Broadcast and vice versa.

### 4. Clover webhook — Broadcast + Telegram trigger
**Path:** `src/app/api/webhooks/clover/route.ts` (EDIT, inside the `status === "captured" || status === "paid"` branch, after the `.update({status:'payment_received'})...select()` returns `updatedOrders` with `length > 0`)

After the order is flipped:
1. Fire-and-forget `broadcastStaffNotification('order.paid', { id, order_number, total })` (non-blocking).
2. Fire-and-forget `sendTelegramNotification(...)` with order_number + total (non-blocking).

Only fires when `updatedOrders.length > 0` (i.e. an actual transition occurred; webhook retries on already-paid orders won't double-ping).

### 5. Telegram helper
**Path:** `src/lib/notifications/telegram.ts` (NEW)

Single exported function: `sendTelegramNotification(message: string): Promise<void>`. Uses `TRUE_COLOR_TELEGRAM_BOT_TOKEN` + `TRUE_COLOR_TELEGRAM_CHAT_ID` from `process.env`. Calls `https://api.telegram.org/bot{TOKEN}/sendMessage` with `parse_mode=HTML`. Returns void; throws on network error (callers swallow). 5-second timeout via `AbortSignal.timeout(5000)`.

### 6. Broadcast helper
**Path:** `src/lib/notifications/broadcast.ts` (NEW)

Single exported function: `broadcastStaffNotification(event: 'quote.created' | 'order.paid', payload: object): Promise<void>`. Uses `createServiceClient()` to get a server-side Supabase client, gets/creates the `tc-staff-notifs` channel, sends a `broadcast` event with type=`event` and the payload. Cleans up the channel after send. 5-second timeout. Swallows on failure (caller does too).

### 7. Sound asset
**Path:** `public/sounds/ding.mp3` (NEW)

Royalty-free notification ding, ~20KB, pleasant tone (not jarring). Source: pixabay/freesound under CC0. Sourced manually during implementation; checked into repo.

## Data flow — happy paths

### Quote request flow
1. Customer fills `/quote-request` form → `POST /api/quote-request`.
2. Route validates input, inserts into `quote_requests` via `createServiceClient()`. Existing behavior preserved.
3. New step: `sendTelegramNotification(...)` fired (non-blocking).
4. Supabase Realtime broadcasts INSERT to all subscribed clients.
5. Any open `/staff/*` tab plays ding + shows toast.

### Paid order flow
1. Customer pays via Clover hosted checkout.
2. Clover POSTs to `/api/webhooks/clover/route.ts`.
3. Route validates HMAC signature, updates `orders.status = 'payment_received'` filtered on `payment_reference=matchRef AND status=pending_payment`. Existing behavior preserved.
4. New step: if `updatedOrders.length > 0`, fire `sendTelegramNotification(...)` (non-blocking).
5. Supabase Realtime broadcasts UPDATE to subscribed clients filtering on `status=eq.payment_received`.
6. Any open `/staff/*` tab plays ding + shows toast.

## Failure modes

| Failure | Behavior |
|---|---|
| Browser blocks autoplay (tab backgrounded) | Audio play rejects silently; toast + badge still render; Telegram still fires |
| Broadcast channel drops | Client auto-reconnects; missed events not replayed (acceptable — Telegram is the durable channel) |
| Telegram API timeout / 5xx | Caught and logged via `console.error`; quote/order flow unaffected |
| `TRUE_COLOR_TELEGRAM_*` env vars missing | Helper short-circuits with `console.warn`; never throws |
| Multiple staff tabs open | All play ding simultaneously (acceptable for current scale of 1–3 staff) |
| Realtime row matches existing INSERT (e.g., staff manually inserts) | Ding fires anyway (acceptable — rare, low impact) |
| Clover webhook retries on already-paid order | Server-side guard: only emit broadcast + Telegram when the `UPDATE orders` returns `updatedOrders.length > 0` (i.e. a real transition from `pending_payment` to `payment_received`). |

## Duplicate fire prevention

Server-side: the Clover webhook only ever emits a broadcast/Telegram when the conditional UPDATE (`.eq('status', 'pending_payment')`) actually matches a row — Postgres returns zero rows on retry of an already-paid order, so the notification only fires once per transition. No client-side dedupe needed in the MVP.

## Security / privacy

- Telegram message body includes customer name + email + summary. Sensitive enough to keep within the existing single-recipient Hasan chat. Do NOT expand to a group channel without redacting PII first.
- The Supabase Realtime subscription requires the staff client to be authenticated; the existing `/staff` middleware already enforces this. No new auth surface.
- `public/sounds/ding.mp3` is publicly served, no leak risk.

## Configuration

Existing env vars (no new vars introduced):
- `TRUE_COLOR_TELEGRAM_BOT_TOKEN` — bot token (already in Railway prod env)
- `TRUE_COLOR_TELEGRAM_CHAT_ID` — Hasan's chat_id (already in Railway prod env)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — already used by existing Supabase client

## Testing

- **Unit:** `sendTelegramNotification` — mock fetch, assert body shape, assert silent failure on missing env vars.
- **Smoke (manual):** Submit a quote-request as anonymous user; confirm ding plays in another tab logged into `/staff` AND Telegram message arrives. Trigger Clover paid webhook via a real test transaction (Clover sandbox) OR via the existing `scripts/test-payment-flow.mjs`.
- **No e2e Playwright test** for the audio play (browser headless audio is unreliable). Manual verification is sufficient given the simple surface.

## Rollout

- Single deploy via Railway. **No schema migration** (no new tables/columns).
- **No RLS or replication changes.** Broadcast channels don't require Postgres replication or table-level RLS edits — server emits, client subscribes via the anon key + session JWT, broadcasts are scoped to the channel name only.
- If something misbehaves, the entire feature can be disabled by removing `<NotificationListener />` from `staff/layout.tsx` and commenting out the broadcast + Telegram calls in the two route files — zero blast radius beyond the new files.

## Files touched

| Path | Change | LOC est. |
|---|---|---|
| `src/components/staff/NotificationListener.tsx` | NEW | ~90 |
| `src/lib/notifications/telegram.ts` | NEW | ~30 |
| `src/lib/notifications/broadcast.ts` | NEW | ~25 |
| `src/app/staff/layout.tsx` | EDIT | +2 |
| `src/app/api/quote-request/route.ts` | EDIT | +6 |
| `src/app/api/webhooks/clover/route.ts` | EDIT | +6 |
| `public/sounds/ding.mp3` | NEW | binary, ~20KB |
| `src/lib/notifications/__tests__/telegram.test.ts` | NEW | ~50 |
| `src/lib/notifications/__tests__/broadcast.test.ts` | NEW | ~40 |

Total: ~250 LOC + 1 audio asset. Net-new surface: 3 source files + 2 test files. Edited surface: 3 files.

## Open follow-ups (not blocking ship)

- After 1–2 weeks of usage, decide: add quote-vs-order sound differentiation? Add mute toggle? Promote to a shop channel?
- Consider adding a small notifications log table if Hasan wants to see "what fired and when" historically.
