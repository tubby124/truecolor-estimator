# True Color Pricing Communication Rules

> This file supplements ~/.claude/rules/brand-voice.md with specific pricing communication patterns. See also: data/PRICING_QUICK_REFERENCE.md for the full pricing reference.

## Source of truth
All prices come from data/tables/ CSVs. PRICING_QUICK_REFERENCE.md is the human-readable reference.

## The 4 minimum-inflated products
These products have a minimum order that IS the correct "from" price:
- Coroplast: $8/sqft rate, $30 minimum → marketing says "from $30"
- ACP Aluminum: $13/sqft rate, $60 minimum → marketing says "from $60"
- Vehicle Magnets: $24/sqft rate, $45 minimum → marketing says "from $45"
- Vinyl Lettering: $8.50/sqft rate, $40 minimum → marketing says "from $40"

## Where to use which price format
| Context | Format | Example |
|---------|--------|---------|
| Marketing headline / CTA | "from $[minimum]" | "Coroplast signs from $30" |
| FAQ / pricing explanation | rate + minimum | "$8/sqft for orders above the $30 minimum" |
| Product reference card (IndustryPage) | T1 sqft rate | "$8/sqft" |
| Ranking page title (FROZEN) | Whatever currently ranks | Do NOT change |

## Common mistakes to avoid
- "from $8/sqft" for coroplast in marketing → WRONG, use "from $30"
- "from $45" for banners → WRONG, use "from $66" (smallest real banner = 2×4ft = $66)
- "from $39" for ACP → WRONG, use "from $60" (minimum order)
- "from $24" for coroplast → WRONG, use "from $30" (minimum order, not 18×24" calc price)
- "from $24/sqft" for magnets → WRONG in marketing, use "from $45"
- "$8/sqft" for window decals → WRONG, decals are $11/sqft
- "8+ sqft" volume discount → WRONG, always QTY-based ("5+ signs")
- PST 6% → WRONG, Saskatchewan printing has GST 5% only

## Add-ons (always separate from "from" price)
- Rush: +$40 flat
- Design (minor edit): +$35
- Design (from scratch): +$50
- Logo vectorization: +$75
- Grommets: $2.50/each
- H-stakes: $2.50/each
- Installation: $75 base

## Tax
All prices are pre-tax. GST 5% applied at checkout only.
