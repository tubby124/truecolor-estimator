# True Color search-growth operating plan

**Prepared:** September 14, 2026<br>
**Status:** ready for the Day 0 decisions below; the 90-day measurement clock has **not** started<br>
**Goal:** build a trustworthy weekly loop that can move True Color toward first place in Google Maps without guessing what caused a change<br>
**Authority:** this plan implements the current [SEO operating standard](../operations/SEO-STANDARD.md), [September 14 baseline](LOCAL-SEARCH-BASELINE-20260914.md), and [search-skill consolidation](SEO-SKILL-CONSOLIDATION-20260914.md). Fresh provider evidence overrides this dated plan when the two disagree.

This is an operating plan, not permission to edit the website or a Google account. It does not authorize a page, image, schema, sitemap, crawler, GBP, directory, Analytics, Merchant, campaign, spend, review-request, or publishing change.

## ELI12: how the loop works

Think of this as a scoreboard, not a slot machine:

1. Freeze one fair way to measure Maps.
2. Take the same measurements once a week for four weeks.
3. Keep Maps, Search Console, Business Profile, Analytics, citations, Merchant, and real orders in separate rows.
4. Fix missing or bad evidence as soon as it is found, but do not change SEO every day.
5. After enough evidence, choose **one** improvement, measure it, and keep, adjust, or stop it.

A daily check answers, “Did the instruments work?” The weekly review answers, “What changed?” A 14-day decision answers, “Did our one controlled action help?” None of those answers automatically proves a sale.

## What winning means

The long-term business objective is stronger qualified local visibility and more source-supported work. The 90-day Maps target is deliberately hard:

- queries: `print shop saskatoon`, `banner printing saskatoon`, and `sticker printing saskatoon`;
- method: the same neutral 5x5 grid, 1 km spacing, accepted centre, collector, result depth, account state, and collection slot;
- target: True Color is #1 at **15 or more of 25 points for every query** in **four consecutive valid weekly scans**.

A valid observed absence counts as not first. A failed or ambiguous point invalidates that query's scan and must be repeated with the same method; it is never entered as rank zero. Improvement can be reported before the target is met, but cannot be relabelled “#1 across Saskatoon.”

## Day 0 gate: freeze the ruler before measuring

The lead records these choices and the validation result in a new `SG-YYYY-D0` acceptance entry in the weekly log. The series starts only when every row is complete and the validation passes.

| Decision | Recommended default | Acceptance evidence | Owner |
|---|---|---|---|
| Maps collector | After owner acceptance of signup and terms, validate [Whitespark Local Ranking Grids](https://whitespark.ca/local-ranking-grids/) with its 200 free credits. Before every attempt, read the actual balance and do not start unless it funds the full run; any paid continuation is separately accepted. Do not create an account, run a scan, buy, or subscribe from this plan. | Collector/version, terms and price readback, sample export, actual credit use/balance, and cancellation terms. | Hasan accepts signup/trial and any paid continuation; lead prepares and runs only the accepted method. |
| Grid centre | Use the verified GBP map pin or another explicitly accepted Saskatoon service-core point. Do not silently reuse the September 14 signed-in browser centre. | Exact latitude/longitude and why this is the accepted centre. | Hasan. |
| Grid geometry | 5x5, 1 km spacing. | Screenshot/export settings and 25 returned points per query. | Lead. |
| Search method | Fixed Maps/local-finder surface, locale, device, zoom if exposed, result depth, and neutral/non-personalized state. | Method card stored with the private raw receipt; sanitized method version in Git. | Lead. |
| Weekly slot | Tuesday at 10:00 `America/Regina`, unless changed before the first scan. | Timestamp on every scan. Once scan one runs, changing the slot starts a new series. | Lead. |
| Baseline schedule | A 25-credit, one-query method validation on Day 0; it never counts as baseline. Then four baseline scans on Days 7, 14, 21, and 28 after acceptance. | Validation export passes, followed by four comparable baseline scan IDs with 75 valid observations each. | Lead. |
| Evidence centre | Git is the shared source of truth; the private Vault stores raw exports/screenshots and points back to the merged Git revision. | Git links plus a private evidence label; no account URLs, customer identities, or raw order data in public Git. | Lead. |

If the chosen collector cannot export every point, query, rank/absence, competitor pack, coordinates, timestamp, and settings, it does not pass Day 0.

### Collector decision record

Current official vendor pages were checked on September 14, 2026. Prices and product limits can change, so they must be read back before account or payment action.

| Option | Current official offer | Fit for 75 observations per run | Decision |
|---|---|---|---|
| [Whitespark Local Ranking Grids](https://whitespark.ca/local-ranking-grids/) | 200 free credits without a card; paid entry shown as US$10/month for 2,000 credits. One point/keyword uses one credit. | A 5x5 grid across three keywords should use 75 credits. It provides weekly scheduling plus CSV/PDF export, but exact 1 km semantics and point-level export must be verified in the UI. | **Recommended validation path.** No-spend first; paid continuation only after a complete export passes. |
| [Local Falcon](https://www.localfalcon.com/pricing) | 100 free credits; Starter shown as US$24.99/month for 7,500 credits; pay-as-you-go shown as US$0.05/credit. | Supports adjustable grids/centres, recurring campaigns, and exports. | Capable but more than this baseline needs; API eligibility wording also needs direct verification. |
| [DataForSEO Maps SERP API](https://dataforseo.com/apis/serp-api) | Standard tasks shown as US$0.0006 each, with a US$1 trial credit and a later US$50 minimum top-up. | Approximately US$0.045 for 75 tasks, with exact coordinates and structured results. | Best later automation candidate, not Day 0: it requires credentials, terms/storage review, and code to create the tracker/history. |
| Manual Google Maps | No direct tool cost. | Requires 75 individual searches and is affected by login, device, IP, language, time, and personalization. | Reject for the official series; retain only as directional reconnaissance. |

The Day 0 validation uses one exact query across the final 25-point grid, so it should consume 25 credits and prove the point layout, distance meaning, result depth, identity, and export fields. It never counts as a baseline scan. The four-scan series then requires 300 credits. With no retries, the 200-credit allowance covers validation plus the first two 75-credit scans and leaves 25, so paid continuation would be needed before baseline scan three. Retries can move that point earlier: before every 25- or 75-credit attempt, read the actual balance and do not start unless it funds the whole attempt. A non-qualifying validation is rerun only after its failure is recorded. Switching collector mid-series starts a new baseline.

## Ninety-day plan

| Period | Work | What counts as done |
|---|---|---|
| Day 0 | Accept signup/trial terms, collector, cost path, centre, method card, weekly slot, owner, and evidence location. Run the 25-point one-query validation. Refresh the current Wall Graphics and Merchant gates as separate facts. | Every Day 0 field is recorded and the validation export passes; no unresolved setting is hidden behind “same as last time.” |
| Days 1–28 | Run four fixed weekly Maps scans. At each weekly review, add finalized GSC Web, GSC Generative AI, comparable GBP, GA4, citation, Merchant, and source-supported commercial observations as separate lanes. | Four valid Maps scans, each with 75 observations; report filters/dates are reproducible; citations have direct-page status. |
| Days 29–42 | Review the four-scan baseline. Close factual identity gaps. Either select one bounded action or explicitly continue observation. | One written decision with hypothesis, evidence, scope, owner, approval class, expected signal, guardrails, and review date. |
| Days 43–90 | Keep the ruler unchanged. Review the one action after its observation window. Start another action only after the prior verdict is recorded. | Day-90 report gives actual results and limits. It says “not achieved” if the four-consecutive-scan target is not met. |

The old date on a proposal is not an automatic green light. Wall Graphics stays the active organic experiment until its actual release evidence and finalized post-release comparison produce a written positive, negative, or inconclusive verdict. Merchant stays the highest-priority Google-growth program, but approval, serving, feed health, inventory, price, cart, tax, consent, fulfilment, and attribution remain separate gates.

## Exact operating cadence

### Daily: five-minute exception check

- Did an expected collector/provider/report update fail, expire, or become overdue?
- Is a real Merchant problem newly reported?
- Is there new source-supported quote/order evidence that belongs in the private evidence store?
- If nothing material happened, record nothing or “no exception”; do not interpret rank noise or launch work.

Daily checking does **not** mean daily SEO edits.

### Weekly: one combined scorecard review

1. Run the fixed-grid Maps collection.
2. Use completed/finalized comparison windows for GSC Web, GSC Generative AI, GBP, and GA4.
3. Recheck only citations that are due, pending, inaccessible, or correction candidates by opening the direct listing.
4. Refresh Merchant approval and serving separately when relevant.
5. Add source-supported qualified quotes, paid orders, and revenue only when the evidence exists.
6. Append one immutable entry to [the weekly log](SEARCH-GROWTH-WEEKLY-LOG.md).
7. Choose no more than three next actions. “No material change; keep measuring” is a valid result.

Always append the weekly review even when Maps collection fails. Mark only that Maps scan invalid/non-comparable, preserve its error receipt, and continue recording the other lanes. The scan joins the baseline only after all 75 point/query observations pass.

### Fixed comparison-window rules

| Lane | Repeatable window |
|---|---|
| Maps | Accepted Tuesday 10:00 America/Regina slot; record actual start/end time. If a retry moves outside the accepted window, mark it and explain comparability. |
| GSC Web | Latest date the source identifies as finalized, counting back 28 days inclusive, versus the immediately preceding non-overlapping 28 days; `type=web`. Record the dates and pagination completeness. |
| GSC Generative AI | The report's latest available 28-day current period versus its immediately preceding 28-day period. Record the exact interface dates, inclusion setting, and rounding; do not add these impressions to Web totals. |
| GBP | Most recent 28 completed local dates returned consistently by the source versus the prior non-overlapping 28. If the source supplies a partial/missing date, mark the period incomplete rather than silently shortening it. |
| GA4 | Latest 28 completed `America/Regina` property days, excluding today, versus the prior non-overlapping 28. Preserve the original acquisition report beside the same-date analysis-only staff/social exclusion. |
| Commercial | New source-supported qualified quotes, paid orders, and revenue since the prior completed weekly review; add a rolling 28-day context only when the same source definition is retained. Unknown attribution stays unknown. |
| Citations / Merchant | Point-in-time direct/provider snapshot with collection timestamp and prior comparable snapshot; these are not forced into an invented 28-day total. |

### Every 14 completed days: decision review

Classify the one active action or experiment:

- **positive:** the expected signal improved without a material guardrail failure;
- **negative:** the expected signal worsened or a guardrail failed;
- **inconclusive:** the data is incomplete, finalizing, too small, mixed, or the method changed.

Inconclusive is not permission to add a second experiment. Follow the stricter named organic gate when it requires a longer window.

### Monthly: system-health review

- refresh protected-page status using fully paginated page/query evidence;
- review indexing, Core Web Vitals, sitemap, schema, crawler, redirect, and live-rendering exceptions;
- reconcile Merchant processing, approval, serving, and commercial evidence;
- inspect GA4 reporting quality and the analysis-only exclusion for known staff/social paths;
- reprioritize candidates without converting every GSC exclusion into a repair task.

### Day 90: outcome review

Report the fixed-grid target result, direction of change, GBP interactions, citations, Merchant status, finalized Web and AI visibility, GA4 limitations, and source-supported commercial outcome. Separate facts, interpretations, hypotheses, decisions, and unknowns.

## Scorecard lanes and required fields

Every observation records: record ID, lane, source/collector, collection timestamp, source date range and timezone, finality, exact filters/method version, current value, comparator, limitation, private evidence label, owner, and next review date. Every Maps scan also links a sanitized normalized 75-row receipt that follows the [Maps evidence schema](evidence/maps/README.md); the private Vault retains the original vendor export and account screenshot.

| Lane | Minimum weekly record | Never claim |
|---|---|---|
| Maps | Per-point coordinates, exact query, rank or observed not-in-pack, first-pack competitors, collector/account state, result depth, validity; summarize #1 and top-three coverage with denominators. | One browser/one point is the Saskatoon rank. |
| GSC Web | Finalized current/prior equal periods: clicks, impressions, CTR, position; relevant page/query context and pagination completeness. | A click or impression is a lead or order. |
| GSC Generative AI | Its own dates, impressions, pages, countries/devices, inclusion state, and report limits. | AI queries, clicks, rank, orders, or totals additive to GSC Web. |
| GBP | Comparable-period views, call-button clicks, directions, and website clicks; reviews/profile facts separately. | An interaction is a qualified lead or sale. |
| GA4 | Completed-period source/medium, landing pages, sessions, engagement, lead/purchase events; original versus analysis-filtered view and attribution limits. | AI referral traffic or Unassigned purchases caused a sale. |
| Commercial | Source-supported paid orders, qualified quotes, and revenue with evidence strength and unknown attribution. | Private customer/order detail in public Git. |
| Citations | Direct URL, observed identity, correct source-backed identity, checked date, access/owner, existing queue ID, and submitted/published state. | A stale search snippet proves the live listing is wrong. |
| Merchant | Dated source/offer counts, feed/inventory processing, approval, actual serving evidence, and exact blocker. | Approved means serving; serving means purchase attribution. |

## Decision rules

1. Evidence collection and provider mutation are different tasks.
2. Use current authenticated provider evidence and public readback before a provider change.
3. Directly inspect a citation before preparing a correction. Never duplicate a pending submission.
4. Use a GA4 report filter, comparison, or unsaved Exploration for analysis first. A persistent property/data-filter change needs its own approval and validation.
5. One organic experiment at a time; one separately governed Maps/GBP/citation action set at a time.
6. No city-page expansion, forced GEO copy, new webpage, image campaign, FAQ markup chase, manufactured mentions, or `llms.txt` work from weak rank evidence.
7. Technical hygiene candidates—currently review-count drift, invalid `PrintShop` vocabulary, redirected `llms.txt` destinations, and crawler-name comments—stay candidates until the active gate and a single-scope approval permit work.
8. A method change ends comparability. Close the old series and start a new method version rather than splicing results.

## Ownership and approval

| Role | Responsibility |
|---|---|
| Lead search agent | Run/read evidence, validate completeness, maintain the Git scorecard, prepare no more than three prioritized recommendations, and link the private receipt. |
| Hasan | Accept collector/cost and centre; approve GBP/directory/Analytics/provider/site/publication/spend changes; resolve business facts that cannot be inferred. |
| Organic implementation task | Own the one live page experiment, code checks, review, release, public readback, and dated outcome. |
| Citation/backlink task | Own direct listing evidence, correction packet, existing queue identity, submission authorization, and published readback. |
| Merchant task | Own offer/feed/inventory/approval/serving evidence and commerce gates. |
| Analytics task | Own reproducible reports, attribution quality, and any separately approved configuration change. |

## Git and Vault record contract

- **Git owns:** this plan, the append-only weekly scorecard, sanitized point receipts, current state, priorities, hypotheses, decisions, owners, dates, and public-safe findings.
- **Existing Git records keep their jobs:** `GROWTH-PIPELINE.json` owns citation queue state; the active SEO runbook/log owns the organic experiment; Merchant and analytics runbooks own their provider-specific gates.
- **Vault owns:** private exports, screenshots, account receipts, customer-supported attribution evidence, and a pointer to the exact merged Git revision.
- **Vault does not own:** a second editable backlog, a competing “current state,” or copied provider secrets.

After a completed weekly review: preserve the private raw receipt, append the sanitized Git entry, update the relevant existing lane record, run repository checks, review/merge, then add the merged revision to the private pointer. If the Vault checkout is dirty or divergent, make only the targeted local note and report it as local/uncommitted; never pull, rebase, or sweep unrelated files as part of SEO tracking.

## Automation, in the right order

Automation begins only after the first manual weekly loop proves the collector, access, record shape, and review can work end to end.

Safe later automation:

- deterministic completed-period date calculation;
- reminders and missing-scan/missing-field alerts;
- validation that all 75 Maps observations exist;
- read-only collection where an already-authorized API supports it;
- sanitized draft scorecard generation.

Still manual or separately approved:

- purchasing a rank tracker or changing its plan;
- choosing/changing the grid centre or measurement method;
- triggering existing “sync” endpoints that write snapshots;
- changing GBP, directories, GA4 settings, Merchant, pages, feeds, campaigns, budgets, reviews, or public content;
- claiming a lead/order attribution link.

A reminder proves only that a reminder ran. A scheduled collector proves nothing until its complete output and timestamp are read back.

## Acceptance examples

1. One grid point fails: repeat the query scan; do not enter zero.
2. True Color is observed absent: valid not-in-pack, so it counts as not first.
3. Yellow Pages' direct page is correct while Google's snippet is old: no correction is submitted.
4. MapQuest already has a pending correction: check its published state; do not submit again.
5. GSC AI impressions fall while AI referrals rise: report both; do not invent a cause or sale.
6. GA4 purchases remain Unassigned: commercial attribution stays unknown.
7. A schema issue appears during Wall Graphics observation: queue it as a later single-scope candidate.
8. Merchant changes from under review to approved: serving remains unproven until independently observed.

## Immediate next actions

1. Accept Whitespark account/signup terms and free validation plus the verified GBP pin as the proposed centre, or record a different collector/centre; no signup or purchase is made by this plan.
2. Create the method card, run the 25-point one-query validation, and append the `SG-YYYY-D0` acceptance/validation entry; it never counts as baseline.
3. Run baseline scans on Days 7, 14, 21, and 28, each with all three queries and 75 valid observations. Read credits before every attempt and accept or reject paid continuation before the first attempt the free balance cannot fully fund; with no retries, that is scan three.
4. Reconcile Wall Graphics from its actual release plus finalized evidence; do not release Foamboard from a calendar date alone.
5. Refresh Merchant's dated September 7 approval/serving state in its own lane.
6. Directly inspect due citation records and prepare only evidence-backed corrections for later approval.
7. Prepare an analysis-only GA4 comparison excluding known staff/social paths while keeping the original report visible.
8. After the first manual weekly review passes, decide whether a recurring reminder/collection automation is useful.
