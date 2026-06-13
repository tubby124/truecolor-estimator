# True Color — Cold Email Campaign System v2 (Design Spec)

**Date:** 2026-06-13
**Owner:** Hasan Sharif
**Status:** Approved design — pending implementation plan
**Repo:** truecolor-estimator
**Supersedes:** the ad-hoc Batch 1 process (Construction + Healthcare, Feb–May 2026)

---

## 1. Objective

Push the untouched emailable lead pool (~3,400 leads) through the proven drip
sequence, one niche at a time, capped at **≤300 sends/day** (Brevo plan limit),
while **never re-emailing anyone who replied or unsubscribed**. Make the machine
**measurable** (real open/click/sent numbers) and **repeatable** (documented
runbook) so each wave gets smarter.

Non-goals (explicitly out of scope for v2):
- Lead enrichment to recover the ~6,150 leads with no email address.
- A new scraping run (current pool is sufficient for many months at 300/day).
- Re-designing landing pages (CTAs point at existing niche pages).

---

## 2. Current state (grounded baseline, measured 2026-06-13)

| Metric | Value | Source |
|---|---|---|
| Total leads | 10,537 | `tc_leads` |
| Leads with an email | 4,384 | `tc_leads.email not null` |
| Suppressed | 748 | `suppression_reason not null` |
| Unsubscribed | 7 | `unsubscribed_at not null` |
| **Emailable pool** | **~3,600** | derived |
| Ever emailed (unique) | ~250 | `last_email_sent_at not null` = 226 |
| Real sends logged | 432 | `tc_email_sends` (Mar 16 → May 4) |
| Engagement | 102 clicked + 26 opened = ~30% | `tc_email_sends.status` |
| Last send | 2026-05-04 | `tc_email_sends` |

**Niches that actually ran:** Construction (list 12) + Healthcare (list 14),
via the Brevo HTML track. Agriculture was a 5-send n8n canary.

### What Batch 1 taught us
1. **Copy + offer convert** (~30% engaged, 23.6% click on cold B2B). Reuse the
   structure; do not start copy from scratch.
2. **The engine that worked = Brevo HTML campaigns to per-niche lists.** The
   fully-automated n8n drip was only ever used for the agriculture canary.
3. **Unsubscribes already auto-suppress** via the Brevo webhook
   (`/api/webhooks/brevo` → `drip_status='unsubscribed'`, `next_email_at=null`).
4. **Gaps v2 must close:**
   - Replies did not stop the drip (Brevo is blind to replies).
   - Warm leads had nowhere to live (no `replied_warm` state, no re-drip path).
   - Campaign-level tracking is unreliable (`tc_campaigns` claims ~3,830 sent /
     0 opens / 0 clicks — does not reconcile with the 432-row send log).
   - Only ~250 of ~3,600 emailable leads have ever been contacted.

---

## 3. Architecture

### 3.1 Send engine — phased

**Brevo plan is confirmed FREE: 300 emails/day shared across marketing +
transactional** (verified via `GET /v3/account` on 2026-06-13). Free-tier
automation is too limited / not API-drivable, so we never build the drip on
Brevo Automation.

**Phase 1 (now) — Brevo's own scheduler, zero new send-code.**
Build the retail drip as a small number of HTML campaigns in Brevo, each
**pre-scheduled** for its send date to the retail list (split into ≤300-recipient
chunks for the daily cap). Brevo fires them on schedule. This is the exact
engine that produced Batch 1's 30% engagement, plus Brevo's free scheduler =
"batch scheduled" with no custom code. Campaigns carry the `brevo-html-blitz`
tag so the **existing webhook** (`/api/webhooks/brevo`) tracks opens/clicks/
unsub, and the **existing reply-scan** (§3.3) keeps the list clean between steps.

**Phase 2 (after retail validates) — app-driven daily send cron.**
Once we know fresh-niche copy converts and the manual pain points are concrete,
build the daily send loop: reply-scan → select ≤300 due `queued` leads (cadence
from `tc_email_templates.wait_days`) → send via Brevo's **marketing/campaign**
channel (never transactional — ToS) → log `tc_email_sends` + advance
`drip_step`. At that point re-evaluate the $9/mo Brevo Starter tier to lift the
300/day cap. This is the long-term "smart system"; it is **deliberately
deferred** so we don't automate before product-market fit on the copy.

> **ToS guardrail (both phases):** cold bulk outreach goes through Brevo's
> marketing/campaign channel only. Cold mail via the transactional API risks
> account suspension.

### 3.2 Lead lifecycle — single source of truth = `drip_status`
`campaigns_enrolled` was never populated and is **retired** as a dedup signal.

**EXISTING convention (do not invent new values)** — encoded in
`src/lib/blitz/process-replies.ts`:

| drip_status | suppression_reason | meaning | drip action |
|---|---|---|---|
| `queued` | — | eligible, not yet enrolled | can enroll |
| `active` | — | currently in a sequence | sending |
| `completed` | — | finished sequence, no reply | done; eligible for seasonal |
| `paused` | `replied_warm` | replied interested → you reply by hand from info@; re-drip in 90d | **suppress** |
| `unsubscribed` | `replied_decline` | said "no thanks" (no blacklist) | **suppress** |
| `unsubscribed` | `replied_optout` / unsub-link | opt-out → Brevo blacklist | **permanent suppress** |
| `bounced` | — | hard bounce | **suppress** |

**Enrollment rule (enforced before every send/enroll):** only `queued` leads
with a valid, non-suppressed email — never `paused`/`unsubscribed`/`bounced`.

### 3.3 Daily reply-catcher — ALREADY BUILT ✓
This exists in production and matches the design. **No build needed — verify
it's running and extend dictionaries if needed.**
- Cron route: `src/app/api/cron/process-blitz-replies/route.ts`
- Logic: `src/lib/blitz/process-replies.ts` (+ `classify-reply.ts`, `gmail-replies.ts`)
- Schedule: `.github/workflows/cron-blitz-replies.yml`
- Behaviour: scans `info@true-color.ca`, classifies reply/decline/optout, sets
  `drip_status` + `suppression_reason` per §3.2, blacklists opt-outs in Brevo,
  Telegram-alerts warm replies. Idempotent overlap; `?dryRun=1` supported.

### 3.4 Tracking — mostly already handled ✓
The `/staff/social/blitz` dashboard (`getData()`) already pulls **live** Brevo
campaign open/click stats directly from the Brevo API, so engagement is already
visible and does NOT depend on the stale `tc_campaigns` counters. v2 only needs:
- One `tc_campaigns` row per new wave (so the wave is named/tracked in the table).
- Per-lead engagement continues via the existing Brevo webhook → `tc_leads`.
- Document `drip_status` as the dedup source of truth (retire `campaigns_enrolled`).

> The "~3,830 sent / 0 opens" weirdness in `tc_campaigns` is cosmetic legacy
> data; the dashboard routes around it. Optional cleanup, not a blocker.

### 3.6 Pre-send gate (MANDATORY)
Before any batch of Brevo campaigns is created or scheduled, run
**`/true-color-campaign-presend-audit`** (checks images, CTA links, subject
merge tags, pricing). This is a hard project gate. Email copy must also pass the
brand-voice + content-format rules (subject <50 chars, plain-text fallback,
UTM'd `truecolorprinting.ca` links — never a Railway/Vercel URL, real prices per
the $25 order-minimum comms rules).

### 3.5 Content workstream
Clone the proven sequence **structure** into per-niche copy:
- 5–7 steps over ~90 days (model on construction/healthcare/agriculture).
- Niche-relevant hooks + proven offers (e.g. "250 cards for $45").
- CTA → the niche's existing landing page.
- Stored as Brevo templates; tracked in `tc_email_templates`.
- Built via the `true-color-campaign` / copywriting skills.

> Note: fresh niches (retail, restaurants, salon, etc.) currently have **zero**
> templates. Only agriculture (12-step), construction (7), healthcare (9) exist,
> and construction/healthcare copy lives in Brevo HTML templates, not Supabase.

---

## 4. Rollout

**Wave 1 — Retail** (908 leads, priority-1, live landing page): run end-to-end
as the proof-of-system AND first revenue. Validate the full cycle:
send → daily reply-scan → suppression → real tracking on the dashboard.

**Then fan out**, same process, staggered under 300/day:
restaurants (416) → salon (353) → school (302) → non-profit (391) →
church (256) → hotel (242) → daycare (231) → agriculture remainder.

90-day re-drip: `replied_warm` non-converters re-enter a NEW short sequence
(different hook/season, not the same emails) after ~90 days.

---

## 5. Verification / definition of done (per wave)

- [x] Brevo plan confirmed FREE, 300/day shared cap (verified 2026-06-13).
- [ ] Daily send cron sends via Brevo marketing/campaign API (never transactional).
- [ ] Tracking backfill makes `tc_campaigns` reconcile with `tc_email_sends`.
- [ ] Reply-scan dry-run correctly classifies a known remove + warm reply.
- [ ] Webhook tags confirmed on every niche template (`brevo-html-blitz`).
- [ ] Small test batch (e.g. 20 leads) sends + tracks before the niche goes full.
- [ ] No lead in `unsubscribed`/`bounced`/`replied_warm` ever receives a send.
- [ ] Dashboard `/staff/social/blitz` shows true open/click numbers for the wave.

---

## 6. Open items for the implementation plan
- Host for the daily cron (app cron route in truecolor-estimator vs cloud
  routine). The reply-scan + send loop should share the same host.
- Confirm `/v3/emailCampaigns` send-now/schedule works cleanly on free tier;
  if not, use the §3.1 zero-code fallback (sync due cohort into a list + send
  a pre-built HTML campaign).
- Migration: add `replied_warm` to the `drip_status` allowed values + any
  CHECK constraint; retire `campaigns_enrolled` from dedup logic.
- Exact niche copy generation pipeline + review gate before send.
- Daily send budget split: at 300/day shared, decide reserve for transactional
  order/receipt mail vs the cold drip (e.g. cap drip at ~250/day).
