# Plan Gaps Addendum — What the Original Plan Missed

**Date:** 2026-05-05
**Supersedes:** Phase ordering in IMPLEMENTATION-ROADMAP.md for items below
**Reason:** Original plan optimized for ranking; missed conversion, capture, and the highest-leverage local factors.

## Gap 1 — Reviews are a top-3 local pack factor and we treated them as Phase 4

### What's broken
Plan mentions "2 reviews/month minimum" in Phase 4. Whitespark 2026 ranks "review velocity + photo reviews" as a top-3 local pack signal. Reviews compound — months 1-3 of zero review velocity = months 1-3 of leaving the local pack on the table.

### Move to Wave A (Week 1)

| Task | Tool | File / location |
|---|---|---|
| Build review request email | Brevo (account user_id 10399836) | new transactional template |
| Trigger review email at order pickup | webhook from Supabase order status → Brevo | src/app/api/orders/[id]/status/route.ts |
| SMS review request 48hr after email | Twilio (existing setup) | new function |
| Review response SOP | docs only | docs/REVIEW-RESPONSE-SOP.md |
| GBP review badge on hub pages | new component | components/GbpReviewBadge.tsx |
| Schema AggregateRating on homepage | LocalBusiness extension | src/app/page.tsx |

### Targets (revised)
- Month 1: 8 new reviews (2/week)
- Month 3: 25 reviews total (4.7+ avg)
- Month 6: 60 reviews total
- Month 12: 150 reviews total

---

## Gap 2 — Sticker → Roland cross-sell is the warmest list we own

### What's broken
Sticker buyers are pre-qualified True Color customers. Plan has zero cross-sell motion. Every sticker order is a chance to introduce coroplast, banners, or vehicle decals to a warm buyer.

### Move to Wave A (Week 1-2)

| Task | Tool | File / location |
|---|---|---|
| "Also from our Roland printer" strip on order confirmation | new component | src/app/order-confirmed/page.tsx + components/RolandUpsellStrip.tsx |
| Post-purchase email sequence (T+3, T+10, T+30) | Brevo automation | new automation in Brevo dashboard |
| Brevo contact tag: `sticker_buyer` | API tag on order webhook | src/app/api/webhooks/order-paid/route.ts |
| Brevo segment: sticker buyers w/ no Roland order in 60d | Brevo segment | new dynamic list |
| Quarterly Roland-only campaign to sticker segment | Brevo campaign | recurring campaign |
| "Complete your brand kit" cross-sell on `/sticker-printing-saskatoon` | inline component | edit existing page |

### Targets
- 15% of sticker buyers receive Roland upsell email open
- 3% click to Roland service page
- 0.5% convert to Roland order within 60 days

---

## Gap 3 — Cannibalization audit MUST precede hub rebuilds

### What's broken
95 pages, many overlapping intents (e.g. `/event-signs-saskatoon` vs `/event-banners` vs `/event-signs-saskatoon` referenced from coroplast hub). Without de-conflicting, hub rebuilds will fight their own spokes. This is likely WHY positions are 25-30 instead of top-10 — Google can't pick a winner.

### Move to BEFORE Wave A (Week 0)

| Task | Method |
|---|---|
| Run `site:truecolorprinting.ca [query]` for top 30 GSC queries | manual or script |
| Build cannibalization matrix: query × ranked URLs | new doc CANNIBALIZATION-AUDIT.md |
| Decide canonical page per query cluster | manual review |
| 301 redirect or rel=canonical the losers | next.config.js redirects |
| Update internal links to point only at canonical | grep + edit |

### Likely conflicts to investigate
- `/event-signs-saskatoon` vs `/event-banners` (event intent)
- `/coroplast-signs-saskatoon` vs `/lawn-signs-saskatoon` (after we build it) vs `/election-signs`
- `/large-format-printing-saskatoon` vs `/poster-printing-saskatoon` vs `/foamboard-printing-saskatoon`
- `/sign-company-saskatoon` vs `/signs-saskatoon` (does latter exist?)
- `/business-cards-saskatoon` vs city variants competing for `business cards near me`

### Output
CANNIBALIZATION-AUDIT.md with: conflict list, canonical decisions, redirect map, internal link cleanup task list.

---

## Gap 4 — Bing + ChatGPT search are zero-effort wins we ignored

### What's broken
Plan is Google-only. ChatGPT now recommends local businesses for "best print shop saskatoon"-style queries. Bing IndexNow gets new pages indexed in hours not weeks.

### Move to Wave A (Week 1)

| Task | File / location |
|---|---|
| Bing Webmaster Tools setup | bing.com/webmasters — verify domain |
| IndexNow integration | src/app/sitemap.ts + new src/app/api/indexnow/route.ts |
| llms.txt audit + expansion | public/llms.txt — confirm all 6 hubs listed with descriptions |
| OpenGraph audit on every hub | src/app/[hub]/layout.tsx — og:image, og:type, og:price |
| robots.txt allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended | public/robots.txt |

---

## Gap 5 — Conversion tracking has no plan

### What's broken
Targeting 1,000 clicks/28d at 12 months but no measurement of what happens after the click. We won't know if SEO drives Roland revenue or just sticker orders.

### Move to Wave A (Week 1-2)

| Task | Tool / location |
|---|---|
| GA4 events: quote_form_start, quote_form_submit, phone_click, email_click | GTM or direct gtag in components |
| Roland vs Sticker conversion segment | GA4 custom dimension on quote form: `product_category` |
| Quote form completion attribution | UTM-aware quote form (already exists?) — verify |
| Phone tracking (call tracking number per channel?) | optional Phase 2 — CallRail or DIY w/ Twilio |
| Conversion dashboard | new staff page src/app/staff/seo-dashboard/page.tsx |

### Targets
- Quote form submit rate from organic Roland pages: ≥ 2.5% (industry benchmark)
- Phone click rate from Roland pages: ≥ 4%
- Sticker vs Roland order ratio measurable monthly

---

## Gap 6 — Saskatchewan seasonality is hard but content calendar is generic

### What's broken
Original calendar treats every week the same. Saskatchewan signage has brutal seasonal swings. We're publishing election content in week 12 (mid-summer) when the demand is fall.

### Revised seasonal map

| Quarter | Months | Peak demand | Front-load content |
|---|---|---|---|
| Q1 (Apr-Jun) | spring | Real estate signs, lease signs, lawn signs spring listings | for-lease, real estate, property mgmt |
| Q2 (Jul-Sep) | summer | Events, agriculture, harvest signs, brewery patios | event signs, agriculture, brewery, banners |
| Q3 (Oct-Dec) | fall | Trade shows, retail holiday, election prep | trade show, retail signs, election rules, banners |
| Q4 (Jan-Mar) | winter | B2B planning year, vehicle wrap commits, indoor signage | vehicle graphics, wall murals, year-ahead planning |

### Action
Reorder CONTENT-CALENDAR.md weeks to match. Key swaps:
- Move "Saskatchewan election sign rules" from Wk 12 (summer) to Q3 fall
- Move "Real estate signs: what realtors order most" from Wk 7 to Wk 1 (spring listing rush)
- Move "Saskatchewan summer event signage checklist" from Wk 19 to Wk 13 (early summer)
- Move "Vehicle decals vs wraps ROI" from Wk 3 to Q4 (winter B2B planning when fleets refresh)

---

## Gap 7 — No competitor monitoring loop

### What's broken
Single competitor analysis snapshot. Sharp Auto Trim or Mako could ship a new page on "for lease signs" tomorrow and we'd find out 90 days later in GSC.

### Add to Wave B (Week 2 onwards)

| Task | Cadence |
|---|---|
| Monthly competitor audit via `/seo [domain]` for top 3 | monthly |
| Track competitor new page count via Sitemap diff | monthly cron in n8n |
| Alert if competitor ranks for query we're targeting | monthly GSC export diff |
| Quarterly redo of COMPETITOR-ANALYSIS.md | quarterly |

---

## Gap 8 — On-site cross-sell components are missing

### What's broken
Site treats product lines as siloed. Sticker visitor never sees Roland services unless they navigate. Banner visitor never sees coroplast cross-sell.

### Move to Wave C/D (Week 3-4)

| Task | File |
|---|---|
| `<RolandServicesStrip />` component | components/RolandServicesStrip.tsx |
| Place at bottom of every spoke page | components/IndustryPage.tsx (existing — add prop) |
| Rotating "Featured Roland service" hero | data-driven from supabase featured_roland_service table |
| "What goes with this?" recommendation block | logic per spoke (manual map) |

---

## Gap 9 — Photo + alt-text strategy needs an actual photo shoot

### What's broken
"5+ photos per hub" with no plan for what to shoot.

### Move to Wave A (Week 1) — half-day shoot

| Shot list | Where it lands |
|---|---|
| Roland TrueVIS printer in action (4 angles) | every hub hero |
| For-lease coroplast sign on commercial property | /for-lease + /property-mgmt |
| Banner installation on event venue | /banner-printing + /event-banners |
| Vehicle decal on local trade truck | /vehicle-decals + /vehicle-graphics |
| Wall mural in office | /wall-graphics + /custom-wall-murals |
| Trade show booth setup | /trade-show + /large-format |
| Realtor's commercial for-lease setup | /for-lease + /real-estate-signs |
| In-house designer at workstation | /about + /sign-company hub |
| Coroplast lawn sign cluster (sample) | /coroplast-signs hub + /lawn-signs |
| 18×24, 24×36, 4×8 size comparison shot | /coroplast hub (educational) |

### Alt-text formula
`[product] printed at True Color Saskatoon — Roland UV print on [substrate], [size]`

### Action
Block 4 hours next Saturday for shoot. Designer + 1 helper. Shot list above. WebP convert via existing `/truecolor-images` skill.

---

## Gap 10 — Email capture on hub pages

### What's broken
Hub pages drive traffic but don't convert visitors to leads. Currently only the quote form captures intent.

### Move to Wave D (Week 4)

| Hub | Lead magnet | Format |
|---|---|---|
| Sign Company Saskatoon | "Saskatoon Sign Bylaw Cheatsheet" | PDF |
| Banner Printing | "Banner Sizing + Material Guide" | PDF |
| Vehicle Graphics | "Vehicle Decal vs Wrap ROI Calculator" | interactive web |
| Coroplast Signs | "Lawn Sign Sizing + Install Guide" | PDF |
| Wall Graphics | "Office Wall Mural Visualizer" | photo upload tool |
| Large Format | "Trade Show Booth Signage Checklist" | PDF |

| Task | Tool |
|---|---|
| Brevo lead capture form on each hub | Brevo embed or custom |
| PDF generation for non-interactive magnets | weasyprint (already global) |
| Drip sequence per magnet | Brevo automation |
| GTM event tracking on capture | gtag |

---

## Revised Wave A (replaces original)

Original Wave A was 7 CTR rewrites. New Wave A is bigger but still ships in Week 1-2:

1. **CTR rewrites** (original) — 7 pages
2. **Cannibalization audit** (Gap 3) — Week 0 prerequisite
3. **Review request automation** (Gap 1) — Brevo + Supabase webhook
4. **Sticker cross-sell email + Brevo tag** (Gap 2)
5. **Bing Webmaster + IndexNow + llms.txt audit** (Gap 4)
6. **GA4 conversion events** (Gap 5)
7. **Photo shoot** (Gap 9) — Saturday block
8. **Seasonal calendar reorder** (Gap 6) — doc edit only

## Updated dependency graph

```
Week 0: Cannibalization audit + photo shoot scheduling
Week 1: CTR rewrites + Bing/IndexNow + GA4 + Brevo review/sticker tags
Week 2: Lease signage page + photo shoot + sticker cross-sell email live
Week 3: Hub 1 rebuild (Sign Company) + reviews flowing
Week 4: Hubs 2-5 rebuild (parallel agents) + lead magnets per hub
Week 5: Vehicle decision gate + competitor monitoring cron live
```

## What to do now

1. Review this addendum
2. Decide: do all 10 gaps go in Wave A, or pick top 5?
3. Approve photo shoot day
4. I'll execute approved gaps in parallel waves
