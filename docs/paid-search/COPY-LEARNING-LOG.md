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
