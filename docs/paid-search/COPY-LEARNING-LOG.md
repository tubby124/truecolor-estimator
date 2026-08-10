# Google Ads Copy — Learning Log

Append-only. Newest at the bottom. Mirrors the `memory/seo-sprints.md` pattern that already
works for SEO.

**The `Outcome` line is the entire point.** A log without outcomes is a diary. With them it is
the input to the next decision — and when a pattern proves out it graduates into
`.claude/rules/google-ads-copy.md` as a do/don't with its evidence line, so the next person
writing copy inherits the finding instead of re-running the experiment.

Do not delete entries. A wrong call that got corrected is more useful than a clean log.

## Entry format

```
## YYYY-MM-DD — short title
What shipped:     the concrete change
Hypothesis:       why we believed it would win
Metric + date:    what gets checked, and when
Outcome:          (WRITTEN BACK on the check date — required)
Promoted to rule: yes/no — what changed in .claude/rules/google-ads-copy.md
```

---

## 2026-08-06 — Variant B: price-anchored copy on all 10 Core ad groups

**What shipped:**
- New sourced-fact registry `docs/paid-search/approved-claims.mjs` (28 facts, each with a named
  source). Replaces the 3-entry exact-string allowlist that banned every digit from ad copy.
- `rsaVariantB` added to all 10 Core ad groups: 10 group-specific + 5 shared headlines, every ad
  carrying at least one sourced price. Variant A left byte-identical as the control arm.
- Callouts and all 6 sitelink description pairs rewritten with sourced prices — these render on
  every impression across all 20 ad groups.
- Two new validator assertions: variant B must carry a sourced price headline, and may share at
  most 5 headlines with any other ad group.
- Price-staleness gate: validation fails if `PRICING_QUICK_REFERENCE.md` is newer than
  `VERIFIED_ON`.
- New read-only tooling: `verify-destinations`, `pacing-report`, `mine-search-terms`,
  `expand-keywords`.

**Hypothesis:** The ads had zero numbers because the validator forbade them, so the account's
only real differentiators — published pricing, +$40 rush, 1–3 day turnaround, local pickup —
never reached a customer. Adding sourced prices and cutting shared headlines from 10 to 5 should
raise Ad Relevance (mechanical, via Quality Score) and CTR (behavioural, unproven).

**Metric + date:** At the variant-A vs variant-B read, compare CTR and conversions per ad group.
Ad Relevance in the Google Ads UI is the leading indicator and moves first.

**Outcome:** _pending — write this back on the check date._

**Promoted to rule:** yes — `.claude/rules/google-ads-copy.md` created with the copy standard,
the expansion cadence, and a seeded known-traps table.

**Caveats recorded honestly at ship time:**
- At ~2.6 clicks/day, variant A vs B will not reach statistical significance inside the pilot.
  Treat any CTR delta as directional. The defensible win is Quality Score and never shipping an
  unsourced claim again.
- Day-1 CTR was already 28.6%. The ads were being clicked. If orders still do not land, the
  bottleneck is post-click (landing page CTA framing, or the unproven conversion upload), not copy.
- CA$600 is not reachable at current delivery — projection is ~CA$282. This change does not fix
  that and was never going to.

---

## 2026-08-06 (second pass) — variant B extended to ALL 20 ad groups; variant B now mandatory

**What shipped:**
- `rsaVariantB` added to the 9 Competitor groups and the Brand group. **Account is now 40 ads:**
  19 enabled APPROVED (variant A) + 19 enabled in review (variant B) + 1 paused APPROVED and
  1 paused in review (both Brand).
- **`rsaVariantB` is now MANDATORY on every ad group.** A config without it fails validation, so
  a new ad group can never ship vague, number-free copy — the standard no longer depends on
  anyone remembering it.
- Competitor groups deliberately share ONE variant-B payload; the shared-headline cap is now
  Core-only. Nine SKAGs targeting one offer on one landing page, forbidden from naming the
  competitor, have nothing legitimate left to differentiate on. What changed is that every line
  now carries a real number and answers "why switch" instead of "compare us".
- Brand variant B exists but serves nothing today (campaign paused). It is pre-positioned because
  unpausing Brand is the cheapest lever toward CA$600 — if that call gets made, the copy is
  already price-anchored.
- `apply-sync` now creates ads with the **ad group's** status instead of hardcoded ENABLED, so
  the Brand ad was correctly created PAUSED rather than silently half-enabling a held group.

**Two bugs the tests caught that review did not:**
1. The competitor-name ban checked only `group.rsa`, never `group.rsaVariantB` — a competitor
   name could have shipped in variant-B copy. Found by writing a test that tried it.
2. `validateCompetitorDestinationInventory` pinned exactly nine ads by resource name, so adding
   a tenth per group turned the live verifier **UNSAFE**. Fixed by treating the allowlist as a
   subset and validating every additional competitor ad against the same tracked destination —
   widening the count alone would have left the new ads unchecked. This is the third time this
   project has hit "change a contract, change its verifier in the same pass".

**Hypothesis:** Same as the first pass. Competitor delivery is currently zero, so this is
groundwork, not an expected performance change.

**Metric + date:** No competitor read is meaningful until that campaign gets impressions — it has
had zero since launch, which is a bid problem, not a copy problem. Do not judge competitor copy
on zero data.

**Outcome:** _pending._

**Promoted to rule:** yes — variant B mandatory, and the Core-only scope of the shared-headline
cap, are both documented in `.claude/rules/google-ads-copy.md`.

---

## 2026-08-06 (third pass) — first search-term harvest

**What shipped:** 11 mined keywords into existing groups, 4 waste negatives. 121→143 positive,
229→253 negative. Full detail in commit `62548d2`.

**Hypothesis:** Real served queries beat planner guesses. Adding exact/phrase coverage for terms
Google already matched loosely should improve relevance and capture the impressions currently
leaking.

**Metric + date:** Re-run `mine-search-terms.mjs` next cycle. Watch whether the 4 negatives
actually stop the apparel/photo-lab impressions, and whether the 11 new terms pick up clicks.

**Outcome:** _pending._

**Promoted to rule:** no rule change — this is the cadence working as designed.

### Not acted on, deliberately — evidence recorded for the next pass

- **Decals have real demand and no ad group.** "clear window decals for business" (2 imp),
  "custom boat decals", "boat decals near me", "decals saskatoon" — 5 impressions across 4
  queries, and both `/products/window-decals` and `/window-decals-saskatoon` already exist.
  **This is the strongest Phase 2 ad-group candidate.** Not built now because the documented
  Phase 2 evidence gate is T+14d and we are at T+1d; 5 impressions is not yet a decision.
- **Competitor names leaking into Core.** "print baron saskatoon" (3 imp), "labels made easy"
  (2), "mister print saskatoon", "vista print banner" — all Saskatoon competitors NOT in the
  nine-competitor list, so Core has no routing negative for them. Note "vista print banner"
  slipped past the `vistaprint saskatoon` negative because of the space. Fixing this properly
  means extending COMPETITOR_GROUPS, which also creates conquest keywords — a structural change,
  not a quick negative. Low urgency: CA$0.00 spend so far.
- **Left alone on purpose:** "photo printing saskatoon" (photo posters are a real product from
  $15), "business cards canada" (national intent but a genuine BC query), "24 hour flyer
  printing" (rush intent; does not collide with the `24 hour signs` competitor negative).

**Resolved:** the earlier worry that delivery was concentrating on `/printing-prices-saskatoon`
was a viewport artifact of the screenshot. The 5 clicks are spread across four ad groups —
stickers, sign shop, generic price, and stickers again. Not a routing problem.

---

## 2026-08-06 (fourth pass) — Decals ad group + 3 new competitors, routed to orderable pages

**What shipped:**
- **New Core ad group `Decals` → `/products/window-decals`** (the orderable configurator, not the
  SEO page). Terms: decals saskatoon, clear window decals for business, custom boat decals, boat
  decals near me, window decals saskatoon, custom decals. Built from harvest evidence, ahead of
  the T+14d gate, because the destination already existed and the queries were being absorbed by
  looser groups.
- **3 new Competitor groups**: Print Baron, Mister Print, Labels Made Easy. Plus `vista print`
  (spaced) added to the Vistaprint group — it had been slipping past the `vistaprint` negative.
  Because Core's campaign negatives derive from the competitor list, this blocks the Core leak
  and captures the conquest query in one edit.
- `rsa` (variant A) is now **optional**. Groups created from here ship variant B alone rather than
  inventing a vague legacy ad to sit beside good copy. `rsaVariantB` stays mandatory.
- Registered `$11/sqft` (window decal T1 rate) — the validator rejected the decal copy until the
  fact had a source, which is the registry working exactly as intended.

Counts: 20→24 ad groups, 40→44 ads, 143→159 keywords, 253→262 negatives.

**Three defects found during this pass, all by tooling rather than review:**
1. `apply-sync` built a planned RSA entry even when `group.rsa` was absent, so the dry run planned
   8 ads for 4 new groups and crashed on an undefined payload. **Caught by dry-run-by-default
   before it touched the account** — the single best argument for that default.
2. `export-google-ads.mjs` assumed every group has `rsa` and only ever exported one ad per group,
   so variant B was missing from the Editor CSV artifacts entirely.
3. **`apply-sync` never synced campaign-scoped routing negatives at all.** Only account negatives
   were diffed. Core's competitor negatives existed live purely because the original Editor import
   created them — so adding a competitor to the contract silently failed to block it on Core, and
   `sync-plan` reported clean while the drift was real. Fixed in both scripts; the 4 missing
   negatives were then created.

Defect 3 is the serious one: a diff tool that cannot see a whole class of object will report
"in sync" forever. Worth checking whether any other contract field has the same blind spot.

**Hypothesis:** Decals had demand and nowhere to land. Competitor leakage was costing Core
impressions on navigational queries that will never convert there.

**Metric + date:** Next mining run — do decal terms pick up clicks, and do print baron / mister
print / labels made easy stop appearing in Core's search terms?

**Outcome:** _pending._

**Promoted to rule:** yes — `rsa` optional / `rsaVariantB` mandatory is in the rule file.

---

## 2026-08-06 (fifth pass) — the blind-spot audit, and the assets that were never live

**The finding that matters:** the previous entry flagged that a diff tool blind to one class of
object reports "in sync" forever, and asked whether anything else had the same hole. It did, and
it was worse than the negatives case.

**The sitelinks and callouts rewritten earlier that day were never live.** `apply-sync` has no
asset authority and `sync-plan` never queried assets at all, so the account kept serving
"Exact Online Pricing", "Rush Options Available", and "Configure and order locally" on every
impression while every check reported clean. The copy work was real in the repo and cosmetic in
the account.

**What shipped:**
- `sync-plan` now reports **asset and destination drift** it cannot fix, in its own clearly
  separated section, with an explicit warning that a clean SUMMARY does not cover it. Silence
  used to read as "in sync" when it only meant "not looked at".
- It reads through `campaign_asset`, not `asset` — an asset linked to no campaign serves nothing,
  and reporting it as drift is noise. Noise is how a warning list gets ignored.
- New `scripts/google-ads/apply-assets.mjs` — the **fourth and final mutation authority**, scoped
  strictly to extension assets. Creates assets, links them, and unlinks stale ones. It never
  deletes an asset, only the link, so every removal is reversible by re-linking.
- Applied: 11 assets created, 33 links added, 33 stale links removed. Drift 16 → 0. Every
  serving callout and sitelink now carries a real price.
- Also now detected: ad-group destination drift, so a slug retired out from under a live ad group
  shows up in the diff rather than only in the separate destination check.

**Outcome:** confirmed live — 6 sitelinks and 6 callouts serving, all price-anchored, readback
clean, launched verifier zero safety failures.

**Promoted to rule:** yes — the blind-spot lesson is now the first row of the known-traps table.

**Still not covered by any diff, recorded honestly:** live ad *content* is compared by count, not
by text. If someone edited an RSA's headlines in the Google Ads UI, nothing here would notice.
Lower risk than the asset gap (ads are not hand-edited in this workflow) but it is the same class
of hole and remains open.

---

## 2026-08-06 EOD — first real read, and two corrections

**Outcome (partial, writing back as promised):**

| | Aug 5 | Aug 6 |
|---|---:|---:|
| Core spend | CA$6.89 | CA$13.72 |

Delivery roughly doubled day over day. 13 clicks / 124 impressions / CA$20.62 across 2 delivering
days. Competitor still zero. Too early to attribute the lift to copy versus the 11 new keywords —
both landed the same day, and that confounding was avoidable if they had shipped a day apart.
**Lesson for the next cadence: change one thing per day when the sample is this small.**

**Correction 1 — the burn rate was wrong.** `pacing-report.mjs` divided spend by days since
PILOT_START (Aug 3) while campaigns went live Aug 5, so two zero-spend days halved the apparent
rate. Real burn CA$10.31/day, not CA$5.15. Projection CA$443, not CA$232. Fixed to measure over
delivering days and to print per-day spend so a trend is visible instead of buried in an average.

**Correction 2 — the diagnosis flipped.** Every earlier note called this a thin market where no
lever helps. The live data says **budget-limited**: 32.1% of impression share lost to budget, and
Aug 6 spent CA$13.72 against a CA$14/day budget. Raising the daily budget is now the
evidence-justified lever, and it is the first one the data has ever supported.

**Promoted to rule:** the "thin market, no bid fixes it" line in `google-ads-copy.md` now has to
be read against live lost-IS, not assumed. An average computed over the wrong denominator will
happily confirm whatever you already believed.

---

## 2026-08-07 — Core CA$18 -> CA$21, two negatives, and a diagnosis that flipped back

Three delivering days (Aug 5–7): CA$29.08, 150 impressions, 18 clicks, **12% CTR**,
CA$1.62 avg CPC, 0 conversions. Per-day: Aug 5 CA$6.89 · Aug 6 CA$18.09 · Aug 7 CA$4.09 (partial).

**Correction 3 — "budget-limited" was right for one day, then stopped being the story.**
The Aug 6 note promoted budget to *the* evidence-justified lever on 32.1% lost IS (budget).
That raise (14 -> 18) worked: budget loss fell **32.1% -> 8.6%**. But the same window shows
**60.2% of impression share lost to RANK** — seven times the remaining budget loss. Average burn
is CA$9.69/day against CA$22/day of already-enabled capacity, so on most days the account cannot
spend the budget it already has. Aug 6 alone capped out (CA$18.09 vs CA$18).

Raised Core 18 -> 21 anyway — the cap-out is real evidence and it is the cheap lever — but
recorded the honest expectation in the contract comment: **this is a small lever.** Enabled total
is now CA$25/day, exactly at `MAX_UNMONITORED_DAILY_BURN_CAD`. Any further raise requires lifting
that safety bound, which is a deliberate decision, not a pacing reflex.

**Do not read a weak pacing response as the raise failing.** Read it as confirmation that rank,
not budget, is binding. The next lever to evaluate is the CPC ceiling (CORE currently CA$4) —
but not during Maximize Clicks calibration, and not before the learning week closes.

**Negatives added (2): "canvas", "shirt printing".** Both verified against the catalog, not
assumed:
- `canvas` — zero references in `products.v1.csv` or `products-content.ts`. No canvas capability.
- `shirt printing` — the Aug 6 `t shirt` / `tshirt` phrase-negatives do **not** block
  "shirt printing saskatoon" (neither substring occurs in it). Apparel intent was leaking
  through a second door the first pass never closed.

**Rejected the miner's own recommendations.** `mine-search-terms.mjs` flagged
`photo printing saskatoon`, `professional sticker printer`, and `business card price list` as
negative candidates on the "spend > 0, conversions = 0" rule. All three are core products —
stickers are the strongest commercial category on the site. **The miner cannot see conversions
because ad-attributed conversion upload has never fired**, so its zero-conversion signal is
currently meaningless and will flag every good keyword equally. The script warns about this
itself; heed the warning. Negating those three would have cut the best traffic in the account.

**Also NOT negated:** every boat term (`boat hull registration numbers`, `custom boat decals`,
`boat decals near me`). Boat registration numbers are a real product — 45 references in
`products-content.ts`.

**Promoted to rule:** a waste-mining rule keyed on conversions is inert until conversion upload
is proven live. Until then, verify every negative against the product catalog, not against the
conversion column. Same failure shape as Correction 1 — a metric computed on a signal that cannot
yet exist will confirm whatever you already believed.

**Applied:** `apply-sync.mjs --execute` created 12 campaign negatives (readback 281 negative
criteria); `apply-budgets.mjs --execute` set Core CA$21/day (readback clean, Brand still PAUSED).
Post-apply `sync-plan.mjs` re-diff: **zero**. Validator VALIDATED, 96/96 ads tests pass,
8 generated artifacts deterministic.

**Untouched and still open:** `CompetitorConquest` is ENABLED with 0 impressions / 0 spend across
all three days while competitor queries (`print baron saskatoon`, `mister print saskatoon`,
`77 signs saskatoon`) draw impressions on Core instead. That is both a routing fault and the
untapped delivery capacity the pacing gap needs. Diagnose after the learning week.

---

## 2026-08-07 PM — CompetitorConquest zero-delivery diagnosis: the fix already shipped yesterday

Diagnosed the open item from this morning's entry ahead of schedule because zero delivery on an
ENABLED campaign smelled like a fault. It mostly wasn't. Full-stack live read (campaign, ad
group, ad, keyword, criterion, change_event layers) via a scratchpad read-only script against
`gaql-read.mjs`. **No mutation applied — the evidence says wait, so nothing was touched.**

**Hypotheses tested, in order:**

1. **Status/approval suppression — REFUTED.** Campaign ENABLED/SERVING/LEARNING
   (`BIDDING_STRATEGY_LEARNING` only). All 21 RSAs `REVIEWED`/`APPROVED`/`ELIGIBLE` — including
   all nine shared-payload conquest ads. All 13 positive keywords ENABLED/ELIGIBLE, zero
   `LOW_SEARCH_VOLUME` flags. Live CPC ceiling confirmed 2,500,000 micros = CA$2.50. Geo is
   PRESENCE + 35km proximity, Google Search only, all devices, English. Landing page
   `/why-true-color?source=google-ads` re-verified HTTP 200 today. Nothing is suppressing this
   campaign.

2. **CPC ceiling too low (lost IS rank) — UNTESTABLE, not confirmed.** A campaign with zero
   impressions has **no impression-share rows at all** — the metric that would prove
   rank-loss cannot exist yet. Anyone raising the ceiling today would be bidding against a
   number that does not exist. Blocked anyway by the learning-week discipline in this
   morning's entry.

3. **Core absorbing the traffic — TRUE, and already fixed.** `change_event` shows the four
   2026-08-06 harvest keywords (`print baron saskatoon`, `mister print saskatoon`,
   `labels made easy`, `vista print`) were created on Competitor at **Aug 6 15:57** and their
   PHRASE routing negatives on Core at **Aug 6 15:58**. Every observed leak — `print baron
   saskatoon` (3 imp), `mister print saskatoon` (1), `labels made easy` (2), `vista print
   banner` (1) — is dated **Aug 6, before that sync**. Aug 7 search terms on Core: **zero
   competitor-brand queries**. The leak this morning's entry flagged was a timing artifact of
   the harvest itself, not a live routing fault. All 13 competitor terms verified present as
   live PHRASE negatives on Core.

4. **Near-zero volume — SUPPORTED for the original 9, refuted for the new 4.** Three delivering
   days produced zero observable queries for qwik-signs/minuteman/ink-house/rayacom/24-hour/
   anytime/pgi/staples/vistaprint anywhere (their Core negatives existed from launch, and no
   close variant leaked into Core's search terms either). Meanwhile the new 4 have **proven
   demand** — 7 impressions on Aug 6 alone. The conquest opportunity is concentrated in the
   terms harvested from real search-term data, which is exactly what the "never from planner
   guesses" rule predicts.

**Conclusion: there is no fix to make today.** The routing fix shipped Aug 6 15:58; the
campaign has had barely one day of fair eligibility on the only terms with proven volume.
Pausing now would kill the test one day after it started being a test. Bidding changes now
would confound the routing fix and violate change-one-thing-per-day.

**Decision gate (earliest ~2026-08-12, after the learning week):**
- If Competitor has impressions by then → IS rows exist → read lost IS (rank) and evaluate the
  CA$2.50 ceiling on evidence.
- If still zero impressions AND Core's search terms stay clean of competitor queries → the
  proven-volume terms went dark too; conclude thin volume and pause the campaign rather than
  manufacture delivery (broadening is blocked by contract).
- The original 9 groups cost nothing while idle; no reason to prune them before the gate.

**Also observed, deliberately left alone:** `77 signs saskatoon` (1 imp on Core, untargeted
competitor). One impression is not evidence; adding a conquest target is a contract change
that should ride the next harvest cadence if the query recurs.

**Verification chain (clean state confirmed, no apply):** validator VALIDATED / errors [],
96/96 ads tests, 8 artifacts deterministic, `sync-plan` re-diff zero including asset/destination
drift.

**Promoted to rule:** a zero-impression campaign produces **no** lost-IS data — "check lost IS
rank" is only a valid instruction after the first impression exists. Absence of IS rows is
itself the finding: the campaign never entered a recorded auction.

---

## 2026-08-07 PM (2) — GA4 was polluted 5:1 by our own e2e suite; funnel read is now clean

**The find:** the paid-journeys Playwright spec navigates production with synthetic paid params
(`utm_campaign=tc_core`, `gclid=test-click-123`) and GTM fired real GA4 hits on every run —
10–29 fake "google / cpc" sessions per day since at least Jul 20, outnumbering real ad clicks
~5:1. Every GA4 paid-segment read before today silently included them. Fixed at the source
(analytics domains now blocked in the spec's browser context) and at the read (new report
excludes `tc_core` and counts it as a pollution watch — 20 synthetic sessions in the Aug 5–7
window; expect zero going forward).

**New tool:** `scripts/google-ads/paid-funnel-report.mjs` — read-only, joins per-ad-group
spend/clicks (GAQL), real post-click funnel events per landing page (GA4, synthetic excluded),
and conversion-outbox state. Run via `railway run` at each cadence alongside `pacing-report`.

**First clean funnel baseline (Aug 5–7, 21 clicks, CA$35.37):**
- `/products/stickers`: view_item → add_to_cart → **begin_checkout** — one real clicker from
  `sticker printing saskatoon` got one step from purchase. The configurator funnel works.
- `/products/business-cards`: 2× price_calculated. Engaged.
- `/printing-prices-saskatoon`, `/sign-company-saskatoon`: sessions but no funnel events —
  these SEO-page destinations show no measurable progression yet. Watch, don't react (n=2).
- Outbox: 1 purchase in window (CA$28), not ad-attributed. 0 attributed conversions at
  21 clicks = sample size; pipeline verified armed.

**Destination decision (owner raised it):** owner suggested repointing the
`/printing-prices-saskatoon` ad to the homepage. Kept as-is, with owner-visible reasoning:
Generic Print Price is the top ad group (71 imp / 8 clk, ~40% of Core spend), the page answers
the exact price intent of its queries, and a final-URL change mid-calibration recreates the ad
(new ID, policy re-review, serving-history reset) while the Maximize Clicks strategy is on day 3
of its ~7-day learning window. Queued instead: post-pilot improvement wave tightening the page's
paths to configurators (several links currently route to SEO pages first). Revisit at the
2026-08-12 gate with funnel data.

**Also shipped:** `/why-true-color` grid expanded 6 → 8 cards (ACP $39, vehicle magnets $25 —
both verified against pricing-comms anchors); page contract test and e2e spec updated in the
same pass. Landing content is not part of the ads contract, and CompetitorConquest has zero
traffic, so this is trial-neutral.

**Promoted to rule:** any test or monitor that touches production URLs with paid-looking
params MUST block analytics ingestion (route-abort GTM/GA domains) — and any GA4 paid read
MUST exclude known synthetic markers. A funnel report that cannot distinguish its own test
traffic reports whatever the test suite does, not what customers do.

---

## 2026-08-07 PM (3) — Enhanced conversions implemented; the UI toggle alone was inert, and naive implementation would have caused an outage

Owner enabled "Turn on enhanced conversions" (method: Google Ads API) in the Google Ads UI and
asked whether it was actually tracking. It was not, and the reason matters.

**The upload sent no user data at all.** `buildDataManagerRequest` attached only `adIdentifiers`
(gclid/gbraid/wbraid). Enhanced conversions is entirely a function of what the API *sends* —
ticking the box changes nothing until hashed contact details ride along with the conversion.

**The trap that would have caused an outage.** Verified live with byte-identical `validateOnly`
payloads on 2026-08-07:

| Payload | Result |
|---|---|
| with `userData` | **HTTP 400** `DESTINATION_ACCOUNT_ENHANCED_CONVERSIONS_TERMS_NOT_SIGNED` |
| without `userData` | **HTTP 200** accepted |

Google rejects the **entire request**, not just the userData block. Shipping unconditional
userData would have turned a measurement upgrade into a **conversion-upload outage**, discovered
only when the first real ad sale silently failed to land. `acceptedCustomerDataTerms: true` reads
true on the account (GAQL-verified) — **customer data terms and enhanced-conversions terms are
different acceptances.** The UI showing "Customer data terms: Accepted" does not mean EC is armed.

**What shipped:**
- Normalization + SHA-256 hex hashing with the rules Google actually matches on: trim, lowercase,
  gmail dot/plus canonicalization, phone → E.164. **Hashing unnormalized text yields a
  valid-looking digest that matches nothing, with a 200 OK** — same silent-failure shape as
  Correction 1 and the miner's conversion column.
- Request-level `encoding: "HEX"`, required whenever userData is present. Omitting it makes Google
  read hex digests as Base64 — another silent zero-match.
- **Self-healing fallback:** on the EC-terms violation specifically, the uploader retries once
  without userData. Unrelated failures do NOT retry. Consequence: conversions keep landing today,
  and enhanced conversions begin working the instant the owner accepts the terms — no redeploy,
  no config flip, no coordination.
- Identifiers are resolved at **upload time** from `orders` → `customers` and never persisted.
  The outbox stays a queue, not a second PII store. Coverage measured: **54/54 orders since Jul 1
  have a resolvable email**, 37/54 a phone.
- `paid-funnel-report.mjs` now probes and prints EC readiness (LIVE / INERT + the exact fix), so
  this state can never again be assumed from a UI screenshot.

**Owner action still required (2 clicks, cannot be done via API):** Google Ads → Goals →
Settings → Enhanced conversions → accept the **terms dialog** → Save. The report says INERT until
then. Nothing else is blocked by it.

**Not implemented, deliberately:** *Enhanced conversions for leads* (shown "Not configured yet").
That variant uploads conversions with **no click ID**, which would attribute the phone-in and
manual orders that are ~80% of gross charges — the single largest known attribution gap. It is
also a materially different privacy posture (sending customer PII for orders that never touched
an ad) and needs its own conversion action. **Owner decision, not a code change.** Flagged here so
it is chosen rather than drifted into.

**Promoted to rule:** a third-party toggle is not evidence of a working integration. Probe the
API with `validateOnly` and assert the result — and when adding an optional field to a request
that can fail the whole call, ship the fallback in the same commit as the field.

---

## 2026-08-07 PM (4) — Google Ads tag installed; EC live; and a correction to entry (3)

**Correction 4 — entry (3) said enhanced conversions for leads "would attribute the phone-in and
manual orders that are ~80% of gross charges." That is WRONG and the reasoning was lazy.**
EC for leads works by tagging a **form submission** with hashed contact data, which is what links
the email to the ad click; the later offline upload matches on that email. **A phone call never
submits a form**, so there is nothing to match against and EC for leads does nothing for phone-in
orders. The correct instrument for those is call conversion tracking — `qualified_call_60s`
(AD_CALL, 7694360843), already wired to the call asset and APPROVED. EC for leads only helps the
narrower case of a *form* lead whose click ID was lost. Same failure shape as Corrections 1–3:
a plausible mechanism asserted without tracing whether the trigger can physically fire.

**Root cause found while installing the tag: the site had NO Google Ads presence at all.**
`buildGoogleTagBootstrapScript` derived the Ads tag ID *from a purchase conversion label*. No
label was ever issued, so `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL` was unset and the
`AW-` config never emitted — the site ran GA4-only since launch. Every discussion of "enhanced
conversions for leads" was moot: there was no tag on the page to collect anything. Fixed with
`NEXT_PUBLIC_GOOGLE_ADS_TAG_ID` (AW-18330693756), independent of any conversion action; the
label path still works unchanged. One `gtag.js` load serves both destinations.

**CSP would have made the install a silent failure.** `googleadservices.com` and
`googleads.g.doubleclick.net` were absent from `script-src`/`connect-src`. The tag would have
installed, reported healthy in the Google Ads UI, and had its conversion pings dropped by the
browser. Added both (additive only — no existing directive weakened). **The Google Ads UI cannot
see a client-side CSP block, so "tag installed" in that UI is not evidence the tag works.**

**Verified live, not assumed** (`curl` against production, GAQL against the account):
- `gtag('config','AW-18330693756')` + `gtag('config','G-6HMQT7MNLL')` both in served HTML
- CSP response header carries `googleadservices.com`
- `acceptedCustomerDataTerms: true`, `enhancedConversionsForLeadsEnabled: true`
- Enhanced conversions probe: **✅ LIVE** — hashed identifiers accepted
- 5 enabled conversion actions; `purchase_online` + `quote_won` primary and counted

**Still not built, and now correctly scoped:** a lead-conversion tag firing on quote submit. The
EC-for-leads toggle is on but has nothing to collect until that ships. Deliberately deferred —
`quote_requests` already captures `gclid` first-party (39 quotes since Jun 1), so most of that
value is reachable without it. Revisit after the 2026-08-12 gate.

**Promoted to rule:** when a client-side vendor tag is added, allowlist its domains in CSP in the
same commit and verify from the **served HTML and response headers**, not the vendor's dashboard.


## 2026-08-07 PM (5) — Core ceiling CA$4 -> CA$5 on rank evidence; owner UI drift reverted; 25 live ads carry a stale $35 design price

**Ceiling raise, taken on the evidence the rationale demanded.** Lost IS (rank) 60.2% vs lost IS
(budget) 8.6% on Core over Aug 5–7 — auctions existed and were lost on rank, not thinness. Owner
approved; Core `target_spend.cpc_bid_ceiling_micros` 4.00 → 5.00 CAD, applied via `apply-budgets`
(scope widened to ceilings — they had the same no-mutation-path gap budgets had before Aug 6).
Caveat recorded: 184 impressions is a small sample. Judge at the Aug 12 gate on fresh lost-IS,
and expect avg CPC to drift up — the win condition is more impression share at acceptable CPC,
not cheaper clicks.

**Owner UI drift, found by dry-run diff, attributed by `change_event`.** At 11:41–11:43 the owner
(web UI) raised Competitor's budget CA$4 → CA$10 and enabled Brand's ad group + one Brand RSA.
Competitor has zero impressions, so the budget bought nothing and pushed enabled daily to CA$31 —
over the CA$25 blast-radius bound. Reverted to contract (CA$4). Brand children re-paused via new
`hold-brand.mjs` (sixth authority, pause-only, Brand-only). The held-children rule is
defense-in-depth: if Brand's campaign is ever accidentally enabled, paused children still serve
nothing. Lesson: **the account has a second author (the owner in the UI). Run the apply-* dry
runs at the start of every ads session — the diff is the drift detector.**

**🔴 OPEN: 25 of 45 live ads say "In-House Design $35 Flat" / "$35 flat, same-day proof" — the
shop has charged $40 flat since 2026-08-06.** The contract copy was corrected to $40 the same
day, but apply-sync is create-only and ad content is the documented count-not-text blind spot,
so every RSA created before the correction still carries $35 live. Includes ENABLED Core groups
receiving real clicks (Large Format, Decals, Boat Registration). This is the exact "ad quoting a
price the shop no longer charges" consumer-trust problem the price-staleness rule exists for —
but fixing it means updating RSA assets in place, which sends all 25 ads (9 of them Competitor
copy, the riskiest to resubmit) back through policy review mid-pilot. Owner decision required:
update now and eat the review-window delivery risk, or batch it with the next copy pass.

---
<<<<<<< HEAD
---

## 2026-08-07 — Search-term routing correction: photo posters + Staples conquest

**What shipped:**
- Added a new Core ad group, `Photo Posters`, for mined `photo printing saskatoon` demand.
- Routed it to `/photo-poster-printing-saskatoon` with variant-B-only copy: photo posters from $15, matte photo prints, local Saskatoon printing.
- Added sourced `$15` photo-poster price to `approved-claims.mjs` from `PRICING_QUICK_REFERENCE.md` and `products.v1.csv`.
- Added `staples saskatoon printing` to the existing Staples conquest group, while adding the same phrase as a Core campaign negative so it routes to `/why-true-color?source=google-ads` instead of Generic Print Price.
- Kept `signs saskatoon`, `professional sticker printer`, `photo printing saskatoon`, and Staples/comparison wording live as legitimate demand; only `3d printer` stayed blocked as hard mismatch.

**Hypothesis:** The issue was routing, not waste. Photo-printing clicks should see a product-specific photo-poster page; Staples shoppers should see the premium/local comparison page; sign/sticker terms should keep serving because they are real buyer language.

**Metric + date:** Check search terms and GA4 funnel after 20 additional clicks or by 2026-08-12: photo terms should land on `/photo-poster-printing-saskatoon`, Staples query should land on `/why-true-color`, and Generic Print Price should stop absorbing those two intents.

**Outcome:** _pending — write this back after the next search-term read._

**Promoted to rule:** no — still an experiment. Candidate rule if it works: mined legitimate demand should become its own destination split before being labeled waste.
=======

## 2026-08-09 — CompetitorConquest RETIRED; four pre-existing drift items surfaced by the same pass

**Owner call, taken three days before the 2026-08-12 gate.** The gate's own stop-condition was
already satisfied, so this is the documented branch firing early, not an override of it: Competitor
delivered **0 impressions / 0 clicks / CA$0.00** across the entire pilot (2026-08-03..08-09), and
Core's search terms stayed clean of competitor queries after the Aug 6 15:58 routing sync. The
2026-08-07 diagnosis said "if still zero impressions AND Core's search terms stay clean → conclude
thin volume and pause". Both halves held.

**Executed through a new authority, not the UI.** `scripts/google-ads/retire-competitor.mjs` is the
**seventh mutation authority** — pause-only, Competitor-only, cannot enable/create/remove anything.
It fails closed on two guards before touching a thing: campaign-name identity, and a metrics read
that **aborts if impressions > 0** (if it ever started delivering, that is a live judgement call
with real lost-IS rows, not a gate outcome). Readback confirmed campaign + 12 ad groups + 21 ads
all PAUSED. The UI was deliberately not used — owner UI edits are the exact second-author drift
that had to be reverted on 2026-08-07.

**Contract + verifier changed in the same pass** (the rule that keeps getting paid for): config
Competitor → `status: PAUSED`, `maximumPilotCad: 0`, children PAUSED, tier `RETIRED_THIN_VOLUME`;
validator `EXPECTED.COMPETITOR` + tier expectation; `LAUNCHED_EXPECTED_CAMPAIGNS` → PAUSED; launched
counts enabled 24→12 groups / 43→22 RSAs and paused 1→13 / 2→23. 96/96 tests, validator VALIDATED,
8 artifacts deterministic.

**`expectedNonBrandChildStatus` had to be split into `expectedCoreChildStatus` +
`expectedCompetitorChildStatus`.** One knob stopped being expressible the moment Core children were
ENABLED while Competitor children were PAUSED. Collapsing them back into one would silently stop
checking one of the two — the same shape as every other blind spot in this log.

**`/why-true-color` did NOT fail — it was never tested.** The page was built for these nine ads, and
those ads served zero impressions, so it never received a single paid click from the campaign it
exists for. "The landing page isn't working" is unproven, not proven. It stays live (200, noindex,
paid-marker present, 8-card product grid). Its next legitimate test is as a destination for
**Generic Sign Shop**, which spent CA$13.87 over 8 clicks on `/sign-company-saskatoon` and produced
**zero funnel events** — a page that IS getting paid traffic and failing. That is a destination
experiment and must ship on its own, not bundled with this retirement.

### The "drift" was a stale local clone, not drift — corrected before push

The first pass of this entry claimed four pre-existing drift items, including an undeclared
"Photo Posters" Core ad group "created outside the contract". **That was wrong, and the error is
worth keeping.** Every one of those gaps was this Mac's clone being one commit behind `origin/main`.

`6c9d0fe "Route mined paid-search demand by intent"` (ZaraBot VPS, 2026-08-07 21:03Z) adds the
`photo-posters` Core ad group routing "photo printing saskatoon" to
`/photo-poster-printing-saskatoon`, plus the keyword and negative changes, and it updates the
verifier counts to match. `change_event` had already said the group was created via
`GOOGLE_ADS_API`, not the web UI — that was the tell, and it was read as suspicious rather than as
evidence of a legitimate apply-sync run from the other machine.

After rebasing onto it, everything reconciles exactly and the account has **no drift at all**:

| | Contract (post-rebase) | Live | |
|---|---|---|---|
| enabled ad groups | 13 Core | 13 | ✅ |
| paused ad groups | 12 Competitor + 1 Brand | 13 | ✅ |
| enabled RSAs | 23 Core | 23 | ✅ |
| paused RSAs | 21 Competitor + 2 Brand | 23 | ✅ |

**Promoted to rule (the real lesson):** this repo has two authors on two machines — this Mac and
the ZaraBot VPS — and both run `apply-*` against the same live Google Ads account. `git fetch`
BEFORE reading the live account, not after. A live account that disagrees with the contract is far
more likely to be a stale checkout than rogue drift, and "the account has an undeclared ad group"
is a serious accusation to get wrong. The verifier was right the whole time; the clone was stale.

**Promoted to rule:** a status-only mutation is the cheapest possible way to discover inventory
drift, because it forces the verifier's count assertions to be re-derived from the contract. Run
`validate:google-ads:launched` after every retirement or hold — it reports what the account really
has, not what the last green check remembered.
>>>>>>> aa5d405 (feat(ads): retire CompetitorConquest — seventh mutation authority, pause-only)

---

## 2026-08-09 (2) — the stale $35 design price, fixed without a delivery gap; 20 keywords landed

**Two things shipped after the Competitor retirement, same session.**

### 20 contract keywords were staged but never live

`sync-plan` reported 20 keywords in the contract and absent from the account — the tail of the VPS
`6c9d0fe` session, where the config was committed but `apply-sync` never ran. Applied: 32 criteria
created, readback **164 positive / 292 negative — exactly the contract**. Flyers, Generic Print
Price, Generic Sign Shop, Decals, and Boat Registration were all targeting fewer terms than the
contract said for two days. Nothing alerted, because a keyword that was never created cannot drift.

### The stale-price fix: 12 ads, zero delivery gap

Scope was smaller than the Aug 7 entry feared — **the retirement did half the work**. Of 25 ads
quoting `$35`, 13 were Competitor + Brand and are now PAUSED, serving nothing. Only **12 ENABLED
Core RSAs** actually needed replacing, and the riskiest group (the nine Competitor RSAs the Aug 7
entry did not want to resubmit) had already left the serving set.

**`replace-stale-price-ads.mjs` is the eighth mutation authority.** Two phases, because Google RSA
text is immutable — "editing" copy is always create-new + retire-old, and every new ad enters
policy review:

- `--create` builds the replacement **from the contract** and creates it **PAUSED**. It reviews
  while the stale ad keeps serving. Nothing stops delivering, and nothing starts either.
- `--swap` waits for `APPROVED`/`REVIEWED`, then enables the replacement and pauses the stale ad in
  **one atomic mutate** — no delivery gap, and no window where both prices serve.

This is the answer to the open question the Aug 7 entry left: it framed the choice as "update now
and eat the review-window delivery risk, or batch it later". Both options were avoidable. The
delivery risk only exists if you edit in place.

**Staleness is decided against the contract, NOT by grepping `$35`.** `$35` is a *legitimate live
price* — postcards start at $35 — so a `$35` grep would eventually mangle a correct ad. Instead every
live ad is fingerprinted (order-independent, since Google returns assets in serving order) and
compared to its own ad group's contract copy:

| classification | action |
|---|---|
| matches variant A | legacy control arm — **never touched** (google-ads-copy.md) |
| matches variant B | already current — skipped |
| matches neither | stale — replaced with contract variant B |

Live classification confirmed the model exactly: 23 Core ads = 10 variant A + 1 already-current
(Photo Posters, created *after* the Aug 6 correction) + 12 stale. This generalises — it catches any
copy drift from contract, not just this one price.

**Fails closed on:** contract copy that itself still quotes a retired design price (otherwise the
tool republishes the bug as the fix), live ad groups missing from the contract (a stale clone, per
the previous entry), and any replacement Google has not yet cleared.

**Promoted to rule:** `apply-sync` diffs ads by **count**, not content, so corrected copy in the
contract reaches the account only if the ad count also changes. It never does for a price edit.
Any pricing change must be followed by `replace-stale-price-ads.mjs --create`, or the corrected
price lives in git and the retired one keeps serving. Three days of `$35` is the cost of learning
this once.

### 🟡 Left open deliberately — the 12 paused stale ads

`--swap` **pauses** the stale ad rather than removing it. That keeps the change reversible, but it
means the account permanently carries 12 paused ads the contract does not describe, so the launched
verifier will report ad-count drift until someone decides. Removing them is the only end state that
matches the contract exactly — that is an owner call, not an automated one, and it was deliberately
not taken here. Until then, expect `validate:google-ads:launched` to flag RSA counts.

---

## 2026-08-10 — negatives pass (80 criteria) from the first full search-term audit; sync-plan was blind to cross-negatives

**Account change of the day.** Applied 72 campaign negatives (12 account-level terms ×EXACT+PHRASE×3)
+ 8 PHRASE crossNegatives fencing Generic Print Price. Readback 164 positive / 372 negative — exactly
contract; post-apply re-diff zero. Evidence base: search-term mining showed `printing saskatoon`
[PHRASE] carried 23.4% of spend and was the sole entry point for every off-catalog query in the
account (staples, mr print, 3d printer, wedding invitations, shirt printing, art prints…), with
~CA$55 of the remaining CA$510 projected to leak unfenced. The fence is additive — no keyword was
removed or demoted; match-type demotion of `printing saskatoon` waits for post-fence data.

**Added (account):** feather flag · walmart · mr print · print bros · pro print · lindas printing ·
77 signs · stickermule · cd label · who makes · print your own · ideas
**Added (Generic Print Price crossNegatives):** photo printing · poster printing · sticker printing ·
banner printing · business card · flyer printing · coroplast · decal

**Held out of the proposed list, deliberately — the audit list was overzealous on capability:**
- `staples`, `rayacom` — hard-blocked by `PROTECTED_ACCOUNT_NEGATIVES` (COMPETITOR_TERMS); narrow
  variants already exist as Core campaign negatives. The validator + an existing test enforce this.
- `art print` — the shop SELLS this (gallery: "Art Print — Morris Minor", from $15, routed to
  photo-posters; the group's approved copy says "Photo & Art Poster Prints"). Negating it would
  repeat the 2026-08-07 photo-printing correction in reverse.
- `book binding` — real in-house coil-binding service per products-content.
- `invitation` — flat card/sheet printing on carried stock; same call as keeping `logo design`.
**Rule reinforced:** every negative candidate gets checked against the catalog before it ships.
An external audit list is a hypothesis, not an order.

**🔴 Tool defect found and fixed in the same pass: `sync-plan.mjs` never saw ad-group
cross-negatives.** It queried neither `ad_group_criterion WHERE negative = true` nor
`group.crossNegatives`, while `apply-sync` creates from exactly that field — so the first dry run
showed 72 of the 80 criteria the apply would create. This is the documented trap verbatim ("a diff
tool that cannot see a class of object reports 'in sync' forever") and it had been silently wrong
since the Aug 6 boat-split shipped 6 cross-negatives that never appeared in any plan. sync-plan now
queries live ad-group negatives, diffs them, reports a dedicated section, and splits the summary
(campaign + ad-group). Still read-only. The reviewer-facing preview and the mutation are now the
same shape — which is the entire point of having a preview.

**Also for the record:** `mr print` (account negative) is a spelling variant of the retired
Competitor group's `mister print saskatoon` EXACT target. No collision while Competitor is RETIRED;
if it is ever revived, revisit this negative first.

---

## 2026-08-10 (2) — outbox re-evaluation migration APPLIED to prod; pilot-window backfill complete

Applied `20260810120000_outbox_reevaluation.sql` to project dczbgraekmzirxknjvwe via the
Management API (owner-directed; recorded in supabase_migrations.schema_migrations so `db push`
will not re-apply). Live trigger definition verified verbatim against the local-cluster replay:
fires on status, paid_at, conversion_type, and all six click-ID columns.

Backfill (pilot window only, paid_at >= 2026-08-03, owner decision — pre-pilot orders stay NULL
deliberately): 3 orders repaired. TC-2026-0314 was quote-linked via
quote_requests.converted_order_id and became quote_won with the quote's 35 attribution columns
inherited (COALESCE — order-side values never overwritten); TC-2026-0309 and TC-2026-0316 became
purchase_online. The trigger fired on every UPDATE: all 5 pilot-window paid orders now hold an
outbox row (was 2 of 5). All 5 are not_attributable — none carried a click ID — so nothing
uploaded to Google; they are now visible and promotable, which is the point.

The conversion pipeline is closed end-to-end as of this entry: capture (UtmCapture) -> order
(online + staff-manual + quote-won paths all set conversion identity) -> outbox (re-evaluable,
promotable) -> Data Manager (verified solid). The remaining gap is upstream: getting a click ID
onto orders at all (7-day ITP ceiling, no server-side cookie, cross-device) — see the Aug 10
audit's capture-hardening items.

---

## 2026-08-10 (3) — Google's "remove redundant keywords" recommendation reverted the keyword apply; restored

At 01:23 Regina the owner, from the Google Ads MOBILE APP, applied Google's "remove redundant
keywords" recommendation — mistakenly, prompted by the app after the 00:24 keyword apply. It
removed 32 criteria (the EXACT/PHRASE structure Google reads as duplication), leaving the account
17 keywords short of contract including 4 of the 12 verifier-required near-me keywords. Caught
within the hour because the owner asked for a re-check and sync-plan diffed against contract;
change_event attributed it (GOOGLE_ADS_MOBILE_APP + REMOVE ×32). Restored via apply-sync:
readback 164/372 = contract, re-diff zero.

**Why the recommendation is wrong for this account:** the EXACT+PHRASE pairing is deliberate —
the mining/expansion cadence reads performance PER MATCH TYPE (it is how the `printing saskatoon`
leak was isolated), and the live verifier asserts exact inventory. Google's rec optimizes for
broad-match Smart Bidding accounts, which this deliberately is not (contract forbids broad).

**Promoted to rule — the account now has THREE authors: this Mac, the ZaraBot VPS, and Google's
recommendation engine via the owner's phone.** Never apply in-app/in-UI recommendations on this
account; DISMISS them. Any recommendation worth taking becomes a contract change through the
normal cadence. Owner action items: dismiss the "redundant keywords" card so it stops re-prompting,
and verify auto-apply recommendations are OFF (Google Ads → Recommendations → Auto-apply).
sync-plan after any owner phone/UI session is the drift detector — it caught this in minutes.
