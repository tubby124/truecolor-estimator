# Brand Voice — True Color Display Printing

## Tone
Direct, locally grounded, price-transparent when presenting an offer. Lead with the product and a practical customer use. Use only verified specs, prices and service claims; avoid filler and manufactured urgency.

## Current authority — September 9, 2026

Current explicit owner decisions govern creative intent. Current executable product/pricing facts and the maintained business profile govern factual claims; a campaign or recipe cannot override them. Recipes choose composition and presentation, not business facts.

This revision supersedes the former universal price-first, rush-fee, design-fee and same-day-proof mandates and copied price anchors in this file. It also supersedes the numeric price/rush/design/timing mandates and example amounts in `content-pipeline.md` and `content-formats.md`: those checklists must not force a price or an unverified service claim into content. Their unrelated page, email, link and review conventions remain in scope for the formats they describe; they are not mandatory social-artwork layouts. Historical examples and `data/PRICING_QUICK_REFERENCE.md` are navigation/context, not current price authority.

## Forbidden phrases
Never use: "competitive pricing", "affordable", "high quality", "best in class", "fast turnaround"
Use instead: a concrete product benefit, verified specification or appropriately qualified current fact. Do not manufacture a number to replace a vague phrase.

## Content requirements

- An exact priced offer needs its currently verified payable amount and full configuration/qualifiers visibly associated with it. A price for one configuration is not a product-wide promise.
- Nonpriced showcase, design-help, options and educational content are valid. Make the product/purpose and useful next action clear; do not add a token offer or service fee.
- Use Saskatoon/Saskatchewan context naturally when relevant. Keep contact identity accurate and legible; panel shape, position, palette and composition belong to the recipe.
- Describe the in-house Roland TrueVIS VG2 accurately as an eco-solvent printer/cutter when equipment context is useful; never call it UV, flatbed or direct-to-substrate.
- Onsite designer availability does not establish a fee, included artwork work or proof deadline. Rush and numerical turnaround claims require their maintained conditions and trusted disclosure; never promise universal same-day availability.
- Use descriptive internal links where the channel supports them. A graphic is not required to contain a website-page link checklist.

## Price source of truth
Resolve exact offers from `src/lib/pricing/product-facts.ts`, the current engine in `src/lib/engine/`, `src/lib/pricing/order-min.ts` and loaded `data/tables/*.csv` inputs. Use the current configured feature flags and preserve the source/fingerprint binding. A local calculation does not verify deployed pricing.

For social service wording use eligible facts in `src/lib/social/generation/business-profile.ts`, backed by `src/lib/commerce/policies.ts`; respect each fact's status, `useInGeneration` and review limitations. Missing or disabled claims stay omitted until separately verified. Read `docs/social/BRANDING-STANDARD.md` for scoped logo decisions and the current campaign record for exact offer context.
