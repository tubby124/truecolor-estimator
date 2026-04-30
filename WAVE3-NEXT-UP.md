# SEO Wave 3 — NEXT UP

> **Read this first when opening the True Color repo for SEO work.**
> Status as of 2026-04-30. Updated after every wave ships.

---

## Where we are

**Wave 3a SHIPPED 2026-04-27** — 2 commits, 2 separate concerns:
- `18b0ce0` — Organization schema + alternateName + logo (fixes branded "true color printing" pos 13.55)
- `c8f1f95` — wall-graphics title 89→53 chars (fixes 246 imp / 0% CTR)

Both Railway-deployed. Indexing window: 5–14 days for Googlebot recrawl.

**Wave 3b/3c PREPPED 2026-04-30** — exact diffs + draft pages locked in [seo-prep/](seo-prep/). Zero research left. Apply mechanically once gate passes.

- [seo-prep/README.md](seo-prep/README.md) — overview + apply order
- [seo-prep/WAVE-3B-COMMIT-1-flyer-links.md](seo-prep/WAVE-3B-COMMIT-1-flyer-links.md) — 3-href repoint diff
- [seo-prep/WAVE-3B-COMMIT-2-sticker-ddg.md](seo-prep/WAVE-3B-COMMIT-2-sticker-ddg.md) — DDG diff (existing images, no generation needed)
- [seo-prep/wave-3c-printing-near-me-saskatoon.tsx](seo-prep/wave-3c-printing-near-me-saskatoon.tsx) — full page draft
- [seo-prep/wave-3c-printing-services-saskatoon.tsx](seo-prep/wave-3c-printing-services-saskatoon.tsx) — full page draft
- [seo-prep/WAVE-3C-WIRING.md](seo-prep/WAVE-3C-WIRING.md) — sitemap + footer wiring + commit messages

---

## 🚦 GATE — Re-check GSC on 2026-05-02 (5 days from ship)

**Do NOT start Wave 3b until you've done this gate.**

### What to check

1. **Branded query "true color printing"** — should be moving from pos 13.55 toward 1
2. **/wall-graphics-saskatoon** — CTR should be non-zero (was 0% on 246 imp)
3. **All 5 baseline pages** — must NOT have dropped ≥2 positions:
   - business-cards-saskatoon (was pos 8.32)
   - banner-printing-saskatoon (was pos 10.62)
   - flyer-printing-saskatoon (was pos 25.31)
   - sign-company-saskatoon (was pos 26.47)
   - coroplast-signs-saskatoon (was gone from top 40)
   - sticker-printing-saskatoon (was pos 5.75)
4. **Schema validator** — paste truecolorprinting.ca homepage into https://search.google.com/test/rich-results — Organization + LocalBusiness + WebSite should all pass with 0 errors

### Decision tree after the gate

| Outcome | Action |
|---------|--------|
| Branded query moving + no baseline drops | ✅ Proceed to Wave 3b |
| Branded query stuck at 13 after 14 days | Add LinkedIn company page + BBB profile + Yellow Pages CA listing to Organization `sameAs[]` |
| Any baseline page dropped ≥2 positions | 🛑 STOP. Diagnose which Wave 3a change caused it. Rollback if needed. |
| Schema validator errors | 🛑 STOP. Fix immediately. Don't proceed until Rich Results Test passes clean. |

---

## Wave 3b — flyer link repoint + sticker DDG (Day 7, ~2026-05-04)

**PREP DONE 2026-04-30.** No more research. Apply diffs from `seo-prep/`.

**Page already has descriptionNode** — sticker page only needs DDG addition (verified 2026-04-30). Existing sticker images at `/images/products/product/sticker-*.webp` reused — **no new image generation needed.**

**Two separate commits**:
- Commit 1: [seo-prep/WAVE-3B-COMMIT-1-flyer-links.md](seo-prep/WAVE-3B-COMMIT-1-flyer-links.md) — 3 hrefs in flyer page (brochures, business-cards, postcards) repointed to `/[product]-saskatoon` equivalents. `/products` cluster hub link kept as-is.
- Commit 2 (≥24h after Commit 1): [seo-prep/WAVE-3B-COMMIT-2-sticker-ddg.md](seo-prep/WAVE-3B-COMMIT-2-sticker-ddg.md) — `<DesignDirectionGrid>` with 2 sections (5 images total) added to sticker page descriptionNode. FROZEN guardrails listed in the doc.

Each commit bumps only its own page's sitemap lastmod (per safety rule).

**Wait 7 days after Wave 3b commit 2 → re-check GSC → Wave 3c**

---

## Wave 3c — capture "near me" volume (Day 14, ~2026-05-11)

**PREP DONE 2026-04-30.** Both pages drafted in full at:
- [seo-prep/wave-3c-printing-near-me-saskatoon.tsx](seo-prep/wave-3c-printing-near-me-saskatoon.tsx)
- [seo-prep/wave-3c-printing-services-saskatoon.tsx](seo-prep/wave-3c-printing-services-saskatoon.tsx)

Apply via [seo-prep/WAVE-3C-WIRING.md](seo-prep/WAVE-3C-WIRING.md):
1. Move drafts → `src/app/[slug]/page.tsx`, strip leading WAVE 3C DRAFT comment block
2. Commit 1: printing-near-me + sitemap entry + SiteFooter Quick Links
3. Wait 2–3 days
4. Commit 2: printing-services + sitemap entry + SiteFooter Quick Links
5. After ship: flip targeting-map.md rows from "Wave 3c BUILD" to "✅ Wave 3c SHIPPED"

**Why:** GSC shows 130+ impressions/month on "printing near me", "print shop near me", "color printing near me", "printing services near me" — all bouncing off homepage / `/services` at pos 7–9 with 0% CTR. Dedicated hubs capture that volume.

**Anti-cannibalization rule:** these hubs link OUT to product pages but never compete for the product-specific keywords. Both drafts respect this — primary keywords are the hub queries, never the product queries. See [[targeting-map]] for the canonical assignment.

---

## Wave 3d — GEO / AI crawler polish (Day 21, ~2026-05-18)

**Files:**
- `public/llms.txt` — refresh prices to current state, ensure Wave 3a Organization details visible
- `src/app/robots.ts` — verify GPTBot, ClaudeBot, PerplexityBot still allowed (was clean as of 2026-04-27)

**Why:** Wave 3a unified the brand entity. Wave 3d makes sure AI crawlers (ChatGPT search, Perplexity, AI Overviews) see the same canonical brand identity as Google's main index.

**Run before commit:** `/seo-geo` skill (never run before — first time)

---

## Wave 4 — Product schema rollout (DEFERRED)

Still gated until `/coroplast-signs-saskatoon` and `/flyer-printing-saskatoon` recover from Wave 2 + 3b. Earliest possible: ~2026-05-25 (post-Wave 3c indexing).

Files: coroplast, banner, BC, flyer landing pages — add `Product` schema with offers, price, availability. Per [SEO-REMAINING-WAVES.md](SEO-REMAINING-WAVES.md) Wave 4 entry.

---

## Reference docs

- Full audit: [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md) — score 67→68 after Wave 3a
- Wave history: [SEO-REMAINING-WAVES.md](SEO-REMAINING-WAVES.md)
- Repo sprint log: [memory/seo-sprints.md](memory/seo-sprints.md) — Phase 25 = Wave 3a
- Vault recovery log: `~/Downloads/Obsidian Vault/Projects/true-color/SEO/seo-recovery-log.md`
- Vault targeting map: `~/Downloads/Obsidian Vault/Projects/true-color/SEO/targeting-map.md`
- Branded fix deep-dive: `~/Downloads/Obsidian Vault/Projects/true-color/SEO/branded-query-fix.md`
- Wall-graphics fix deep-dive: `~/Downloads/Obsidian Vault/Projects/true-color/SEO/wall-graphics-ctr-fix.md`

## Hard rules (do not violate)

- 5–7 day wait between waves. Period.
- Schema + title + content changes never combined in one commit.
- FROZEN pages from [.claude/rules/seo-protected-pages.md](.claude/rules/seo-protected-pages.md): never change H1, URL, slug, or title tag.
- Sitemap `lastModified`: only bump dates of pages that actually changed in that commit.
- Update [memory/seo-sprints.md](memory/seo-sprints.md) with new Phase entry after every wave (mandatory rule per `.claude/rules/truecolor-seo-safety.md`).
- After every wave: also update vault `seo-recovery-log.md`.
