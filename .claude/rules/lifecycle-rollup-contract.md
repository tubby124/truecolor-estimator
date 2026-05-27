# Lifecycle Rollup Contract — How to Add a Silent-Fail Signal

The `/staff/lifecycle` dashboard tile AND the hourly Telegram alerts both
read from ONE function: `buildRollup` in `src/lib/lifecycle/rollup.ts`.

**Rule:** When you add any check that detects a silent failure — a stuck
order, an unrecorded payment, a webhook that stopped firing, a cron
that's returning errors — register it in `buildRollup`. Do not add inline
Telegram calls at the failure site. Do not add a panel-only check.

## Why

- **No drift.** Dashboard and alerts share the same rule set — impossible
  for one to say RED while the other says green.
- **No spam.** The cron at `/api/cron/dashboard-alerts` dedups by `key`
  with a 6-hour cooldown. Inline Telegram calls bypass this and produce
  notification storms.
- **No silent regressions.** If you forget to register a new check, it
  shows up nowhere. That forces the registration habit instead of
  letting the dashboard get out of sync with reality.

## How to add a new signal

1. **Define the input** the signal needs. Add it to `RollupInputs` in
   `src/lib/lifecycle/rollup.ts`. Pass numbers, arrays, or pre-computed
   row counts — not raw Supabase clients.
2. **Push a `RollupIssue`** into `reds` or `yellows` inside `buildRollup`.
   Required fields:
   - `key` — stable across ticks; used by Telegram dedup
   - `panel` — anchor id on `/staff/lifecycle` (must match an `id="panel-X"`
     wrapper in `src/app/staff/lifecycle/page.tsx`)
   - `label` — short, human-readable; shown as both the dashboard chip
     and the Telegram subject line
3. **Wire the input** in `src/app/staff/lifecycle/data.ts`. Pass the value
   into the `buildRollup({...})` call. The cron picks it up for free —
   it imports `fetchLifecycleData()` and reads the same rollup.
4. **Add the anchor wrapper** if your `panel` id is new. Wrap the panel
   render in `page.tsx` with `<div id="panel-X" className="scroll-mt-20">`
   so the chip's href scrolls to it.

## Severity

- `reds` = broken now. Telegram fires. Dashboard tile goes red.
- `yellows` = watch list. Dashboard only. No Telegram.

If you're unsure: yellow first. Bump to red after one confirmed incident
where silence cost real money.

## What NOT to do

- ❌ Add `sendTelegramNotification()` inline in an API route to report a
  silent-fail surface. Use `recordAuditEvent` instead — let the daily
  digest cron + dashboard rollup surface it.
- ❌ Add a panel-only check that the rollup doesn't know about. The user
  has to open the dashboard to see it; the whole point of the rollup is
  push notification on red.
- ❌ Hardcode panel anchor ids in alert templates. Always reference
  `RollupIssue.panel`.

## Files

- `src/lib/lifecycle/rollup.ts` — pure builder + types
- `src/app/staff/lifecycle/data.ts` — assembles inputs for the dashboard
- `src/app/staff/lifecycle/StatusRollupPanel.tsx` — renders the tile
- `src/app/staff/lifecycle/page.tsx` — owns the `id="panel-X"` anchors
- `src/app/api/cron/dashboard-alerts/route.ts` — hourly Telegram push +
  cooldown + cleared-state notifications
- `dashboard_alert_state` table — state store, rows keyed `rollup:<key>`
