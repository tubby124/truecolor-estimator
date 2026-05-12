# SEO Investigation + Long-Term Plan — Execution Prompt

**Author:** Lyra-optimized for Hasan, True Color Display Printing
**Date authored:** 2026-05-12
**Target:** Claude Code (Opus or Sonnet) in a fresh session at this repo root
**Usage:** Open a new Claude Code session, `cd` to this repo, paste the prompt block below as your first message. Auto-mode recommended.

---

## How to run

```
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator"
# Open fresh Claude Code session here
# Paste the entire <role>...</constraints> block below as the first message
```

---

## THE PROMPT (paste everything between the ===== lines into Claude)

=====

<role>
You are a senior technical SEO + analytics engineer who has shipped 50+ small-business
attribution stacks. You prioritize evidence over speculation: every finding cites the
specific file, line, GSC row, or grep result that supports it. You will not invent
prices, claim fixes without diffs, or recommend skills/tools that aren't installed.
You respect the True Color wave system and FROZEN page list at all times. You write
zero pseudocode — anything you produce must be concrete and runnable, or it stays
out of the plan.
</role>

<context>
Business: True Color Display Printing — Saskatoon SK B2B print shop (signs, banners,
business cards, flyers, coroplast, vehicle decals, stickers).

Repo: /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/
Today's date: 2026-05-12

Owner's stated problem: online orders are arriving — something in SEO is working —
but attribution is opaque. Owner suspects GA4 / conversion tracking is broken or
missing. Goal is a long-term SEO + attribution roadmap, not a quick fix.

Known infrastructure:
- GSC IS wired: scripts/gsc-oauth-init.mjs + scripts/seo-opportunities.mjs read
  snapshots from Supabase table seo_gsc_snapshots
- GA4 status UNKNOWN — Phase 0 must verify
- Order source-of-truth UNKNOWN — Phase 0.5 must find it (Supabase orders table?
  Stripe? Square? Wave Accounting? Email-only?)

Existing skills to LEVERAGE (never reinvent):
  /seo-audit /tc-seo-opportunities /seo-technical /seo-content /seo-geo /seo-schema
  /seo-competitor-pages /seo-images /seo-page /seo-sitemap /seo-programmatic
  /paa-faq /truecolor-page /gmb-update

Existing docs to READ before any new writing:
  CLAUDE.md
  .claude/rules/truecolor-seo-safety.md
  .claude/rules/seo-standards.md
  .claude/rules/seo-protected-pages.md (FROZEN list)
  memory/seo-sprints.md  ← sprint history; do NOT duplicate
  FULL-AUDIT-REPORT.md   ← last audit baseline
  SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md  ← prior plan to extend, not replace
  SEO-REMAINING-WAVES.md
  data/PRICING_QUICK_REFERENCE.md  ← price truth

Owner authorization (per ~/.claude/CLAUDE.md "Standing autonomy authorization"):
Hasan-owned repo + Hasan-owned Supabase projects. Read / grep / analyze freely.
For ANY code change, GTM container edit, GA4 property change, sitemap submission,
or deploy: show the diff + blast-radius table, wait for explicit "ship it".

Vault guard: memory/MEMORY.md is at the 200-line auto-load cap. You MUST NOT add
entries to memory/MEMORY.md this session. Sprint index goes into memory/seo-sprints.md
(repo-local, no cap). Durable cross-project knowledge goes into the Obsidian vault
at ~/Downloads/Obsidian Vault/Projects/true-color/ — not memory.
</context>

<phase id="0_discover" gate="emit-PHASE-0-COMPLETE">
GOAL: Baseline + verify current state. Pure evidence collection. Zero recommendations.

Steps:
1. Dispatch a single Explore subagent to read in parallel:
   CLAUDE.md, .claude/rules/truecolor-seo-safety.md, .claude/rules/seo-standards.md,
   .claude/rules/seo-protected-pages.md, memory/seo-sprints.md (last 80 lines),
   FULL-AUDIT-REPORT.md, SEO-PLAN-2026-05-05/IMPLEMENTATION-ROADMAP.md,
   SEO-REMAINING-WAVES.md.
   Have it return: (a) FROZEN page list, (b) last sprint outcome, (c) what shipped
   from SEO-PLAN-2026-05-05, (d) current wave schedule.

2. Grep the repo (single combined call):
   - GA4 / tracking: `(gtag|GTM-|G-[A-Z0-9]{8,}|dataLayer|measurementId|@next/third-parties)` in src/, public/, package.json
   - Event names: `(purchase|begin_checkout|view_item|generate_lead|form_submit|quote_submitted|add_to_cart)` in src/
   - Server-side tracking: `(measurement[_-]?protocol|mp_collect|api_secret)` in src/, scripts/
   - Consent layer: `(cookieconsent|onetrust|consent)` in src/, public/

3. Read structural files: package.json (analytics deps), next.config.ts (redirects,
   headers), src/app/layout.tsx (head scripts), src/app/sitemap.ts (page count).

4. Enumerate .env.local KEYS ONLY (never print values): bash:
   `cd <repo> && grep -E "^[A-Z]" .env.local | cut -d= -f1 | sort`
   Cross-reference against .env.example. Report which keys exist.

5. Pull GSC (parallel, both windows):
   `source ~/.secrets && node scripts/seo-opportunities.mjs --days=90 | jq .`
   `source ~/.secrets && node scripts/seo-opportunities.mjs --days=28 | jq .`

6. **Baseline metrics snapshot** — extract from GSC and write to
   `memory/seo-baseline-2026-05-12.json` with these fields:
   { date_iso, total_clicks_90d, total_impressions_90d, avg_position_90d,
     avg_ctr_90d, top_10_queries: [], top_10_pages: [], tier_1_money_pages: [],
     frozen_pages: [], total_indexed_pages_estimate, gsc_data_freshness_days }
   This is the Day-0 row everything is measured against later.

Emit a Phase 0 report with these sections (every claim cites a file or row):
  - TRACKING STATE: GA4 wired? client-side? server-side? GTM? Which events fire?
  - GSC STATE: snapshot freshness, top 20 query×page by clicks, top 10 by impressions
  - SEO STATE: total pages, FROZEN count, last sprint outcome
  - PRIOR PLAN STATE: shipped from SEO-PLAN-2026-05-05 / open / stale
  - CONFIG STATE: which env keys exist, which expected keys are missing
  - BLIND SPOTS: explicit list of what we still cannot see

End with literal token: PHASE-0-COMPLETE

CONDITIONAL: If GA4 IS wired AND server-side purchase events fire AND ≥80% of
last-30d orders have matching GA4 transaction_ids → skip Phase 1, jump to Phase 2.
State this branch decision explicitly.
</phase>

<phase id="0_5_orders_truth" gate="emit-PHASE-0_5-COMPLETE">
GOAL: Find the actual order / quote source-of-truth. Backfill is impossible without it.

Steps:
1. Search the repo and Supabase for order/quote tables:
   - bash: `grep -rIl --include="*.ts" --include="*.sql" -E "(orders|quotes|checkout|transactions|leads)" src/ supabase/ scripts/ 2>/dev/null | head -30`
   - List any Stripe webhook routes (`src/app/api/**/*stripe*`, `webhook`)
   - List any quote form routes
2. If Supabase project ref is known (likely in .env.local), run via mcp__supabase
   (read-only): list tables matching `(order|quote|lead|payment)` patterns.
3. Read any found table schemas + last 5 rows. Identify the canonical "an order
   happened" event source.
4. Report:
   - Order source-of-truth: <table or webhook or "none — orders are email-only">
   - Average orders/day for last 30d (if computable)
   - Total orders last 30d
   - Customer fields available for attribution (UTM? Referrer? IP? Email domain?)

End with literal token: PHASE-0_5-COMPLETE

CONDITIONAL: If no order source-of-truth exists at all → Phase 1 expands to include
"build an orders table" as Wave A prerequisite. State this branch decision.
</phase>

<phase id="1_attribution_fix" gate="emit-PHASE-1-COMPLETE">
GOAL: Spec the attribution-stack patch. Still NO code changes — spec only.

The 2026 reality: client-side gtag drops 30-50% of B2B purchase events because
corporate networks + Safari ITP + uBlock Origin silently block analytics requests.
**Dual-track measurement is non-negotiable**:
  Track 1 (client): gtag fires funnel events for live debugging in DebugView
  Track 2 (server): Stripe webhook (or order INSERT trigger) fires purchase event
                    via GA4 Measurement Protocol — invisible to ad blockers

Required events (with mandatory params or they silently drop from ecom reports):
  view_item       → item_id, item_name, currency=CAD
  begin_checkout  → value, currency, items[]
  add_payment_info → value, currency
  purchase        → transaction_id (Stripe pi_… or order UUID), value, currency,
                    items[] with item_id/item_name/price/quantity
  generate_lead   → for quote-form submissions, with value=estimated_quote_total
  form_submit     → form_id, form_name

Steps:
1. Map every order/quote handler discovered in Phase 0.5. For each, identify the
   exact file + function where the server-side MP call must land.
2. Build the funnel-event matrix:
   | Page route | Funnel step | Event to fire | Hook location (file:line) | Currently fires? |
3. Build the patch spec (file-by-file, runnable when approved):
   - `.env.local` additions: NEXT_PUBLIC_GA4_MEASUREMENT_ID, GA4_API_SECRET
   - `src/app/layout.tsx` — add @next/third-parties GoogleAnalytics component
   - `src/lib/analytics.ts` (new) — typed wrappers: trackViewItem, trackPurchase, etc.
   - `src/app/api/webhooks/stripe/route.ts` (or equivalent) — server-side MP call on
     payment_intent.succeeded
   - One backfill script: scripts/ga4-backfill.mjs that replays last 30d of orders
     from the source-of-truth table through Measurement Protocol with the original
     event_timestamp_micros
4. Channel attribution audit:
   - Inventory all outbound links (Brevo emails, GBP posts, social) — do they carry
     UTMs? If no, propose UTM scheme: source / medium / campaign convention.
   - GA4 channel-group settings to verify post-wire.
5. Consent / privacy layer:
   - Confirm whether a consent banner exists. For CA + B2B + small shop, basic
     consent mode v2 default-granted is acceptable; flag if anything stricter
     is needed for the customer mix.

Emit the full patch spec. Do NOT write the code yet — that's Wave A in Phase 3.

End with literal token: PHASE-1-COMPLETE
</phase>

<phase id="2_what_works" gate="emit-PHASE-2-COMPLETE">
GOAL: From GSC + GBP + competitor data, surface what's converting demand.

Steps:
1. GSC tier classification (cite the row for every entry):
   - TIER 1 Money pages: pos 1-10, impressions ≥ 200/mo, healthy CTR for category
   - TIER 2 Page-2 captures: pos 11-20, impressions ≥ 50/mo
   - TIER 3 Title-rewrite candidates: pos 1-10 with CTR below category average
     EXCLUDE every page in the FROZEN list — verify each against
     .claude/rules/seo-protected-pages.md
   - TIER 4 Missing-page demand: queries with impressions but no matching slug
   - TIER 5 Decay alerts: queries where 28d position is worse than 90d position by ≥3
2. GBP performance pull: read any existing GBP dashboard / vault notes at
   ~/Downloads/Obsidian Vault/Projects/true-color/*gbp* and surface: monthly views,
   search queries triggering GBP, calls, direction requests. If no data exists,
   flag GBP as "no telemetry yet" — that's its own Wave.
3. Competitor delta — run /seo-competitor-pages against top 3 Saskatoon competitors:
   - Identify queries they rank for that True Color does NOT
   - Identify content depth gaps (their word counts vs ours on overlapping queries)
4. Indexation status:
   - From sitemap.ts, list all URLs
   - Cross-reference against GSC `page` dimension — pages with sitemap entry but
     zero impressions = likely "Crawled — currently not indexed"
   - Output the indexation-gap list
5. INP / CWV check on top 5 Tier-1 money pages:
   - Use /seo-technical or a direct PageSpeed Insights API check
   - Report INP, LCP, CLS for each

Output each tier as a markdown table with the exact `/skill-name` command in the
final column. Match the routing logic in /tc-seo-opportunities exactly.

End with literal token: PHASE-2-COMPLETE
</phase>

<phase id="3_long_term_plan" gate="emit-PHASE-3-COMPLETE">
GOAL: Write the long-term roadmap to disk. This is the deliverable.

Output files (write both):
- `/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/SEO-LONG-TERM-PLAN-2026-05-12.md`
- One-line index entry appended to `memory/seo-sprints.md`
  Format: `- 2026-05-12 — Long-term SEO + attribution plan (Waves A-E) — [SEO-LONG-TERM-PLAN-2026-05-12.md](../SEO-LONG-TERM-PLAN-2026-05-12.md)`

DO NOT touch memory/MEMORY.md (vault guard active).

Plan structure — 5 waves. Each wave has:

  GOAL: one sentence
  SUCCESS METRIC: numeric, measurable against Day-0 baseline in memory/seo-baseline-2026-05-12.json
  TASKS: file-level, ≤3 commands per step
  SKILL: exact /command to copy-paste
  BLAST RADIUS (quantified):
    Files touched: N
    Deploy required: Y/N
    GTM publish: Y/N
    Schema risk: Low / Med / High
    Reversible: Y/N
    Owner-action required: Y/N — if Y, list the human steps
  KILL CRITERIA: when to stop and rethink
  DECISIONS LOG: every non-obvious choice with one-line WHY

WAVE A — Attribution Foundation (blocking everything else):
  Wire client-side GA4 via @next/third-parties.
  Wire server-side Measurement Protocol from Stripe webhook (or order INSERT trigger).
  Backfill last 30d via scripts/ga4-backfill.mjs.
  Verify in GA4 DebugView + Realtime + Ecommerce purchases report.
  Success metric: ≥95% of last-30d orders match a GA4 purchase event with non-null
  transaction_id, value, currency.

WAVE B — Tier-1 / Tier-2 Amplification:
  For each Tier-1 page: add 3 internal links from related pages, expand FAQ to 8+,
  validate Service / Product / FAQPage schema.
  For each Tier-2 page: run /paa-faq + content depth pass to push to page 1.
  Respect wave system: one page edit per session, then 5-7d GSC re-crawl wait.
  Success metric: 5 of top 10 Tier-2 queries reach page 1 within 14d of edit.

WAVE C — Missing-Page Demand Capture:
  For each Tier-4 query cluster, decide: new page (via /truecolor-page) or expand
  existing. Cap at 3-5 new pages this wave.
  Success metric: each new page indexed in GSC within 14d and earning impressions.

WAVE D — GBP + Local Amplification:
  Run /gmb-update for monthly post cadence. Add photos for top services. Ensure
  product list mirrors top-converting pages. Build GBP telemetry pipeline if missing.
  Success metric: GBP-attributed visits + calls trend up vs Day-0 baseline.

WAVE E — Continuous Loop:
  Weekly: /tc-seo-opportunities + GA4 conversion review
  Monthly: /seo-audit + GBP performance review
  Quarterly: competitor delta refresh + INP / CWV check on money pages
  Success metric: organic-traffic-to-purchase rate trends up month-over-month
  against Day-0 baseline.

End the file with a SELF-CRITIQUE section. Score the plan 1-10 on each dimension:
  Evidence density (every claim cites a source)
  Actionability (every task is concrete + runnable)
  Risk awareness (blast radius quantified for every wave)
  Skill leverage (uses existing skills, doesn't reinvent)
  Measurability (every wave has a numeric success metric tied to Day-0)

If ANY dimension scores < 8, iterate on that section before printing PHASE-3-COMPLETE.

End with literal token: PHASE-3-COMPLETE
Print final summary: `✅ DONE → <absolute path to plan file>`
</phase>

<output_format>
Each phase ends with its literal completion token on its own line.
Use markdown tables for any data with ≥3 columns.
No em-dashes. No marketing fluff. No time estimates ("week 1-2" is fine, "2 weeks" is not).
Use "wave" and "session" as the only time units.
File references in text use markdown link syntax: [filename.ts](src/filename.ts).
</output_format>

<constraints>
- Read-only until Phase 3 file writes. NO code edits, NO migrations, NO deploys.
- Cite evidence for every claim: file path + line, GSC row, grep result, or DB row.
- FROZEN pages: never propose title or meta edits. Body / FAQ / schema only.
- Wave system: one page edit per session, then 5-7d GSC re-crawl wait.
- No pseudocode. Any code in the plan must be concrete and runnable when copied.
- Use existing skills before inventing flows. Listed in <context>.
- Never write to memory/MEMORY.md this session (vault guard active).
- Stop and ask before: writing production code, editing GTM, creating GA4 property,
  deploying, submitting sitemap, force-pushing.
- No time estimates in absolute units — waves and sessions only.
- No em-dashes anywhere in output.
- If you would say "leverage", "utilize", "seamless", "robust", "streamline", or
  "game-changer" — pick a concrete verb instead.
</constraints>

Begin Phase 0 now. Auto-continue through Phase 3 without pausing for confirmation.

=====

## Notes for Hasan

- This prompt is **read-only** until Phase 3 writes the plan file. You can let it run unattended in auto-mode.
- If you watch the run, the only places Claude SHOULD pause are: end of Phase 3 (it'll wait for you to approve Wave A code changes), or if it discovers something unexpected and asks.
- The plan output at `SEO-LONG-TERM-PLAN-2026-05-12.md` is your blueprint. Then Wave A is the first thing to actually ship.
- The Day-0 baseline at `memory/seo-baseline-2026-05-12.json` is what every "did this work" measurement uses. Don't delete it.

## Verification after Phase 0

Quick sanity check Phase 0 worked correctly:
```bash
ls -la "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/memory/seo-baseline-2026-05-12.json"
jq '.total_clicks_90d, .top_10_queries' "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/memory/seo-baseline-2026-05-12.json"
```

If the baseline file exists with non-null fields, Phase 0 collected real evidence.
