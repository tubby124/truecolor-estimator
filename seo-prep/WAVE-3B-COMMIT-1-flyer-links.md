# Wave 3b — Commit 1: Flyer link repoint

**Why:** `/products/*` pages are noindex utility pages. PageRank flowing from `/flyer-printing-saskatoon` (pos 25.31) to noindex destinations is wasted equity. Repoint 3 internal hrefs to their indexed Saskatoon equivalents.

**Risk:** Very low. Anchor text + page content unchanged. Only href destinations change.

**Files touched:** 2
- `src/app/flyer-printing-saskatoon/page.tsx` — 3 href changes
- `src/app/sitemap.ts` — bump `/flyer-printing-saskatoon` lastmod ONLY

---

## Diff: src/app/flyer-printing-saskatoon/page.tsx

### Change 1 — Brochures link (line ~109)

```diff
-            <Link href="/products/brochures" className="text-[#16C2F3] underline font-medium">
+            <Link href="/brochure-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
               Brochures (tri-fold &amp; half-fold)
             </Link>
```

### Change 2 — Business cards link (line ~113)

```diff
-            <Link href="/products/business-cards" className="text-[#16C2F3] underline font-medium">
+            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
               Business cards
             </Link>
```

### Change 3 — Postcards link (line ~117)

```diff
-            <Link href="/products/postcards" className="text-[#16C2F3] underline font-medium">
+            <Link href="/postcard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
               Postcards
             </Link>
```

**KEEP AS-IS** — line ~102 `/products` (cluster hub link, OK to keep — products hub is indexed).

---

## Diff: src/app/sitemap.ts

### Change — bump flyer lastmod ONLY

```diff
-    { url: `${BASE_URL}/flyer-printing-saskatoon`, lastModified: new Date("2026-04-12"), changeFrequency: "monthly", priority: 0.9 },
+    { url: `${BASE_URL}/flyer-printing-saskatoon`, lastModified: new Date("2026-05-02"), changeFrequency: "monthly", priority: 0.9 },
```

**Do NOT touch** any other lastmod date in this commit. The wave-safety rule is explicit on this.

---

## Commit message

```
fix(seo): repoint flyer page internal links from /products/* to indexed /[product]-saskatoon pages

3 hrefs changed in flyer-printing-saskatoon (brochures, business-cards, postcards)
to flow PageRank to indexed SEO pages instead of noindex utility pages.
Anchor text unchanged. Wave 3b commit 1 of 2.
```

---

## Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Wait ~2 min Railway deploy
- [ ] Open https://truecolorprinting.ca/flyer-printing-saskatoon — confirm 3 links open the new destinations
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) Phase 27a entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md` — Wave 3b commit 1 row
- [ ] Wait ≥24h before applying Commit 2 (sticker DDG) — different commits, different concerns, separate Googlebot recrawl signals
