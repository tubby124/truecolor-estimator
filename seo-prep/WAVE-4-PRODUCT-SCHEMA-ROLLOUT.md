# Wave 4 — Product schema rollout (Commits 5, 6, 7)

**Why:** Per [SEO-REMAINING-WAVES.md](../SEO-REMAINING-WAVES.md) + [CONTENT-EEAT-AUDIT-2026-04-30.md](CONTENT-EEAT-AUDIT-2026-04-30.md), top FROZEN pages should get `Product` schema with `offers.price` to qualify for rich-result price display in SERPs. **Ship order locked by E-E-A-T scoring:**

1. **Commit 5** — banner-printing-saskatoon (69/70 — highest score, ship first)
2. **Commit 6** — business-cards-saskatoon (68/70 — second)
3. **Commit 7** — sign-company-saskatoon (69/70 — third, AFTER Wave 4 Commit 2 voice fix)

**Risk:** Low if `offers.price` matches CSV truth; high if it drifts. **Run `/pricing-health` before each commit** to verify CSV alignment. Page is FROZEN at title/H1/slug — schema additions are explicitly allowed under [.claude/rules/seo-protected-pages.md](../.claude/rules/seo-protected-pages.md) ("schema additions to ranking pages have low risk but must be a separate commit from content changes").

**Sequencing rule per [.claude/rules/truecolor-seo-safety.md](../.claude/rules/truecolor-seo-safety.md):** schema + content on the same page must be 7+ days apart. Sign-company specifically needs Commit 2 (voice fix) to ship and bake for 7 days before Commit 7 (schema) ships.

---

## Step 0 — Extend IndustryPage with optional Product schema prop

This step is shared by Commits 5, 6, 7. Apply once, before any of the three.

### Diff: src/components/site/IndustryPage.tsx

Add a new prop to `IndustryPageProps` (after line 52 `relatedCities?` field):

```diff
   relatedCities?: { name: string; slug: string }[];
+  /** Optional Product schema — emits Product/Offer JSON-LD when present. Use only on FROZEN ranking pages with confirmed price stability. */
+  productSchema?: {
+    name: string;
+    description: string;
+    image: string;
+    sku: string;
+    fromPriceCAD: number;
+    /** e.g. "from $66" — display string already in copy */
+    priceLabel: string;
+    /** When true, marks the offer as InStock + LocalBusiness pickup. Always true for True Color. */
+    inStock?: boolean;
+  };
 }
```

In the function signature destructure (line ~68):

```diff
   relatedCities,
+  productSchema,
 }: IndustryPageProps) {
```

After the existing `breadcrumbSchema` const (around line 118), add:

```tsx
const productSchemaJSON = productSchema ? {
  "@context": "https://schema.org",
  "@type": "Product",
  name: productSchema.name,
  description: productSchema.description,
  image: productSchema.image.startsWith("http")
    ? productSchema.image
    : `${BASE_URL}${productSchema.image}`,
  sku: productSchema.sku,
  brand: { "@type": "Brand", name: "True Color Display Printing" },
  offers: {
    "@type": "Offer",
    price: productSchema.fromPriceCAD,
    priceCurrency: "CAD",
    availability: productSchema.inStock !== false
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: { "@id": `${BASE_URL}/#localbusiness` },
    priceValidUntil: "2027-12-31",
    url: canonicalSlug ? `${BASE_URL}/${canonicalSlug}` : BASE_URL,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: 29,
  },
} : null;
```

In the JSX render block where `breadcrumbSchema` is rendered (around line 128), add:

```diff
   {breadcrumbSchema && (
     <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
   )}
+  {productSchemaJSON && (
+    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemaJSON) }} />
+  )}
```

**Why this approach:**
- Optional prop — only emits Product schema on pages explicitly opted in (no risk to non-FROZEN pages or pages with unstable prices)
- `seller` references the canonical LocalBusiness via `@id` (matches the Wave 3a graph)
- `aggregateRating` reuses the same 5.0/29 source of truth used by LocalBusiness in layout.tsx
- `priceValidUntil` set to 2027-12-31 — Google requires this field; long-dated value avoids it expiring before a deliberate price update

This Step 0 ships as part of Commit 5 (banner-printing). Once IndustryPage has the prop, Commits 6 and 7 each just add `productSchema={...}` to their page.tsx.

---

## Commit 5 — banner-printing-saskatoon Product schema

### Diff: src/app/banner-printing-saskatoon/page.tsx

Add `productSchema` prop in the `<IndustryPage>` JSX (after `primaryProductSlug`):

```diff
       primaryProductSlug="vinyl-banners"
+      productSchema={{
+        name: "Vinyl Banner Printing — Saskatoon",
+        description: "Full-colour vinyl banners printed on 13oz scrim vinyl with hemmed edges and brass grommets included. Roland UV print, Saskatoon. Same-day rush available.",
+        image: "/images/products/product/banner-vinyl-colorful-800x600.webp",
+        sku: "BANNER-V13-SQFT",
+        fromPriceCAD: 66,
+        priceLabel: "from $66",
+        inStock: true,
+      }}
```

### Sitemap diff

Bump banner-printing-saskatoon lastmod only:

```diff
-    { url: `${BASE_URL}/banner-printing-saskatoon`, lastModified: new Date("2026-04-12"), ... },
+    { url: `${BASE_URL}/banner-printing-saskatoon`, lastModified: new Date("YYYY-MM-DD"), ... },
```

### Pre-commit gate

- [ ] Run `/pricing-health` — verify $66 entry price for banners is current (BANNER-V13-2X4FT or smallest qualifying SKU)
- [ ] `npm run build` clean
- [ ] Validate the rendered Product schema via Rich Results Test on a local preview deploy if possible

### Commit message

```
feat(seo): add Product schema to banner-printing-saskatoon

Extends IndustryPage with optional productSchema prop that emits
Product + Offer + AggregateRating JSON-LD. banner-printing
opted-in first per E-E-A-T audit ranking (69/70). Reuses canonical
LocalBusiness @id for seller reference. Wave 4 commit 5 of 7.
```

---

## Commit 6 — business-cards-saskatoon Product schema

Wait ≥7 days after Commit 5 ships and confirm GSC clean.

### Diff: src/app/business-cards-saskatoon/page.tsx

```diff
       primaryProductSlug="business-cards"
+      productSchema={{
+        name: "Business Card Printing — Saskatoon",
+        description: "Full-colour business cards on 14pt or 16pt premium gloss/matte stock. 250 starting at $45 double-sided. Same-day rush available, in-house designer.",
+        image: "/images/products/product/business-cards-800x600.webp",
+        sku: "BC-14PT-DOUBLE",
+        fromPriceCAD: 45,
+        priceLabel: "from $45",
+        inStock: true,
+      }}
```

### Sitemap diff — bump business-cards-saskatoon lastmod only.

### Pre-commit gate

- [ ] Run `/pricing-health` — verify 250 BC at $45 still current
- [ ] `npm run build` clean

### Commit message

```
feat(seo): add Product schema to business-cards-saskatoon

E-E-A-T 68/70 — second in Wave 4 ship order. Reuses IndustryPage
productSchema prop shipped in Commit 5. Wave 4 commit 6 of 7.
```

---

## Commit 7 — sign-company-saskatoon Product schema

**Prerequisite:** Wave 4 Commit 2 (voice fix) must have shipped ≥7 days ago.

### Diff: src/app/sign-company-saskatoon/page.tsx

```diff
       primaryProductSlug="coroplast-signs"
+      productSchema={{
+        name: "Sign Printing — Saskatoon Sign Company",
+        description: "Full-service sign printing in Saskatoon — coroplast yard signs from $30, ACP aluminum from $60, vinyl banners from $66, vehicle magnets from $45. In-house Roland UV. Same-day rush available.",
+        image: "/images/products/product/coroplast-yard-sign-800x600.webp",
+        sku: "SIGN-MULTI-MIN",
+        fromPriceCAD: 30,
+        priceLabel: "from $30",
+        inStock: true,
+      }}
```

### Sitemap diff — bump sign-company-saskatoon lastmod only.

### Pre-commit gate

- [ ] Wave 4 Commit 2 (voice fix) shipped ≥7 days prior — confirm via git log
- [ ] Run `/pricing-health` — verify $30 entry (smallest coroplast sign) still current
- [ ] `npm run build` clean

### Commit message

```
feat(seo): add Product schema to sign-company-saskatoon

E-E-A-T 69/70 — third in Wave 4 ship order. Voice fix from Commit 2
shipped 7+ days prior, page is now eligible for schema add. Wave 4
commit 7 of 7.
```

---

## After Wave 4 Commit 7 — wait 14 days, GSC re-check

If all 3 Product schema pages render rich results in Rich Results Test AND no FROZEN page drops ≥2 positions, Wave 4 closes successfully and Wave 5 (Performance/CWV) becomes eligible.

If any page DROPS in position post-schema, the rollback is: revert that single commit. Schema additions are isolated to one prop; removing the prop reverts cleanly without affecting body content or other schemas.
