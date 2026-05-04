# Wave 2 Handoff — DesignDirectionGrid + descriptionNode on 5 Ranking Pages

**Status:** 0/8 items complete — 3+ weeks overdue
**Projected SEO gain:** +3–4 Content Quality points (from 60 → 63–64)
**Estimated build time:** 3–5 hours across 5 pages

> **Next session:** Use `/optimizeprompt` to deep-plan before implementing.
> This doc is the research brief — everything you need to write the plan.

---

## What Wave 2 Is

DDG = `DesignDirectionGrid` — a visual component showing example design directions with images, labels, and prices. It's already live on 6 secondary pages (poster, mothers-day, healthcare, agribusiness, agriculture, ramadan-eid) but **missing on all 5 ranking pages** that drive actual GSC traffic.

**Why it matters for SEO:**
- Increases word count and visual content richness on ranking pages
- Adds specific price anchors and product names (E-E-A-T signals)
- Forces `descriptionNode` adoption, which adds internal links (0 on BC and sign-company)
- Content Quality category is 25% of total score and flat at 60 — Wave 2 is the only lever

---

## Wave 2 Items (SEO-REMAINING-WAVES.md ref)

| # | Item | Page | Priority |
|---|------|------|----------|
| 2.1 | Add DesignDirectionGrid | `business-cards-saskatoon` | HIGH |
| 2.2 | Add descriptionNode + internal links | `business-cards-saskatoon` | HIGH |
| 2.3 | Add DesignDirectionGrid | `banner-printing-saskatoon` | HIGH |
| 2.4 | Add DesignDirectionGrid | `coroplast-signs-saskatoon` | HIGH |
| 2.4b | Fix FAQ price: 18×24" = "$24" → "$30" | `coroplast-signs-saskatoon` | HIGH |
| 2.5 | Add DesignDirectionGrid | `flyer-printing-saskatoon` | MED |
| 2.6 | Add descriptionNode + internal links | `sign-company-saskatoon` | MED |
| 2.7 | In-house press mention on business-cards | `business-cards-saskatoon` | LOW |
| 2.8 | Update sitemap lastmod for all Wave 2 pages | `src/app/sitemap.ts` | LOW |

---

## Pattern Reference — How DDG Is Implemented

**Reference page:** `src/app/poster-printing-saskatoon/page.tsx` (fully built, copy this structure)

### Step 1: Add imports at top of page file
```tsx
import Link from "next/link";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";
```

### Step 2: Define `designDirections` array BEFORE the export default
```tsx
const designDirections = [
  {
    title: "Section Title",
    subtitle: "Price anchor · spec detail · turnaround",
    aspect: "3/4" as const,   // options: "3/1" | "3/4" | "4/3" | "3/8"
    maxCols: 3 as const,       // 2 or 3
    items: [
      {
        src: "/images/industries/[niche]/[image-name].webp",
        alt: "Descriptive alt text with Saskatoon + location signal",
        label: "Use Case Label",
        caption: "Size — $Price",
      },
    ],
  },
];
```

### Step 3: Replace `description` string with `descriptionNode` JSX prop
The `description` prop stays for schema (Google uses it) — add `descriptionNode` alongside it.
`descriptionNode` is the visible content area with `<Link>` components for internal links.
End `descriptionNode` with `<DesignDirectionGrid sections={designDirections} />`.

```tsx
descriptionNode={
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      First paragraph with price anchor + location + key spec.
      <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        linked product
      </Link>
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Second paragraph with use cases and differentiators.
    </p>
    <DesignDirectionGrid sections={designDirections} />
  </>
}
```

---

## Per-Page Build Specs

### 1. `business-cards-saskatoon` (Items 2.1, 2.2, 2.7)

**Current state:** No `descriptionNode`, no DDG, no internal links (0 internal links)
**Primary product:** `business-cards` slug → Konica Minolta digital press (NOT Roland UV)

**DDG sections to build:**
```
Section 1: "Professional Business Cards"
  aspect: 4/3, 3 items
  Items: Realtor card, Contractor/trades card, Restaurant/retail card
  Subtitle: "250 double-sided for $45 · 500 for $65 · 1000 for $110 — 14pt gloss, Konica Minolta digital press"
  
Section 2: "Card Finishes & Formats"
  aspect: 3/4, 3 items (or 2)
  Items: Standard gloss, Matte finish, Single-sided
  Subtitle: "Standard 3.5×2\" · matte on request · single-sided from $40"
```

**descriptionNode internal links to add (aim for 3–5):**
- `/products/business-cards` — "get your exact price"
- `/flyer-printing-saskatoon` — "flyer printing from $45"
- `/brochure-printing-saskatoon` — "brochures from $70"
- `/graphic-design-saskatoon` — "in-house designer"
- `/same-day-printing-saskatoon` — "same-day rush"

**Item 2.7 — Konica Minolta mention:** Add "printed on our in-house Konica Minolta digital press" somewhere in the descriptionNode. This is the correct press for cards (NOT Roland UV flatbed).

**Images needed** (create via ChatGPT / generate): 
- `/images/industries/business-cards/card-realtor.webp`
- `/images/industries/business-cards/card-contractor.webp`
- `/images/industries/business-cards/card-restaurant.webp`
- `/images/industries/business-cards/finish-gloss.webp`
- `/images/industries/business-cards/finish-matte.webp`

---

### 2. `banner-printing-saskatoon` (Item 2.3)

**Current state:** Has `descriptionNode` already ✅, has 4 internal links ✅. Just needs DDG added at end of existing descriptionNode.
**Primary product:** `vinyl-banners` → Roland UV printer (correct)

**DDG sections to build:**
```
Section 1: "Event & Storefront Banners"
  aspect: 3/1 (wide), 3 items
  Items: Grand opening banner, Trade show booth banner, Outdoor event fence banner
  Subtitle: "From $8.25/sqft · 13oz scrim vinyl · hemmed & grommeted standard"

Section 2: "Retractable Banner Stands"
  aspect: 3/8 (tall), 2 items
  Items: Economy pull-up ($219), Premium double-sided
  Subtitle: "From $219 with graphic · packs into carry bag · 1–3 business days"
```

**Note:** `descriptionNode` already exists — just append `<DesignDirectionGrid sections={designDirections} />` before the closing `</>` of the existing node. Don't rewrite the whole block.

**Images needed:**
- `/images/industries/banners/banner-grand-opening.webp`
- `/images/industries/banners/banner-trade-show.webp`
- `/images/industries/banners/banner-fence-outdoor.webp`
- `/images/industries/banners/retractable-economy.webp`
- `/images/industries/banners/retractable-premium.webp`

---

### 3. `coroplast-signs-saskatoon` (Item 2.4 + 2.4b)

**Current state:** Has `descriptionNode` ✅, has 3 internal links ✅. Needs DDG + FAQ price fix.
**ALSO FIX:** FAQ "How much do coroplast signs cost?" — answer mentions 18×24" = "$24" but $30 minimum applies. Fix to "$30".

**DDG sections to build:**
```
Section 1: "Real Estate & Yard Signs"
  aspect: 3/4, 3 items
  Items: Real estate listing sign, Election/campaign sign, Event directional sign
  Subtitle: "18×24\" from $30 · 24×36\" $48 · H-stakes $2.50 ea — 4mm flute coroplast"

Section 2: "Job Site & Construction Signs"
  aspect: 4/3, 3 items
  Items: Construction job site sign, Contractor company sign, Hoarding panel
  Subtitle: "4×8 ft from $232 · custom sizes · Roland UV print"
```

**Images needed:**
- `/images/industries/coroplast/sign-real-estate.webp`
- `/images/industries/coroplast/sign-election.webp`
- `/images/industries/coroplast/sign-event-directional.webp`
- `/images/industries/coroplast/sign-job-site.webp`
- `/images/industries/coroplast/sign-contractor.webp`
- `/images/industries/coroplast/sign-hoarding.webp`

---

### 4. `flyer-printing-saskatoon` (Item 2.5)

**Current state:** Has `descriptionNode` ✅, has 5 internal links ✅. Needs DDG appended.
**IMPORTANT:** Flyers use Konica Minolta press — do NOT mention Roland UV. Do NOT add Roland UV mention.

**DDG sections to build:**
```
Section 1: "Flyer Design Directions"
  aspect: 3/4, 3 items
  Items: Restaurant/food promo flyer, Grand opening event flyer, Real estate open house flyer
  Subtitle: "100 for $45 · 250 for $80 · 500 for $130 — 80lb or 100lb gloss, Konica Minolta digital press"

Section 2: "Sizes & Formats"  
  aspect: 4/3, 2 items (or skip this section if it feels forced)
  Items: Letter 8.5×11", Half-letter 5.5×8.5"
  Subtitle: "Letter from $45/100 · Half-letter from $35/100"
```

---

### 5. `sign-company-saskatoon` (Item 2.6)

**Current state:** No `descriptionNode`, no DDG, no internal links (0 internal links)
**Primary product:** `coroplast-signs` slug → Roland UV printer (correct)
**Note:** `description` prop is already a very long multi-paragraph string. The `descriptionNode` should be a condensed, link-rich version of the same content — not a repeat.

**DDG sections to build:**
```
Section 1: "Coroplast Sign Applications"
  aspect: 3/4, 3 items
  Items: Yard sign (real estate), Job site sign, Event directional
  Subtitle: "From $8/sqft · $30 minimum · 4mm flute · Roland UV in-house"

Section 2: "ACP Aluminum Applications"  
  aspect: 4/3, 3 items
  Items: Storefront wall sign, Office directory, Construction hoarding panel
  Subtitle: "From $13/sqft · 3mm aluminum composite · permanent outdoor-rated"
```

**descriptionNode internal links to add (aim for 3–5):**
- `/coroplast-signs-saskatoon` — "coroplast signs from $8/sqft"
- `/aluminum-signs-saskatoon` — "ACP aluminum signs from $13/sqft"
- `/banner-printing-saskatoon` — "vinyl banners from $8.25/sqft"
- `/vehicle-magnets-saskatoon` — "vehicle magnets"
- `/graphic-design-saskatoon` — "in-house designer"

---

## Image Generation Requirement

Each DDG item needs a `.webp` image file in `public/images/industries/[niche]/`. Images must:
- Be WebP format (not JPG/PNG)
- Match the `src` path in the DDG item exactly
- Realistic-looking printed product photography style (not illustrations)
- Under 200KB each

**Total new images needed: ~25 images across 5 pages**

For the next session, generate via ChatGPT image generation using the niche-specific prompts pattern from `src/lib/data/niche-image-prompts.json`. Check that file's structure — it has a `sources` array with entries per niche that include `prompts[]` arrays.

**If images don't exist yet, placeholder approach:**  
Use an existing webp from a related page as a placeholder during build, then swap images after generation. This lets you ship DDG structure first and images second.

---

## niche-image-prompts.json

Path: `src/lib/data/niche-image-prompts.json`

Structure: `{ sources: [ { slug, name, type, status, prompts: [...] }, ... ] }`

After building each page, add an entry here for each new niche with the ChatGPT prompts used to generate the images. This is for the image generation workflow — not required for DDG to work, but keeps the workflow documented.

---

## Coroplast FAQ Price Fix (Item 2.4b)

File: `src/app/coroplast-signs-saskatoon/page.tsx`
Find in `faqs` array: the FAQ about coroplast sign pricing that mentions 18×24" = "$24"
Fix: Change "$24" to "$30" (the $30 minimum applies — `sign-company-saskatoon` correctly shows $30)

This is a standalone 2-minute fix. Do it at the same time as 2.4.

---

## Sitemap Update (Item 2.8)

After all pages are modified, update lastmod dates in `src/app/sitemap.ts`:
- `business-cards-saskatoon` → today's date
- `banner-printing-saskatoon` → today's date
- `coroplast-signs-saskatoon` → today's date
- `flyer-printing-saskatoon` → today's date
- `sign-company-saskatoon` → today's date

---

## Build Order (recommended)

1. **Coroplast FAQ fix** (2 min, standalone, no DDG needed)
2. **Business cards** (highest traffic page, needs full descriptionNode build)
3. **Sign company** (second zero-link page, needs full descriptionNode build)
4. **Banner printing** (has descriptionNode — just append DDG)
5. **Coroplast** (has descriptionNode — append DDG + fix FAQ)
6. **Flyer** (has descriptionNode — append DDG, careful: Konica Minolta only)
7. **Sitemap lastmod** (touch all 5 entries)

---

## Projected Score After Wave 2

| Category | Before | After | Delta |
|----------|--------|-------|-------|
| Content Quality | 60 | 63–64 | +3–4 |
| On-Page SEO | 63 | 65–66 | +2 (0-link pages fixed) |
| **Overall** | **67** | **72–73** | **+5–6** |

---

## Pre-Wave 2 Checklist

- [ ] GSC rankings check (overdue since 2026-03-19 — verify 5 ranking pages still at positions #1–5)
- [ ] Immediate fixes N1–N5 deployed ✅ (done 2026-04-12)
- [ ] Image assets ready OR placeholder plan confirmed

---

## Files to Touch in Wave 2

```
src/app/business-cards-saskatoon/page.tsx         (full rewrite — add descriptionNode + DDG)
src/app/banner-printing-saskatoon/page.tsx         (append DDG to existing descriptionNode)
src/app/flyer-printing-saskatoon/page.tsx          (append DDG to existing descriptionNode)
src/app/coroplast-signs-saskatoon/page.tsx         (append DDG + fix FAQ price)
src/app/sign-company-saskatoon/page.tsx            (full rewrite — add descriptionNode + DDG)
src/app/sitemap.ts                                  (update lastmod for 5 pages)
src/lib/data/niche-image-prompts.json              (add prompt entries for new niches)
public/images/industries/business-cards/           (new webp images)
public/images/industries/banners/                  (new webp images)
public/images/industries/coroplast/                (new webp images)
public/images/industries/flyers/                   (new webp images — if needed)
```
