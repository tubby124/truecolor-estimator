# Wave 3b — Commit 2: Schema dedup + NAP fix (Wave 3a integrity)

**Why this commit exists:** The 2026-04-30 schema audit ([SCHEMA-AUDIT-2026-04-30.md](SCHEMA-AUDIT-2026-04-30.md)) found that Wave 3a's Organization + LocalBusiness schemas are being **silently corrupted** in production by duplicate `@id` declarations on `/about` and `/contact`, plus a NAP-inconsistent phone on `/vehicle-decals-saskatoon`. Without this commit, the Wave 3a brand fix (`alternateName` array) and aggregateRating star snippet are non-deterministic depending on which page Googlebot crawls first.

**Risk:** Low. All changes either reference existing canonical schema by @id or remove duplicate declarations. Net effect is fewer competing nodes, not more.

**Files touched:** 3
- `src/app/about/page.tsx` — replace duplicate Organization with AboutPage referencing canonical @id
- `src/app/contact/page.tsx` — delete duplicate LocalBusiness block (layout.tsx already injects canonical version on every page)
- `src/app/vehicle-decals-saskatoon/page.tsx` — single-line phone fix `+1-306-700-0272` → `+13069548688`

**Why these are bundled:** All 3 fixes share the same concern — "Wave 3a schema graph integrity." Per wave-safety, single-concern commits are preferred. This is one concern across 3 files.

---

## Diff: src/app/about/page.tsx

### Replace the entire `organizationSchema` const (lines 22-77)

```diff
-const organizationSchema = {
-  "@context": "https://schema.org",
-  "@type": "Organization",
-  "@id": "https://truecolorprinting.ca/#organization",
-  name: "True Color Display Printing",
-  url: "https://truecolorprinting.ca",
-  logo: "https://truecolorprinting.ca/truecolorlogo.png",
-  telephone: "+13069548688",
-  email: "info@true-color.ca",
-  address: {
-    "@type": "PostalAddress",
-    streetAddress: "216 33rd St W",
-    addressLocality: "Saskatoon",
-    addressRegion: "SK",
-    postalCode: "S7L 0V1",
-    addressCountry: "CA",
-  },
-  sameAs: [
-    "https://www.instagram.com/truecolorprint",
-    "https://maps.google.com/?cid=3278649905558780051",
-    "https://www.facebook.com/truecolordisplay",
-  ],
-  description:
-    "Saskatoon-based print shop operating Roland TrueVIS and Konica Minolta production equipment in-house. Coroplast signs, vinyl banners, vehicle magnets, business cards, and large format printing. Local pickup at 216 33rd St W.",
-  foundingYear: "2019",
-  foundingLocation: {
-    "@type": "Place",
-    address: {
-      "@type": "PostalAddress",
-      streetAddress: "1629 Ontario Ave",
-      addressLocality: "Saskatoon",
-      addressRegion: "SK",
-      addressCountry: "CA",
-    },
-  },
-  areaServed: [
-    { "@type": "City", name: "Saskatoon" },
-    { "@type": "AdministrativeArea", name: "Saskatchewan" },
-  ],
-  hasOfferCatalog: {
-    "@type": "OfferCatalog",
-    name: "Print Products and Signage",
-    itemListElement: [
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Coroplast Signs" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vinyl Banners" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Business Cards" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "ACP Aluminum Signs" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vehicle Magnets" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Flyers" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Brochures" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Window Decals" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Retractable Banners" } },
-      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Graphic Design" } },
-    ],
-  },
-};
+const aboutPageSchema = {
+  "@context": "https://schema.org",
+  "@type": "AboutPage",
+  "@id": "https://truecolorprinting.ca/about#aboutpage",
+  url: "https://truecolorprinting.ca/about",
+  name: "About True Color Display Printing",
+  description:
+    "Meet the team behind True Color Display Printing. Roland TrueVIS UV printer, Konica Minolta press, in-house designer. Local Saskatoon shop at 216 33rd St W.",
+  mainEntity: { "@id": "https://truecolorprinting.ca/#organization" },
+  isPartOf: { "@id": "https://truecolorprinting.ca/#website" },
+};
```

### Update the JSX render reference

Find `<script type="application/ld+json"` block(s) on this page that render `organizationSchema` and rename the variable:

```diff
   <script
     type="application/ld+json"
-    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
+    dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
   />
```

**Why:** The canonical Organization (with the 4-entry `alternateName`, `legalName`, structured `logo`, `image`, `taxID`) is already injected on every page by `layout.tsx`. The /about page now adds a single `AboutPage` node that *references* it by @id. Google's structured data merge will see one Organization (from layout) plus one AboutPage referring to it — clean graph, no @id collision.

The page-specific data that this commit drops (foundingYear, foundingLocation, areaServed, hasOfferCatalog) — none of those are required for `AboutPage` and the layout-level `LocalBusiness` already declares `areaServed` (GeoCircle). foundingYear is acceptable to drop; it wasn't appearing in any rich result and Google rarely surfaces it. If owner wants foundingYear preserved later, it can be added to the layout-level Organization in a future schema-only commit.

---

## Diff: src/app/contact/page.tsx

### Delete the entire `localBusinessSchema` const (lines 24-60)

```diff
-const localBusinessSchema = {
-  "@context": "https://schema.org",
-  "@type": "LocalBusiness",
-  "@id": "https://truecolorprinting.ca/#localbusiness",
-  name: "True Color Display Printing",
-  url: "https://truecolorprinting.ca",
-  telephone: "+13069548688",
-  email: "info@true-color.ca",
-  image: "https://truecolorprinting.ca/images/about/shop-exterior.webp",
-  priceRange: "$$",
-  address: {
-    "@type": "PostalAddress",
-    streetAddress: "216 33rd St W",
-    addressLocality: "Saskatoon",
-    addressRegion: "SK",
-    postalCode: "S7L 0V1",
-    addressCountry: "CA",
-  },
-  geo: {
-    "@type": "GeoCoordinates",
-    latitude: 52.13254,
-    longitude: -106.67047,
-  },
-  openingHoursSpecification: [
-    {
-      "@type": "OpeningHoursSpecification",
-      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
-      opens: "09:00",
-      closes: "17:00",
-    },
-  ],
-  sameAs: [
-    "https://maps.google.com/?cid=3278649905558780051",
-    "https://www.instagram.com/truecolorprint",
-    "https://www.facebook.com/truecolordisplay",
-  ],
-};
-
```

### Delete the JSX render of localBusinessSchema

Find the `<script type="application/ld+json">` block that renders `localBusinessSchema` on /contact and delete the whole `<script>` element. **Keep** the `breadcrumbSchema` and `faqSchema` blocks — those are page-specific and required.

**Why:** The canonical LocalBusiness (with `parentOrganization` → #organization, `alternateName`, `aggregateRating` 5.0/27, `legalName`, `taxID`, etc.) is already injected by `layout.tsx` on every page including /contact. The /contact-specific block was a partial duplicate that Google would attempt to merge by @id — and the merge could drop fields that aren't on both copies (specifically `aggregateRating`, which is the star-snippet signal).

After this commit, /contact will have: layout-level Organization + LocalBusiness + WebSite (via global injection) + page-specific BreadcrumbList + FAQPage. Cleaner graph, fewer @id collisions, full Wave 3a brand signals preserved.

---

## Diff: src/app/vehicle-decals-saskatoon/page.tsx

### Single-line phone correction (line 56)

```diff
     },
-    telephone: "+1-306-700-0272",
+    telephone: "+13069548688",
   },
```

**Why:** Every other schema across the codebase uses the canonical True Color shop number `+13069548688` per `.claude/rules/truecolor-domain.md`. The `+1-306-700-0272` value on this page appears to be a paste error from a different brand or test data. NAP (Name/Address/Phone) inconsistency on a single page dilutes the local-SEO signal sitewide because Google evaluates NAP consistency across all citations of the brand.

This page is NOT on the FROZEN list, so the change is allowed. Single-line fix, zero scope risk.

---

## Diff: src/app/sitemap.ts

### Bump 3 lastmods (only the affected pages)

```diff
-    { url: `${BASE_URL}/about`, lastModified: new Date("2026-03-17"), changeFrequency: "monthly", priority: 0.6 },
+    { url: `${BASE_URL}/about`, lastModified: new Date("2026-05-02"), changeFrequency: "monthly", priority: 0.6 },
```

```diff
-    { url: `${BASE_URL}/contact`, lastModified: new Date("2026-03-15"), changeFrequency: "monthly", priority: 0.7 },
+    { url: `${BASE_URL}/contact`, lastModified: new Date("2026-05-02"), changeFrequency: "monthly", priority: 0.7 },
```

```diff
-    { url: `${BASE_URL}/vehicle-decals-saskatoon`, lastModified: new Date("2026-03-26"), changeFrequency: "monthly", priority: 0.85 },
+    { url: `${BASE_URL}/vehicle-decals-saskatoon`, lastModified: new Date("2026-05-02"), changeFrequency: "monthly", priority: 0.85 },
```

**Do NOT touch any other lastmod.** The flyer date from Commit 1 stays at 2026-05-02; sticker stays unchanged until Commit 3.

---

## Commit message

```
fix(seo): dedup Organization + LocalBusiness @id collisions, fix vehicle-decals NAP

Wave 3a Organization/LocalBusiness schemas in layout.tsx were being silently
corrupted in production by duplicate @id nodes on /about + /contact that
dropped key fields (alternateName, aggregateRating, parentOrganization).
- /about: Organization @id duplicate → replaced with AboutPage referencing canonical @id
- /contact: LocalBusiness @id duplicate → deleted (layout.tsx already injects canonical)
- /vehicle-decals-saskatoon: phone +1-306-700-0272 → +13069548688 (NAP fix)
Wave 3b commit 2 of 3 — schema integrity for May 2 GSC gate.
```

---

## Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Wait ~2 min Railway deploy
- [ ] Open https://search.google.com/test/rich-results — paste these 3 URLs and verify zero schema errors:
  - https://truecolorprinting.ca/ (homepage — confirms layout schemas)
  - https://truecolorprinting.ca/about (confirms AboutPage refers to canonical Organization)
  - https://truecolorprinting.ca/contact (confirms only layout schemas + breadcrumb + FAQ remain)
- [ ] Open https://truecolorprinting.ca/vehicle-decals-saskatoon — view-source, confirm `+13069548688` in JSON-LD
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) Phase 27b entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md` — Wave 3b commit 2 row
- [ ] Wait ≥24h before applying Commit 3 (sticker DDG) — different commits, different concerns
