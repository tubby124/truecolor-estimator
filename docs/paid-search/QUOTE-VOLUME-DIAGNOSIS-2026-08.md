# Quote Volume Diagnosis — August 2026

**As of:** 2026-08-11, 16:30 America/Regina  
**Scope:** Read-only diagnosis. No production data, code, SEO page, campaign, or advertising-account changes were made.

## Executive diagnosis

The immediate cause of the quote-volume collapse is **lower traffic/distribution into the quote flow**, not a newly introduced late-July submit failure.

- The original audit snapshot was correct at **18 quote requests from July 14–31 versus 2 from August 1–10**. A third August request arrived on August 11 at 14:31 local, so the refreshed August 1–11 count is **3**.
- GA4 `/quote` pageviews moved in the same direction: **32 from July 14–31 versus 4 from August 1–10**, then 2 more on August 11. On a per-day basis through August 10, quote requests fell 80% and `/quote` pageviews fell 77.5%.
- The August 11 semantic-form fix removes real mobile friction, but the relevant architecture dates to March 13, not late July. It cannot explain a sudden August 1 cliff.
- Retail Day 45 sent on July 30, immediately before 7 quote requests on July 30–31. The next cold-drip step did not send until School Day 0 on August 11. This makes the distribution gap a credible contributor, but not a proven cause: none of the July 30–31 or August quote rows carried Brevo UTM attribution.
- Sitewide non-blog GSC demand was nearly flat per day between July 14–31 and August 1–8: impressions fell about 1.2% and clicks about 10.9%. A general organic-demand or seasonal collapse therefore does not fit the observed 70–80% quote decline.

**Disposition:** traffic/distribution loss is accepted as the proximate cause. The drip-calendar gap is the leading upstream explanation but remains correlational. The form bug and normal seasonality are possible contributors, not the primary cause of the date-specific cliff.

## Evidence by hypothesis

### 1. `/quote` submit bug

**Disposition: rejected as the August cliff trigger; accepted as pre-existing mobile friction.**

`git log -p --follow src/app/quote/page.tsx` shows:

- **2026-03-13 — `77c8131`:** the multi-item quote form was introduced without a semantic `<form>`. Submission used a `type="button"` with `onClick={handleSubmit}`. Valid inputs could submit, but invalid-input errors rendered elsewhere on the long page; on mobile, a tap could appear to do nothing because the user was not moved to the error.
- **2026-07-24 — `5d79c26`:** Turnstile gating and idempotent submission were added. The existing button/on-click structure remained. This commit did not introduce the no-form architecture.
- **2026-08-10 — `f698666`:** attribution hints were added to the existing submit path; submission mechanics were unchanged.
- **2026-08-11 — `68eea15`:** the page gained a real `<form onSubmit>`, a submit button, native required attributes, and scroll/focus to the first invalid field.

The defect existed for roughly five months, including the strong July period. It may have suppressed mobile completion throughout that period, and the August 11 fix should improve recovery, but the timing rejects it as the sole or primary explanation for the August 1 break.

### 2. Brevo drip-campaign calendar

**Disposition: accepted as a plausible major distribution contributor; causality unproven.**

The runbook and live Brevo readback agree on the relevant sends:

| Send | Live sent time (America/Regina) | Quote requests on send day / following day |
|---|---:|---:|
| Retail Day 30 | Jul 15, 08:03 | 1 on Jul 15; 1 on Jul 17 |
| Retail Day 45 | Jul 30, 08:16 | 3 on Jul 30; 4 on Jul 31 |
| School Day 0 | Aug 11, 08:05 | 1 on Aug 11 by 14:31 |

There was an **11-day gap** from Retail Day 45 to School Day 0. Seven of the 18 July 14–31 quote requests arrived on July 30–31, immediately after the last retail send.

Limits on the inference:

- All seven July 30–31 rows and all three August rows have `utm_source`, `utm_medium`, and `utm_campaign` blank, except one July 31 row attributed to `chatgpt.com`. None is directly attributable to Brevo.
- `tc_email_sends` contains no rows from July 1–August 11. It is not a reliable record of the list-based marketing sends.
- `tc_campaigns` is cohort-level legacy bookkeeping, not a send calendar; its School row is stale relative to live Brevo. The runbook explicitly says the dashboard reads Brevo live rather than these counters.

The temporal match is strong enough to retain as the leading upstream hypothesis, but not strong enough to claim that the emails caused the quote spike.

### 3. Traffic versus conversion

**Disposition: traffic decline accepted; conversion-rate collapse not demonstrated.**

| Window | Days | `/quote` GA4 pageviews | Pageviews/day | `quote_requests` | Requests/day |
|---|---:|---:|---:|---:|---:|
| Jul 14–31 | 18 | 32 | 1.78 | 18 | 1.00 |
| Aug 1–10 | 10 | 4 | 0.40 | 2 | 0.20 |
| Aug 1–11 | 11 | 6 | 0.55 | 3 | 0.27 |

Through August 10, pageviews and requests fell by almost the same proportion. This is the opposite of a flat-traffic/failed-submit pattern.

GA4 landing-session data also fell from 9 `/quote` landing sessions in July 14–31 (4 Direct, 5 Organic Search) to 1 in August 1–11 (Organic Search). The GA4 counts are small and do not form a clean conversion-rate denominator: `quote_requests` can originate from multiple forms, and GA4 can be blocked. They are still directionally decisive because the traffic and database series fell together.

GSC supplies a useful control:

| Window | Non-blog impressions/day | Non-blog clicks/day | `/quote` organic result |
|---|---:|---:|---:|
| Jul 14–31 | 731.9 | 11.50 | 3 impressions, 0 clicks |
| Aug 1–8* | 723.4 | 10.25 | no reported row |

\* August 8 is the latest complete date used because GSC has a normal 2–3 day lag.

Sitewide organic visibility did not collapse. Direct organic discovery of `/quote` was negligible in both windows, so the missing traffic is more likely downstream distribution/navigation or campaign-driven demand than loss of `/quote` rankings.

### 4. Seasonality

**Disposition: plausible background factor; rejected as a sufficient explanation.**

July event demand and an early-August lull are commercially plausible, but there is no prior-year quote baseline because the current form launched in March 2026. More importantly, sitewide non-blog GSC impressions per day were essentially flat and clicks per day declined only about 11%, while quote traffic and submissions fell roughly 70–80%. Seasonality may lower intent at the margin, but the available data does not support using it to explain away the collapse.

## Recovery-verification plan

No code or account change is required for this plan.

1. **August 12:** record the first full post-fix day of `quote_requests` and `/quote` GA4 pageviews, split pageviews by device. Do not interpret August 11 as a full recovery day.
2. **Daily August 12–17:** record database request count, `/quote` pageviews, landing sessions by channel, and non-PII UTM fields. Flag delivery errors separately so a saved quote is not misclassified as a failed submit.
3. **August 18:** mark School Day 7's live Brevo send time and compare the following 48 hours with the July 30–31 pattern. Treat only `utm_source=brevo` / `utm_campaign=school-drip-2026-08` as direct campaign attribution.
4. **August 19:** compare the first seven full post-fix days with the July 14–31 baseline. Recovery gates:
   - `/quote` pageviews at or above **0.89/day** (50% of the July baseline);
   - `quote_requests` at or above **0.50/day** (50% of the July baseline);
   - no renewed mobile-only divergence.
5. **August 25–27:** repeat after School Day 14. If traffic recovers but requests do not, reopen the form/UX hypothesis with device-level testing. If neither recovers, investigate internal CTA paths and distribution sources before changing the form again.

## Decision boundary

This memo does not authorize another quote-page change, a campaign change, or an advertising-account mutation. The next action is observation through the dated recovery gates. Any remediation should be shown to Hasan after the failing layer is demonstrated.
