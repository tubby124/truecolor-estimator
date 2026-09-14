---
name: true-color-local-search
description: Runs a read-only, evidence-led local-search scorecard for True Color when asked about Google Maps ranking, Google Business Profile, local SEO, Google Analytics, Google Search Console, citations, or the path toward first-place local visibility. It separates Maps from organic SEO and commercial outcomes, and requires explicit authorization for any provider, page, directory, analytics-setting, or spend change.
metadata:
  version: 1.0.0
---

# True Color local search

This skill assesses local visibility without silently changing the website or a Google property. Its purpose is to make the next decision honest: observe, diagnose, prepare one bounded action, or stop for missing evidence.

## Operating boundary

- Resolve the canonical checkout first. Read `AGENTS.md`, `docs/TRUE-COLOR-INDEX.md`, `docs/operations/CURRENT-STATE.md`, `docs/operations/SEO-STANDARD.md`, and the latest linked local-search baseline before interpreting old notes.
- Treat `.claude/commands/truecolor-seo.md` as historical reference only. It does not authorize a page, claim, price, competitor, or ranking action.
- Reconcile the current business identity across `src/lib/business-info.ts`, the live contact page, the current GBP, and the latest linked citation record. If they disagree, report the conflict. Do not invent a suite number, capability, review, price, partnership, or uniqueness claim.
- The default result is a read-only report. A successful local read, XML check, or script does not prove a Google ranking, a customer visit, or a sale.

## Explicit stops

Do not run automatic sync endpoints, publish or edit a GBP/profile/directory/review/outreach record, create an Active GA4 data filter, change spend, edit a page, create a new page, run `scripts/build-gbp-upload.py`, or publish through any provider unless the current task explicitly authorizes that exact class of change.

Do not use this skill to bypass the organic controls: one live organic experiment at a time; wait 7–14 completed days with finalized GSC evidence; and do not expand city pages. Carry the current Google-growth priority from `docs/operations/SEO-STANDARD.md` and `docs/operations/CURRENT-STATE.md`; a Maps review does not silently change that priority or its gates.

## Evidence labels and freshness

Label every material statement as one of:

- **Fact** — directly read from an authenticated console, production URL, approved source file, or query, with date and scope.
- **Hypothesis** — plausible explanation that needs a test; never a claimed cause.
- **Unknown** — data unavailable, too stale, sampled, incomplete, or not comparable.

Use the narrowest reliable date window. Prefer completed/finalized days; name partial current months. Mark browser Maps checks as *directional* unless a fixed neutral grid was collected. Never compare a logged-in, one-location search to a citywide rank.

## Read-only workflow

1. **Set the question and baseline.** State the target query, geographic scope, desired outcome, last comparable period, and whether the task is Maps, organic, attribution, citations, or commercial performance.
2. **Read the four separate lanes.**
   - **GSC / organic:** latest successful ingestion, final date, 28-day current/prior clicks, impressions, CTR, position, query/page context, indexing and enhancement status. `node scripts/seo-opportunities.mjs --days=28 --text` is an input, not a decision engine.
   - **GBP / Maps:** verification, category, NAP, hours, reviews, profile completeness, Search-versus-Maps views, calls, directions, website clicks, search terms, and current citations. A prepared post is not a published post.
   - **GA4:** use completed days and inspect acquisition, landing pages, device mix, lead events, and known internal/staff traffic. Keep report filtering separate from permanent data-filter changes.
   - **Orders and quotes:** report only source-backed paid orders, quotes, and limitations. Do not turn a click, direction request, call-button click, or `purchase` event into revenue attribution without the relevant evidence.
3. **Collect rank evidence correctly.** For an approved grid, record query, scan date/time, collector/account state, map centre coordinates, zoom, each grid point, visible rank or not-in-pack result, and the first-pack competitors. Use a 5x5 grid at 1 km spacing around the agreed service core by default only after the owner accepts the collector and centre. A one-browser result is directional reconnaissance, not a grid baseline.
4. **Check factual hygiene.** Verify public NAP directly at each citation before calling it stale; separate submitted, pending, and published. Check production schema, review-count drift, invalid structured-data types, `llms.txt`, redirects, sitemaps, indexing exclusions, and Core Web Vitals without changing them.
5. **Interpret without blending lanes.** Explain whether the evidence supports relevance, distance, prominence, measurement quality, or an unknown. Google describes local ranking as relevance, distance, and prominence; no action can guarantee a rank. See [Google's local-ranking guidance](https://support.google.com/business/answer/7091?hl=en).
6. **Return a bounded scorecard.** Give no more than three prioritized actions, each with owner, exact evidence needed, authorization class, and next review date. If the only safe conclusion is observation, say so.

## Scorecards

### Weekly read-only scorecard

| Lane | Required comparison | Guardrail |
|---|---|---|
| GSC | latest finalized 28 days vs preceding 28 | do not interpret trailing partial data |
| GBP | comparable completed period; calls, directions, website clicks, Search/Maps views | actions are profile interactions, not orders |
| Maps ranks | same queries, grid, collector, centre, and scan method | directional checks stay labelled directional |
| GA4 | completed days; acquisition, landing quality, leads, device | disclose internal/staff pollution and unattributed revenue |
| Commercial | paid orders and qualified quotes only where source-backed | never blend into a vanity score |

### Monthly decision review

Refresh the citation table and public profile facts; compare four weekly grid scans when available; classify each tracked query as improving, flat, declining, or unknown. Re-read the current organic experiment gate before proposing a page change. A GBP or citation proposal is prepared for owner review, never applied by this skill.

Google defines Business Profile calls as call-button clicks, directions as direction requests, and website clicks as profile-link clicks; use those definitions in reports. See [Business Profile performance](https://support.google.com/business/answer/9918094). GA4 internal-data exclusions are permanent once Active, so start with a report filter, comparison, or Exploration and obtain separate authorization before configuration; see [GA4 internal-traffic filters](https://support.google.com/analytics/answer/10104470?hl=en-CA).

## Acceptance scenarios

1. **Weekly health check:** with finalized GSC and a completed GBP period, produce four separated lanes and at most three actions; make no mutation even if a metric falls.
2. **Rank-drop triage:** with one query dropping in a fixed grid, verify method parity, profile/citation facts, and organic experiment status before describing a hypothesis; do not edit a page or profile based on a directional check.
3. **Ninety-day Maps plan:** after an owner accepts a 5x5/1 km collector and target queries, establish a four-scan baseline, then propose only authorized profile/citation work. For each query, each of four consecutive weekly scans must return valid observations at all 25 fixed points and rank first at 15 or more points. A successful not-in-pack observation counts as not first; a failed or ambiguous collection invalidates that scan and must be repeated with the same method. This is an ambitious measurement target, not a ranking guarantee; report the honest day-90 result.

## Report template

Use this order: scope and freshness; facts; hypotheses; unknowns; four-lane scorecard; rank-method note; up to three actions; explicit non-actions; next review date. If the task authorizes documentation changes, record sanitized findings in the relevant repo runbook or `memory/seo-sprints.md`; otherwise return a proposed entry without changing files. Keep private account exports and customer records outside this public repository.
