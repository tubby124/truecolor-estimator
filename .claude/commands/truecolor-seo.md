---
name: truecolor-seo
description: True Color Display Printing SEO engine. Use whenever building or editing any page on truecolorprinting.ca. Also invoke when the user mentions "new page", "landing page", "SEO", "ranking", "keyword", "schema", "meta", "content", or any of the 6 priority pages. Pre-loaded with all competitor intel, keyword targets, schema templates, and content rules. No research needed — everything is here.
metadata:
  version: 1.0.0
---

# True Color SEO Engine

> You are the SEO brain for **True Color Display Printing Ltd.** — Saskatoon's only print shop with transparent real-time online pricing. Every page you touch must rank, convert, and answer questions competitors refuse to answer.

---

## BUSINESS CONTEXT (read before any SEO work)

**Business:** True Color Display Printing Ltd.
**Location:** 216 33rd St W, Saskatoon, SK S7L 0V2
**Phone:** (306) 954-8688
**Domain:** truecolorprinting.ca
**Stack:** Next.js 16.1.6, TypeScript, Tailwind CSS v4, Railway hosting

**Core differentiator:** The ONLY print shop in Saskatoon with a real-time online estimator that shows exact prices before you order. Every competitor is quote-only or phone-only.

**Selling points (owner-confirmed):**
1. In-house designer (no outsourcing)
2. One shop for everything (signs, banners, magnets, cards, flyers, stickers, brochures)
3. Local Saskatoon — 216 33rd St W
4. Beats Staples/FedEx pricing
5. Same-day = rush +$40 flat
6. Real-time transparent pricing online (exclusive in Saskatoon market)

---

## KEYWORD MAP — Priority Targets

### Tier 1: Build NOW (100–500 searches/mo, local, purchase intent)

| Keyword | Vol/mo | Page Target | Status | 90-day odds |
|---|---|---|---|---|
| coroplast signs saskatoon | 100–300 | `/coroplast-signs-saskatoon` | NOT BUILT | 90% #1 |
| same day printing saskatoon | 200–400 | `/same-day-printing-saskatoon` | NOT BUILT | 85% top 3 |
| banner printing saskatoon | 200–500 | `/banner-printing-saskatoon` | NOT BUILT | 80% top 3 |
| business cards saskatoon | 150–350 | `/business-cards-saskatoon` | NOT BUILT | 75% top 5 |
| agribusiness signs saskatchewan | 50–150 | `/agribusiness-signs-saskatchewan` | NOT BUILT | 95% #1 (zero local competition) |

### Tier 2: Industry pages (50–200 searches/mo, high B2B value)

| Keyword | Vol/mo | Page Target | Status |
|---|---|---|---|
| real estate signs saskatoon | 50–150 | `/real-estate-signs-saskatoon` | NOT BUILT |
| construction signs saskatoon | 30–100 | `/construction-signs-saskatoon` | NOT BUILT |
| healthcare signs saskatoon | 20–80 | `/healthcare-signs-saskatoon` | NOT BUILT |
| election signs saskatoon | seasonal | `/election-signs-saskatoon` | Partial (exists at /election-signs) |
| restaurant signs saskatoon | 20–60 | `/restaurant-signs-saskatoon` | Partial (exists at /restaurants) |

### Tier 3: Product pages (already exist — optimize)

| Page | Primary keyword |
|---|---|
| `/products/coroplast-signs` | coroplast signs saskatoon |
| `/products/vinyl-banners` | vinyl banner printing saskatoon |
| `/products/vehicle-magnets` | vehicle magnets saskatoon |
| `/products/business-cards` | business cards saskatoon |
| `/products/flyers` | flyer printing saskatoon |
| `/products/acp-signs` | ACP signs saskatoon, aluminum composite signs |

---

## COMPETITOR INTEL — How to Destroy Each One

### Market-wide weakness: D+ content grade
All 7 local competitors are quote-only, phone-only, and answer ZERO buyer questions on their websites.

| Competitor | Grade | Their Weakness | Our Weapon |
|---|---|---|---|
| Qwik Signs | C | 10–14 day turnaround, no online pricing | Same-day + real pricing |
| Minuteman Press | D | Franchise template, "call us" for everything | Local ownership + transparent pricing |
| **Rayacom** | C- | **3.86/5 stars, worst reputation in market** | Same-day + 4.9 stars + transparent pricing |
| Mako Signs | D+ | Appointment-only, zero self-serve | Order online in 3 clicks |
| The Print Baron | D | 5-star reviews but placeholder website | Same content advantage + same speed |
| Kota Graphics | C+ | Vehicle wraps only, no small orders | One shop for everything |
| PGI Printers | D | 50-year legacy shop, no digital conversion | Modern online ordering |

**Rayacom is the #1 competitor to destroy.** They own "same day printing Saskatoon" and have the worst reviews in the market. Every page that targets speed must contrast quality (our 4.9 stars vs. their 3.86).

---

## SCHEMA REQUIREMENTS — By Page Type

### Every page (global)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "True Color Display Printing",
  "url": "https://truecolorprinting.ca",
  "telephone": "+13069548688",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "216 33rd St W",
    "addressLocality": "Saskatoon",
    "addressRegion": "SK",
    "postalCode": "S7L 0V2",
    "addressCountry": "CA"
  }
}
```
Already in `src/app/layout.tsx` — verify it's there.

### Product/landing pages → add Service schema
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Coroplast Sign Printing in Saskatoon",
  "serviceType": "Print Service",
  "provider": { "@type": "LocalBusiness", "name": "True Color Display Printing" },
  "areaServed": { "@type": "City", "name": "Saskatoon" },
  "description": "...",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CAD",
    "price": "8.00",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "priceCurrency": "CAD",
      "unitText": "per square foot"
    }
  }
}
```

### FAQ sections → FAQPage schema
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much do coroplast signs cost in Saskatoon?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "18×24\" coroplast signs start at $28.80. Prices decrease with quantity — order 5+ and save 8%, 10+ save 17%, 25+ save 23%. See exact pricing at truecolorprinting.ca/products/coroplast-signs."
      }
    }
  ]
}
```

### BreadcrumbList — add to all inner pages
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://truecolorprinting.ca" },
    { "@type": "ListItem", "position": 2, "name": "Coroplast Signs Saskatoon", "item": "https://truecolorprinting.ca/coroplast-signs-saskatoon" }
  ]
}
```

---

## CONTENT RULES — Non-Negotiable

### Voice & Tone (from voice_style_guide.md)
- **Plain language only.** No jargon without immediate explanation.
- **Blunt and local.** "We're in Saskatoon. We print same day." Not "We offer expedited production services in the Saskatchewan region."
- **Always name prices.** "18×24" starts at $28.80" not "pricing available on request."
- **Active voice.** "Order online" not "Orders can be placed online."
- **Sentence length:** max 20 words for key claims.
- **Banned phrases:** "cutting-edge," "state-of-the-art," "high-quality solutions," "seamless experience," "leverage," "utilize."

### Content Length by Page Type
| Page Type | Min words | Why |
|---|---|---|
| SEO landing page (e.g. /coroplast-signs-saskatoon) | 1,200 | Topical depth to beat competitors |
| Industry page (e.g. /agribusiness-signs-sk) | 800 | Niche authority signal |
| Product page (/products/*) | 600 | Existing — add FAQ section |
| Homepage | 800+ | Already built |

### The 50 Questions We Must Answer (from competitor_content_audit.md)
Zero competitors answer these. We answer every one. Priority questions for landing pages:
1. What is coroplast and why is it used outdoors?
2. How long do coroplast signs last in Saskatchewan winters?
3. What file format do I need to send?
4. Can I get same-day printing in Saskatoon?
5. How much does a coroplast sign cost?
6. Do you show prices before I commit to ordering?
7. What are H-stakes and do I need them?
8. Do you have a minimum order quantity?
9. Can I order online without calling?
10. Will I see a proof before you print?

---

## PAGE CHECKLIST — Run This Before Shipping ANY Page

```
SEO CHECKLIST — True Color Landing Page
□ title tag: 50-60 chars, starts with keyword, ends with "| True Color Printing Saskatoon"
□ meta description: 150-160 chars, includes keyword, includes price, includes "same-day" or "Saskatoon"
□ H1: contains primary keyword, one per page only
□ H2s: contain secondary keywords and question-format headings
□ URL: /keyword-saskatoon or /keyword-saskatchewan format
□ First 100 words: primary keyword appears
□ Pricing table: real prices from engine (never "contact for pricing")
□ CTA above fold: "Get an instant price" → links to /products/[slug] estimator
□ FAQPage schema: minimum 3 questions from the 50-question master list
□ Service schema: areaServed: Saskatoon, real price in offers
□ BreadcrumbList schema: home → this page
□ noindex: NEVER on SEO landing pages
□ Internal links: link to at least 2 product pages + 1 industry page
□ External link: link to Google Maps listing (trust signal)
□ Images: WebP, alt text with keyword + location, descriptive filenames
□ Sitemap: verify page appears in /sitemap.xml
```

---

## 6 PRIORITY PAGES — Build Order + Copy Sources

### 1. `/coroplast-signs-saskatoon` (BUILD FIRST — #1 keyword)
**Copy source:** `research/content/seo_keywords.md` L304 + `research/website/SEO_DOMINATION_PLAN_20260228.md` Section 7
**Title:** `Coroplast Signs Saskatoon | Same-Day Printing | True Color`
**Meta:** `Custom coroplast yard signs in Saskatoon. 18×24" from $28.80. Order online, get an instant price, pick up same day. No quote needed.`
**Hero H1:** `Coroplast Signs Saskatoon — Order Online, Pick Up Today`
**Must include:** pricing table (18×24, 24×36, 24×48, 4×8), FAQPage schema (5+ Qs), Service schema, bulk discount table, H-stake upsell, comparison vs. foamboard, "Saskatchewan winter" durability claim
**Destroy sentence:** PrintRadiant is a Chicago shop pretending to be local. We're at 216 33rd St W. Same-day turnaround means you order at 9am and pick up at 4pm.

### 2. `/same-day-printing-saskatoon`
**Copy source:** `research/content/seo_keywords.md` L224 + `SEO_DOMINATION_PLAN` Section 7
**Title:** `Same-Day Printing Saskatoon | Ready Same Day | True Color`
**Meta:** `Same-day printing in Saskatoon. Coroplast signs, banners, business cards — order by 10am, pick up same day. Online pricing. No quote needed.`
**Hero H1:** `Same-Day Printing in Saskatoon — Order Online, Pick Up Today`
**Must include:** order cutoff time, product list with same-day availability, +$40 rush fee clearly stated, Rayacom contrast (their 3.86 stars vs our rating), real testimonial
**Destroy sentence:** Rayacom says same-day too. Their Google rating is 3.86/5. Ours is 4.9. Same speed, completely different quality.

### 3. `/agribusiness-signs-saskatchewan` (URGENT — plot sign season NOW)
**Copy source:** `research/content/website_copy.md` L249 — FULL COPY READY
**Title:** `Agribusiness Signs Saskatchewan | Plot Signs, Field Banners | True Color`
**Meta:** `Plot signs, field signs, Ag in Motion banners, vehicle magnets for ag reps. Bulk pricing. Local Saskatoon print shop — order online, same-day available.`
**Hero H1:** `Agribusiness Signs Saskatchewan — Plot Signs, Field Banners, Ag Rep Kits`
**Must include:** plot sign pricing (100+ qty bulk), Ag in Motion banner spec, vehicle magnet for ag reps, field sign installation guide, FAQPage schema
**Urgency note:** Feb–Mar = plot sign ordering season. This page is uncontested. Build NOW.

### 4. `/healthcare-signs-saskatoon`
**Copy source:** `research/content/website_copy.md` L403 — FULL COPY READY
**Title:** `Healthcare Signs Saskatoon | Clinic Signage, Medical Office Signs | True Color`
**Hero H1:** `Healthcare Signs Saskatoon — Clinic Signage & Medical Office Printing`

### 5. `/banner-printing-saskatoon`
**Copy source:** `research/content/seo_keywords.md` L278
**Title:** `Banner Printing Saskatoon | 13oz Vinyl Banners from $45 | True Color`
**Must include:** transparent $/sqft pricing ($8.25/sqft), grommet options, size calculator link, outdoor durability claims

### 6. `/business-cards-saskatoon`
**Copy source:** `research/content/seo_keywords.md` L252
**Title:** `Business Cards Saskatoon | 250 Cards from $45 | Same Day | True Color`
**Must include:** 250 for $45 price call-out, per-associate reorder angle (B2B), realtor kit mention

---

## TECHNICAL SEO — Standing Requirements

### Next.js Metadata (every page)
```typescript
export const metadata: Metadata = {
  title: "Keyword Saskatoon | True Color Printing",
  description: "150-160 chars with keyword + price + location",
  alternates: { canonical: "https://truecolorprinting.ca/page-slug" },
  openGraph: {
    title: "...",
    description: "...",
    url: "https://truecolorprinting.ca/page-slug",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_CA",
    type: "website",
  },
};
```

### noindex pages (MUST have)
- `/pay/[token]` — payment gateway
- `/cart` — cart
- `/checkout` — checkout
- `/order-confirmed` — thank you page
- `/staff/*` — all staff routes

### Sitemap — verify all SEO pages appear in `/sitemap.xml`
Current `src/app/sitemap.ts` generates dynamically. Add new pages to the products array or create a separate `landingPages` array.

### 301 Redirects — add to `next.config.ts` if old Hostinger URLs differ
Check Hostinger file manager for old URL structure FIRST before building new pages.

---

## RESEARCH FILES — Full Copy Pre-Written

| File | Contents |
|---|---|
| `research/content/seo_keywords.md` | 12-page keyword map, monthly volumes, competitor rankings |
| `research/content/website_copy.md` | Full copy for 6 industry pages + homepage + FAQ |
| `research/content/competitor_content_audit.md` | 7 competitor audits + 50-question opportunity list |
| `research/content/CONTENT_MASTER_SUMMARY.md` | Executive summary, top 10 opportunities |
| `research/content/customer_psychology.md` | 6 industry mental journey maps |
| `research/content/voice_style_guide.md` | Brand voice rules, 20+ do/don't pairs |
| `research/website/SEO_DOMINATION_PLAN_20260228.md` | Master competitive strategy + page briefs |
| `research/website/SEO_CUTOVER_AUDIT_20260228.md` | Full audit of current site SEO state |

---

## WHEN TO RUN THIS SKILL

**Automatically invoke when:**
- Building any new page
- Editing any `page.tsx` in `src/app/`
- Adding or editing metadata in any file
- Discussing keywords, content, or search rankings
- Discussing any of the 6 priority landing pages
- Adding schema markup
- Editing `next.config.ts` (redirects affect SEO)
- Editing `src/app/sitemap.ts` or `src/app/robots.ts`

**What to do each time:**
1. Run the PAGE CHECKLIST above against the page being built/edited
2. Flag any missing schema types
3. Flag any missing keywords in title/H1/meta
4. Suggest FAQ questions from the 50-question master list
5. Link to copy source in research/content/ if copy is needed
