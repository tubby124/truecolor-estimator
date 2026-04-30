# Wave 4 — Commit 3: SiteNav megamenu repoint

**Why:** [TECHNICAL-AUDIT-2026-04-30.md](TECHNICAL-AUDIT-2026-04-30.md) P1-1 + P1-4. SiteNav megamenu sends 14 product entries to noindex `/products/[slug]` utility pages. SiteNav appears on every page including all 5 FROZEN ranking pages → sitewide PageRank leak counteracts Wave 3b Commit 1's flyer link repoint at scale.

**Risk:** Medium-high blast radius. Touches every page rendered on the site (since SiteNav is in the global layout). Anchor text + label text unchanged — only `href` destinations change. **Ship only after Wave 3c is verified green** (≥7 days post Wave 3c GSC re-check).

**Files touched:** 1
- `src/components/site/SiteNav.tsx` lines 13–48 (PRODUCT_CATEGORIES const)

---

## Diff: src/components/site/SiteNav.tsx

Repoint **14 hrefs** in PRODUCT_CATEGORIES. Label text and structure unchanged.

### Signs & Displays group (lines 14–22)

```diff
   {
     label: "Signs & Displays",
     links: [
-      { label: "Coroplast Signs", href: "/products/coroplast-signs" },
-      { label: "ACP Aluminum Signs", href: "/products/acp-signs" },
-      { label: "Vinyl Banners", href: "/products/vinyl-banners" },
-      { label: "Foamboard Displays", href: "/products/foamboard-displays" },
-      { label: "Retractable Banners", href: "/products/retractable-banners" },
+      { label: "Coroplast Signs", href: "/coroplast-signs-saskatoon" },
+      { label: "ACP Aluminum Signs", href: "/aluminum-signs-saskatoon" },
+      { label: "Vinyl Banners", href: "/banner-printing-saskatoon" },
+      { label: "Foamboard Displays", href: "/foamboard-printing-saskatoon" },
+      { label: "Retractable Banners", href: "/retractable-banners-saskatoon" },
     ],
   },
```

### Window & Vehicle group (lines 24–34)

```diff
   {
     label: "Window & Vehicle",
     links: [
       { label: "Vehicle Decals", href: "/vehicle-decals-saskatoon" },
-      { label: "Vehicle Magnets", href: "/products/vehicle-magnets" },
-      { label: "Vinyl Lettering", href: "/products/vinyl-lettering" },
-      { label: "Window Decals", href: "/products/window-decals" },
-      { label: "Perforated Window Vinyl", href: "/products/window-perf" },
+      { label: "Vehicle Magnets", href: "/vehicle-magnets-saskatoon" },
+      { label: "Vinyl Lettering", href: "/vinyl-lettering-saskatoon" },
+      { label: "Window Decals", href: "/window-decals-saskatoon" },
+      { label: "Perforated Window Vinyl", href: "/window-perf-saskatoon" },
       { label: "Wall Graphics", href: "/wall-graphics-saskatoon" },
     ],
   },
```

### Print & Promo group (lines 36–47)

```diff
   {
     label: "Print & Promo",
     links: [
-      { label: "Business Cards", href: "/products/business-cards" },
-      { label: "Flyers", href: "/products/flyers" },
-      { label: "Brochures", href: "/products/brochures" },
+      { label: "Business Cards", href: "/business-cards-saskatoon" },
+      { label: "Flyers", href: "/flyer-printing-saskatoon" },
+      { label: "Brochures", href: "/brochure-printing-saskatoon" },
       { label: "Rack Cards", href: "/products/rack-cards" },
-      { label: "Postcards", href: "/products/postcards" },
-      { label: "Stickers", href: "/products/stickers" },
-      { label: "Photo Posters", href: "/products/photo-posters" },
-      { label: "Coil-Bound Booklets", href: "/products/coil-bound-booklets" },
+      { label: "Postcards", href: "/postcard-printing-saskatoon" },
+      { label: "Stickers", href: "/sticker-printing-saskatoon" },
+      { label: "Photo Posters", href: "/photo-poster-printing-saskatoon" },
+      { label: "Coil-Bound Booklets", href: "/booklet-printing-saskatoon" },
     ],
   },
```

**Keep `/products/rack-cards` as-is** — there is no `/rack-cards-saskatoon` SEO page. Only one product where the megamenu still legitimately needs to point at the utility page.

---

## Commit message

```
fix(seo): repoint SiteNav megamenu from noindex /products/* to indexed /[product]-saskatoon pages

14 product entries in the global megamenu were leaking PageRank to noindex
utility pages on every page render. Now point to the indexed Saskatoon
SEO landing pages. Label text unchanged. Single exception: /products/rack-cards
kept (no rack-cards-saskatoon SEO page exists). Wave 4 high-blast-radius
commit — gated on green GSC post Wave 3c.
```

---

## Pre-flight verification (run before push)

- [ ] Confirm all 13 destination URLs return 200:
  - /coroplast-signs-saskatoon, /aluminum-signs-saskatoon, /banner-printing-saskatoon, /foamboard-printing-saskatoon, /retractable-banners-saskatoon
  - /vehicle-magnets-saskatoon, /vinyl-lettering-saskatoon, /window-decals-saskatoon, /window-perf-saskatoon
  - /business-cards-saskatoon, /flyer-printing-saskatoon, /brochure-printing-saskatoon
  - /postcard-printing-saskatoon, /sticker-printing-saskatoon, /photo-poster-printing-saskatoon, /booklet-printing-saskatoon
- [ ] `npm run build` clean
- [ ] Verify no other component imports PRODUCT_CATEGORIES (Grep for `PRODUCT_CATEGORIES` — should only appear in SiteNav.tsx)

---

## Post-commit checklist

- [ ] Push to main
- [ ] Wait Railway deploy
- [ ] Spot-check megamenu on homepage — hover each group, click 1 entry per group, verify lands on `-saskatoon` page (not `/products/*`)
- [ ] Check GSC Coverage report next-day for any new errors
- [ ] **Watch all 5 FROZEN ranking pages for 14 days post-deploy** — sitewide nav change can affect rankings; if any drop ≥2 positions, diagnose immediately
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) — Phase 28c entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md`
