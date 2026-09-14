# Local search baseline — 14 September 2026

**Scope:** audit only. This record made no website, provider, directory, review, analytics-setting, spend, Merchant, or publishing change. It is a sanitized baseline for a local-search decision; it is not proof of first-place Maps rank, orders, or page performance.

**Sources and freshness:** authenticated Google Search Console and Business Profile reads on 14 September; Google Analytics Data API aggregate reads at 18:27 and 19:15 UTC; current production URL/XML reads; repository and current-state review. GSC web search uses `type=web` rows for 14 August–10 September 2026 inclusive versus 17 July–13 August. The separate Search Console Generative AI report uses 16 August–12 September versus 19 July–15 August; the stored Search Console dates were used without a Regina-time conversion. GBP April–September data includes a partial September. GA4 uses 15 August–13 September inclusive in the America/Regina property timezone, with `sessionSourceMedium` and `sessionDefaultChannelGroup` as acquisition dimensions. Browser Maps results are directional observations, not a neutral grid study.

## Executive finding

**Facts:** True Color has a verified Business Profile whose owner view shows profile strength complete and a 4.9 rating from 49 reviews. The current GSC, GBP, GA4, and directional rank measurements are listed below.

**Interpretation:** generic Maps visibility is not demonstrated, and GA4 purchase attribution plus staff/social traffic limit commercial conclusions.

**Decision for this milestone:** no new webpage is recommended. The current organic observation gate and the separately governed Merchant commerce priority remain unchanged.

## Four-lane scorecard

| Lane | Fact | Interpretation |
|---|---|---|
| GSC / organic | Finalized 28-day period: 62 clicks, 9,832 impressions, 0.63% CTR, weighted position 27.16. Prior comparable period: 66, 9,836, 0.67%, 27.8. | Impressions are flat, clicks/CTR are slightly down, and average position is slightly better. This is not enough evidence to change a page. |
| GBP / Maps | Verified and profile strength complete; 4.9 rating from 49 reviews. April–September (September partial): 6,093 profile views, including 1,008 Maps views; 886 interactions = 194 call-button clicks + 305 direction requests + 387 website clicks. | The report covers Search and Maps and can include organic and Ads activity. Calls, directions, and website clicks are Profile interactions, not confirmed leads or orders. Maps represented about 16.5% of recorded profile views. |
| GA4 | In the 30-day acquisition read, Google organic had 397 sessions / 268 engaged sessions; direct 2,449 / 589; Google CPC 254 / 160; ChatGPT 69 / 48; Bing organic 49 / 37. Forty-four ecommerce purchases totaling C$7,376.92 were all Unassigned / `(not set)` with only four sessions. | Purchase channel attribution is not decision-grade. Staff/social routes dominate several landing-page readings, so headline acquisition growth is polluted. |
| Orders / quotes | No source-backed order or qualified-quote attribution was established in this audit. | **Unknown:** whether Maps or organic gains produced commercial improvement. Do not blend profile actions with revenue. |

## Generative AI search evidence

**Fact:** The correct domain property, `sc-domain:truecolorprinting.ca`, is owner verified. Its Search generative AI inclusion control is set to **Include**, and Search Console reports all robots files as valid. The Generative AI performance report is available in Beta.

**Fact:** For 16 August–12 September, the report showed 956 generative-AI impressions across 99 pages. The preceding 28 days showed 1.35K impressions, so the current period was about 29% lower; the prior value is rounded by the interface. The three-month view showed 3.68K impressions across 119 pages. This report is a subset of Search Console Web performance and must not be added to the Web total. It does not provide AI queries, clicks, orders, or a Maps or organic rank.

| Page | Current AI impressions | Prior AI impressions |
|---|---:|---:|
| `/sticker-printing-saskatoon` | 117 | 181 |
| `/aluminum-signs-saskatoon` | 94 | 104 |
| Homepage | 69 | 144 |
| `/sign-company-saskatoon` | 52 | 55 |
| `/boat-registration-numbers` | 39 | 10 |

Canada accounted for 862 current-period impressions. Device totals were 560 desktop, 393 mobile, and three tablet. These are visibility observations, not visits or customers.

**Fact:** A separate completed 30-day GA4 source/medium read returned 69 ChatGPT sessions / 48 engaged sessions, four Claude sessions / three engaged, and four Gemini sessions / three engaged. All three sources had zero attributed ecommerce purchases and C$0 revenue. No Perplexity source row was returned. This establishes real AI-assistant referral traffic but does not connect it to a paid order.

**Decision:** watch this report with the same completed windows and page set. The decline is not evidence for a page, FAQ, `llms.txt`, schema, or crawler-policy rewrite. Google treats AI search visibility as part of normal search quality work, so any future change still needs one bounded hypothesis and the existing experiment gate. [Google's AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) and [Search Console AI report definition](https://support.google.com/webmasters/answer/16984139) define those limits.

## Maps, profile, and citation facts

**Fact:** The primary category shown was Print shop; public NAP, hours, phone, and website were present and matched the shared business identity. Recent GBP posts were visible.

**Dated inherited state, not re-authenticated in this audit:** the 14 September private GBP API record says the intended location still returned ineligible for Local Posts through the API and no API post was sent. The visible owner-panel posting control does not prove API eligibility.

**Fact — directional only and not eligible for later rank comparison:** one signed-in Google Maps session on 14 September used centre `52.1384,-106.6374` at zoom `13z`; the exact clock time was not retained. True Color appeared #5 for `banner printing saskatoon`, #8 for `sticker printing saskatoon`, and #7 for `print banner saskatoon`. It was absent through the first 10 displayed results for `print shop saskatoon`, `printing saskatoon`, and `business cards saskatoon`, and through the first eight for `sign shop saskatoon`. These are not citywide rankings. The missing timestamp, uncontrolled signed-in personalization, changing result depth, and single centre make this reconnaissance non-reproducible.

**Hypothesis:** generic-query weakness is more likely a relevance/prominence/distance question than a page-copy question. Google says local results primarily use relevance, distance, and prominence, and no party can request or buy a better rank. [Google local-ranking guidance](https://support.google.com/business/answer/7091?hl=en)

**Fact:** citation hygiene is unfinished. The direct Yellow Pages page matched the current core NAP, while a Google result snippet still showed the former 1629 Ontario Ave address. Older retrieved snapshots for Yelp and MapQuest also exposed the former address/domain; the existing MapQuest correction was already submitted on 5 September and remains publication-pending. Other listings show inconsistent suite-style presentation such as `201` versus `202-216`. Direct listing verification is required before any correction, and pending work must not be resubmitted. Canonical business identity does not authorize an invented suite number.

## Organic health and technical facts

**Fact:** Search Console reports 112 indexed and 141 not-indexed URLs. The latter includes 34 redirects, 26 `noindex`, 19 not-found, 18 alternate canonical, two blocked by robots, 40 crawled-currently-not-indexed, and two discovered-currently-not-indexed. Several examples are expected technical/legacy URLs; do not treat the total as 141 lost pages.

**Fact:** mobile Core Web Vitals reports 98 good URLs with none needing improvement or poor; desktop has insufficient field data. The normal sitemap last read 12 September with 106 discovered pages. The image sitemap had a Search Console "Missing XML tag" error last read 10 September, while the current live XML was syntactically valid; treat this as a stale-or-unresolved console state until a later read, not proof it is fixed.

**Fact:** production/repository checks found review-count drift (website/schema 43 versus GBP 49), an invalid `PrintShop` structured-data type, and `llms.txt` references that resolve through redirects. These are factual-hygiene candidates, not authorization to edit protected pages. Current malformed historical image URLs return 404; the base assets exist and no matching malformed references were found in the repository.

## Measurement facts and limits

**Fact:** the latest stored GSC and GA4 syncs were successful, but automated sync routes write snapshots and were not triggered for this audit. The latest GSC data covered through 10 September; GA4 stored reporting through 11 September and the direct aggregate read used a current completed 30-day range.

**Fact:** GA4 Admin API configuration reads were blocked because the relevant Admin API was disabled. That prevented automated confirmation of data filters, key events, Google links, and attribution settings. A separate signed-in owner-UI read confirmed the expected property, America/Regina timezone, CAD currency, four listed key events, and one completed Google Ads link; no setting was changed.

**Hypothesis:** staff/social and internal operational traffic materially distorts broad GA4 acquisition and landing-page reports. Any future GA4 cleanup must be separately approved: an Active internal-traffic filter permanently excludes incoming data. Start with a report filter, comparison, or Exploration, then make a deliberate configuration decision. [Google's internal-traffic guidance](https://support.google.com/analytics/answer/10104470?hl=en-CA)

## Ninety-day Maps plan — proposed, not started

1. **Days 1–28 — establish comparable rank evidence.** Obtain owner acceptance for a neutral collector and a 5x5 grid at 1 km spacing around an agreed Saskatoon service core. Scan `print shop saskatoon`, `banner printing saskatoon`, and `sticker printing saskatoon` weekly with fixed centre, zoom, account state, and method. Record rank or not-in-pack plus the first-pack competitors. Four weekly scans require four weeks; two weeks is not a baseline.
2. **Days 1–42 — close verified identity gaps.** Directly verify the stale/inconsistent citations and prepare only the specific correction table for owner approval. Preserve the existing directory campaign's pending/submitted state; do not resubmit or publish automatically. Separately review GBP claims and profile facts against current evidence before proposing any edit.
3. **Days 29–90 — decide from four weekly scans.** Review profile actions, finalized GSC Web and AI data, GA4 data-quality limits, and source-backed orders/quotes as separate lanes. At most one separately authorized action set should be active at a time. No city-page expansion and no organic page mutation unless the existing experiment gate independently opens.

**Ambitious measurement target, not guarantee:** for each tracked query, each of four consecutive weekly scans must return valid observations for all 25 fixed points and show True Color first at 15 or more points. A successful not-in-pack observation counts as not first. A failed or ambiguous collection invalidates the scan and must be repeated with the same method; it is never converted to rank zero. At day 90, report the actual coverage and profile/citation changes, including an honest "not achieved" result if that is the evidence.

Google's [Business Profile performance definitions](https://support.google.com/business/answer/9918094) explain why calls, directions, and website clicks remain interactions rather than sales. Merchant commerce priority remains visible, but it requires its own offer, approval, serving, and attribution evidence before any change.

## Recommended next actions

1. Accept or revise the neutral 5x5/1 km collection design, then gather four comparable weekly scans before declaring a Maps baseline; preserve the same GSC Web and Generative AI comparison windows alongside it.
2. Prepare a citation-verification sheet for the named stale/inconsistent listings; seek explicit approval before any directory claim, correction, or outreach.
3. Define a read-only GA4 report filter, comparison, or Exploration that excludes known staff/social paths for analysis, while leaving property filters unchanged; separately plan a future attribution repair validation using a genuine new website order.

**Explicit non-actions:** no new webpage, page rewrite, image release, GEO content campaign, GBP post, profile edit, directory submission, review request, GA4 Active filter, spend change, `build-gbp-upload`, automatic sync, or provider publish was performed or approved by this baseline.
