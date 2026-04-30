# Wave 4 — Commit 2: Sign-company brand voice fix

**Why:** [CONTENT-EEAT-AUDIT-2026-04-30.md](CONTENT-EEAT-AUDIT-2026-04-30.md) flagged a single brand-voice violation. The phrase `"the turnaround is fast, the quality is consistent"` (line 88) is forbidden by [.claude/rules/brand-voice.md](../.claude/rules/brand-voice.md) which mandates specific numbers, not vague adjectives. **Must ship before** Commit 7 (Product schema on this page) — schema rollout on a page with weak voice signals is the wrong sequence.

**Risk:** Very low. Single-line body edit. Page is FROZEN at title/H1/slug — body content corrections are explicitly allowed under [.claude/rules/seo-protected-pages.md](../.claude/rules/seo-protected-pages.md).

**Files touched:** 1
- `src/app/sign-company-saskatoon/page.tsx` line 88 (within description string)

---

## Diff: src/app/sign-company-saskatoon/page.tsx

Find the closing paragraph in the `description` string at line 88. Replace the violation phrase:

```diff
-Saskatoon businesses, contractors, event organizers, and government offices choose True Color because the turnaround is fast, the quality is consistent, and you're dealing with one shop — not a broker who ships your job somewhere else.
+Saskatoon businesses, contractors, event organizers, and government offices choose True Color because most orders ship in 1–3 business days, every job runs on the same in-house Roland UV printer, and you're dealing with one shop — not a broker who routes your job through Vancouver or Toronto.
```

**Why this rewrite works:**
- "the turnaround is fast" → `"most orders ship in 1–3 business days"` (specific number, matches CSV truth)
- "the quality is consistent" → `"every job runs on the same in-house Roland UV printer"` (specific machine, real expertise signal)
- "ships your job somewhere else" → `"routes your job through Vancouver or Toronto"` (specific competitor framing — chains commonly outsource to BC/ON)

Also lifts the Authoritativeness score by adding the in-house Roland UV mention (mandatory per [brand-voice.md](../.claude/rules/brand-voice.md): "In-house Roland UV printer — at least once").

---

## Commit message

```
fix(seo): replace vague brand-voice phrase on sign-company-saskatoon

"the turnaround is fast, the quality is consistent" violated brand-voice.md
(no specific numbers). Replaced with "most orders ship in 1–3 business
days" + "every job runs on the same in-house Roland UV printer". Body-only
edit — page stays FROZEN at title/H1/slug. Wave 4 prerequisite for
Commit 7 (Product schema on this page).
```

---

## Post-commit checklist

- [ ] `npm run build` clean
- [ ] Push to main
- [ ] Wait Railway deploy
- [ ] Open https://truecolorprinting.ca/sign-company-saskatoon — confirm new phrase renders, H1 still reads "Sign Company Saskatoon", URL unchanged
- [ ] Update [memory/seo-sprints.md](../memory/seo-sprints.md) — Phase 28b entry
- [ ] Update vault `Projects/true-color/SEO/seo-recovery-log.md`
- [ ] **DO NOT proceed to Commit 7 (sign-company Product schema) for ≥7 days** — body content + schema on the same page must be separate waves
