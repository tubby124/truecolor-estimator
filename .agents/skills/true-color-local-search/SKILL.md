---
name: true-color-local-search
description: Routes evidence-led True Color search work involving Google Maps and Business Profile, GSC organic or Generative AI, GA4 attribution, citations, technical SEO, schema, sitemap, search-facing content or images, Merchant search visibility, or GBP/search campaigns. It keeps measurement lanes separate, defaults to read-only, and requires exact authorization for production or provider mutations.
metadata:
  version: 2.0.0
---

# True Color search growth router

Use this project-local skill before selecting a generic SEO skill for True Color. It is a router and safety layer, not a command to load every SEO skill or perform every check. Start with the user's actual question, then use only the relevant route below.

## Authority, scope, and default

Resolve the canonical checkout and read `AGENTS.md`, `docs/TRUE-COLOR-INDEX.md`, `docs/operations/CURRENT-STATE.md`, `docs/operations/SEO-STANDARD.md`, and the latest dated baseline before interpreting older material.

Use this authority order:

1. Current authenticated provider evidence, live production readback, and current repo implementation.
2. `docs/operations/CURRENT-STATE.md`, `docs/operations/SEO-STANDARD.md`, and the newest dated baseline or release receipt.
3. Historical repo/Vault plans when their date and scope remain relevant.
4. Generic global skills, templates, and third-party tools as methods only, never as True Color facts or standing authority.

The default is read-only investigation and a bounded recommendation. State each material conclusion as **Fact**, **Hypothesis**, or **Unknown**, with date and scope. A console read, crawler result, XML validation, or local check does not prove a rank, customer visit, order, or revenue outcome.

Do not publish or edit a Business Profile, directory, review, citation, social/campaign record, website page, image, feed, schema, analytics setting, spend, or external account unless the current task explicitly authorizes that exact mutation. Preparation is not publication. A submitted citation is not a published citation.

## Non-negotiable operating rules

- Merchant commerce remains a separately governed, highest-priority Google-growth program. Maps work does not silently override its approval, feed, offer, cart, tax, consent, fulfilment, or order gates.
- Keep organic GSC, Generative AI/GEO, Maps/GBP, GA4 acquisition, and paid orders/qualified quotes as separate lanes. Never blend them into one health score or invent attribution.
- Run at most one live organic experiment. Do not bundle title/meta/H1, body, schema, links, redirects, or template changes; wait the named experiment gate and at least 7–14 completed days with finalized GSC evidence before another mutation.
- Do not expand city pages. Existing useful pages are DEFEND/RECOVERING until page-level organic, AI/referral, commercial, backlink, and successor-intent evidence supports a narrowly approved change.
- Never fabricate prices, reviews, partnerships, local service claims, customer work, citations, links, or competitor comparisons. Verify public citations at the record itself, not a stale search snippet.
- Treat one browser Maps search as directional reconnaissance. Do not call it citywide rank evidence.

Google describes local ranking as relevance, distance, and prominence; no workflow can guarantee first place. See [Google's local-ranking guidance](https://support.google.com/business/answer/7091?hl=en).

## Route by question

| If the question is about | Read first | Do now | Do not infer or change |
|---|---|---|---|
| Maps, local pack, GBP, reviews, or calls/directions | current state, local baseline, authenticated GBP | compare completed periods; verify identity; use neutral grid only if approved | Maps interactions as orders; a logged-in browser result as rank; provider edits |
| Organic ranking, indexing, titles, or landing pages | SEO standard, current GSC evidence, affected live/source page | use finalized 28-day current/prior and query/page context | a page change while another experiment is live |
| GSC Generative AI, GEO, AI referrals, or crawlers | GSC AI inclusion/report, GA4 completed period, robots/live delivery | inspect report scope, referrals, page usefulness, crawler access | AI impressions as clicks/rank/revenue; special AI-only rewrites |
| GA4 attribution or conversion quality | completed GA4 report, event definitions, orders/quotes evidence | start with report filters, comparisons, or Exploration | permanent data filters or revenue attribution without evidence |
| Citations, NAP, directory profiles | shared business identity, live contact page, direct listing readback | make a verified correction packet with status | duplicate submissions or unsupported directory changes |
| Technical, schema, sitemap, CWV, redirects, or robots | live server output plus source and GSC status | document one scoped, testable candidate | production cleanup while observation gate is active |
| Search-facing content, page copy, FAQs, images, or competitors | evidence for the named existing page and current experiment status | audit accuracy, usefulness, intent, claims, and permissions | new pages/images, template rewrites, invented comparison claims |
| Programmatic/locality expansion or hreflang | actual duplicate-intent/language/region evidence | assess whether a real need exists | city-page scale, automatic noindex, or hreflang without versions |
| Merchant/ecommerce | current commerce/Merchant runbooks and release receipts | follow the commerce-specific gate | stale generic ecommerce instructions as authority |
| GBP posts or search-facing campaigns | current owner-approved GBP/search campaign record | identify real writer, sender, destination, and review gate | automatic posting, outreach, provider mutation, or spend |

## Measurement playbooks

### Maps and Business Profile

For an approved rank baseline, use the exact queries `print shop saskatoon`, `banner printing saskatoon`, and `sticker printing saskatoon`. Only after the owner accepts the collector and centre, collect a neutral 5x5 grid at 1 km spacing. Record scan date/time, collector and account state, centre coordinates, zoom, all 25 points, visible rank or not-in-pack, and first-pack competitors.

The working 90-day target is rank #1 at 15 or more of 25 points for each query across four consecutive valid weekly scans. It is a measurement target, not a ranking promise. A scan with missing, ambiguous, or non-comparable points is invalid and must be repeated with the same method.

Report Business Profile calls as call-button clicks, directions as route requests, and website clicks as profile-link clicks; none alone proves a lead or sale. See [Business Profile performance](https://support.google.com/business/answer/9918094).

### Organic GSC

Use the latest finalized comparable period, usually 28 days versus the preceding 28. Capture clicks, impressions, CTR, position, query/page context, indexing, and enhancement status. `scripts/seo-opportunities.mjs` or the adjacent `tc-seo-opportunities` workflow is read-only input, not an automatic routing or editing engine.

Before proposing any page mutation, record the baseline, cannibalization review, AI/referral context, commercial limitation, exact hypothesis, one-scope diff, verification plan, live readback, and next observation date.

### Generative AI/GEO and crawler access

Treat GEO as normal search-quality work: crawlable, indexable, useful, accurate, and genuinely supported pages. The GSC Generative AI report is a limited view of impressions/pages/countries/devices; it is not queries, clicks, rank, orders, or a complete AI total. Review Google's [AI performance report](https://support.google.com/webmasters/answer/16984139), its [inclusion control](https://support.google.com/webmasters/answer/16908024), and [AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

Use accurate crawler roles:

- `OAI-SearchBot` supports ChatGPT search; `GPTBot` is training; `ChatGPT-User` is user-triggered access. See [OpenAI's publisher FAQ](https://help.openai.com/en/articles/12627856).
- `ClaudeBot` is training; `Claude-SearchBot` is search; `Claude-User` is user-triggered retrieval. See [Anthropic's crawler documentation](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler).
- `PerplexityBot` is search and `Perplexity-User` is user-triggered access. See [Perplexity's crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).
- Google renders JavaScript; do not use a blanket claim that AI/search crawlers cannot execute JS. See [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

An omitted named bot is not currently blocked when `User-agent: *` allows `/`; nonetheless, exact names and comments can be a later factual-cleanup candidate. `llms.txt` is a proposal, not a Google ranking requirement, and RSL licensing is not a Maps or ranking requirement. Do not add either to chase visibility.

### GA4 and commercial outcomes

Use completed days. Review source/medium, landing pages, engagement, device mix, lead events, internal/staff traffic, and the limits of the dataset. Start with a report filter, comparison, or Exploration; an Active GA4 internal-traffic filter is a separate permanent configuration change and requires explicit authorization. Tie paid orders and qualified quotes only to source-backed evidence.

## Specialized work: when to use it

Use the named generic method only after this router selects the lane:

| Method | True Color use | Boundary |
|---|---|---|
| `seo`, `seo-plan`, `seo-audit` | question framing, evidence, dependencies, and acceptance criteria | no mandatory swarm, blended score, or historical wave queue |
| `seo-technical`, `seo-schema`, `seo-sitemap` | one existing technical issue, live/source parity, valid structured data, canonical intended URLs | do not ship during an active observation gate; self-controlled LocalBusiness reviews do not earn review snippets |
| `seo-content`, `seo-page`, `seo-images` | named existing-page accuracy/usefulness or approved image assurance | no word-count/keyword/link-ratio pass-fails and no new page/image release without scope |
| `seo-geo` | AI report/referral/access review and useful existing content | no forced passages, formulas, llms.txt, or AI-only rewrites |
| `seo-programmatic`, `seo-competitor-pages`, `seo-hreflang` | assess a real duplicate-intent, competitor-research, or language/region need | normally defer; no city expansion or comparison-page fabrication; no hreflang without real alternatives |
| `gmb-update` | prepare factual GBP material when explicitly authorized | no scheduled/Monday/hashtag/cross-channel automation |
| local-service template | identity, review, local-intent, and Maps measurement prompts | do not import emergency/mobile/phone assumptions or city-page cadence |
| `ecommerce-ux` | only through current commerce runbooks | generic implementation copy is not a deployment authority |

Adjacent project material has narrower roles: `seo-content-price-auditor` is a read-only price-hygiene subcheck; `tc-seo-opportunities` is read-only GSC input and must not auto-route edits. `paa-faq`, `truecolor-page`, `truecolor-images`, and `truecolor-product` are not default SEO execution paths. The old `truecolor` and `tc-status` skills contain obsolete paths, counts, ranking snapshots, and memory queues; do not use them as current search authority. `content-cluster` and `re-seo-audit` are real-estate workflows and do not apply. `true-color-campaign`, `industry-blitz`, `true-color-instagram`, and `tc-campaign-cleanup` are separate approved campaign/provider work only.

If generic `seo` material refers to `seo-performance` or `seo-visual`, do not invent a missing route: use the relevant live technical, browser, GA4, and field-CWV evidence under this router instead.

## Rules deliberately not adopted

Do not make a pass/fail gate from fixed word counts, keyword density, internal-link ratios, metadata character counts, 134–167 word AI passages, AI citation percentages, Domain Authority/Rating, or any blended 0–100 score. Do not require every route in nav/footer, automatic city pages, automatic GBP weekday/five-day/hashtag/cross-channel posts, manufactured Wikipedia/Reddit/YouTube mentions, or special `llms.txt`/RSL work.

Google fully retired FAQ rich results on May 7, 2026; do not add FAQPage markup to chase them. Visible FAQ content may still serve a real user need, subject to the one-experiment rule. Review snippets require eligible, independently sourced review content; a business's own LocalBusiness reviews do not qualify. See [Google's updates](https://developers.google.com/search/updates) and [review-snippet requirements](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

For pagination, use self-canonicals on distinct useful pages; Google ignores `rel=next`/`rel=prev`. `x-default` is recommended where real localized variants exist, not mandatory everywhere.

## Acceptance scenarios

1. **Weekly review:** finalized GSC plus a completed GBP/GA4 period produces separate lanes, facts/hypotheses/unknowns, and no mutation.
2. **Directional Maps result:** a browser search appears weaker; verify method parity and request collector/centre approval rather than claim a citywide rank drop or edit a page.
3. **GEO question:** GSC AI impressions change; report the limited scope, inspect completed AI referrals and page usefulness, and do not force AI passages or `llms.txt` work.
4. **Schema finding during observation:** document the exact live/source discrepancy and queue one separately scoped candidate after the gate; do not bundle it with current organic work.
5. **Citation candidate:** verify the actual record, prepare one correction packet and status, and do not submit duplicates or call it published.
6. **Programmatic/hreflang proposal:** require evidence of a real duplicate-intent or language/region variant; otherwise defer without creating pages/tags.
7. **GBP content request:** identify the authorized writer, profile, exact content, and review/readback path; do not schedule or publish automatically.

## Output format

Return: scope and freshness; facts; hypotheses; unknowns; the relevant separated lanes; up to three prioritized actions with owner, evidence, authorization class, and review date; explicit non-actions; and the next review date. Keep account exports, customer records, private identifiers, and credentials out of the repository.
