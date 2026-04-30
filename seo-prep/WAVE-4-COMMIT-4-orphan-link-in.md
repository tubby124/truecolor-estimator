# Wave 4 — Commit 4: Orphan page link-in (cluster hubs + city × product)

**Why:** [TECHNICAL-AUDIT-2026-04-30.md](TECHNICAL-AUDIT-2026-04-30.md) P1-2. 13 pages live in sitemap with priority 0.7–0.85 and ZERO inbound internal links. Mismatched signals = Google distrusts.

**Two orphan groups:**

1. **4 cluster hub pages (priority 0.85)** built 2026-04-13, never wired into nav/footer:
   - `/commercial-signs-saskatoon`
   - `/education-signs-saskatoon`
   - `/community-printing-saskatoon`
   - `/trades-signs-saskatoon`

2. **13 city × product pages (priority 0.7)** in sitemap with no inbound links beyond the city-parent page:
   - Regina: `/vehicle-magnets-regina`, `/business-cards-regina`, `/flyer-printing-regina`
   - Moose Jaw: `/coroplast-signs-moose-jaw-sk`, `/banner-printing-moose-jaw-sk`, `/vehicle-magnets-moose-jaw-sk`, `/business-cards-moose-jaw-sk`, `/flyer-printing-moose-jaw-sk`
   - Prince Albert: 5 pages (same product set as Moose Jaw)
   - Yorkton: 5 pages (same product set)

**Risk:** Low-medium. SiteFooter touch is sitewide; per-city link-block additions touch 4 city parent pages (`/banner-printing-regina`, `/signs-moose-jaw-sk`, `/signs-prince-albert-sk`, `/signs-yorkton-sk`). No FROZEN page touches.

**Files touched:** 5–6
- `src/components/site/SiteFooter.tsx` — add cluster hub row
- `src/app/banner-printing-regina/page.tsx` (or whichever Regina city parent exists) — add "Other Regina print services" block
- `src/app/signs-moose-jaw-sk/page.tsx` — add Moose Jaw cross-link block
- `src/app/signs-prince-albert-sk/page.tsx` — add Prince Albert cross-link block
- `src/app/signs-yorkton-sk/page.tsx` — add Yorkton cross-link block
- `src/app/sitemap.ts` — bump lastmods only on pages whose body changed (the 4 city parents)

---

## Diff: src/components/site/SiteFooter.tsx

Add a new "Saskatoon Hubs" row above or beside the "Industries We Serve" section. Find this block (around line 110):

```diff
+        {/* Saskatoon Hubs — cluster pages by industry vertical */}
+        <div className="mt-10 pt-8 border-t border-white/5">
+          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Saskatoon Hubs</p>
+          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 md:gap-y-2 text-sm">
+            <Link href="/commercial-signs-saskatoon" className="hover:text-white transition-colors">Commercial Signs</Link>
+            <Link href="/education-signs-saskatoon" className="hover:text-white transition-colors">Education</Link>
+            <Link href="/community-printing-saskatoon" className="hover:text-white transition-colors">Community Printing</Link>
+            <Link href="/trades-signs-saskatoon" className="hover:text-white transition-colors">Trades</Link>
+          </div>
+        </div>
+
         {/* Industries We Serve — full-width grid for all industry pages */}
         <div className="mt-10 pt-8 border-t border-white/5">
```

This single addition fixes all 4 cluster hub orphans in one footer block.

---

## City parent page link blocks

For each of the 4 city parent pages, add a "More [City] print services" block at the bottom of the body (before the SiteFooter renders). Use a `<section>` with `<Link>` cards.

### Regina — `src/app/banner-printing-regina/page.tsx`

(Or whichever file is the Regina city-parent — confirm via Glob `src/app/*regina*/page.tsx`. Likely `banner-printing-regina` per sitemap evidence.)

Add this block before the closing `</main>` or `</IndustryPage>` wrapper:

```tsx
<section className="mt-12 pt-8 border-t border-gray-200">
  <h3 className="text-lg font-semibold text-[#1c1712] mb-4">
    Other Regina print services
  </h3>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
    <Link href="/vehicle-magnets-regina" className="text-[#16C2F3] underline font-medium">
      Vehicle magnets in Regina
    </Link>
    <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
      Business cards in Regina
    </Link>
    <Link href="/flyer-printing-regina" className="text-[#16C2F3] underline font-medium">
      Flyer printing in Regina
    </Link>
  </div>
</section>
```

### Moose Jaw — `src/app/signs-moose-jaw-sk/page.tsx`

```tsx
<section className="mt-12 pt-8 border-t border-gray-200">
  <h3 className="text-lg font-semibold text-[#1c1712] mb-4">
    More Moose Jaw print services
  </h3>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
    <Link href="/coroplast-signs-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
      Coroplast signs Moose Jaw
    </Link>
    <Link href="/banner-printing-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
      Banner printing Moose Jaw
    </Link>
    <Link href="/vehicle-magnets-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
      Vehicle magnets Moose Jaw
    </Link>
    <Link href="/business-cards-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
      Business cards Moose Jaw
    </Link>
    <Link href="/flyer-printing-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
      Flyer printing Moose Jaw
    </Link>
  </div>
</section>
```

### Prince Albert — `src/app/signs-prince-albert-sk/page.tsx`

(Same structure as Moose Jaw, swap city slugs to `-prince-albert-sk` and labels to "Prince Albert".)

### Yorkton — `src/app/signs-yorkton-sk/page.tsx`

(Same structure as Moose Jaw, swap city slugs to `-yorkton-sk` and labels to "Yorkton".)

---

## Diff: src/app/sitemap.ts

Bump lastmods on the 4 city parent pages **only** (they're the ones whose body changed). Use today's date when shipping.

```diff
-    { url: `${BASE_URL}/banner-printing-regina`, lastModified: new Date("2026-01-25"), ... },
+    { url: `${BASE_URL}/banner-printing-regina`, lastModified: new Date("YYYY-MM-DD"), ... },
```

(Same pattern for `/signs-moose-jaw-sk`, `/signs-prince-albert-sk`, `/signs-yorkton-sk`.)

**Do NOT** bump lastmods on the 13 city × product orphans themselves — they didn't change.
**Do NOT** bump lastmods on the 4 cluster hubs — they didn't change either, only the footer that links to them did.

---

## Commit message

```
fix(seo): wire 17 orphan pages back into the link graph

- SiteFooter: add "Saskatoon Hubs" row linking 4 cluster pages
  (commercial-signs, education-signs, community-printing, trades-signs)
- 4 city parent pages: add "More [city] print services" link block
  giving 13 city×product pages (Regina/Moose Jaw/Prince Albert/Yorkton)
  inbound links beyond the sitemap entry
Resolves sitemap priority 0.7-0.85 + zero-internal-link signal mismatch
flagged in TECHNICAL-AUDIT-2026-04-30.md P1-2. Wave 4 commit 4.
```

---

## Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Spot-check footer on homepage — confirm "Saskatoon Hubs" row renders 4 entries above "Industries We Serve"
- [ ] Open `/banner-printing-regina` — confirm new "Other Regina print services" block renders with 3 links
- [ ] Repeat spot-check on 1 of Moose Jaw / PA / Yorkton parents
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) — Phase 28d entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md`
- [ ] After 14 days: GSC Coverage report — confirm 13 city×product pages move from "Crawled - currently not indexed" → "Indexed" (most should)
