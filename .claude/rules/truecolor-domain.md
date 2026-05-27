# True Color Domain Facts

## Identity
True Color Display Printing Ltd. | 216 33rd St W, Saskatoon SK S7L 0V1
CRA GST#: 731454914RT0001
Phone: (306) 954-8688 | Email: info@true-color.ca | Domain: https://truecolorprinting.ca
Printer: Roland UV (in-house) | Designer: In-house Photoshop, $35 flat, same-day proof
Rush: +$40 flat, order before 10 AM | Standard turnaround: 1–3 business days

## Stack
Next.js 16.1.6 | TypeScript strict | Tailwind CSS v4 | Railway (auto-deploy on push main)
motion: import from "motion/react" — only in "use client" files
@resvg/resvg-js must be in serverExternalPackages in next.config.ts

## Supabase — TRUE COLOR WEBSITE (+ Lead/Campaign Tables)
Project ID: dczbgraekmzirxknjvwe | Region: us-east-2
URL: https://dczbgraekmzirxknjvwe.supabase.co
Keys: stored in Railway env vars (SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL)
Key lookup: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && railway variables --json`
Service client: createServiceClient() in src/lib/supabase/server.ts (reads SUPABASE_SECRET_KEY)
Direct SQL: use mcp__supabase__execute_sql with project_id=dczbgraekmzirxknjvwe (no key needed)
New tables (run true-color-leads-schema.sql to create): tc_leads (upsert_tc_lead() dedup fn) | tc_campaigns | tc_instagram_queue (Google Drive sync)

## Pricing Engine
Source of truth: data/tables/*.csv — edit CSVs only, push main → live in ~2 min
Run `/pricing-health` before EVERY pricing deploy
Three models: SQFT-based | LOT-price (is_lot_price=TRUE) | Per-unit DISPLAY
NEVER fix: BANNER-V13-2X6FT $90 | SIGN-CORO4-4X8FT-S $232 (intentional). RIGID-ACP3-24X36-S was retired 2026-05-20 — full reason in .claude/rules/truecolor-pricing-safety.md.

## Auth Rules
Use getSession() for UI — NEVER getUser()
requireStaffUser() on ALL /api/staff/* routes
Staff = email === STAFF_EMAIL (env var)

## Tax Rules
GST (5%) + PST (6%) shown ONLY on checkout. All other pages show pre-tax sell_price.
PST formula: pst = (sell_price - design_fee) * 0.06 per item
Rush fee = PST-EXEMPT — do NOT apply PST to rush line items
GST rate = read from config.v1.csv gst_rate — never hardcode 0.05
Receipt/email GST# display: read from NEXT_PUBLIC_GST_NUMBER env var (Railway) — never hardcode

## Disabled Products (do NOT re-enable without owner approval)
- Business cards >1000 qty
- Postcards single-sided (1S)
- Brochure 100lb (PLACEHOLDER_100LB — waiting for Spicer quote)

## ACP 2S — Enabled 2026-05-10 (Diana Noble brokerage quote trigger)
- Pricing: +$6/sqft additive uplift over 1S tier (NOT 1.75× — ACP panel cost is 50% of total, additive is cost-honest)
- Rules: PR-ACP-D-T1 ($19/sqft 0-6 sqft), PR-ACP-D-T2 ($17/sqft 6-24 sqft), PR-ACP-D-T3 ($16/sqft 24+ sqft)
- Min charge $60 same as 1S

## Wave Accounting
To mark a Wave invoice PAID: use `invoicePaymentCreateManual` mutation. It links the payment to the invoice so `status` flips PAID and `amountPaid` increments.
DO NOT use `moneyTransactionCreate` for invoice payments — it creates an orphan bank deposit that never closes the invoice (caused 28+ zombie invoices 2026-05-22 to 2026-05-26).
`moneyTransactionCreate` is still OK for non-invoice bookkeeping (manual journal entries, transfers).
GST sales tax object has taxNumber=731454914 + showTaxNumberOnInvoices=true (set 2026-04-09)
Legacy "SK TAX" 11% compound is ARCHIVED — do not reactivate

## Brevo Email
Sender ID: 1 | 21 lists configured
All emails via Brevo REST API at src/lib/email/smtp.ts — Railway Hobby blocks all SMTP
BCC rule: always BCC hasan.sharif.realtor@gmail.com + albert@true-color.ca (not CC — BCC)

## Clover API Filter Syntax
Multiple filter= params required — NEVER AND-join in one string:
  CORRECT: url.searchParams.append("filter", "createdTime>=X"); url.searchParams.append("filter", "createdTime<Y")
  WRONG:   filter=createdTime>=X and createdTime<Y

## Supabase Storage URLs
File links from storage use SUPABASE_STORAGE_URL env var as base, not the project URL directly.

## Image & Content Data Files (DO NOT MIX UP)
| Data File | What Goes Here | Feeds Into | Skill That Updates It |
|-----------|---------------|-----------|----------------------|
| `src/lib/data/niche-image-prompts.json` | ChatGPT prompts for landing page DesignDirectionGrid mockups (per-niche) | `/staff/social/image-prompts` page | `/truecolor-page [niche]` |
| `src/lib/data/gbp-products.json` | GBP product descriptions, prices, image prompts for Google listing photos | `/staff/social/gmb` page + `/staff/social/image-prompts` page | `/gmb-update` |
| `src/lib/data/products-content.ts` | Product page copy, whoUsesThis niche mapping | `/products/[slug]` pages + IndustryPage product cards | Manual edit |

Image Prompts hub (`/staff/social/image-prompts`) reads from BOTH niche-image-prompts.json AND gbp-products.json.
GBP Products page (`/staff/social/gmb`) reads ONLY from gbp-products.json.
Adding a new niche to niche-image-prompts.json = auto-renders on the hub, no code change needed.

## Mandatory Skill Gates (True Color only — run before shipping)
- `/web-design-ux`   → before any UI component
- `/ecommerce-ux`    → before any checkout / order / email feature
- `/pricing-review [cat]` → before any new product pricing or size expansion (researches competitors + calculates margins + gates on owner approval before CSV changes)
- `/pricing-health`  → before any pricing CSV or engine deploy
- `/e2e-test`        → before every production push to Railway
- `/true-color-campaign-presend-audit` → before any batch of Brevo campaigns is created or scheduled (checks images, CTA links, subject merge tags, pricing)

## Post-Build Deploy Prompt
After a successful `npm run build` on customer-facing files (pages, components, styles, data):
- Ask: "Build passed. Push to Railway?" — don't wait for the user to remember.
- If user confirms, run `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && git push`
- After /truecolor-page completes: remind about manual follow-ups (images, Brevo, social) per `memory/truecolor-automation-chain.md`

## Email Component Pattern
All new email templates MUST import shared components from `src/lib/email/components/` (Header, Footer, Button, Section, Card).
Never duplicate header/footer HTML — always use the shared components.
Examples: orderConfirmation, paymentRequest, reviewRequest, statusUpdate, proofSent.

## NotebookLM
Context file: see ~/.claude/notebooklm-guide.md for index. Create project context file at session start if status is STUB NEEDED.