# Next chat starter prompt

Copy/paste this into the next chat to resume the True Color SEO recovery exactly where this session left off. The skill `/truecolor` will load all the domain context.

---

## If today is 2026-05-02 or later (Wave 3b ship day)

```
/truecolor

Resuming SEO Wave 3b ship day. Last session prepped 3 commits + 3 audits — committed locally as 78480e5 + 07684d3, NOT pushed.

Today's work:
1. Run the 2026-05-02 GSC gate per WAVE3-NEXT-UP.md gate criteria. If green, proceed. If any baseline page dropped ≥2 positions or branded query is stuck — STOP and diagnose.
2. Push the 2 unpushed local commits along with Wave 3b Commit 1.
3. Apply seo-prep/WAVE-3B-COMMIT-1-flyer-links.md — exact diff, commit, push, verify deploy.
4. Apply seo-prep/WAVE-3B-COMMIT-2-schema-dedup.md — about/contact/vehicle-decals schema integrity. Commit, push.
5. After Commit 2 deploys, paste these 3 URLs into https://search.google.com/test/rich-results — must be zero schema errors:
   - https://truecolorprinting.ca/
   - https://truecolorprinting.ca/about
   - https://truecolorprinting.ca/contact
6. After ≥24h, apply seo-prep/WAVE-3B-COMMIT-3-sticker-ddg.md.
7. Update memory/seo-sprints.md Phase 27a/b/c entries + vault Projects/true-color/SEO/seo-recovery-log.md.

Read seo-prep/README.md first, then WAVE3-NEXT-UP.md. Ship mechanically — research is done.
```

---

## If today is 2026-05-09 (Wave 3b post-ship GSC check)

```
/truecolor

7-day GSC re-check post Wave 3b. Wave 3b shipped May 2-3 across 3 commits.

Today's work:
1. Pull GSC last 14 days — compare against gsc-baseline-2026-04-27 (in vault).
2. Verify:
   - "true color printing" branded query position improving from 13.55
   - aggregateRating star snippet still rendering on /contact in SERP
   - sticker-printing-saskatoon — same or better than 5.75 pre-DDG
   - flyer-printing-saskatoon — recovering from pos 25 (we deferred deeper content fix)
   - All 5 baseline FROZEN pages — no drop ≥2 positions
3. If green: proceed to 2026-05-11 Wave 3c via seo-prep/WAVE-3C-WIRING.md.
4. If red on any: STOP, diagnose which Wave 3b commit caused the drop. Rollback options listed in vault wave-3b-3c-prep-2026-04-30.md risk register.
```

---

## If today is 2026-05-11 (Wave 3c ship day)

```
/truecolor

Wave 3c ship day. Two new SEO landing pages drafted in seo-prep/. Both target "near me" volume that's currently bouncing off homepage at pos 7-9.

Today's work:
1. Apply seo-prep/WAVE-3C-WIRING.md Step 1 — move two .tsx drafts into src/app/[slug]/page.tsx. Strip leading WAVE 3C DRAFT comment block.
2. Apply Step 2 — sitemap.ts entry + SiteFooter Quick Link addition for printing-near-me-saskatoon. Commit + push.
3. Wait 2-3 days.
4. Apply Step 3 — same for printing-services-saskatoon. Commit + push.
5. Update memory/seo-sprints.md Phase 28a/b + vault seo-recovery-log.md.
6. Schedule next GSC re-check for 2026-05-25.

Both drafts respect anti-cannibalization rule — primary keywords are hub queries, never product queries. See vault targeting-map.md.
```

---

## If today is 2026-05-25+ (Wave 4 ship day)

```
/truecolor

Wave 4 ship period. 7 commits across cleanup + schema rollout. Spacing: commits 1-4 can be 1/day, commits 5-7 require ≥7 days each.

Today's work — pick from the 7 in order:
1. seo-prep/WAVE-4-COMMIT-1-image-sitemap-urls.md — lowest risk, ship first
2. seo-prep/WAVE-4-COMMIT-2-sign-company-voice-fix.md — body fix, prerequisite for Commit 7
3. seo-prep/WAVE-4-COMMIT-3-sitenav-repoint.md — high blast radius, watch FROZEN pages 14 days
4. seo-prep/WAVE-4-COMMIT-4-orphan-link-in.md — 17 orphan pages get inbound links
5. seo-prep/WAVE-4-PRODUCT-SCHEMA-ROLLOUT.md Commit 5 — extends IndustryPage + banner-printing
6. (≥7 days later) Commit 6 — business-cards
7. (≥7 days later, AND ≥7 days after Commit 2) Commit 7 — sign-company

Run /pricing-health before each Product schema commit. Verify CSV alignment before push. Update memory/seo-sprints.md + vault recovery log after each.
```

---

## If you're not sure what wave / where we are

```
/truecolor

Resuming SEO recovery. Read these in order:
1. WAVE3-NEXT-UP.md — repo root pointer
2. seo-prep/README.md — apply order for all prepped waves
3. memory/seo-sprints.md — find latest "Phase XX" entry to identify last shipped commit
4. Vault Projects/true-color/SEO/wave-3b-3c-prep-2026-04-30.md "Apply log" table — see which commits have SHA filled in

Tell me which Wave + Commit is next, then proceed with the appropriate prompt above.
```
