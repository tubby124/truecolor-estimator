# SEO Wave 3b/3c Prep Package

> Built 2026-04-30 (2 days before May 2 GSC gate). Everything in this folder is **ready to ship** — no research left to do, no images to generate, no decisions to make. Just gate-pass + apply.

## How to use this folder

### On 2026-05-02 (after GSC gate passes) — Wave 3b is now 3 commits

1. Read [WAVE-3B-COMMIT-1-flyer-links.md](WAVE-3B-COMMIT-1-flyer-links.md) — apply exact diff, commit, push
2. Wait for Railway deploy (~2 min), confirm live
3. Read [WAVE-3B-COMMIT-2-schema-dedup.md](WAVE-3B-COMMIT-2-schema-dedup.md) — apply schema integrity fixes (about/contact/vehicle-decals), commit, push
4. Wait Railway deploy + paste 3 URLs into Rich Results Test
5. Read [WAVE-3B-COMMIT-3-sticker-ddg.md](WAVE-3B-COMMIT-3-sticker-ddg.md) — apply DDG diff, commit, push
6. Update [memory/seo-sprints.md](../memory/seo-sprints.md) with Phase 27 = Wave 3b (one bullet per commit)
7. Update vault `Projects/true-color/SEO/seo-recovery-log.md` with Wave 3b entries

### On 2026-05-11 (Wave 3c, 7+ days after Wave 3b)

1. Move [wave-3c-printing-near-me-saskatoon.tsx](wave-3c-printing-near-me-saskatoon.tsx) → `src/app/printing-near-me-saskatoon/page.tsx`
2. Move [wave-3c-printing-services-saskatoon.tsx](wave-3c-printing-services-saskatoon.tsx) → `src/app/printing-services-saskatoon/page.tsx`
3. Apply [WAVE-3C-WIRING.md](WAVE-3C-WIRING.md) — sitemap.ts + SiteFooter Quick Links additions
4. Two separate commits per wave-safety rule (one per page)
5. Update logs

### On 2026-05-25+ (Wave 4, after Wave 3c GSC re-check passes)

Wave 4 = 7 commits total. Ship in order, one per day minimum:

1. [WAVE-4-COMMIT-1-image-sitemap-urls.md](WAVE-4-COMMIT-1-image-sitemap-urls.md) — 5 URL slug fixes (lowest risk, can ship anytime post-Wave-3c)
2. [WAVE-4-COMMIT-2-sign-company-voice-fix.md](WAVE-4-COMMIT-2-sign-company-voice-fix.md) — body voice edit (must precede Commit 7 by 7+ days)
3. [WAVE-4-COMMIT-3-sitenav-repoint.md](WAVE-4-COMMIT-3-sitenav-repoint.md) — 14 hrefs in megamenu (high blast radius, watch FROZEN pages 14 days)
4. [WAVE-4-COMMIT-4-orphan-link-in.md](WAVE-4-COMMIT-4-orphan-link-in.md) — footer cluster hubs + 4 city parent link blocks
5. [WAVE-4-PRODUCT-SCHEMA-ROLLOUT.md](WAVE-4-PRODUCT-SCHEMA-ROLLOUT.md) Commit 5 — IndustryPage schema prop + banner-printing
6. WAVE-4-PRODUCT-SCHEMA-ROLLOUT.md Commit 6 — business-cards (≥7 days after Commit 5)
7. WAVE-4-PRODUCT-SCHEMA-ROLLOUT.md Commit 7 — sign-company (≥7 days after both Commit 2 voice fix AND Commit 5 schema prop)

Spacing: Commits 1–4 can be 1 day apart each. Commits 5–7 require ≥7 days each.

## Why this folder exists

Wave 3a shipped 2026-04-27. Hard rule: 5–7 day wait between waves. Hard gate: 2026-05-02 GSC re-check before any Wave 3b commit. Today is 2026-04-30. Rather than do nothing, all the research/copy/wiring decisions are baked here so the May 2 ship is mechanical.

## Audit reports — read these to understand WHY each diff exists

- [SCHEMA-AUDIT-2026-04-30.md](SCHEMA-AUDIT-2026-04-30.md) — found 3 P0 schema issues silently corrupting Wave 3a. Drove the addition of WAVE-3B-COMMIT-2.
- [TECHNICAL-AUDIT-2026-04-30.md](TECHNICAL-AUDIT-2026-04-30.md) — site-wide technical SEO audit. P0 = Wave 3b, P1 = Wave 4, P2 = Wave 5/6.
- [CONTENT-EEAT-AUDIT-2026-04-30.md](CONTENT-EEAT-AUDIT-2026-04-30.md) — E-E-A-T scoring on 7 FROZEN pages. Drives Wave 4 Product schema ship order.

## What's NOT here (still gated)

- **Wave 3d** — `/seo-geo` first-time run on llms.txt + robots.ts. Wait for Wave 3c indexing first.
- **Wave 4** — Product schema rollout. Earliest: post-2026-05-25, after coroplast + flyer recover from Wave 2 + 3b.

## Hard rules (do not violate at apply time)

- Schema + title + content changes never combined in one commit
- Sitemap `lastModified`: only bump dates of pages that actually changed in that commit
- Wave 3b = 3 commits (flyer link repoint, schema dedup, sticker DDG). Never bundle.
- Wave 3c = 2 commits (one per new page). Never bundle.
- Update [memory/seo-sprints.md](../memory/seo-sprints.md) AND vault `seo-recovery-log.md` after EACH commit
