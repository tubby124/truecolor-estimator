# SEO Wave 3b/3c Prep Package

> Built 2026-04-30 (2 days before May 2 GSC gate). Everything in this folder is **ready to ship** — no research left to do, no images to generate, no decisions to make. Just gate-pass + apply.

## How to use this folder

### On 2026-05-02 (after GSC gate passes)

1. Read [WAVE-3B-COMMIT-1-flyer-links.md](WAVE-3B-COMMIT-1-flyer-links.md) — apply exact diff, commit, push
2. Wait for Railway deploy (~2 min), confirm live
3. Read [WAVE-3B-COMMIT-2-sticker-ddg.md](WAVE-3B-COMMIT-2-sticker-ddg.md) — apply exact diff, commit, push
4. Update [memory/seo-sprints.md](../memory/seo-sprints.md) with Phase 27 = Wave 3b
5. Update vault `Projects/true-color/SEO/seo-recovery-log.md` with Wave 3b entry

### On 2026-05-11 (Wave 3c, 7+ days after Wave 3b)

1. Move [wave-3c-printing-near-me-saskatoon.tsx](wave-3c-printing-near-me-saskatoon.tsx) → `src/app/printing-near-me-saskatoon/page.tsx`
2. Move [wave-3c-printing-services-saskatoon.tsx](wave-3c-printing-services-saskatoon.tsx) → `src/app/printing-services-saskatoon/page.tsx`
3. Apply [WAVE-3C-WIRING.md](WAVE-3C-WIRING.md) — sitemap.ts + SiteFooter Quick Links additions
4. Two separate commits per wave-safety rule (one per page)
5. Update logs

## Why this folder exists

Wave 3a shipped 2026-04-27. Hard rule: 5–7 day wait between waves. Hard gate: 2026-05-02 GSC re-check before any Wave 3b commit. Today is 2026-04-30. Rather than do nothing, all the research/copy/wiring decisions are baked here so the May 2 ship is mechanical.

## What's NOT here (still gated)

- **Wave 3d** — `/seo-geo` first-time run on llms.txt + robots.ts. Wait for Wave 3c indexing first.
- **Wave 4** — Product schema rollout. Earliest: post-2026-05-25, after coroplast + flyer recover from Wave 2 + 3b.

## Hard rules (do not violate at apply time)

- Schema + title + content changes never combined in one commit
- Sitemap `lastModified`: only bump dates of pages that actually changed in that commit
- Wave 3b = 2 commits (flyer link repoint, sticker DDG). Never bundle.
- Wave 3c = 2 commits (one per new page). Never bundle.
- Update [memory/seo-sprints.md](../memory/seo-sprints.md) AND vault `seo-recovery-log.md` after EACH commit
