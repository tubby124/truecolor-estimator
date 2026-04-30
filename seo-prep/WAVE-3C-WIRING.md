# Wave 3c — Wiring instructions (apply 2026-05-11 or later)

After moving the two draft pages into `src/app/`, two more files need updates: `sitemap.ts` and `SiteFooter.tsx`. Each new page = one separate commit (per wave-safety rule, never combine).

---

## Step 1 — Move draft files into the routing tree

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator"

# Page 1: printing-near-me-saskatoon
mkdir -p src/app/printing-near-me-saskatoon
mv seo-prep/wave-3c-printing-near-me-saskatoon.tsx src/app/printing-near-me-saskatoon/page.tsx
# Strip the leading `// WAVE 3C DRAFT` comment block (lines 1-9) — they're not needed in production

# Page 2: printing-services-saskatoon
mkdir -p src/app/printing-services-saskatoon
mv seo-prep/wave-3c-printing-services-saskatoon.tsx src/app/printing-services-saskatoon/page.tsx
# Strip the leading `// WAVE 3C DRAFT` comment block (lines 1-10) — same as above
```

---

## Step 2 — Commit 1: printing-near-me-saskatoon

### Diff: src/app/sitemap.ts

Add a new line in the **Service & hub SEO pages** section (around line 47, after `event-signs-saskatoon`):

```diff
     { url: `${BASE_URL}/event-signs-saskatoon`, lastModified: new Date("2026-03-03"), changeFrequency: "monthly", priority: 0.85 },
+    { url: `${BASE_URL}/printing-near-me-saskatoon`, lastModified: new Date("2026-05-11"), changeFrequency: "monthly", priority: 0.9 },
```

### Diff: src/components/site/SiteFooter.tsx

Add to "Quick Links" section (find the Quick Links group — exact line varies by current state of file):

```diff
   <Link href="/services" className="...">Services</Link>
+  <Link href="/printing-near-me-saskatoon" className="...">Printing Near Me</Link>
   <Link href="/gallery" className="...">Gallery</Link>
```

### Commit message

```
feat(seo): add /printing-near-me-saskatoon hub page

Captures "printing near me" + "print shop near me" + "color printing near me"
queries that currently bounce off homepage at 0% CTR. Hub-links to product
pages (banners, BCs, flyers, signs, stickers) without competing for their
keywords. Wave 3c page 1 of 2.
```

### Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Confirm live at https://truecolorprinting.ca/printing-near-me-saskatoon
- [ ] Confirm SiteFooter Quick Links shows new entry on homepage
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) Phase 28a entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md`
- [ ] Wait 2–3 days before applying Page 2

---

## Step 3 — Commit 2: printing-services-saskatoon

### Diff: src/app/sitemap.ts

```diff
     { url: `${BASE_URL}/printing-near-me-saskatoon`, lastModified: new Date("2026-05-11"), changeFrequency: "monthly", priority: 0.9 },
+    { url: `${BASE_URL}/printing-services-saskatoon`, lastModified: new Date("2026-05-13"), changeFrequency: "monthly", priority: 0.9 },
```

### Diff: src/components/site/SiteFooter.tsx

```diff
   <Link href="/printing-near-me-saskatoon" className="...">Printing Near Me</Link>
+  <Link href="/printing-services-saskatoon" className="...">Printing Services</Link>
   <Link href="/gallery" className="...">Gallery</Link>
```

### Commit message

```
feat(seo): add /printing-services-saskatoon B2B hub page

Captures "printing services saskatoon" + "printing services near me"
queries — currently absorbed by homepage at pos 7.83. B2B-angled menu
(net-30, trade show packages, multi-product PO). Wave 3c page 2 of 2.
```

### Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Confirm live at https://truecolorprinting.ca/printing-services-saskatoon
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) Phase 28b entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md`
- [ ] Update vault `targeting-map.md` — flip `/printing-near-me-saskatoon` and `/printing-services-saskatoon` rows from "Wave 3c BUILD" to "✅ Wave 3c SHIPPED YYYY-MM-DD"
- [ ] Schedule next GSC check for **2026-05-25** (14 days post Wave 3c — full indexing window for new pages)
- [ ] Wave 3d (`/seo-geo` on llms.txt + robots.ts) eligible after 2026-05-25 GSC check passes

---

## Anti-cannibalization audit (before Step 2 push)

Re-verify these don't collide:
- Search GSC for "printing near me" — homepage currently absorbs. After ship, the new page should outrank the homepage within 7–14 days.
- Search GSC for "printing services saskatoon" — homepage at pos 7.83. New B2B page should overtake within 14 days.
- The two new pages link OUT to product pages but **never use the product page's primary keyword as their own `title` or H1** (per [`.claude/rules/seo-protected-pages.md`](../.claude/rules/seo-protected-pages.md) + targeting-map).

If any product page (banner, BC, flyer, etc.) drops 2+ positions after Wave 3c, the cannibalization check failed — diagnose immediately.
