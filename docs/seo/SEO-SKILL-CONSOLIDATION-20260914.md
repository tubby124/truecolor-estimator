# True Color SEO skill consolidation — September 14, 2026

## Decision

True Color uses the project-local [`true-color-local-search` skill](../../.agents/skills/true-color-local-search/SKILL.md) as the single router for search-growth work. It selects only the method relevant to the question; it does not mechanically run every generic SEO skill.

This is a documentation and operating-rule consolidation. It does **not** edit the site, Google Business Profile, Analytics, Search Console, citations, Merchant, feeds, schema, robots, `llms.txt`, pages, images, campaigns, or external accounts.

The current start is measurement and factual hygiene, not a new page/image/content/GEO campaign. Merchant commerce remains its separately governed top Google-growth priority under [`SEO-STANDARD.md`](../operations/SEO-STANDARD.md). The current local-search evidence and observation limits belong in the dated [local-search baseline](LOCAL-SEARCH-BASELINE-20260914.md).

## Source of truth

Use this precedence whenever an old plan and current evidence disagree:

1. Current authenticated provider evidence, production readback, and repository implementation.
2. `docs/operations/CURRENT-STATE.md`, `docs/operations/SEO-STANDARD.md`, and current dated baseline/release receipts.
3. Dated historical repository or Vault records, with their original scope retained.
4. Generic skills/templates and third-party tools as methods, never as business facts or automatic work queues.

Older wave/audit documents, `.claude` page rules, and legacy command copy are historical context, not an execution queue. In particular, `.claude/rules/seo-standards.md`, `truecolor-seo-safety.md`, and `seo-protected-pages.md` preserve useful safety intent but contain stale counts, paths, or ranking facts; the current operating standard and freshly dated evidence supersede those facts.

## Inventory and disposition

The `.codex` and `.agents` copies of the general SEO family are mostly byte-identical. The exceptions are `seo-audit` and `seo-geo`: both have stale/problematic variants, including obsolete paths or inaccurate provider wording. No global copies are changed in this work; project routing protects True Color from importing them as authority.

| Skill or adjacent material | Decision for True Color | How it is bounded |
|---|---|---|
| `seo` | Adopt as a general method only | Route by the actual question; no mandatory swarm or score. |
| `seo-plan` | Selectively adopt | Keep goals, dependencies, owner, and acceptance evidence; use current experiment and Maps gates. |
| `seo-audit` | Heavily constrain | Keep live/source/provider inspection and price/claim checks; reject obsolete paths, wave queues, scores, and fixed DesignDirectionGrid rules. |
| `seo-technical` | Use on demand | Check indexability, canonicals, redirects, server output, mobile/CWV, and GSC; make one separately approved change after the observation gate. |
| `seo-content` | Use on demand | Audit useful, accurate, current first-party content; no word-count, density, or link-ratio thresholds. |
| `seo-page` | Use only for a named existing page | Character counts are diagnostics, not Google pass/fail limits; no default page build. |
| `seo-schema` | Use on demand | Validate vocabulary and visible-fact parity; prepare corrections separately, never self-review markup for rich results. |
| `seo-sitemap` | Use on demand | Include canonical, indexable, intended URLs with honest dates; preserve purposeful exclusions. |
| `seo-geo` | Selectively adopt | Review GSC AI data, referrals, crawler access, and useful existing content; reject AI formulas and special AI-only rewrites. |
| `seo-images` | Audit only now | Future work follows Gallery Assurance and approved image workflow; no generated or swapped images in this scope. |
| `seo-programmatic` | Defer generation | Assess duplicate intent/template quality only; no locality scale, automatic noindex, or pagination-to-page-one patterns. |
| `seo-competitor-pages` | Research only | Use fixed, neutral Maps queries/grid; no automatic comparison pages or unsupported competitor claims. |
| `seo-hreflang` | Not applicable unless facts change | Only when actual localized language/region variants exist; `x-default` is recommended, not universal. |
| `gmb-update` | Preparation only | Verify facts and draft only under explicit GBP authorization; no Monday/five-day/hashtag/cross-channel publishing rule. |
| local-service template | Limited reference | Reuse NAP, reviews, local intent, and Maps measurement prompts; do not import generic service, phone, emergency, or city-page assumptions. |
| `ecommerce-ux` | Route to current commerce runbooks | Generic Vercel/nodemailer/turnaround instructions do not govern this stack or Merchant releases. |
| `content-cluster`, `re-seo-audit` | Ignore | Real-estate workflows, not True Color search work. |
| `true-color-campaign`, `industry-blitz`, `true-color-instagram`, `tc-campaign-cleanup` | Defer | Separate, expressly approved campaign/provider/sender scope. |
| `tc-seo-opportunities` | Read-only input only | It may surface fresh GSC evidence but must not auto-route an edit. |
| `.agents/seo-content-price-auditor.md` | Keep as subcheck | Read-only price/claim hygiene, always checked against current approved pricing. |
| `paa-faq`, `truecolor-page`, `truecolor-images` | Defer | They are not default routes and must not bypass current experiment/page/image gates. |
| `truecolor-product` | Unrelated | Do not load for general SEO planning. |
| `truecolor` | Historical session bootstrap | Its checkout path, product count, prices, gaps, and memory source are stale. Start from repo `AGENTS.md`, current state, and this search router instead. |
| `tc-status` | Historical dashboard; do not trust for search state | It reads obsolete home-memory rankings and wave queues. Rebuild any requested status from current Git and authenticated evidence. |

Generic `seo` material also refers to `seo-performance` and `seo-visual`, which were not available as installed project methods in this audit. Use current live technical, browser, GA4, and field-CWV evidence instead of inventing an unavailable route.

## Claims removed from the operating model

The following are not valid standing requirements and must not be used as a score, release gate, or automatic task queue:

- a mandatory six-agent audit or a blended 0–100/health score;
- fixed word counts, keyword density, internal-link ratios, metadata character counts, or 134–167-word “AI passages”;
- unscoped AI visibility/citation percentages or formulas;
- `llms.txt` as a Google ranking requirement or RSL licensing as a Maps/ranking requirement;
- FAQ rich-result work, automated city pages, every route in navigation/footer, or DA/DR as a Google KPI;
- manufactured Wikipedia, Reddit, YouTube, review, or local mentions;
- automatic weekday/five-day/hashtag/cross-channel GBP posting;
- generic pages or builder copy without direct fact and pricing verification.

This includes stale copied product facts. Never reuse the legacy builder claims that describe a Roland VG2 as UV, design as $35, banners as $45, or coroplast as universally below the current minimum. Verify every price, material, capability, and lead time against current approved True Color records before it appears publicly.

Google fully retired FAQ rich results on May 7, 2026. Visible FAQs can still help users when truthful and needed, but FAQPage must not be added to chase that result. Self-controlled LocalBusiness review data does not qualify for review snippets. See [Google Search updates](https://developers.google.com/search/updates) and [review snippet requirements](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

## Accurate technical and AI baseline

GEO is ordinary search quality: make useful, accurate, crawlable content for people and measure it honestly. Google advises against special AI-only rewrites and other manipulative work; consult its [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). The Search Console Generative AI report is a limited report for impressions/pages/countries/devices, not a query, click, rank, or order report; see [report details](https://support.google.com/webmasters/answer/16984139) and [inclusion control](https://support.google.com/webmasters/answer/16908024).

Crawler names must be interpreted accurately: OAI-SearchBot is ChatGPT search, GPTBot is training, and ChatGPT-User is user action ([OpenAI](https://help.openai.com/en/articles/12627856)); ClaudeBot is training, Claude-SearchBot is search, and Claude-User is user action ([Anthropic](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)); PerplexityBot is search and Perplexity-User is user action ([Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)). Google can render JavaScript, so “search/AI crawlers do not execute JS” is not a safe general rule ([Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)).

The existing wildcard `User-agent: *` allow rule means omitted named agents are not currently blocked by that omission. Exact agent names and comments still need later factual cleanup, but that is not an urgent access failure. `llms.txt` remains a proposal, not a universal protocol or ranking lever ([llmstxt.org](https://llmstxt.org/)).

For pagination, use a self-canonical on each distinct useful page; Google ignores `rel=next` and `rel=prev`. Only implement hreflang when real alternate language/region versions exist; `x-default` is recommended rather than mandatory.

## Fresh evidence checked during consolidation

The authenticated 14 September read used the correct verified Search Console domain property. Search generative AI inclusion is set to **Include**, its robots status says all files are valid, and the Beta Generative AI report is available. For 16 August–12 September it returned 956 impressions across 99 pages versus a rounded 1.35K in the prior 28 days. This is a visible decline worth monitoring, not proof that a page, schema, FAQ, crawler rule, or `llms.txt` caused it. The detailed page, country, device, and period evidence is retained in the [dated baseline](LOCAL-SEARCH-BASELINE-20260914.md).

The completed 30-day GA4 source/medium read returned 69 ChatGPT sessions / 48 engaged sessions, four Claude / three engaged, and four Gemini / three engaged. None had an attributed ecommerce purchase or revenue. This proves that AI-assistant referrals reach the site, but not that they create orders.

The Business Profile remains verified and complete at 4.9/49. No neutral citywide Maps baseline exists. Current factual-hygiene candidates include review-count drift, an invalid `PrintShop` schema type, redirected `llms.txt` destinations, and stale/misnamed crawler comments. Because the wildcard robots rule allows public crawling, the omitted named agents are not an urgent access failure. These are prepared candidates only; none was changed in this consolidation.

## What starts now

### Days 1–28: establish comparable Maps evidence

After owner acceptance of the exact collector and centre, run four weekly neutral scans for:

- `print shop saskatoon`
- `banner printing saskatoon`
- `sticker printing saskatoon`

Each uses a 5x5 grid at 1 km spacing. Preserve collector/account state, centre coordinates, time, zoom, every point, and whether the listing ranks or is absent. The day-90 target is #1 at 15 or more of 25 points for every query across four consecutive valid weekly scans. That is an ambitious target, not a guarantee; Google attributes local visibility to relevance, distance, and prominence ([local ranking guidance](https://support.google.com/business/answer/7091?hl=en)).

### Days 1–42: factual identity hygiene

Directly verify each relevant citation record before declaring it stale. Create a correction packet with source URL, current value, correct source-backed value, direct evidence date, ownership/access state, and submitted/published status. Do not create duplicate submissions. Use read-only GA4 report filtering/comparisons first; permanent Analytics data-filter changes are a separate authorization.

### Days 29–90: one controlled action only

After comparable evidence and the current observation gate, choose at most one separately authorized action set. Evaluate it in separate GSC organic, GSC AI/referral, Maps/GBP, GA4, and commercial lanes. Do not turn an interaction, AI impression, or click into a sale without source-backed order/quote evidence.

## Explicit deferrals

Do not start new pages, images, content clusters, programmatic/location pages, competitor comparison pages, hreflang, `llms.txt`/RSL work, FAQ markup work, manufactured authority mentions, or a GEO campaign now. Do not change schema, robots, sitemap, or reviews during the current organic observation window. Those remain candidates only after a fresh baseline, a single-scope hypothesis, approval, tests, and live readback.

## Acceptance tests for the consolidated router

1. A weekly review has finalized GSC and completed GBP/GA4 data: it reports separate lanes and makes no mutation.
2. A one-browser Maps result looks weak: it is labelled directional and triggers method/collector review, not a claim of citywide decline.
3. GSC AI impressions change: the report scope and GA4 referrals are checked, but no forced AI copy or `llms.txt` work is proposed.
4. A schema discrepancy appears while an experiment is live: it becomes a separately queued candidate, not a bundled production change.
5. A citation looks stale in Google: its source page is read directly before any correction packet or submission.
6. A programmatic/hreflang request lacks real duplicate-intent or localized versions: it is deferred without creating pages or tags.
7. A GBP post request names no writer, profile, review path, or authorization: the skill prepares the decision boundary and does not publish.

## Follow-up record

This document supersedes no provider state and makes no ranking claim. Record fresh measurements in the dated baseline/current-state record, preserve the one-experiment gate in `SEO-STANDARD.md`, and use the project-local router for the next scoped request.
