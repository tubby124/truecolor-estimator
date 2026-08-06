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
