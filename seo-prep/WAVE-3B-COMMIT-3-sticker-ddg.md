# Wave 3b — Commit 3: Sticker DesignDirectionGrid + descriptionNode upgrade

> Renumbered from Commit 2 → Commit 3 on 2026-04-30 after schema audit added a new schema-dedup commit at slot 2.

**Why:** `/sticker-printing-saskatoon` is converting orders at pos 5.75 *without* DDG/imagery. Per [targeting-map.md](../../Obsidian%20Vault/Projects/true-color/SEO/targeting-map.md): "Wave 3b adds DDG." Adding DDG + visual content to a converting page is pure compounding — more dwell time, more pages-deep crawl, more E-E-A-T.

**Risk:** Low. Page is FROZEN at title/H1/slug level (per `.claude/rules/seo-protected-pages.md`). Body content additions are explicitly allowed. No schema changes. No price changes.

**Existing image assets** (verified 2026-04-30, no generation needed):
- `/images/products/product/sticker-custom-sheet-800x600.webp`
- `/images/products/product/sticker-diecut-truecolor-logo-800x600.webp`
- `/images/products/product/sticker-laptop-waterbottle-800x600.webp`

**Files touched:** 2
- `src/app/sticker-printing-saskatoon/page.tsx` — add DDG import + designDirections const + render in descriptionNode
- `src/app/sitemap.ts` — bump `/sticker-printing-saskatoon` lastmod ONLY

---

## Diff: src/app/sticker-printing-saskatoon/page.tsx

### Change 1 — Add DDG import (line ~3)

```diff
 import type { Metadata } from "next";
 import Link from "next/link";
 import { IndustryPage } from "@/components/site/IndustryPage";
+import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";
```

### Change 2 — Insert designDirections const before component (between line ~17 export const metadata block close and line ~19 default export function)

Insert this block AFTER the `metadata` export block closes and BEFORE `export default function StickerPrintingSaskatoonPage()`:

```tsx
const designDirections = [
  {
    title: "Sticker Design Directions",
    subtitle:
      "100 for $160 · 250 for $325 · 500 for $475 — die-cut vinyl, Roland UV print, waterproof",
    aspect: "4/3" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/products/product/sticker-diecut-truecolor-logo-800x600.webp",
        alt: "Custom die-cut vinyl logo sticker printed in Saskatoon — True Color Display Printing",
        label: "Logo Die-Cut",
        caption: "100 for $160 — brand identity stickers",
      },
      {
        src: "/images/products/product/sticker-custom-sheet-800x600.webp",
        alt: "Custom sticker sheet printed in Saskatoon for product packaging — True Color Display Printing",
        label: "Product / Packaging Stickers",
        caption: "250 for $325 — labels for jars, bottles, boxes",
      },
      {
        src: "/images/products/product/sticker-laptop-waterbottle-800x600.webp",
        alt: "Vinyl stickers on laptop and water bottle printed in Saskatoon — True Color Display Printing",
        label: "Laptop / Bottle / Vehicle",
        caption: "500 for $475 — promo giveaways + branding",
      },
    ],
  },
  {
    title: "Sizes & Shapes",
    subtitle: "4×4\" default die-cut · custom shapes available · 25-piece minimum from $25",
    aspect: "4/3" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/products/product/sticker-diecut-truecolor-logo-800x600.webp",
        alt: "4 inch die-cut vinyl sticker printed in Saskatoon — True Color Display Printing",
        label: "4×4\" Die-Cut (Default)",
        caption: "Most popular — 100 for $160",
      },
      {
        src: "/images/products/product/sticker-custom-sheet-800x600.webp",
        alt: "Custom shape vinyl sticker printed in Saskatoon — True Color Display Printing",
        label: "Custom Shape",
        caption: "Logo outlines, ovals, rounded — quote on request",
      },
    ],
  },
];
```

### Change 3 — Render DDG inside descriptionNode (after line ~69, just before closing `</>`)

```diff
           Saskatoon — no shipping delays.
         </p>
+        <DesignDirectionGrid sections={designDirections} />
       </>
     }
```

---

## Diff: src/app/sitemap.ts

### Change — bump sticker lastmod ONLY

```diff
-    { url: `${BASE_URL}/sticker-printing-saskatoon`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.85 },
+    { url: `${BASE_URL}/sticker-printing-saskatoon`, lastModified: new Date("2026-05-03"), changeFrequency: "monthly", priority: 0.85 },
```

**Do NOT** bump any other date. The flyer date from Commit 1 stays at 2026-05-02.

---

## Commit message

```
feat(seo): add DesignDirectionGrid + visual content to sticker-printing-saskatoon

Page converts at pos 5.75 without DDG/imagery — adding 5 sticker mockups
across 2 sections (design directions + sizes/shapes). Reuses existing
sticker product photos. No title/H1/slug change (page is FROZEN).
Wave 3b commit 3 of 3.
```

---

## FROZEN page guardrails (verify before push)

These MUST NOT change in this commit:
- [ ] `metadata.title` — keep `"Sticker Printing Saskatoon | Die-Cut Vinyl | True Color"`
- [ ] `metadata.description` — keep current price-anchored 158-char string
- [ ] `IndustryPage` props `title` (H1) — keep `"Sticker Printing Saskatoon"`
- [ ] `canonicalSlug` — keep `"sticker-printing-saskatoon"`
- [ ] All FAQ questions/answers — unchanged
- [ ] `whyPoints` array — unchanged
- [ ] `products` array (cross-link cards) — unchanged

Only ADDITIONS allowed: import line, designDirections const, single `<DesignDirectionGrid>` JSX render, sitemap lastmod bump.

---

## Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Wait ~2 min Railway deploy
- [ ] Open https://truecolorprinting.ca/sticker-printing-saskatoon — confirm DDG renders 5 images, 2 sections
- [ ] Confirm H1 still reads "Sticker Printing Saskatoon"
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) Phase 27c entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md` — Wave 3b commit 3 row
- [ ] Schedule next GSC check for **2026-05-09** (7 days post Wave 3b ship)
- [ ] Do NOT proceed to Wave 3c until 2026-05-11 GSC check passes
