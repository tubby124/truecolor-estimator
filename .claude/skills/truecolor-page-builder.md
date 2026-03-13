# True Color Landing Page Builder

## When to use
Automatically when creating or editing any file in src/app/*/page.tsx for truecolorprinting.ca.

## BEFORE writing any page content
1. Read data/PRICING_QUICK_REFERENCE.md — specifically the Communication Rules section
2. Identify which products appear on this page
3. Look up the correct "Marketing from $X" price for each product

## Canonical marketing "from" prices
- Coroplast Signs: from $30 (NOT $24, NOT $8/sqft in marketing)
- Vinyl Banners: from $66 (NOT $45)
- ACP Aluminum: from $60 (NOT $39)
- Foamboard: from $45
- Vehicle Magnets: from $45 (NOT $24/sqft)
- Vinyl Lettering: from $40
- Window Decals: from $45
- Window Perf: from $40
- Business Cards: from $45 (250 2-sided)
- Flyers: from $45 (100 full 2S 80lb)
- Stickers: from $25 (25 qty 2×2")
- Postcards: from $35 (50 qty 3×4")
- Brochures: from $70 (100 tri-fold)
- Photo Posters: from $15 (12×18")
- Retractable Banners: from $219 (Economy)
- Rack Cards: from $25 (100 1-sided)

## Product reference card rates (IndustryPage products array)
Wide-format T1 sqft rates: Coroplast $8/sqft, Banners $8.25/sqft, ACP $13/sqft, Foamboard $10/sqft, Window Decals $11/sqft, Vehicle Magnets $24/sqft

## Volume discounts — ALWAYS QTY-based labels
- "5+ signs get 8% off" ✅
- "8+ sqft gets 8% off" ❌ NEVER

## Meta description rules
- Must include a real dollar price
- Must include "Saskatoon" or "Saskatchewan"
- Must be ≤155 characters
- Template: "Custom [product] from $[price] in Saskatoon. [benefit]. [CTA]."

## SEO protection
- NEVER change meta titles, H1s, or URLs on pages ranking in top 10
- Price-only surgical fixes on ranking pages
- Read .claude/rules/seo-protected-pages.md before editing ranking pages

## After writing any page
- Verify all prices against data/PRICING_QUICK_REFERENCE.md
- Run: npm run validate:pricing
