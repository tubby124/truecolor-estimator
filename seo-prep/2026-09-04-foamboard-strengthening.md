# Next existing-page improvement: Foam Board Printing

Status: prepared, not published. This file does not change a public page.

## Decision and evidence

Use `/foamboard-printing-saskatoon` for the next single-page content improvement. Preserve `/poster-printing-saskatoon`, whose exact local query averaged position 2.88 in the direct GSC page-filtered read; its broader page average of 14.54 is not its local keyword rank. Preserve the recovering Sticker, Business Cards, Aluminum and Photo Poster pages.

Source: direct Search Console API, domain property `sc-domain:truecolorprinting.ca`, web search, August 5–September 1 versus July 8–August 4, 2026. Full page aggregation includes anonymized queries; query rows do not sum to page totals.

| Foamboard evidence | Current | Prior |
| --- | ---: | ---: |
| Page impressions | 294 | 293 |
| Page clicks | 3 | 7 |
| Page-average position | 14.41 | 15.75 |
| Page CTR | 1.02% | 2.39% |

Query opportunities: `foam board printing` 50 impressions / 1 click / position 19.82; `foam core printing near me` 22 impressions / 0 clicks / 17.09. The separate daily-snapshot analyzer flags `foamboard printing` at 15.42 on 31 impressions. Treat small click counts as directional evidence, not proof of a content problem.

The existing page has factual content to improve before more keyword expansion: unverified direct-to-board Roland UV wording, unconditional rush promises, 1–3-day turnaround inconsistent with the current policy, and a stale related Coroplast price. No additional location URL is proposed.

## Release gate

The site shipped Merchant SEO/catalog changes on September 4 (`90f0251`, then `31c7389`). The installed `tc-seo-opportunities` skill requires five days after the last site SEO release. Earliest reconsideration is September 9, after that release's time, with at least seven finalized post-release days for the August 28 Wall Graphics experiment available. This date is not automatic permission to ignore a new release or a regression.

Wall Graphics `wall graphics near me` was already position 22.88 during August 21–27, before its August 28 title change, and 36.8 on 55 impressions during August 29–September 1. The 14-day decay alert is real, but attributing the entire fall to the title is unsupported. Compare equal completed windows after at least seven finalized post-release days before keeping/reverting that experiment. Do not expand Wall Graphics copy while diagnosing it.

## Exact proposed main-copy replacement

Keep the Foamboard URL, H1, canonical, current title, hero and product-order destination. Replace the three introductory body paragraphs with:

> Foam board printing in Saskatoon starts at $45 for one single-sided 18×24-inch display or $65 for one single-sided 24×36-inch display. These prices are before tax. Choose your size and quantity in the foamboard configurator to see the complete price before ordering. Pickup is at 216 33rd St W, Saskatoon.
>
> **Choose foamboard for an indoor display**
>
> Foamboard is useful for event welcome signs, restaurant specials, presentation boards and indoor open-house displays. Choose the size to fit your easel, frame or display space before preparing the artwork. It is intended for indoor use; for a sign exposed to rain or outdoor conditions, compare coroplast or aluminum composite signs instead. If your brief specifies foam core, a particular thickness or a mounting method, send those requirements so the shop can confirm the right material before printing.
>
> **Confirm your file and pickup deadline**
>
> Have your finished dimensions, quantity, text, images and pickup deadline ready. Standard production is 2–3 business days after both artwork approval and payment. Paid same-day rush may be available for an additional $40 on eligible weekday orders placed before 10 AM; call (306) 954-8688 to confirm capacity before ordering. Standard design assistance is $40; complex custom work is quoted after review. Your proof needs approval before production begins.

Use existing `Link` styling for the foamboard configurator (`/products/foamboard-displays`), Coroplast (`/coroplast-signs-saskatoon`) and Aluminum (`/aluminum-signs-saskatoon`) anchors. The two bold lines above are H2s in the implementation, not additional H1s.

## Matching factual corrections for the same page

These must accompany the body correction before publication so the page does not contradict itself:

- Remove unsupported `Roland UV`, `prints directly onto foam`, universal same-day-proof and unlimited-revision claims from visible copy, description input, metadata descriptions and FAQs. Do not replace them with another unverified machine/process claim.
- Replace every unconditional turnaround/rush sentence with the exact standard/rush wording above. Title is unchanged in this content/factual wave; review its `Same-Day` wording separately if the supported conditional rush interpretation is insufficient.
- Replace the related Coroplast card's `From $8/sqft — 18×24" = $24` with the verified fixed configuration price: `18×24" single-sided from $30` (recheck CSV and configurator at implementation).
- Replace the timing FAQ answer with: `Standard production is 2–3 business days after both artwork approval and payment. Paid same-day rush may be available for an additional $40 on eligible weekday orders placed before 10 AM. Call (306) 954-8688 to confirm capacity before ordering.`
- Replace the artwork FAQ answer with: `You can supply your artwork or request standard design assistance for $40. Send your logo, text, images, finished dimensions and deadline. Complex custom work is quoted after review, and your proof must be approved before printing.`
- Do not invent material composition, mounting hardware prices, included hardware, print-process details or customer case studies. Existing `GENERIC_FOAM` CSV and product prose disagree about composition; confirm separately if specific stock wording is needed.

## Sources and checks before implementation

- `data/tables/products.v1.csv`: `FOAM-5MM-18X24-S` $45 and `FOAM-5MM-24X36-S` $65, single-sided, quantity one.
- `src/lib/commerce/policies.ts`: standard production after approval/payment, weekday rush and pickup policy.
- `src/lib/data/products-content.ts`: foamboard indoor-use guidance and conditional rush; do not repeat the ambiguous material composition.
- Refresh GSC page/query evidence and protected status; stop if the page acquires a conflicting decay signal or another wave is active.
- Review only this page's diff; validate all prices, rich-result syntax, one H1, unchanged canonical, product CTA, mobile/desktop rendering and links. Update only its sitemap date when the page is actually changed.
- Observe seven to fourteen completed days after release. Compare query and page clicks/CTR/position and genuine commercial outcomes; do not promise a rank increase.
