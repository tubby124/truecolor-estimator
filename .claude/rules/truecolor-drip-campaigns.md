# True Color — Cold Drip Campaign Rule

**Before launching, scheduling, or editing ANY B2B cold-email drip campaign,
read the full runbook:** `docs/campaigns/DRIP-CAMPAIGN-RUNBOOK.md`.
It encodes the proven method (Wave 1+2 ≈ 30% engagement). Do not improvise a new
send mechanism — the system already exists.

## Non-negotiables (the runbook has the rest)

- **Channel:** Brevo **marketing campaign** API only. NEVER the transactional API
  for cold mail (ToS = account suspension risk).
- **Sender** `hello@outreach.true-color.ca` · **reply-to** `info@true-color.ca`
  (reply-to MUST be info@ so the reply-scan catches replies).
- **300/day is SHARED** with order/receipt mail. Cold-drip ceiling = **250/day**,
  50 reserved for transactional. One niche-step ~maxes a day → parallel niches go
  on OTHER days. Keep the send calendar in the runbook current.
- **Fresh Brevo list per wave.** Never reuse a list (re-mails people).
- **Eligibility:** only `drip_status='queued'` + has email + not suppressed +
  not unsubscribed + `validation_status<>'invalid'`. Same predicate as
  `scripts/blitz/build-retail-cohort.js isEligible`.
- **Pre-send gate:** `/true-color-campaign-presend-audit` is MANDATORY before any
  campaign is scheduled.
- **Reply suppression + tracking are already automated** (`process-blitz-replies`
  cron + Brevo webhook). Verify the cron is green; don't rebuild it.

## Launch tool

`scripts/blitz/launch-niche-wave.mjs` — edit the CONFIG block per niche, dry-run,
then `--execute`. Cadence Day 0/7/14/30/45, 8 AM Saskatoon, naming
`TC Wave N — <Niche> Day <D>`.
