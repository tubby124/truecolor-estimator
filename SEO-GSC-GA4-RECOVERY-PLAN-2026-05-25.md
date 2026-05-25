# SEO + Attribution Recovery Plan — 2026-05-25

## Data Used

- GSC source: `seo_gsc_snapshots` in Supabase, pulled through `scripts/seo-opportunities.mjs`.
- GSC freshness: snapshots run from 2026-02-28 through 2026-05-13. Search Console is lagging, so the "28 day" pull is really the current window through the latest available GSC date, not through today.
- Analytics source available in this audit: repo GA4 instrumentation plus first-party `orders` and `quote_requests` attribution fields.
- GA4 report API status: not directly available from the current credentials. Treat GA4 revenue/channel reporting as unverified until a GA4 export/API pull is connected.

## Current Read

The site is not cooked, but attribution is. GSC shows demand is still there and average ranking is improving, but clicks are being wasted by low CTR, cannibalization, and missing/weak landing-page intent.

| Window | Clicks | Impressions | CTR | Avg Pos | Notes |
|---|---:|---:|---:|---:|---|
| 14d | 4 | 534 | 0.75% | 25.76 | Not enough coverage because latest GSC date is 2026-05-13 |
| 28d | 21 | 2,579 | 0.81% | 18.50 | Current working SEO window |
| 90d | 62 | 7,447 | 0.83% | 22.46 | Longer trend baseline |

Current 28d vs prior 28d:

- Clicks: 21 vs 15, up 6.
- Impressions: 2,579 vs 2,499, up 80.
- Avg position: 18.50 vs 23.17, improved by 4.67 positions.
- Caveat: the current window has GSC lag, so use this as directional, not final.

## Biggest GSC Bleeds

| Priority | Page | Query Signal | Evidence | Diagnosis |
|---|---|---|---|---|
| P0 | `/for-lease-signs-saskatoon` | lease signage Saskatchewan | 244 impressions, avg pos 3.03, 0 clicks | Ranking is good, snippet/intent is failing |
| P0 | `/property-management-signs-saskatoon` | lease signage Saskatchewan | 312 impressions, avg pos 14.08, 0 clicks | Cannibalizing/supporting the for-lease page instead of clearly supporting it |
| P0 | `/sticker-printing-saskatoon` | die cut stickers/labels near me | 338 impressions, avg pos 13.25, 0 clicks | Strong demand, frozen page, needs body/FAQ targeting only |
| P1 | `/` | printing near me, print shop near me, printing Saskatoon | 802 impressions, 14 clicks, but key local queries at pos 9-10 with 0 clicks | Homepage is carrying too many local-printing queries |
| P1 | `/flyer-printing-saskatoon` | flyer printing | 216 impressions, avg pos 33.21, 0 clicks | Content/intent gap, likely too weak or too generic |
| P1 | `/wall-graphics-saskatoon` | wall covering / wall graphics | pos worsened from about 12.2 to 24.1, impressions down 163 to 39 | Decay/cannibalization investigation needed |
| P2 | `/products` | poster printing Saskatoon | serving query at pos 8.86 with 0 clicks | Product hub is stealing traffic from the poster page |

## Attribution Reality

First-party commerce data is strong, but channel data is mostly blind:

| Window | Orders | Paid/Complete-ish | Revenue | Avg Order | UTM Tagged | Referrer Tagged |
|---|---:|---:|---:|---:|---:|---:|
| 28d | 20 | 17 | $4,286.04 | $214.30 | 0 | 2 |
| 90d | 79 | 73 | $15,942.61 | $201.81 | 0 | 2 |

Quote requests:

| Window | Quote Requests | UTM Tagged | Referrer Tagged |
|---|---:|---:|---:|
| 28d | 23 | 0 | 10 |
| 90d | 45 | 0 | 10 |

Confirmed from code:

- GA4 loads client-side in `src/app/layout.tsx`.
- GA4 ecommerce helpers include `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `generate_lead`, and `price_calculated` in `src/lib/analytics.ts`.
- Server-side GA4 Measurement Protocol sender exists in `src/lib/analytics/measurementProtocol.ts`.
- Clover webhook fires server-side `purchase` events.
- Quote request route fires server-side `generate_lead` events.

Remaining problem: this does not prove GA4 reporting is receiving complete production events. The local environment does not expose GA4 report access, and orders/quotes show 0 UTM capture.

## Plan

### Phase 0 — Measurement Lock

Goal: make revenue and lead attribution trustworthy before making broad SEO calls.

1. Verify production env has `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-6HMQT7MNLL` and `GA4_API_SECRET`.
2. Run one test quote and one test checkout, then confirm GA4 Realtime/DebugView shows:
   - `generate_lead`
   - `begin_checkout`
   - `add_payment_info`
   - `purchase`
   - `items[]`, `transaction_id`, value, currency, and tax
3. Add GA4 Data API access or scheduled GA4 CSV export so this repo can read:
   - organic sessions by landing page
   - purchases by landing page
   - generate_lead by landing page
   - channel group by revenue
4. Fix attribution capture:
   - persist first-touch UTM/referrer in a cookie
   - send it into `orders` and `quote_requests`
   - tag GBP, Brevo, social, and QR links with UTMs
5. Add a weekly data snapshot that joins:
   - GSC clicks/impressions
   - GA4 leads/purchases
   - Supabase orders/revenue

No SEO page rewrites should depend on GA4 revenue claims until this phase is verified.

### Phase 1 — Fast CTR Rescue

Run one page at a time, then wait 5-7 days for GSC movement before the next title/meta change.

1. `/for-lease-signs-saskatoon`
   - Rewrite title/meta around "For Lease Signs Saskatchewan" and commercial real estate signage.
   - Add a tight above-fold proof point: Saskatoon/Saskatchewan, fast turnaround, coroplast/ACP/window options, starting price.
   - Add FAQ for "lease signage", "used lease signs", "for rent signs", and "property signs".
   - Success: CTR above 3% within 14 indexed days.

2. `/property-management-signs-saskatoon`
   - Stop competing head-on with `/for-lease-signs-saskatoon`.
   - Make it the broader property-management support page.
   - Add internal links to `/for-lease-signs-saskatoon` using exact-match lease signage anchors.
   - Success: property page improves page-2 queries while lease page owns the lease SERP.

3. `/sticker-printing-saskatoon`
   - Frozen page: no title/H1 rewrite.
   - Add body copy and FAQs for "die cut stickers near me", "die cut labels near me", "custom die cut labels near me".
   - Add material/finish proof and price clarity without changing protected metadata.
   - Success: move page-2/low page-1 sticker terms into click-producing positions.

4. Homepage `/`
   - Keep the page stable; improve snippet/body support for "Saskatoon print shop", "printing near me", and "printing services Saskatoon".
   - Route specific intent deeper with internal links to business cards, flyers, same-day printing, and signs.
   - Success: local print queries move from pos 9-10 into top 7 and CTR rises.

### Phase 2 — Intent Cleanup

1. `/products`
   - It is ranking for "poster printing Saskatoon"; this should point users to `/poster-printing-saskatoon` or `/photo-poster-printing-saskatoon`.
   - Add stronger internal links and reduce accidental product-hub cannibalization.

2. `/flyer-printing-saskatoon`
   - Rebuild depth around local flyer use cases: restaurants, events, real estate, nonprofit, retail, mailers.
   - Add stock/size/turnaround/pricing sections and Product/Offer schema if supported.

3. `/wall-graphics-saskatoon`
   - Investigate cannibalization before rewriting.
   - Check which pages are serving wall-covering/wall-graphics terms.
   - Consolidate internal links to make this the canonical wall graphics page.

4. `/sign-company-saskatoon`
   - Current GSC still shows homepage serving sign-company queries.
   - Strengthen the sign-company page as the hub and link it from homepage/sign pages.

### Phase 3 — Schema And Snippet Trust

1. Add Product/Offer schema to core product pages:
   - stickers
   - banners
   - coroplast
   - business cards
   - flyers
   - posters
   - vehicle magnets
   - window decals/perf
2. Add price/availability only when it matches `data/PRICING_QUICK_REFERENCE.md`.
3. Keep `$25 order-total minimum` language consistent everywhere.
4. Continue trimming long meta descriptions only on non-frozen pages or allowed frozen fields.

### Phase 4 — Weekly Operating Loop

Every week:

1. Run `node scripts/seo-opportunities.mjs --days=28`.
2. Pull GA4 landing-page leads/purchases once GA4 report access exists.
3. Pull Supabase orders/quotes and compare UTM/referrer coverage.
4. Pick one action:
   - CTR rewrite if page 1 with 0 CTR.
   - FAQ/body update if frozen or page 2.
   - Cannibalization fix if the wrong page ranks.
   - New page only if GSC shows high impressions and no matching page.
5. Update `memory/seo-sprints.md`.

## Immediate Next Three Moves

1. Verify GA4 production receiving real `purchase` and `generate_lead` events, because current repo evidence shows instrumentation but not successful report capture.
2. Fix `/for-lease-signs-saskatoon` first. It has the cleanest money signal: high ranking, high impressions, zero clicks.
3. Then fix the sticker page with FAQ/body only, because it is protected but has a strong die-cut keyword cluster.

## Do Not Do Yet

- Do not mass rewrite frozen page titles.
- Do not launch new pages from hunches; current analyzer found 0 new-page candidates.
- Do not trust order attribution until UTM/referrer capture is fixed.
- Do not judge the last 14 days of SEO from GSC yet; the latest snapshot is 2026-05-13.
