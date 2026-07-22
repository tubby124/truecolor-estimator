# True Color — Pricing Communication Rules

## Mandatory Check
Before writing ANY price in a landing page, email, campaign, FAQ, or social post for True Color:
→ Read `data/PRICING_QUICK_REFERENCE.md` § "Communication Rules" section first.

## The $25 order-total minimum (replaces all per-product mins)

Owner decision 2026-05-19: per-product minimum charges were KILLED in the engine.
The shop now enforces a **single $25 order-total minimum at checkout** via `src/lib/pricing/order-min.ts`. Carts under $25 get a "Small order setup fee" line that tops the order up to $25.

**This means:**
- Do NOT write "Coroplast from $30", "Magnets from $45", "ACP from $60", or any other per-product min in marketing copy. Those are stale references to a system that no longer exists.
- "from $X" anchors on landing pages, headlines, meta tags, and product cards = the smallest realistic checkout total a customer would pay (which is bounded below by $25).
- For products where the smallest realistic single-piece engine price is **under $25**, use "from $25" — the $25 order-total minimum is what the customer actually pays.
- For products where the smallest realistic single-piece engine price is **$25 or more**, use that real number.

## Quick Reference (current anchors)

| Product | Marketing "from" | Real Rate | Why this anchor |
|---------|-----------------|-----------|-----------------|
| Coroplast | from $25 | $8/sqft (T1) | 18×24" sign = $24 → $25 order floor |
| ACP Aluminum | **from $39** | $13/sqft (T1) | smallest realistic 18×24" = $39, above $25 floor → floor doesn't apply |
| Vehicle Magnets | from $25 | $24/sqft (T1) | small magnets < $25 → $25 order floor |
| Window Decals | from $25 | $11/sqft (T1) | small decals < $25 → $25 order floor |
| Foamboard | from $45 | $10/sqft (T1) | smallest realistic display > $25 |
| Banners | from $66 | $8.25/sqft (T1) | 2×4ft = $66 (real) |
| Business Cards | from $45 | lot price | 250 cards 14pt 2S = $45 (real) |
| Vinyl Lettering | from $25 | $8.50/sqft (T1) | small lettering jobs reach the $25 order floor |
| Flyers | from $45 | lot price | 100 flyers 80lb 2S = $45 (real) |
| Brochures | from $70 | lot price | tri-fold 100lb (real) |
| Stickers | from $25 | lot price | 25 stickers ≈ $25 (real) |
| Posters | from $15 | per-unit | 1 small poster — bumps to $25 at checkout if single-item order |
| Retractable Banners | from $219 | lot price | economy stand + print (real) |
| Postcards | from $35 | lot price | 100 postcards (real) |
| Labels (cosmetic / candle / freezer / product) | from $5.50/sqft | sqft tier | small label runs hit the $25 order floor |

## Key Rules

- "from $X" in marketing headlines/titles/meta = the smallest realistic checkout total. Bounded below by $25.
- Sqft rates = FAQ, comparison context, AND product reference cards on IndustryPage.
- Product reference cards (`products` array): use T1 sqft rates for wide-format (matches ranking pages). Marketing headlines/titles/meta use the "from $X" anchors above.
- T1 sqft rates for product cards: Coroplast $8 | Banners $8.25 | ACP $13 | Foamboard $10 | Window Decals $11 | Magnets $24 | Vinyl Lettering $8.50 | Labels $5.50.
- Lot-priced products (BCs, flyers, stickers, postcards, brochures, posters) = no minimums, flat totals.
- BC "from $45" = 250 double-sided on 14pt gloss (1S = $40). 500 2S = $65, 1000 2S = $110.
- Flyer "from $45" = 100 full-letter double-sided on 80lb gloss. 100lb upgrade: 100=$65, 250=$115, 1000=$250.
- Rush +$40 and Design $35 always mentioned separately, never baked into "from" price.

## FAQ phrasing for small orders

When explaining the $25 floor in body copy or FAQ answers, prefer:

- "$25 order-total minimum at checkout" — primary phrase
- "$25 order minimum" — shorter variant for tight FAQ slots
- "small orders top up to the $25 order-total minimum at checkout" — when explaining a single-item example

Do NOT write:

- "$30 minimum charge" / "$30 minimum" — STALE, refers to dead per-product floor
- "$45 minimum" / "$60 minimum" — STALE, refers to dead per-product floors
- "$30 covers small format jobs" — STALE
- "fall under the $30 minimum" — STALE

## Reference

- `src/lib/pricing/order-min.ts` — engine source of truth (ORDER_MINIMUM_DOLLARS = 25)
- `data/PRICING_QUICK_REFERENCE.md` — full price table with comms guidance
- `scripts/hooks/post-edit-price-check.mjs` — PostToolUse guard, already aligned 2026-05-20
