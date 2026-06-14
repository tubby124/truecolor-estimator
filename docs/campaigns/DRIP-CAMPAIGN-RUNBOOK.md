# True Color — Cold Drip Campaign Runbook

> **Single source of truth for launching B2B cold-email drip waves.**
> If you're about to email a niche, read this first. It encodes the proven
> method (Wave 1 + Wave 2 got ~30% engagement) so we never rebuild from memory.
> Last updated: 2026-06-13 (TC Wave 3 — Retail launch).

---

## TL;DR — the proven method

List-based Brevo **campaigns** (NOT automation, NOT transactional API), one per
step, scheduled by Brevo. Reply suppression + tracking are already automated.

| Setting | Value |
|---|---|
| Send channel | Brevo **marketing campaign** (`POST /v3/emailCampaigns`) — never transactional (ToS) |
| Sender | `hello@outreach.true-color.ca` (warmed subdomain) |
| Reply-to | `info@true-color.ca` (so the reply-scan catches replies) |
| Send slot | **8:00 AM Saskatoon** (`-06:00`, no DST), weekdays |
| Cadence | Day 0 / 7 / 14 / 30 / 45 |
| Naming | `TC Wave N — <Niche> Day <D>` |
| List | **Fresh list per wave** (never reuse — guarantees no re-mailing) |
| Plan | Brevo **FREE: 300 emails/day shared** with transactional/order mail |

## The daily send budget (the rule that prevents collisions)

300/day is shared across **everything** Brevo sends (cold drip + order
confirmations + receipts + review requests).

- **Reserve 50/day for transactional.** Cold-drip ceiling = **250/day.**
- A niche with ≤250 eligible leads = one whole-list campaign per step.
- A niche >250 = split across consecutive days via sub-lists (≤250 each).
- **One niche-step ~maxes a send-day.** Run parallel niches on DIFFERENT days.
  Keep the send calendar below current so two niches never double-book a day.

## Send calendar (KEEP CURRENT — every wave adds rows)

| Date | 8 AM send | Recipients | Wave |
|------|-----------|-----------|------|
| Mon Jun 15 | Retail Day 0 | 204 | TC Wave 3 |
| Mon Jun 22 | Retail Day 7 | 204 | TC Wave 3 |
| Mon Jun 29 | Retail Day 14 | 204 | TC Wave 3 |
| Wed Jul 15 | Retail Day 30 | 204 | TC Wave 3 |
| Thu Jul 30 | Retail Day 45 | 204 | TC Wave 3 |

> **Parallel sends:** Retail owns the 5 dates above (each ~maxes the 250 ceiling).
> Any parallel niche must send on the OTHER days. Before scheduling a new niche,
> add its dates here and confirm no day exceeds 250 combined.

---

## Lead lifecycle (already built — do not reinvent)

Source of truth = `tc_leads.drip_status` + `suppression_reason`
(`campaigns_enrolled` is retired). Encoded in `src/lib/blitz/process-replies.ts`.

| drip_status | suppression_reason | meaning |
|---|---|---|
| `queued` | — | eligible, not yet enrolled |
| `active` | — | in a wave |
| `completed` | — | finished, no reply |
| `paused` | `replied_warm` | replied interested → you reply by hand; re-drip in 90d |
| `unsubscribed` | `replied_decline` | "no thanks" (no blacklist) |
| `unsubscribed` | `replied_optout` / unsub-link | opt-out → Brevo blacklisted |
| `bounced` | — | hard bounce |

**Eligibility predicate (never email anyone else):**
`industry_tags @> '{<niche>}'` AND `email IS NOT NULL` AND `drip_status='queued'`
AND `suppression_reason IS NULL` AND `unsubscribed_at IS NULL`
AND `validation_status <> 'invalid'`.

## Automated infrastructure (already running — just verify)

- **Reply suppression:** `/api/cron/process-blitz-replies` (GitHub Action
  `.github/workflows/cron-blitz-replies.yml`, every ~2h). Scans `info@`, stops
  the drip for anyone who replies, blacklists opt-outs. Verify:
  `gh run list --workflow=cron-blitz-replies.yml --limit 3`
- **Open/click/unsub tracking:** Brevo webhook `/api/webhooks/brevo`.
- **Dashboard:** `/staff/social/blitz` — reads engagement **live from Brevo**,
  not the `tc_campaigns` counters (those are cosmetic/legacy).

---

## How to launch a new niche wave (step by step)

1. **Verify the reply-scan is green:** `gh run list --workflow=cron-blitz-replies.yml --limit 3`
2. **Write the copy** (5 emails) to `content/campaigns/<niche>/step{1..5}-*.html` + `.txt`
   and a `manifest.json` (`{step,file,subject,wait_days}`). Follow brand-voice +
   content-format rules (subject <50, plain-text fallback, one UTM'd CTA to the
   niche page, real prices per the $25-minimum comms rules, personal 1:1 voice).
3. **Run the pre-send gate:** `/true-color-campaign-presend-audit` (MANDATORY).
4. **Self-test:** create a draft campaign, `sendTest` to an inbox you control,
   confirm render + deliverability (cold marketing lands in Promotions — normal).
5. **Edit `scripts/blitz/launch-niche-wave.mjs` CONFIG** (niche, industryTag,
   waveName, listName, htmlDir, manifestPath, startDate). Pick a `startDate`
   whose 5 cadence dates don't collide with the send calendar above.
6. **Dry-run:** `node scripts/blitz/launch-niche-wave.mjs` — confirm eligible
   count + schedule.
7. **Execute:** `node scripts/blitz/launch-niche-wave.mjs --execute` — creates the
   fresh list, syncs contacts, schedules all 5 campaigns.
8. **Bookkeeping:** flip the cohort `queued→active`, insert a `tc_campaigns` row
   (`industry_target` is NOT NULL — always set it), add the dates to the send
   calendar above.
9. **Operate:** reply-scan runs itself; watch `/staff/social/blitz`; reply to
   warm leads from the `info@` inbox.

## 90-day re-drip (deferred)

`paused` / `replied_warm` non-converters become eligible for a NEW short sequence
(different hook) ~90 days later. Not built yet — Phase 2.

---

## Gotchas (learned the hard way — read before launching)

- **Free tier blocks the campaign `tag` field via API.** The `brevo-html-blitz`
  tag (which the webhook keys on for per-lead mirroring) must be added in the
  **Brevo UI** per campaign. Without it: unsubscribes are still enforced natively
  by Brevo, the reply-scan still works, and the dashboard still shows engagement
  (live read). Per-lead `engagement_state` mirroring just won't update. Non-blocking.
- **`totalSubscribers` on a list lags.** To get the real count use
  `GET /v3/contacts/lists/<id>/contacts` and read the `count` field.
- **Dirty email data exists.** Some `tc_leads.email` values are scrape junk
  (e.g. a Google Maps URL). FIXED 2026-06-13: `isEligible` now runs
  `isValidEmail()` (regex) so junk is excluded from the cohort upstream, not just
  rejected by Brevo at send. New niches reusing the predicate inherit this.
- **Cold marketing lands in Gmail Promotions, not Primary.** Expected. Don't
  chase Primary by stripping the unsubscribe/tracking links.
- **Brevo prefixes test sends with "TEST - ".** Search that, not the real subject,
  when looking for a `sendTest`.
- **Send FROM `hello@outreach`, not `info@`.** The outreach subdomain is the
  warmed sending identity (carries all transactional mail). Always set
  `replyTo: info@` so the reply-scan still catches replies.

## Key files

| File | Role |
|---|---|
| `scripts/blitz/launch-niche-wave.mjs` | The launcher (config block per niche) |
| `scripts/blitz/build-retail-cohort.mjs` | `isEligible` predicate (tested) |
| `content/campaigns/<niche>/` | Source-of-truth copy + manifest |
| `src/lib/blitz/process-replies.ts` | Reply classification + suppression |
| `src/app/api/webhooks/brevo/route.ts` | Open/click/unsub tracking |
| `src/app/staff/social/blitz/` | Dashboard |
| `docs/superpowers/specs/2026-06-13-truecolor-email-campaign-v2-design.md` | Design rationale |
