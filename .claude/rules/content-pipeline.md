# Content Pipeline Stages — True Color

## Stage 1 — Research Brief (researcher agent)
Required output sections:
- Target keyword + 3 LSI variants
- Search intent (transactional / informational / local)
- Competitor gap table (what they have that we don't, and vice versa)
- 8 PAA questions ranked by search relevance
- Recommended price anchors and local signals
- Recommended word count and FAQ count

## Stage 2 — Draft (writer agent)
Required output: complete `page.tsx` using IndustryPage component pattern.
Pre-handoff checklist:
- [ ] 400+ words across description + descriptionNode
- [ ] Price in first paragraph
- [ ] Saskatoon/Saskatchewan in first paragraph
- [ ] Roland UV mentioned
- [ ] Rush +$40 mentioned
- [ ] Designer $35 mentioned
- [ ] 2+ internal links
- [ ] 8 FAQs, each with at least one price

## Stage 3 — Review (reviewer agent)
Required output: scored report (1–10 per dimension) + specific rewrite instructions for any score < 7.
Dimensions: E-E-A-T | Local SEO | Price transparency | Brand differentiators | Internal linking

## Stage 4 — Edit (editor agent)
Triggered only if any dimension scored < 7.
Required output: edited file + change summary (old → new for each fix).

## Stage 5 — Publish (publisher agent)
Required output: pre-send checklist with pass/fail for each item.
Never sends autonomously — always requires explicit user confirmation.
