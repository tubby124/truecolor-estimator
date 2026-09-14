# True Color search-growth weekly log

**State:** initialized September 14, 2026; Maps baseline not started<br>
**Authority:** use with the [search-growth operating plan](SEARCH-GROWTH-OPERATING-PLAN.md) and [SEO operating standard](../operations/SEO-STANDARD.md). Current provider evidence overrides dated entries.

This is the sanitized, append-only scorecard. Add new completed reviews at the bottom. Do not rewrite old observations; append a correction that points to the earlier record. Raw exports, screenshots, account receipts, customer/order facts, and private evidence stay in the authorized Vault location.

## Entry contract

Each review must identify:

- review ID and completion timestamp;
- source windows, source timezone, and whether each source is finalized/complete;
- collector/report name and method version;
- private evidence label, not a private URL or personal filesystem path;
- current value, comparator, evidence limit, owner, and next review date;
- facts, interpretations, hypotheses, decisions, and unknowns as separate statements;
- no more than three next actions.

Maps additionally records the exact grid centre, 5x5/1 km settings, exact query, all 25 points, result depth, collector/account state, rank or observed not-in-pack, first-pack competitors, and scan validity. A Maps baseline scan requires three valid query scans, or 75 valid observations total. The weekly review is still appended if Maps is invalid or missing; only its Maps row stays non-comparable.

Each Day 0 validation or Maps scan links a sanitized point CSV that follows the [Maps evidence schema](evidence/maps/README.md): 25 rows for the one-query validation or 75 rows for a baseline scan. The raw vendor export and account screenshot remain private; the Git receipt preserves enough point-level evidence to audit the summary without exposing credentials or customer information.

## Day 0 acceptance/validation entry template

Append this before the first baseline review. A Day 0 validation is never a baseline scan.

```markdown
## SG-YYYY-D0 — Maps method acceptance and validation, YYYY-MM-DD

**Completed:** YYYY-MM-DD HH:MM America/Regina
**Owner acceptance reference:** exact conversation/receipt label
**Private evidence label:** TC-SEARCH-YYYY-D0
**Baseline status:** not started

| Decision/evidence | Accepted value |
|---|---|
| Collector and version | |
| Signup/trial terms accepted | yes/no; by whom; date |
| Current free/paid credit terms and cancellation readback | |
| Exact centre and reason | latitude, longitude; verified GBP pin or accepted alternative |
| Grid / distance meaning | 5x5; exact meaning of 1 km |
| Search surface / locale / device / depth / account state | |
| Method version / weekly slot | SG-MAPS-v1; Tuesday 10:00 America/Regina |
| Validation query | one of the three accepted exact queries |
| Sanitized 25-row receipt | `evidence/maps/SG-MAPS-v1-D0-YYYY-MM-DD.csv` |
| Private raw export SHA-256 | |
| Credit use / remaining | 25 / 175 expected; record actual |
| Validation result | pass/fail plus exact reason |

- **Decision:** start baseline on Day 7 / repair and repeat Day 0 validation.
- **Explicit limit:** this 25-point one-query validation is not baseline scan one.
- **Next review:** YYYY-MM-DD.
```

## Weekly entry template

Copy this section to the bottom and replace every placeholder. An omitted field means incomplete evidence, not zero.

```markdown
## SG-YYYY-WW — week ending YYYY-MM-DD

**Completed:** YYYY-MM-DD HH:MM America/Regina
**Method version:** pending / SG-MAPS-v1
**Private evidence label:** pending / TC-SEARCH-YYYY-WW
**Owner:** lead search agent
**Next review:** YYYY-MM-DD

### Method and completeness

| Item | Value |
|---|---|
| Collector and plan/credit basis | |
| Accepted centre | latitude, longitude; acceptance record |
| Grid / slot / search surface / result depth | 5x5; 1 km; Tuesday 10:00 America/Regina; ... |
| Maps completeness | 0/75, 75/75, or invalid with reason |
| Sanitized 75-row receipt | `evidence/maps/SG-MAPS-v1-YYYY-MM-DD.csv`, or `none` with reason |
| Private raw evidence label / SHA-256 | |
| GSC Web window/finality | |
| GSC AI window/finality | |
| GBP window/completeness | |
| GA4 window/completeness and filters | |

### Maps

| Exact query | #1 points | Top-three points | Observed not-in-pack | Median rank among ranked points | Validity |
|---|---:|---:|---:|---:|---|
| `print shop saskatoon` | /25 | /25 | /25 | | |
| `banner printing saskatoon` | /25 | /25 | /25 | | |
| `sticker printing saskatoon` | /25 | /25 | /25 | | |

### Separate evidence lanes

| Lane | Current observation | Comparator | Evidence limit / status |
|---|---|---|---|
| GSC Web | | | |
| GSC Generative AI | | | |
| GBP | | | |
| GA4 | | | |
| Qualified quotes / paid orders | | | |
| Citations | | | |
| Merchant | | | |
| Organic experiment | | | |

### Interpretation and decision

- **Facts:**
- **Interpretation:**
- **Hypothesis:**
- **Decision:** continue observation / prepare one bounded action / keep / adjust / stop
- **Unknowns:**
- **Next actions (maximum three):**
```

## SG-2026-INIT — plan initialization, September 14, 2026

**Completed:** September 14, 2026
**Method version:** pending Day 0 acceptance
**Private evidence label:** `TC-SEARCH-BASELINE-20260914`
**Owner:** lead search agent
**Next review:** after collector, cost, centre, and method acceptance

### Method and completeness

| Item | Value |
|---|---|
| Collector and plan/credit basis | Whitespark free validation recommended after official comparison; owner has not accepted signup/terms and no account, scan, scheduling, or purchase action was taken. |
| Accepted centre | Not accepted. The directional browser centre from September 14 is not silently adopted. |
| Grid / slot / search surface / result depth | Proposed 5x5, 1 km, Tuesday 10:00 America/Regina; remaining fields pending. |
| Maps completeness | 0/75 comparable observations; baseline not started. |
| Sanitized 75-row receipt | None; no baseline scan exists. |
| Private raw evidence label / SHA-256 | None; initialization uses the dated audit receipt only. |
| GSC Web window/finality | August 14–September 10 versus July 17–August 13; finalized equal 28-day windows. |
| GSC AI window/finality | August 16–September 12 versus July 19–August 15; separate Beta report. |
| GBP window/completeness | April–September with partial September; not a completed weekly comparison. |
| GA4 window/completeness and filters | August 15–September 13; completed 30 property-timezone days; original acquisition report, no permanent filter. |

### Maps

| Exact query | #1 points | Top-three points | Observed not-in-pack | Median rank among ranked points | Validity |
|---|---:|---:|---:|---:|---|
| `print shop saskatoon` | — | — | — | — | Not started |
| `banner printing saskatoon` | — | — | — | — | Not started |
| `sticker printing saskatoon` | — | — | — | — | Not started |

The September 14 signed-in, single-centre browser observations remain directional reconnaissance and are not week zero.

### Separate evidence lanes

| Lane | Current observation | Comparator | Evidence limit / status |
|---|---|---|---|
| GSC Web | 62 clicks, 9,832 impressions, 0.63% CTR, weighted position 27.16. | 66 clicks, 9,836 impressions, 0.67% CTR, position 27.8. | Impressions flat; clicks/CTR slightly down; position slightly better. No page decision. |
| GSC Generative AI | 956 impressions across 99 pages. | Prior period rounded to 1.35K; about 29% lower. | Separate subset report; no AI queries, clicks, rank, or orders. |
| GBP | Verified/complete profile; 4.9 rating from 49 reviews. April–partial September: 6,093 views and 886 interactions. | No completed equal weekly period in this initialization. | Interactions are not leads or sales. |
| GA4 | Google organic 397/268 sessions/engaged; ChatGPT 69/48; Claude 4/3; Gemini 4/3. | No accepted clean analysis comparison yet. | All 44 purchases/C$7,376.92 were Unassigned/`(not set)`; staff/social traffic pollutes broad reporting. |
| Qualified quotes / paid orders | None source-supported in this audit. | — | Attribution unknown. |
| Citations | Yellow Pages direct page matched core identity; MapQuest correction already pending; other old/inconsistent observations require direct reads. | — | No duplicate correction or snippet-only action. |
| Merchant | Dated September 7 state: 0 approved, 16 under review, 27 legacy/not approved; public serving unverified. | Fresh read required. | Merchant remains separately governed highest priority. |
| Organic experiment | Wall Graphics observation active; Foamboard prepared, not released. | Finalized post-release verdict not reconciled here. | Calendar date does not open the gate. |

### Interpretation and decision

- **Facts:** the Business Profile is healthy as a profile, AI referrals are real, and GSC AI visibility exists. No neutral Maps baseline or source-supported search-to-order result exists.
- **Interpretation:** the biggest current gap is trustworthy Maps and attribution evidence, not a shortage of page ideas.
- **Hypothesis:** a fixed-grid series plus factual identity hygiene will identify a better first intervention than another broad SEO/content wave.
- **Decision:** prepare Day 0; do not change pages, images, profiles, citations, Analytics settings, Merchant, spend, or public content from this entry.
- **Unknowns:** accepted collector/centre and any paid continuation, current Wall Graphics verdict, fresh Merchant state, clean GA4 analysis comparison, and source-supported order attribution.
- **Next actions:** accept Whitespark signup/terms plus the proposed GBP-pin centre (or record a different method); validate the 25-point one-query Day 0 collection; then run the first 75-observation baseline scan while reconciling the dated Wall Graphics and Merchant gates separately.
