# Google Ads Copy — Standard, Workflow, and Known Traps

Applies to any edit of `docs/paid-search/campaign-config.mjs`, any new ad group, and every
keyword expansion. The validator enforces most of this mechanically; this file explains WHY,
so it does not get cargo-culted or "simplified" back into the trap it came from.

---

## Known traps — already paid for, do not rediscover

| Trap | The lesson |
|---|---|
| The validator banned **all** numbers, not unsourced ones | A guard aimed slightly wrong is worse than no guard. It silently enforced vague copy for months while looking like diligence. Fixed 2026-08-06 with the sourced-fact registry. |
| `brand-voice.md` mandated "+$40 rush"; the ad validator forbade it | When two rule files govern one artifact, reconcile them or one loses silently. Check for a conflicting rule before adding a new constraint. |
| RSA and keyword counts are hardcoded in the live verifier | **Change a contract → change its verifier in the same pass.** This project has already shipped a launch check that failed for the wrong reason. |
| `{ignore}` in the tracking template exists only in the Google Ads UI | Repo correctness ≠ runtime correctness. The contract does not own the tracking template. Check the running account. |
| The Landing pages report shows the *unexpanded* template | A URL that looks like a 404 in that column is not a 404. Read the **Expanded landing page** column before investigating. All 11 destinations verified 200 on 2026-08-06. |
| Day-1 CTR was 28.6% | Ads getting clicked ≠ ads converting. Do not diagnose copy when the bottleneck is post-click. |
| Forecast delivery cannot reach CA$600 | At day-1 burn the promo lands near CA$282 of the CA$600 target. Keyword volume alone will not close it. See "Pacing" below. |

---

## The copy standard

**Trigger:** writing or editing any RSA, callout, or sitelink.

**Inputs required:** the keyword's search intent; the product's from-price from
`data/PRICING_QUICK_REFERENCE.md`; the destination URL.

**`rsaVariantB` is MANDATORY on every ad group.** A config without it fails validation. This is
the structural guarantee that a new ad group cannot ship vague, number-free copy — the standard
does not depend on anyone remembering it.

**Structure — 15 headlines, 4 descriptions:**

| Layer | Count | Job |
|---|---|---|
| Price / product | 4–5 | Carry the number and name the exact thing |
| Problem / outcome | 3–4 | What the customer gets, in their words |
| Shared proof / local | **max 5 (Core only)** | Reviews, rush, design, pickup |

The shared-headline cap binds on **Core only**. Core groups answer genuinely different queries,
so shared copy there collapses Ad Relevance. The nine Competitor groups target one offer on one
landing page and may not name the competitor, so they deliberately share one payload — there is
nothing legitimate left to differentiate on. Clear ≠ unique.

**Steps:**
1. Write 4–5 price/product headlines. At least one MUST carry a from-price.
2. Write 3–4 outcome headlines in the customer's language — the job, not the form.
3. Reuse at most 5 shared proof headlines. Never more.
4. Every number must already exist in `docs/paid-search/approved-claims.mjs`. If it does not,
   add it **with a real source**, or delete the claim. Never add a token to make a headline pass.
5. `node scripts/google-ads/config-validator.mjs` must return `VALIDATED`.

**Banned as a headline:** describing the website's UI — *configure*, *upload your artwork*,
*review your configuration*, *submit your order*. Nobody searches because they want to fill in
a form. Fine as a supporting clause in a description; never the pitch.

**Never, at any price:** `guarantee` / `guaranteed`, superlatives like "lowest price", and any
turnaround claim without an attached price or condition. `NEVER_ALLOWED_PATTERNS` cannot be
unlocked by registering a token.

**Exceptions:** competitor ad groups may not name a competitor in copy. Brand stays paused.
The legacy `rsa` (variant A) on every group is live and policy-APPROVED — **do not edit it**;
it is the control arm and carries a documented exemption from the condition-qualifier rule.

---

## The expansion cadence — adding keywords every few days

**Trigger:** every 3–7 days until 2026-09-16, or when pacing falls behind projection.

1. `railway run node scripts/google-ads/mine-search-terms.mjs` — review waste, approve negatives.
2. `railway run node scripts/google-ads/pacing-report.mjs` — spend, projection, lost-IS split.
3. Pick terms from mined search terms and GSC evidence. **Never from planner guesses.** Route
   them to an ad group that is actually delivering.
4. `node scripts/google-ads/expand-keywords.mjs --group <key> --terms "..."` — prints the exact
   four-file diff including the verifier counts. Apply it by hand.
5. `npm run test:google-ads && npm run verify:google-ads-destinations` — both green.
6. `railway run node scripts/google-ads/sync-plan.mjs`, review, then `apply-sync.mjs --execute`.
   Post-apply re-diff must be zero.
7. Append to `docs/paid-search/COPY-LEARNING-LOG.md`.

**Hard rules for the cadence:**
- Every new ad group needs an `rsaVariantB`. A group without copy serves nothing.
- **Never add keywords without mining negatives in the same pass.** Expansion without pruning
  is how a fixed CA$600 gets spent on garbage instead of qualifying traffic.
- New keywords go to groups that actually deliver.
- **Pacing anxiety is not a reason to broaden.** Diagnose lost IS first.

---

## Pacing — the CA$600 reality

The promo needs CA$600 of qualifying spend by 2026-09-16. At day-1 delivery (CA$6.89) the
projection is ~CA$282. Closing the gap needs roughly double the burn, held for the full window.
Budget is not the constraint (CA$18/day enabled vs ~CA$14.46/day required) — **delivery is**.

`config-validator.mjs` hard-fails on `radiusKm !== 35`, `searchOnly !== true`, match types
outside EXACT/PHRASE, and `noBroadeningToManufactureVolume !== true`. Every documented
escalation lever is therefore blocked by contract. Levers, cheapest first:

1. Keyword expansion — free, necessary, likely insufficient alone.
2. **Unpause Brand** — cheapest qualifying spend available; distorts the non-brand baseline.
3. Raise the CPC ceiling — only if lost IS (rank) proves auctions are lost on price.
4. Search Partners — approved contract change; mildest broadening.
5. Broad match / wider radius — highest waste risk; needs Smart Bidding this account lacks.
6. Accept missing the promo — legitimate. CA$600 of credit is not worth CA$600 of bad clicks.

**Decide at the pacing gate with data, not now.** And note the endgame: `protectivePause` and
`absoluteCap` are both CA$600, so the tick that qualifies also pauses, and the earned credit
cannot be spent without a separate deliberate raise.

---

## Price staleness

`approved-claims.mjs` carries `VERIFIED_ON`. The validator compares it to the `**Updated:**`
header in `data/PRICING_QUICK_REFERENCE.md` and **fails** when pricing is newer. Ads quoting a
price the shop no longer charges is a trust and consumer-protection problem, not a style one.
When you reprice: re-check every fact in the registry, then bump `VERIFIED_ON`.

---

## Files

| File | Role |
|---|---|
| `docs/paid-search/approved-claims.mjs` | Sourced-fact registry + claim gate. The source of truth for every number in an ad. |
| `docs/paid-search/campaign-config.mjs` | The contract: keywords, ad groups, `rsa` (A) and `rsaVariantB` (B), assets. |
| `scripts/google-ads/config-validator.mjs` | Deterministic gate. Independently duplicates canonical sets on purpose. |
| `scripts/google-ads/expand-keywords.mjs` | Prints the four-file diff for any expansion. |
| `scripts/google-ads/mine-search-terms.mjs` | Read-only waste mining → negative candidates. |
| `scripts/google-ads/pacing-report.mjs` | Spend, projection to the promo deadline, lost-IS diagnosis. |
| `scripts/google-ads/verify-destinations.mjs` | Every ad destination must return 200. |
| `docs/paid-search/COPY-LEARNING-LOG.md` | Append-only; outcomes written back. |
