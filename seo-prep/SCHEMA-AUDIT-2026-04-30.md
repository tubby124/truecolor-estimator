# Schema.org JSON-LD Audit — True Color Display Printing
**Date:** 2026-04-30
**Auditor:** Claude (schema specialist)
**Scope:** Wave 3a Organization/LocalBusiness/WebSite gate + IndustryPage template + product pages + frozen ranking page spot-check
**Frozen pages (validate-only):** coroplast-signs-saskatoon, banner-printing-saskatoon, flyer-printing-saskatoon, business-cards-saskatoon, sign-company-saskatoon, aluminum-signs-saskatoon, sticker-printing-saskatoon

---

## Executive Summary

| Result | Count |
|---|---|
| Schema blocks audited | 23 across 9 files |
| **PASS** (rich-result eligible, no fixes needed) | 14 |
| **PASS with notes** (valid but improvable post-Wave-3a) | 5 |
| **FAIL — @id collision** (Wave 3a gate-breaking) | 2 |
| **FAIL — wrong phone number** | 1 |
| **WARN — review count drift** | 1 |
| Deprecated/restricted types found | 0 |
| Property typos (alternativeName, same-as, http://schema.org) | 0 |

**Wave 3a (May 2 gate) status:** The three layout.tsx schemas (Organization, LocalBusiness, WebSite) are **structurally correct** and the @id reference chain (LocalBusiness.parentOrganization → #organization, WebSite.publisher → #organization) **passes** — but **two competing pages declare the same @ids with conflicting properties**, which Google will treat as schema graph conflicts. Fixing those two collisions is the only Wave 3a-blocking issue. Everything else is improvement, not blocker.

---

## 1. layout.tsx — Wave 3a (PRIORITY 1)

File: [src/app/layout.tsx](src/app/layout.tsx) lines 72-217

### 1a. Organization (#organization) — PASS

Validation:
- `@context` = `https://schema.org` ✅
- `@type` = `Organization` ✅
- `@id` = `https://truecolorprinting.ca/#organization` ✅ stable anchor
- Required for Org rich result: `name`, `url`, `logo` — all present ✅
- `logo` is structured `ImageObject` with width 512 + height 512 (Google requires ≥112px) ✅
- `alternateName` is correct property spelling, array form is valid ✅
- 4 alternate names cover branded-query variants ("True Color Printing", "True Color Display Printing", "True Color Display Printing Ltd.", "TrueColor Printing") — directly addresses the pos 13.55 branded-query issue
- `sameAs` valid (3 absolute URLs: Instagram, Google Maps CID, Facebook) ✅
- `email`, `telephone` (E.164 `+13069548688`), `legalName` all present ✅
- `taxID` and `vatID` both set to `731454914RT0001` — duplicating taxID into vatID is unusual but not invalid; schema.org defines vatID as VAT registration which Canada doesn't have. **Note:** consider removing `vatID` (Canada uses GST/HST not VAT). Not gate-blocking.

**Verdict:** PASS — gate-quality.

### 1b. LocalBusiness (#localbusiness) — PASS

- `@context` = `https://schema.org` ✅
- `@type` = `["LocalBusiness", "Store"]` (multi-type valid) ✅
- `@id` = `https://truecolorprinting.ca/#localbusiness` ✅
- `parentOrganization: { "@id": "https://truecolorprinting.ca/#organization" }` ✅ — graph chain works
- Required for LocalBusiness rich result: `name`, `address`, `telephone` — all present ✅
- `address` is full PostalAddress with all 5 fields including `addressCountry: "CA"` ✅
- `geo` GeoCoordinates with float lat/lng ✅
- `openingHoursSpecification` valid ISO 24h time ✅
- `priceRange: "$$"` valid ✅
- `aggregateRating` structurally valid (see §6) ✅
- `hasOfferCatalog` with 15 services — all URLs absolute, all use slug format consistent with sitemap ✅
- `areaServed` GeoCircle with 50km radius ✅

**Verdict:** PASS — gate-quality.

### 1c. WebSite (#website) — PASS

- `@context` = `https://schema.org` ✅
- `@type` = `WebSite` ✅
- `@id` = `https://truecolorprinting.ca/#website` ✅
- `publisher: { "@id": "https://truecolorprinting.ca/#organization" }` ✅ — graph chain works
- `potentialAction` SearchAction with `query-input` and `urlTemplate` correctly bound to `{search_term_string}` ✅ — Sitelinks Search Box eligible
- Required: `name`, `url` — present ✅

**Verdict:** PASS — gate-quality.

### Wave 3a graph chain validation

```
WebSite#website ──publisher──▶ Organization#organization ◀──parentOrganization── LocalBusiness#localbusiness
```

All three @ids resolve. Chain is bidirectional and correct. **Wave 3a layout schemas pass.**

---

## 2. @id COLLISIONS — WAVE 3a GATE BLOCKERS

> Both must be fixed before May 2 to avoid Google treating these as schema conflicts.

### 2a. about/page.tsx — duplicate Organization @id — **FAIL**

File: [src/app/about/page.tsx](src/app/about/page.tsx) lines 22-77

Declares a second `Organization` with the **same `@id`** as layout.tsx (`https://truecolorprinting.ca/#organization`) but with **different/missing properties**:

| Field | layout.tsx | about/page.tsx | Conflict? |
|---|---|---|---|
| @id | `#organization` | `#organization` | SAME — collision |
| legalName | "True Color Display Printing Ltd." | (missing) | DROPPED |
| alternateName | 4 entries | (missing) | DROPPED |
| logo | structured ImageObject | string URL | DOWNGRADED |
| image | og-image.png | (missing) | DROPPED |
| taxID | 731454914RT0001 | (missing) | DROPPED |
| foundingYear | (missing) | "2019" | ADDED |
| foundingLocation | (missing) | Place at 1629 Ontario Ave | ADDED |
| areaServed | (missing) | City + AdministrativeArea | ADDED |
| hasOfferCatalog | 15 services | 10 services (no urls) | CONFLICT |

When Google merges nodes by @id across pages, conflicting property values create non-deterministic merge behavior. The 4-entry alternateName (the entire point of Wave 3a) gets dropped on /about page loads.

**Fix:** Replace the about/page.tsx organizationSchema block with a minimal `AboutPage` schema that *references* the canonical Organization rather than redeclaring it:

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "url": "https://truecolorprinting.ca/about",
  "mainEntity": { "@id": "https://truecolorprinting.ca/#organization" }
}
```

Or extend the existing Organization with only the fields that are net-new (foundingYear, foundingLocation) by re-referencing the @id:

```json
{
  "@context": "https://schema.org",
  "@id": "https://truecolorprinting.ca/#organization",
  "foundingYear": "2019",
  "foundingLocation": { "@type": "Place", "address": {...} }
}
```

Either pattern eliminates the conflict.

**Risk if shipped during Wave 3a:** Google's branded-query graph for "true color printing" sees inconsistent Organization data → continued pos 13.55 instead of recovery.

### 2b. contact/page.tsx — duplicate LocalBusiness @id — **FAIL**

File: [src/app/contact/page.tsx](src/app/contact/page.tsx) lines 24-60

Declares a second `LocalBusiness` with the same `@id` (`#localbusiness`) but missing 12 fields the layout version has:

| Field | layout.tsx | contact/page.tsx |
|---|---|---|
| @type | ["LocalBusiness", "Store"] | "LocalBusiness" |
| parentOrganization | → #organization | (missing) |
| legalName | present | (missing) |
| alternateName | present | (missing) |
| description | present | (missing) |
| areaServed | GeoCircle 50km | (missing) |
| paymentAccepted | present | (missing) |
| currenciesAccepted | "CAD" | (missing) |
| knowsAbout | 9 entries | (missing) |
| hasOfferCatalog | 15 services | (missing) |
| aggregateRating | 5.0 / 29 | (missing) |
| hasMap | Maps URL | (missing) |
| image | logo.png | shop-exterior.webp (different) |

Same merge-conflict issue. The aggregateRating in particular — if Google merges the contact-page node first, it sees no rating → fewer star snippets.

**Fix:** Either delete the entire `localBusinessSchema` block on contact/page.tsx (the layout.tsx version is already injected on every page), or replace with a `ContactPage` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "url": "https://truecolorprinting.ca/contact",
  "mainEntity": { "@id": "https://truecolorprinting.ca/#localbusiness" }
}
```

The contact/page.tsx BreadcrumbList and FAQPage blocks are fine — keep those. Only remove/refactor the LocalBusiness block.

---

## 3. IndustryPage.tsx (template used by 50+ landing pages) — PASS WITH NOTES

File: [src/components/site/IndustryPage.tsx](src/components/site/IndustryPage.tsx) lines 73-118

### 3a. Service schema — PASS WITH NOTES

- `@context` ✅ `@type: Service` ✅
- `provider` correctly references LocalBusiness with `"@id": "${BASE_URL}/#localbusiness"` ✅ — links into the layout graph
- `areaServed` array with City + AdministrativeArea ✅
- `serviceType: "Print Service"` ✅
- `description` present ✅
- `url` set when `canonicalSlug` provided ✅
- **Note (non-blocking, Wave-3-eligible improvements deferred for frozen pages):** No `offers` block. Google does not show rich results for Service schema (it's mostly for knowledge graph), so adding `offers.price` won't trigger rich snippets — but it strengthens entity confidence. **Skip for frozen pages. Allowed for new pages going forward.**
- **Note:** Service `provider` redeclares `name`, `url`, `telephone`, `address` even though the @id is provided. Google reconciles this fine, but the verbose redeclaration creates the same conflict surface as §2 if any field drifts. Recommend reducing to `provider: { "@id": "${BASE_URL}/#localbusiness" }` for ALL non-frozen pages — DEFERRED, NOT for this session.

**Verdict:** PASS for frozen pages (no changes needed). Note logged for Wave 4+.

### 3b. FAQPage schema — PASS

- `@context` ✅ `@type: FAQPage` ✅
- `mainEntity` array of `Question` with `acceptedAnswer: Answer` ✅
- Conditionally rendered (`faqs.length > 0 ? ... : null`) — clean ✅
- **Restriction note:** Per Google's Aug 2023 policy, FAQPage rich results are restricted to government and healthcare authority sites. True Color won't get FAQ rich results regardless. **Keep the schema** — it still feeds knowledge graph and entity understanding. Do **not** remove on frozen pages, do **not** add new FAQPage blocks elsewhere just to chase rich results.

**Verdict:** PASS — schema is valid; SERP rich-snippet eligibility is a Google policy issue, not a schema issue.

### 3c. BreadcrumbList — PASS

- `@context` ✅ `@type: BreadcrumbList` ✅
- 2-position list (Home → page) ✅
- Conditionally rendered when `canonicalSlug` provided ✅
- All `item` URLs absolute ✅

**Verdict:** PASS.

---

## 4. products/[slug]/page.tsx (16 product pages) — PASS WITH NOTES

File: [src/app/products/[slug]/page.tsx](src/app/products/[slug]/page.tsx) lines 54-130

> **Important context:** /products/* is `noindex` per CLAUDE.md route map. Schema here helps internal linking + entity confidence, not SERP results. So validation matters, rich-result eligibility doesn't.

### 4a. Product schema — PASS

- `@context` ✅ `@type: Product` ✅
- Required for Product rich result: `name`, `image`, `offers` — all present ✅
- `offers.price` extracted from `fromPrice` string via regex (`replace(/[^0-9.]/g, "")`) — **WARN:** if `fromPrice` is something like `"$8/sqft"` the extracted value is `8` which is technically the per-sqft rate, not the offer price. For products like coroplast-signs the fromPrice is `$30` (the minimum), so `30` is correct. Verify on a per-product basis, but since these pages are noindex, low-impact.
- `aggregateRating`: 5.0 / **29** ✅ structurally valid
- `offers.seller` references `"@id": "https://truecolorprinting.ca/#localbusiness"` ✅
- `offers.availability: "https://schema.org/InStock"` ✅
- `offers.priceCurrency: "CAD"` ✅
- `brand` is an inline Brand object (valid; could also reference Organization @id, but Brand is fine)

**Verdict:** PASS.

### 4b. Service schema (also on product pages) — PASS WITH NOTE

- Valid structure, all fields present
- `provider` is **inline LocalBusiness** without @id reference. This re-declares the entity and could conflict with the layout #localbusiness if fields drift. Same recommendation as §3a: reduce to `provider: { "@id": ".../#localbusiness" }`. **Deferred** — pages are noindex, very low impact.

### 4c. BreadcrumbList — PASS

3-position list (Home → Products → product). Valid.

### 4d. FAQPage — PASS

Same structure as IndustryPage. Valid (Google policy applies — knowledge graph only).

---

## 5. Frozen ranking pages — VALIDATION ONLY

> Per .claude/rules/seo-protected-pages.md: validate only, do NOT recommend property changes.

| Page | Schema source | Rank | Validation |
|---|---|---|---|
| coroplast-signs-saskatoon | IndustryPage template | #5 | PASS — all 3 schemas valid; canonicalSlug set; primaryProductSlug set |
| banner-printing-saskatoon | IndustryPage template | #2 | PASS — same template, same validation result |
| sticker-printing-saskatoon | IndustryPage template | top 10 | PASS — same template |

All three rely on the IndustryPage template (§3) and inherit the layout schemas (§1). No per-page schema overrides. Validation: PASS.

**No recommendations for these pages.** Frozen.

---

## 6. AggregateRating — Star Snippet Eligibility

### Sources

| File | ratingValue | reviewCount | Source of truth |
|---|---|---|---|
| layout.tsx (LocalBusiness) | "5.0" | `String(REVIEW_COUNT)` from src/lib/reviews.ts | reviews.ts |
| products/[slug]/page.tsx (Product) | "5.0" (hardcoded) | "29" (hardcoded) | hardcoded |
| src/lib/reviews.ts | RATING_VALUE = "5.0" | REVIEW_COUNT = 29 | constants |

### Validation

- `@type: AggregateRating` ✅
- `ratingValue: "5.0"` (string) ✅ — Google accepts both string and number
- `bestRating: "5"` ✅
- `worstRating: "1"` ✅
- `reviewCount: "29"` (≥1) ✅ — minimum required for star snippet eligibility is 1 review

**Star snippet eligibility:** AggregateRating attached to LocalBusiness can get the star treatment in local pack/knowledge panel; on Product schema (currently only on /products/* which is noindex) it would feed product rich results — but those pages are noindex so no SERP impact.

### WARN: prompt drift

The audit request says "currently 5.0/27 reviews" but actual code shows **29**. Two possibilities:
1. The 27 is stale prompt context — the actual deployed value is 29 (matches reviews.ts). No action needed.
2. There was an intent to revert to 27 — if so, update `src/lib/reviews.ts` REVIEW_COUNT and the hardcoded 29 in `src/app/products/[slug]/page.tsx` line 65 together.

**Action:** confirm with owner which number is current. If 29 is correct, **only fix needed is on products/[slug]/page.tsx line 65** — replace hardcoded `"29"` with `String(REVIEW_COUNT)` imported from `@/lib/reviews` so future changes update both atomically. Allowed under SEO safety rules ("update count only — never change ratingValue").

---

## 7. Other schema files — quick validation

| File | Schemas | Status |
|---|---|---|
| src/app/page.tsx (homepage) | FAQPage (5 questions) | PASS — relies on layout for Organization/LocalBusiness/WebSite |
| src/app/gallery/page.tsx | CollectionPage with inline LocalBusiness provider | PASS WITH NOTE — no @id collision (provider is unidentified inline node, not @id-referenced); could tighten to `provider: { "@id": ".../#localbusiness" }` |
| src/app/resources/page.tsx | @graph with WebPage + FAQPage | PASS WITH NOTE — uses inline LocalBusiness publisher; same tightening applies |
| src/app/vehicle-decals-saskatoon/page.tsx | BreadcrumbList + Service | **FAIL — wrong phone number** |

### 7a. vehicle-decals-saskatoon — wrong phone — **FAIL**

File: [src/app/vehicle-decals-saskatoon/page.tsx](src/app/vehicle-decals-saskatoon/page.tsx) line 56

```
telephone: "+1-306-700-0272"
```

Every other schema across the codebase uses `+13069548688` (the True Color shop number per .claude/rules/truecolor-domain.md). This page declares a different number on its Service.provider node. NAP (Name/Address/Phone) consistency is a local-SEO ranking signal — having one page disagree dilutes the signal.

**Fix:** Change line 56 to `telephone: "+13069548688"`.

This page is NOT in the frozen list, so the change is allowed.

---

## 8. Property typo / format scan — CLEAN

Scanned all .tsx and .ts files under src/app and src/components for:
- `alternativeName` (typo of alternateName) → 0 hits ✅
- `same-as` (typo of sameAs) → 0 hits ✅
- `http://schema.org` (should be https) → 0 hits ✅
- `HowTo` (deprecated Sept 2023) → 0 hits ✅
- `SpecialAnnouncement` (deprecated July 2025) → 0 hits ✅
- Relative URLs in @id or url → 0 hits ✅
- Placeholder text like `[Business Name]` → 0 hits ✅

Clean.

---

## 9. Wave 4 deferred recommendation — Product schema rollout

**Per .claude/rules/truecolor-seo-safety.md Wave 4: "Product schema on landing pages — Risk: Low — Wait 7 days after Wave 3."**

> The user explicitly asked for Wave 4 recommendations as a deferred list, NOT to act on. Listed below; do not implement until owner triggers Wave 4 after Wave 3a/3b GSC stabilization.

### Recommended Wave 4 candidates (in order)

These are pages that would benefit most from Product schema on the public-facing /[slug]-saskatoon URL (currently only IndustryPage template runs there, no Product). Adding Product gives these pages eligibility for product rich results (price, availability, rating) in SERP.

1. **business-cards-saskatoon** — #1 ranking, lot-priced (`$45 / 250 cards`) maps cleanly to a single Product+Offer. Highest conversion-density landing page. **FROZEN** — skip.
2. **flyer-printing-saskatoon** — #3 ranking, lot-priced ($45 / 100). Clean Product mapping. **FROZEN** — skip.
3. **sticker-printing-saskatoon** — top 10, lot-priced (100/250/500 tiers). Could use AggregateOffer with priceSpecification. **FROZEN** — skip.
4. **postcard-printing-saskatoon** — not frozen. Lot-priced. Good Wave 4 candidate.
5. **brochure-printing-saskatoon** — not frozen. Good Wave 4 candidate.
6. **vinyl-lettering-saskatoon** — not frozen. Per-sqft pricing — needs careful Offer modelling (use minimum order $40 as price, document with priceSpecification UnitPriceSpecification).
7. **window-decals-saskatoon** — not frozen. Same per-sqft consideration.
8. **retractable-banners-saskatoon** — not frozen. Lot-priced ($219). Clean.

### Frozen-page exclusions

Per the user's rule, no Product schema additions on: coroplast-signs-saskatoon, banner-printing-saskatoon, flyer-printing-saskatoon, business-cards-saskatoon, sign-company-saskatoon, aluminum-signs-saskatoon, sticker-printing-saskatoon. Once those rankings stabilize for 30+ days post-Wave-3a, owner can revisit.

### Wave 4 prerequisites

- Wave 3a (layout schemas) confirmed live and indexed in GSC ✅ already shipped 2026-04-27
- §2a + §2b @id collisions resolved (this audit) — **gate item**
- 7+ days clean GSC after Wave 3a/3b
- All Product schemas use `seller: { "@id": ".../#localbusiness" }` to attach to layout LocalBusiness graph
- Real prices from CSV via getConfigNum — never hardcoded

---

## 10. Action list, ordered by priority

| # | Action | File | Frozen? | Risk | Wave |
|---|---|---|---|---|---|
| 1 | Remove duplicate Organization @id (replace with AboutPage referencing #organization) | src/app/about/page.tsx | No | Very low | 3a fix |
| 2 | Remove duplicate LocalBusiness @id (replace with ContactPage or delete) | src/app/contact/page.tsx | No | Very low | 3a fix |
| 3 | Fix wrong phone number on Service schema | src/app/vehicle-decals-saskatoon/page.tsx:56 | No | Very low | 3a fix |
| 4 | Confirm AggregateRating count (27 vs 29); align hardcoded "29" in products/[slug] with REVIEW_COUNT import | src/app/products/[slug]/page.tsx:65 | No (noindex) | Very low | Anytime |
| 5 | Tighten Service.provider on IndustryPage to use @id only (no inline LocalBusiness redeclaration) | src/components/site/IndustryPage.tsx | Affects frozen pages | LOW but template change | DEFER to Wave 5+ — touches frozen-page output |
| 6 | Tighten Product/Service provider on /products/[slug] to @id-only | src/app/products/[slug]/page.tsx | No (noindex) | Very low | Wave 4 |
| 7 | Drop Organization.vatID (Canada uses GST, not VAT) | src/app/layout.tsx | No | Very low | Wave 4 |
| 8 | Tighten gallery + resources LocalBusiness provider/publisher to @id-only | src/app/gallery/page.tsx, src/app/resources/page.tsx | No | Very low | Wave 4 |

**Wave 3a-blocking items (must ship before May 2 gate evaluation):** #1, #2, #3.

Items #4–#8 are improvements, not gate items. Defer per the SEO safety wave system.

---

## Files referenced

- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/layout.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/components/site/IndustryPage.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/products/[slug]/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/about/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/contact/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/gallery/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/resources/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/vehicle-decals-saskatoon/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/page.tsx
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/coroplast-signs-saskatoon/page.tsx (frozen)
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/banner-printing-saskatoon/page.tsx (frozen)
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/app/sticker-printing-saskatoon/page.tsx (frozen)
- /Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/src/lib/reviews.ts
