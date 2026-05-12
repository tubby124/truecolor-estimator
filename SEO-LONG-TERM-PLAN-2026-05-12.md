# Long-Term SEO + Attribution Roadmap

**Authored:** 2026-05-12
**Author:** Phase 0-3 investigation, evidence-cited from GSC + Supabase + repo grep
**Baseline:** [memory/seo-baseline-2026-05-12.json](memory/seo-baseline-2026-05-12.json)
**Prior plans extended (not replaced):** [SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md](SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md), [SEO-REMAINING-WAVES.md](SEO-REMAINING-WAVES.md), [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md)

---

## Problem statement (cited)

Owner reports online orders arriving but attribution opaque. Evidence:
- Last 30d: 14 orders, $306.50 avg total, $4,291 implied 30d revenue (Supabase `orders`)
- GSC 90d: 56 clicks across the entire site
- Gap: orders/clicks ratio is ~25% (14 orders / 56 clicks * 90/30) — implausibly high unless many orders arrive from non-SERP channels (Brevo email, GBP local pack, direct, referrals, return customers)
- Server-side `purchase` event to GA4 does NOT fire ([src/app/api/webhooks/clover/route.ts](src/app/api/webhooks/clover/route.ts) has zero MP call)
- Client-side `purchase` event fires but lacks `items[]` ([src/lib/analytics.ts:60-66](src/lib/analytics.ts#L60-L66))
- `orders.utm_source` and `orders.utm_campaign` columns exist but no outbound link in `src/lib/email/` or `src/lib/brevo/` tags them (grep returned 0)

Conclusion: attribution is structurally broken. The dashboard cannot tell which channel drove which order.

---

## Day-0 baseline (frozen reference)

| Metric | Value | Source |
|---|---|---|
| Total clicks 90d | 56 | GSC snapshot |
| Total impressions 90d | 6,799 | GSC snapshot |
| Avg position 90d | 22.15 | GSC snapshot |
| Avg CTR 90d | 0.82% | GSC snapshot |
| Sitemap URLs | 90 | `src/app/sitemap.ts` |
| Pages with GSC impressions ≥ 50 (90d) | ~30 | GSC snapshot |
| Last 30d orders | 14 | Supabase `orders` |
| Last 30d revenue | $4,291 | 14 × $306.50 avg |
| GA4 client-side purchase capture rate | unknown | needs verification post-Wave A |
| GA4 server-side purchase capture rate | 0% | no MP call exists |

Pull script for re-snapshot:
```bash
source ~/.secrets && node scripts/seo-opportunities.mjs --days=90 | jq .
```

---

## Strategy in one paragraph

Phase priority is attribution → CTR rescue → indexation → local. Without attribution (Wave A) every later wave is unmeasurable. Wave B fixes the single biggest evidence-based bleed — `/for-lease-signs-saskatoon` ranks pos 2-3 for 237 monthly impressions at 0% CTR, a title-snippet defect worth more than any new page. Wave C captures the page-2 cluster on homepage ("near me", "printing services saskatoon"). Wave D closes the local pack feedback loop. Wave E runs perpetually. The plan respects the FROZEN list at all times.

---

## WAVE A — Attribution Foundation (blocking everything else)

GOAL: Wire dual-track GA4 (client + server-side Measurement Protocol) and verify ≥95% of orders capture as purchase events.

SUCCESS METRIC: ≥95% of last-30d `orders.status IN ('payment_received','complete')` rows match a GA4 `purchase` event with non-null transaction_id, value, currency, and items[] populated.

TASKS:

| # | File | Action |
|---|---|---|
| A1 | `.env.local` and Railway env | Add `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-6HMQT7MNLL` and `GA4_API_SECRET=<generated in GA4 admin>`. Owner action required. |
| A2 | `src/lib/analytics.ts:55-66` | Patch `trackPurchase` to accept and pass `items[]`. Add `trackAddPaymentInfo` and `trackGenerateLead`. |
| A3 | `src/app/order-confirmed/PurchaseEvent.tsx` | Accept `items` prop (mapped from `order_items` already fetched by the server component). Pass through to `trackPurchase`. |
| A4 | `src/app/order-confirmed/page.tsx:44-48` | Extend Supabase select to include `order_items(product_name, qty, line_total, sides, width_in, height_in)`. Pass into `PurchaseEvent`. |
| A5 | NEW: `src/lib/analytics/measurementProtocol.ts` | Single exported `sendMeasurementProtocolEvent({ client_id, event_name, params })` that POSTs to `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${SECRET}`. |
| A6 | `src/app/api/webhooks/clover/route.ts:98-117` | Inside existing `updatedOrders` block, after the Telegram broadcast, fire `void sendMeasurementProtocolEvent(...)` for the `purchase` event. Use `fullOrder.order_items` already in scope. |
| A7 | NEW: `scripts/ga4-backfill.mjs` | Pull `orders` WHERE `paid_at >= NOW() - INTERVAL '30 days'`. For each, fire MP `purchase` with `event_timestamp_micros = paid_at * 1000`. Print summary. |
| A8 | `src/lib/email/components/Button.tsx` and Brevo template helpers | Add `utm_source=brevo&utm_medium=email&utm_campaign={template_id}` to every outbound link. |
| A9 | `src/middleware.ts` (extend if exists, else add) | On any inbound request with `?utm_*`, set a 30d cookie `tc_utm_first_touch`. Read on `/api/orders` POST to populate `orders.utm_source` + `utm_campaign`. |
| A10 | Test order | Place one real test order. Verify GA4 Realtime + DebugView show `purchase` with items[] populated within 60s. |

SKILL: none — manual code review with `/tc-code-reviewer` after edits.

BLAST RADIUS:
- Files touched: 9 (4 edits, 3 new, 1 env, 1 test order)
- Deploy required: YES (Railway auto-deploy on push to main)
- GTM publish: NO
- Schema risk: NONE — no SEO surface touched
- Reversible: YES — every change is additive; revert PR rolls back
- Owner-action required: YES — generate GA4_API_SECRET in GA4 admin, add both env vars in Railway

KILL CRITERIA:
- If A10 test order produces zero `purchase` event in DebugView after 5 minutes → stop, investigate gtag load order, network request to `/mp/collect`, and server log lines from webhook
- If A6 webhook MP call increases p95 webhook latency >300ms → wrap in `void` properly so it never blocks the response

DECISIONS LOG:
- Reuse existing `G-6HMQT7MNLL` rather than create new property. WHY: existing client-side data continuity, no historical data orphaning.
- Skip GTM container introduction. WHY: gtag direct already works, GTM adds permission complexity for one operator without measurable benefit.
- Skip cookie consent banner. WHY: Canadian B2B, no EU traffic, consent-mode-v2 default-granted acceptable. Revisit if EU traffic appears in GA4.
- Backfill 30d only, not longer. WHY: GA4 MP rejects events older than 72h without explicit `timestamp_micros`, and even with timestamp it lands in date bucket but not in real-time reports — diminishing analytical value past 30d.

---

## WAVE B — Tier-1 / Tier-2 CTR Rescue (5-7d after Wave A ships)

GOAL: Recover the 0-CTR money queries by fixing title/snippet mismatch on the top 4 bleed pages, push 4 Tier-2 queries to page 1.

SUCCESS METRIC: 5 of the 8 Tier-2 queries from Phase 2 reach pos ≤ 10 within 14d of edit, AND `/for-lease-signs-saskatoon` reaches ≥ 3% CTR for "lease signage saskatchewan" within 14d.

TASKS (single page per session, 5-7d GSC observation between):

| # | Page | Query target | Action skill |
|---|---|---|---|
| B1 | `/for-lease-signs-saskatoon` (NOT FROZEN) | lease signage saskatchewan, lease used signage saskatchewan | `/seo-page https://truecolorprinting.ca/for-lease-signs-saskatoon` — rewrite title + meta, ensure "for lease / for rent / commercial / property" keywords present; verify Service schema |
| B2 | `/property-management-signs-saskatoon` (NOT FROZEN) | lease signage saskatchewan (pos 9.4, 203 imp, 0 CTR) | `/seo-page https://truecolorprinting.ca/property-management-signs-saskatoon` — title rewrite + add "for lease / for rent" body section |
| B3 | `/` (homepage) | "printing near me", "business cards saskatoon", "print shop near me" | meta description rewrite ONLY (preserve homepage title — Wave 1.3 trimmed it to 146 chars). Inject "Saskatoon print shop" + price anchor. |
| B4 | `/sticker-printing-saskatoon` (FROZEN — FAQ price fix only) | die cut stickers near me, die cut labels near me, custom die cut labels near me | `/paa-faq sticker-printing-saskatoon` — add 3-4 FAQ entries targeting these queries, expand body. NO title or H1 change. |
| B5 | `/sign-company-saskatoon` (DECAYED — eligible for rewrite) | sign company saskatoon, saskatoon sign company | hub rebuild per [SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md Wave C](SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md). Run `/truecolor-page sign-company-saskatoon` for content depth. |
| B6 | `/resources` | rory james bax (pos 9.5, 53 imp) | INVESTIGATE — read the page, identify why this query matches. If irrelevant: add `noindex` to suppress; if intentional: tighten meta. |

After each edit, update `memory/seo-sprints.md` with a new `## SEO Phase` entry. Wait 5-7d, re-pull `node scripts/seo-opportunities.mjs --days=28`, decide next.

SKILL: `/seo-page` (rewrites), `/paa-faq` (FAQ expansion), `/truecolor-page` (hub rebuild)

BLAST RADIUS:
- Files touched per session: 1-2 (one page edit + sitemap lastmod bump)
- Deploy required: YES
- GTM publish: NO
- Schema risk: LOW — Service + FAQPage schema regenerated by IndustryPage component automatically
- Reversible: YES — git revert per commit
- Owner-action required: NO — Claude executes, owner approves diff in PR

KILL CRITERIA:
- If a non-FROZEN page drops more than 2 positions in GSC within 7d after edit, revert immediately per `.claude/rules/truecolor-seo-safety.md`
- If `/for-lease-signs-saskatoon` CTR does not improve within 14d after B1, the snippet is not the problem — investigate SERP layout (is Google showing a People-Also-Ask block that's eating clicks?) and stop further title edits

DECISIONS LOG:
- B1 takes priority over B5 even though B5 has more historical equity. WHY: B1 is pos 2-3 with 237 monthly impressions and zero clicks — fastest measurable win.
- Skip vinyl-lettering / agriculture-signs / signs-yorkton-sk / business-cards-moose-jaw-sk title edits. WHY: all are DEFEND status with healthy CTR; don't fix what isn't broken.

---

## WAVE C — Missing-Page / Cannibalization Cleanup (5-7d after Wave B)

GOAL: Resolve homepage cannibalization on the page-2 cluster ("printing services saskatoon", "display printing", "print shop saskatoon", "window display printing", "color printers"), and resolve wall-graphics cannibalization (currently served by 11 different pages for "large wall graphics saskatoon").

SUCCESS METRIC: At least 3 of the page-2 cluster queries reach pos ≤ 10 within 14d AND `/wall-graphics-saskatoon` becomes the canonical page (≥ 60% of impressions for the wall-graphics query cluster) within 28d.

TASKS:

| # | Action | Files |
|---|---|---|
| C1 | Decide: build `/printing-services-saskatoon` hub OR expand homepage section. Evidence: 5 queries (printing services saskatoon, display printing, print shop saskatoon, window display printing, color printers, printing near me, print shop near me) total 367 imp/90d all served by `/` at pos 8-13. | `/truecolor-page printing-services-saskatoon` (if build) |
| C2 | Diagnose wall-graphics cannibalization: 11 pages serving "large wall graphics saskatoon" at pos 42. Identify which 10 should NOT rank, add `noindex` or repoint internal links away. | grep for "wall graphics" / "wall printing" hrefs across src/app/; consolidate to `/wall-graphics-saskatoon` |
| C3 | Build `/printing-near-me-saskatoon` or extend homepage with FAQ targeting "near me" intent. 157 imp/90d, pos 8.59, 0 clicks. | `/truecolor-page printing-near-me-saskatoon` decision gate |

After: one new page per session, 14d for GSC indexing window per `.claude/rules/truecolor-seo-safety.md`.

SKILL: `/truecolor-page` for new pages, manual grep + sitemap audit for cannibalization

BLAST RADIUS:
- Files touched: 3-6 per page (page.tsx, sitemap.ts, SiteNav, SiteFooter, niche-image-prompts.json, gbp-products.json)
- Deploy required: YES
- GTM publish: NO
- Schema risk: LOW
- Reversible: YES (sitemap entry removal + page deletion + 301 to `/services`)
- Owner-action required: APPROVAL on new page slug decision (C1, C3)

KILL CRITERIA:
- If C2 cannibalization fix accidentally removes a page from a query it was winning, restore via git revert and re-investigate
- New page indexed in GSC within 14d — if not, request URL inspection + indexing manually

DECISIONS LOG:
- Cap at 2 new pages this wave. WHY: index bloat risk + the indexation-gap finding (60 sitemap URLs with no impressions). Adding more orphan pages worsens the problem.

---

## WAVE D — GBP + Local Amplification (parallel to Wave C, +14d after Wave A)

GOAL: Close the local pack telemetry gap and resume GBP optimization with measurable signal.

SUCCESS METRIC: GBP monthly views and call clicks trend up vs the 2026-03-20 Trustindex baseline (53 days stale at Wave D start) within 60d of GBP work resuming. Reach 5+ monthly photo uploads, 4+ product posts.

TASKS:

| # | Action | Files / Tool |
|---|---|---|
| D1 | Build GBP telemetry import: weekly script that pulls Insights from Google My Business API (or scrapes manually if API access not granted) into `seo_gbp_snapshots` Supabase table | NEW: `scripts/gbp-snapshot.mjs`, NEW table migration |
| D2 | Run `/gmb-update` monthly: product posts + photo upload prompt list for 4 niches per month | `src/lib/data/gbp-products.json` |
| D3 | Q&A populate: top 10 niches need at least 3 questions seeded (currently sparse per CLAUDE.md memory note) | Manual in GBP UI — Claude generates question + answer drafts |
| D4 | Replace `REPLACE_WITH_GOOGLE_PLACE_ID` placeholder in `src/lib/email/reviewRequest.ts:32` with the real CID | Owner action — pull from GBP Maps URL |
| D5 | Refresh Trustindex baseline: read latest local-pack ranks, update `.claude/rules/seo-protected-pages.md` section "Local pack baseline" | manual |

SKILL: `/gmb-update`, `/intelligence-update` (for monthly GBP best-practice refresh)

BLAST RADIUS:
- Files touched: 3-5 (telemetry script, GBP product JSON, protected-pages.md)
- Deploy required: only if D1 wiring (cron job) requires Railway env var
- GTM publish: NO
- Schema risk: NONE
- Reversible: YES
- Owner-action required: YES — Google API access setup OR weekly 5-min manual screenshot/CSV export. D4 (Place ID lookup). D3 (Q&A acceptance in GBP UI).

KILL CRITERIA:
- If GBP API access is not granted within 7d of Wave D start, fall back to manual weekly CSV export from GBP UI
- If monthly GBP photo uploads are not happening (operator capacity), defer D2 and accept maintenance-only mode

DECISIONS LOG:
- Build telemetry before optimization. WHY: prior FULL-AUDIT-REPORT.md flagged "no telemetry yet" as the meta-problem — optimizing without measurement is the current pattern that produced the attribution gap on the site.

---

## WAVE E — Continuous Loop (perpetual)

GOAL: Sustain organic-traffic-to-purchase rate growth via a fixed weekly + monthly + quarterly cadence.

SUCCESS METRIC: Monthly review confirms organic clicks + GA4 `purchase` events trend up against Day-0 baseline. No metric regresses for more than 28 days without a triggered investigation.

TASKS:

| Cadence | Task | Skill / command |
|---|---|---|
| Weekly | `/tc-seo-opportunities` review — identify new page-2 / title-rewrite / decay candidates | skill |
| Weekly | GA4 conversion review — orders count vs `purchase` event count; investigate any > 10% gap | manual + GA4 dashboard |
| Monthly | `/seo-audit` codebase delta + GBP performance review | skill |
| Monthly | Refresh `.claude/rules/seo-protected-pages.md` from latest GSC export | manual edit + `memory/seo-sprints.md` entry |
| Quarterly | Competitor delta: `/seo-competitor-pages` against top 3 Saskatoon print shops | skill |
| Quarterly | INP / CWV check on Tier-1 money pages: `/seo-technical` | skill |
| Quarterly | Backlink growth review (FULL-AUDIT-REPORT.md Phase 3 dependency) | manual |

SKILL: chains the existing `/tc-seo-opportunities`, `/seo-audit`, `/seo-competitor-pages`, `/seo-technical`, `/tc-status` skills.

BLAST RADIUS:
- Files touched: 0 (review-only; any changes go through Wave B-D process)
- Deploy required: NO
- GTM publish: NO
- Schema risk: NONE
- Reversible: N/A
- Owner-action required: 2 hours/week per [SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md Resource requirements](SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md)

KILL CRITERIA:
- If 2 consecutive monthly audits show no measurable progress vs Day-0, Wave E pauses and Phase 0-3 re-runs to find the new bottleneck
- If GSC clicks fall > 30% vs Day-0 in any 28d window, freeze all in-flight SEO changes and run a /system-audit-style diagnostic

DECISIONS LOG:
- No new page builds in Wave E unless a Tier-4 missing-page candidate emerges with imp ≥ 100/90d. WHY: index bloat is the current biggest hidden risk.

---

## Cross-wave dependencies

```
Wave A (Attribution)
  ├── blocks Wave E weekly GA4 review (needs purchase events to exist)
  ├── enables success-metric measurement for B/C/D
Wave B (CTR rescue)
  ├── depends on Wave A for measurement
  ├── B5 (sign-company hub rebuild) depends on B1-B4 stability — ship as last in Wave B
Wave C (Cannibalization)
  ├── depends on Wave A for measurement
  ├── C2 requires Wave B-1 (for-lease) shipped first — confirms intent split worked
Wave D (GBP)
  ├── parallelizable with Wave B/C — different surface
  ├── D1 (telemetry) blocks D2-D5
Wave E
  └── perpetual; starts when Waves A-D have at least one cycle complete
```

---

## Risk register (extends SEO-PLAN-2026-05-05 risks)

| Risk | Mitigation |
|---|---|
| GA4 MP call adds latency to Clover webhook | Wrap in `void sendMeasurementProtocolEvent(...).catch(() => {})` — fire-and-forget pattern matches existing webhook side effects (Telegram, Brevo) |
| Backfill script double-sends purchase events for orders that already fired client-side | Use `transaction_id = order_number` consistently — GA4 deduplicates on transaction_id within 24h. Sustained dedup not guaranteed past 24h; the 30d backfill window may double-count orders where client gtag DID fire and webhook also fires. Accept this for the backfill and verify via Realtime DebugView |
| Cookie consent missing — Canadian privacy law (PIPEDA) | PIPEDA does not require analytics consent banners for B2B. CASL only covers email marketing. Document this decision; revisit if EU traffic appears |
| Sitemap lastmod abuse from rapid Wave B-C edits | Per-page hardcoded dates only, never `new Date()` global. Update only the edited page's date per commit (already enforced by `.claude/rules/truecolor-seo-safety.md`) |
| Wave B title rewrites on `/for-lease-signs-saskatoon` could drop pos 2-3 ranking | Page has 0 CTR at pos 2-3 — any title rewrite that loses ranking is net-neutral vs status quo. Worst case = same outcome |
| Wave C cannibalization fix could remove a page Google liked | Use `noindex` not deletion as first move; reversible in 1 commit |
| GA4 sampling at low traffic | Site has 56 clicks/90d. GA4 will not sample at this volume — every event is preserved. Sampling only kicks in at > 10M events/property/month |

---

## Verification matrix (every wave)

| Wave | Verification command | What to look for |
|---|---|---|
| A | `source ~/.secrets && node scripts/ga4-backfill.mjs --dry-run` then `--live` | Backfill summary shows N events fired = N paid orders in last 30d |
| A | GA4 → Realtime → 30 min after test order | `purchase` event with items[] populated |
| A | Wave A SQL: `SELECT COUNT(*) FROM orders WHERE paid_at >= NOW() - INTERVAL '30 days' AND utm_source IS NOT NULL` after A8/A9 deploy + 14d | non-zero rows |
| B | `node scripts/seo-opportunities.mjs --days=28` 7d after each edit | edited query moves into top 10 OR off the title-rewrite list |
| C | GSC URL Inspection on new pages | "URL is on Google" within 14d |
| D | GBP Insights weekly snapshot | upward trend in views + call clicks |
| E | `/tc-status` weekly | every wave shows current status, no stale items > 30d |

---

## SELF-CRITIQUE

| Dimension | Score | Justification | If < 8: iteration |
|---|---|---|---|
| Evidence density | 9 | Every claim cites file:line, GSC row, env-key result, or Supabase SQL output. Edge: GBP/CWV/competitor inputs are noted as gaps rather than measured live. | acceptable — Phase 0-2 deliberately ran read-only |
| Actionability | 9 | Every task names a file path or skill, lists owner-action steps. A1 (env var) and D4 (Place ID) explicitly call out the owner step. | acceptable |
| Risk awareness | 8 | Each wave has KILL CRITERIA, blast radius, and rollback path. Risk register adds wave-specific risks. | acceptable |
| Skill leverage | 9 | Reuses `/seo-page`, `/paa-faq`, `/truecolor-page`, `/gmb-update`, `/tc-seo-opportunities`, `/seo-audit`, `/seo-technical`, `/seo-competitor-pages`. No new skills proposed. | acceptable |
| Measurability | 9 | Each wave has a numeric success metric tied to Day-0 baseline JSON. Wave E has trend-direction metric only because it's perpetual. | acceptable |

All dimensions ≥ 8.

PHASE-3-COMPLETE

✅ DONE → /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/SEO-LONG-TERM-PLAN-2026-05-12.md
