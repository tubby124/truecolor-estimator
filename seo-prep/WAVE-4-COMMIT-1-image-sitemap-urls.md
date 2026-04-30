# Wave 4 — Commit 1: Image-sitemap URL slug corrections

**Why:** [TECHNICAL-AUDIT-2026-04-30.md](TECHNICAL-AUDIT-2026-04-30.md) P2-6 — image-sitemap declares image data for 5 page URLs that don't exist as routes. Google fetches the sitemap, follows `<loc>` URLs, gets 404s, drops the image associations. Images less likely to surface in Image search.

**Risk:** Very low. Single file. Pure URL string swap. No schema changes. No content changes. Can ship standalone — does not require waiting for any other Wave 4 work.

**Files touched:** 1
- `src/app/image-sitemap.xml/route.ts` — 5 line edits

---

## Diff: src/app/image-sitemap.xml/route.ts

5 string replacements at lines 274, 299, 389, 414, 795:

```diff
-${BASE}/postcards-saskatoon
+${BASE}/postcard-printing-saskatoon
```

```diff
-${BASE}/brochures-saskatoon
+${BASE}/brochure-printing-saskatoon
```

```diff
-${BASE}/photo-posters-saskatoon
+${BASE}/photo-poster-printing-saskatoon
```

```diff
-${BASE}/magnet-calendars-saskatoon
+${BASE}/custom-magnets-saskatoon
```

```diff
-${BASE}/ramadan-printing-saskatoon
+${BASE}/ramadan-eid-banners-saskatoon
```

(Use Grep to verify all 5 are still on the listed line numbers before applying — file may have drifted.)

---

## Commit message

```
fix(seo): correct 5 image-sitemap URLs that 404'd against actual routes

postcards/brochures/photo-posters/magnet-calendars/ramadan slugs were
pointing to URLs that don't exist. Image-sitemap <loc> URLs now match
real routes, restoring image-to-page associations for Google Image search.
Wave 4 standalone commit (lowest risk, can ship anytime post-Wave-3c).
```

---

## Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Open `https://truecolorprinting.ca/image-sitemap.xml` — confirm 5 corrected URLs render
- [ ] Each corrected URL must return 200 (spot check 1–2: postcard-printing-saskatoon, custom-magnets-saskatoon)
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) — Phase 28a entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md`
