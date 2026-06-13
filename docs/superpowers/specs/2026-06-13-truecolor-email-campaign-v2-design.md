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

### 3.1 Send engine — app-driven daily send cron + Brevo campaign API

**Brevo plan is confirmed FREE: 300 emails/day shared across marketing +
transactional** (verified via `GET /v3/account` on 2026-06-13). Free-tier
marketing automation is too limited and is not API-drivable, so we do **not**
build the drip on Brevo Automation. Instead, all drip logic lives in our app.

A daily cron (in `truecolor-estimator`) runs each morning in this order:
1. **Reply-scan** (§3.3) → update `drip_status` suppression first.
2. **Select ≤300 due leads:** `drip_status='queued'` AND next step is due
   (cadence from `tc_email_templates.wait_days` vs `last_email_sent_at`) AND
   email valid + not suppressed.
3. **Send the due step** through Brevo's **marketing/campaign** channel
   (`/v3/emailCampaigns` or campaign-to-list), NOT the transactional API.
4. **Log + advance:** write `tc_email_sends`, bump `drip_step`, set
   `next_email_at`, flip `drip_status` `queued→active`, `active→completed` on
   the final step.

Cadence + suppression live entirely in **our Supabase**, not in a Brevo feature
we don't have. The 300/day cap is enforced by the batch size. We keep the
**existing Brevo webhook** (`/api/webhooks/brevo`) for open/click/unsub/bounce →
Supabase. **No n8n, no VPS dependency.**

> **ToS guardrail (load-bearing):** cold bulk outreach MUST go through Brevo's
> marketing/campaign channel. Sending cold mail via the transactional API risks
> account suspension. Batch 1 already used the marketing channel (HTML
> campaigns), so this stays on the proven, compliant path.

> **Zero-code fallback:** if the campaign-send-via-API path proves awkward on
> free tier, fall back to the Batch 1 method — our cron computes the daily due
> cohort and syncs it into a Brevo list; Hasan (or a scheduled step) sends a
> pre-built HTML campaign to that list. Same compliant channel, more manual.

### 3.2 Lead lifecycle — single source of truth = `drip_status`
`campaigns_enrolled` was never populated and is **retired** as a dedup signal.

| state | meaning | drip action |
|---|---|---|
| `queued` | eligible, not yet enrolled | can enroll |
| `active` | in a Brevo workflow | sending |
| `completed` | finished sequence, no reply | done; eligible for future seasonal |
| `replied_warm` | replied with interest | **paused**; Hasan replies manually; re-drip in 90 days |
| `unsubscribed` | unsub link OR "not interested/remove" reply | **permanent suppress** |
| `bounced` | hard bounce | **suppress** |

**Enrollment rule (enforced before every send/enroll):** only `queued` leads
with a valid, non-suppressed email. Never `unsubscribed`, `bounced`, or
`replied_warm`.

### 3.3 Daily reply-catcher (automated)
A scheduled job runs the `/tc-campaign-cleanup` logic each morning **before**
sends:
1. Scan `info@true-color.ca` inbox for replies (last N days).
2. Classify **remove** vs **warm** (existing keyword dictionaries).
3. **Remove** → blacklist in Brevo + `drip_status='unsubscribed'`.
4. **Warm** → `drip_status='replied_warm'`, pull from the Brevo workflow, log.
   Hasan replies to warm leads manually from his inbox (already his workflow —
   warm replies land in info@ natively).

**Host:** cloud routine (`/schedule`) or an app cron route. **Not** Mac launchd
(TCC-blocked from reading Downloads/Gmail context as of 2026-06-13). Decided in
the implementation plan.

### 3.4 Tracking fix (built FIRST, before any new sends)
- Backfill `tc_campaigns` aggregates (`total_sent`, `opens`, `clicks`,
  `total_bounced`) from the real `tc_email_sends` + webhook data.
- Wire the campaign counters so `/staff/social/blitz` shows true engagement.
- Document `drip_status` as the dedup source of truth.

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
