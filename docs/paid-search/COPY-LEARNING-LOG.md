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
