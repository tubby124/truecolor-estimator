# Construction Print — ChatGPT Image Generation Prompts
**Purpose:** Generate header images for the construction cold email sequence in Brevo — same system as Healthcare.

**How to use:** Copy each prompt block → paste into ChatGPT (GPT-4o with image generation). Download, rename, drop into the path listed.

**Save location:** `truecolor-estimator/public/images/industries/construction/`

---

## SECTION 1 — Brevo Cold Email Headers (2 images)
**Purpose:** In-email header image for construction cold outreach sequence (10 emails)
**Dimensions:** 600×250 px (email-safe)
**File names:** `email-header-construction-main.png`, `email-header-construction-followup.png`
**Usage:** Hosted at `https://truecolorprinting.ca/images/industries/construction/`

---

### Email Header 1 — Main Outreach Header (use for emails 2–5 / campaigns 75–78)
**Brevo campaigns:** 75 (Mar 5), 76 (Mar 12), 77 (Mar 28), 78 (Apr 27)

```
Create a professional B2B cold email header banner, exactly 600×250 px, flat design suitable for HTML email.

Design:
- Background: very dark warm charcoal (#1c1712 — almost black with warmth).
- Left 55%: text area.
  - White headline text (bold, clean sans-serif, approx 24pt): "Site signs & vehicle magnets for Saskatoon contractors"
  - Below in teal (#16C2F3), approx 14pt: "Coroplast signs · Vehicle magnets · ACP panels · Vinyl banners"
  - Small teal horizontal rule below the subtext.
  - Very small white text at bottom of text area: "True Color Display Printing · 216 33rd St W · (306) 954-8688"
- Right 45%: a clean product flatlay arrangement showing 3–4 small construction print items grouped on a dark surface:
  · A coroplast yard sign with "UNDER CONSTRUCTION" text visible
  · A vehicle magnet with a contractor logo placeholder
  · A retractable banner stand (tiny, full stand visible)
  · An ACP aluminum panel sign
  All items are clean, professional, slightly warm studio-lit.
  Items are arranged neatly, not chaotically. This is a product showcase, not a lifestyle photo.
- No harsh gradients that won't survive email clients. Mostly flat dark background.
- Subtle True Color logo in bottom-right corner (small, white, low opacity).
- No people. Completely product and typography focused.
- The overall feel: premium, professional, B2B printing supplier email header for the trades industry.
```

---

### Email Header 2 — Follow-up / Urgency Header (use for emails 6–10 / campaigns 79–83)
**Brevo campaigns:** 79 (May 27), 80 (Jun 26), 81 (Aug 25), 82 (Nov 23), 83 (Feb 26, 2027)

```
Create a professional B2B cold email header banner, exactly 600×250 px, flat design for HTML email.

Design:
- Background: dark navy (#1B4F8A) — clean, trustworthy blue.
- Left 60%: text area on the navy background.
  - White bold headline (approx 22pt): "Still need signs for your job sites?"
  - Teal (#16C2F3) subtext (approx 14pt): "48-hour turnaround · Same-day rush · Local Saskatoon pickup"
  - Below: white small text: "No minimums · In-house designer included"
  - Very bottom: teal underline accent bar.
- Right 40%: a tight crop of a single hero product — a large coroplast yard sign with a clean contractor message, professionally designed, shot against white — placed on the right half of the banner with a slight drop shadow.
- Bottom strip: a slightly lighter navy (#1E5FAA) band the full width, with small white text: "True Color Display Printing · truecolorprinting.ca · (306) 954-8688"
- Feels warmer and slightly more urgent than Header 1. Blue builds trust, teal pops the value props.
- No people. Product + typography only. Email-safe flat design.
```

---

## SECTION 2 — Landing Page Images (future — if construction landing page gets descriptionNode upgrade)

The construction industry currently uses `/construction-signs-saskatoon` page. If/when adding a `descriptionNode` with design-direction card grids (same JSX pattern as Healthcare or Ramadan), these would be needed:

**Banner cards (3:1, 1800×600):** job-site-safety.png, trade-show-display.png, new-location-grand-opening.png
**Display cards (4:3, 1200×900):** display-site-office-directory.png, display-safety-board.png, display-trade-show-panel.png
**Retractable cards (3:8, 600×1600):** retractable-contractor-promo.png, retractable-site-welcome.png

*Generate these using the Healthcare prompt file as a template — swap industry, products, and construction color palette (charcoal #1c1712, teal #16C2F3, navy #1B4F8A).*

---

## Integration Checklist

### After generating images in ChatGPT:
1. Download as `.png`
2. `ls -lt ~/Downloads/ | head -10` — find new PNGs by timestamp
3. `Read` each file in Claude — view visually, match to purpose
4. `cp "Downloads/ChatGPT Image ..." "public/images/industries/construction/[name].png"` — use EXACT filename templates reference
5. `git add public/images/industries/construction/` → `git commit` → `git push`
6. Railway deploys in ~2 min
7. Verify live: `curl -s -o /dev/null -w "%{http_code}" https://truecolorprinting.ca/images/industries/construction/email-header-construction-main.png`

### Brevo template mapping:
| Template | Campaign | Send Date | Image Used |
|----------|----------|-----------|------------|
| 63 | 75 | Mar 5 | main |
| 64 | 76 | Mar 12 | main |
| 66 | 77 | Mar 28 | main |
| 68 | 78 | Apr 27 | main |
| 70 | 79 | May 27 | followup |
| 71 | 80 | Jun 26 | followup |
| 72 | 81 | Aug 25 | followup |
| 73 | 82 | Nov 23 | followup |
| 74 | 83 | Feb 26 2027 | followup |

### Image URLs in templates:
- Main: `https://truecolorprinting.ca/images/industries/construction/email-header-construction-main.png`
- Followup: `https://truecolorprinting.ca/images/industries/construction/email-header-construction-followup.png`

---

## Quick Reference — Image Inventory

| Image | Dimensions | Use |
|---|---|---|
| `email-header-construction-main.png` | 600×250 | Brevo emails 2–5 (campaigns 75–78) |
| `email-header-construction-followup.png` | 600×250 | Brevo emails 6–10 (campaigns 79–83) |

**Both images live at commit `4926de0` ✅**
