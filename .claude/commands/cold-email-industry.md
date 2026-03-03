# /cold-email-industry [industry]

Cold email system executor for True Color Display Printing. Runs the complete outreach pipeline for one industry: lead scraping, landing page audit, email writing, Brevo setup, tracker update, and visual QA.

**Usage:** `/cold-email-industry [industry]`
**Examples:** `/cold-email-industry retail` | `/cold-email-industry nonprofits` | `/cold-email-industry construction`

---

## STEP 0 — READ STATE (always first)

1. Read `research/outreach/OUTREACH_TRACKER.md` — check what step the industry is at.
2. Read `research/leads/by_industry/[industry].csv` — count contacts, identify unknowns.
3. If the industry has never been emailed: start from Step 1. If in-sequence: jump to the right step.
4. Read `research/emails/drafts/healthcare/email_2.html` as style reference — all emails must match that format exactly.

### ⚠️ Post-Day-0 bounce audit (run FIRST if Day 0 was already sent)

Before setting TC attributes or scheduling anything, pull the list and find hard bounces:
```
mcp__brevo__lists_get_contacts_from_list → list_id: [N], limit: 500
```
Filter for `emailBlacklisted: true` → these hard-bounced on Day 0.
- Set `TC_STATUS = "bounced"` on each via `mcp__brevo__contacts_update_contact`
- Mark `BOUNCE` in the industry CSV
- **Skip these contacts in all TC attribute updates and campaign targeting**

Healthcare bounces (already done): info@stonebridgeeyecare.ca, info@pinehouseeyecare.ca, info@mountroyaldental.ca, info@broadwayeyecare.ca

### ⚠️ CRITICAL: Live page existence check (run BEFORE any Day 0 send)

The landing page must return HTTP 200 on the **live Railway site** — not just exist in the codebase. A 404 on `truecolorprinting.ca` means email clicks go to the True Color 404 page → wasted campaign.

```bash
curl -s -o /dev/null -w "%{http_code}" https://truecolorprinting.ca/[industry-slug]
```

- **200** → safe to send
- **404** → build the page + `git push main` → wait ~2 min for Railway deploy → re-check before sending
- **Never send Day 0 until this returns 200.**

**Known page map** (verify slug → URL is correct):

| Industry | Correct URL | Email Links To |
|----------|------------|----------------|
| healthcare | `/healthcare-signs-saskatoon` | `/dental-office-signs-saskatoon` (more specific) |
| dental | `/dental-office-signs-saskatoon` | `/dental-office-signs-saskatoon` |
| real-estate | `/real-estate-signs-saskatoon` | `/real-estate-signs-saskatoon` |
| construction | `/construction-signs-saskatoon` | `/construction-signs-saskatoon` |
| agriculture | `/agriculture-signs-saskatoon` | `/agriculture-signs-saskatoon` |
| restaurant | `/restaurant-signs-saskatoon` | `/restaurant-signs-saskatoon` |
| events | `/event-banners` | `/event-banners` |
| retail | `/retail-signs-saskatoon` (NOT YET BUILT) | needs building first |
| nonprofits | `/nonprofit-signs-saskatoon` (NOT YET BUILT) | needs building first |
| sports | `/sports-signs-saskatoon` (NOT YET BUILT) | needs building first |

**⚠️ `/healthcare-printing-saskatoon` does NOT exist** — this URL is wrong. Use `/healthcare-signs-saskatoon`.

---

## STEP 1 — APIFY LEAD SCRAPING (run in parallel with Step 2)

**Fire all scrape calls simultaneously — do not wait for results before continuing.**

Use `mcp__apify__call-actor` with `actor: "enckay/google-maps-places-extractor"` and `async: true`.

### Input schema (REQUIRED — pass as object, NOT string):

⚠️ `keyword` and `location` are SEPARATE fields — NEVER embed location inside keyword. Doing so causes actor validation failure.

```json
{
  "keyword": "[search term only — no city/province]",
  "location": "Saskatoon, SK, Canada",
  "maxResults": 40,
  "filterPermanentlyClosed": true,
  "extractContactDetails": true,
  "extractWebsiteEmails": true,
  "extractSocialMedia": true,
  "calculateLeadScore": true
}
```

For province-wide searches (agriculture, farm supply): use `"location": "Saskatchewan, Canada"`

### Standard search queries per industry (keyword only — location set separately):

| Industry | Keywords (run in parallel, location="Saskatoon, SK, Canada") |
|----------|--------------------------------------------------------------|
| healthcare | "dental clinic", "optometry", "physiotherapy", "chiropractic" |
| real-estate | "real estate agent", "realtor", "real estate brokerage" |
| construction | "general contractor", "construction company", "renovation contractor home builder", "roofing contractor", "landscaping company" |
| retail | "retail boutique gift shop", "clothing store boutique" |
| events | "event planner", "wedding venue", "event venue banquet hall", "party rental equipment" |
| nonprofits | "non-profit organization charity" |
| sports | "minor hockey sports association", "fitness gym yoga studio" |
| agriculture | "farm supply store" + "seed dealer agricultural supply" (location="Saskatchewan, Canada") + "agricultural equipment dealer" |
| restaurants | "restaurant", "cafe", "bar and grill", "food truck" |
| st-patricks | "Irish pub", "sports bar", "bar and grill", "nightclub lounge", "pub brewery taproom" |
| mothers-day | "day spa massage", "beauty salon", "nail salon", "florist flower shop", "hair salon barber" |
| graduation | "private school", "event venue banquet hall", "party rental equipment", "wedding venue" |
| canada-day | "retail boutique gift shop", "auto dealership car dealer", "non-profit organization charity", "fitness gym yoga studio" |
| back-to-school | "daycare child care center", "tutoring center learning academy" |

### Post-scrape filtering rules (apply after results arrive):
- **EXCLUDE**: chains with 10+ locations (Tim Hortons, Subway, national franchises)
- **EXCLUDE**: any contact already in the industry CSV (deduplicate by business name + phone)
- **EXCLUDE**: any business outside Saskatoon city limits (check address for Regina, Prince Albert, etc.)
- **INCLUDE**: locally owned, independent businesses with 1–3 locations max

### After filtering:
- Append net-new leads to `research/leads/by_industry/[industry].csv` (same column format as existing)
- Log the Apify run IDs and result count in `OUTREACH_TRACKER.md` under "Apify Supplementation Log"

**Note:** Retrieve results with `mcp__apify__get-actor-output` using the `datasetId` returned from `call-actor`.

---

## STEP 2 — LANDING PAGE AUDIT (run in parallel with Step 1)

Check the industry landing page using the checklist below. Fix any gaps before emails go out.

### Landing page checklist:

| Item | How to check | Fix |
|------|-------------|-----|
| Page exists | `ls src/app/[slug]/page.tsx` | Create using IndustryPage component |
| `canonicalSlug` set | Check props | Add prop — triggers BreadcrumbList schema |
| `primaryProductSlug` set | Check props | Add prop — routes CTA to estimator, not /quote |
| ≥6 FAQs | Count faq array items | Add industry-specific questions |
| `openGraph` block complete | Check metadata | Add url, title, description, images array |
| Description ~155 chars | Count metadata.description | Trim or expand |
| Internal links in description | Check descriptionNode | Link to related industry page + product page |
| Schema renders (3-set) | JSON in page | IndustryPage auto-generates Service + FAQPage + BreadcrumbList |
| Same-day callout present | Check whyPoints | Add: "Same-day rush available — $40 flat, order before noon" |
| Sitemap includes page | `src/app/sitemap.ts` | Add entry at priority 0.85 under industry pages |

### Required SEO skill: run `/truecolor-seo` before building any new page.

---

## STEP 3 — WRITE 10 EMAILS (sequential after Steps 1+2 complete)

### Email HTML standards (canonical — NEVER deviate):

```
Layout:    600px max-width table, inline styles only
Header:    #1c1712 background, white "True Color Display Printing" wordmark
Body bg:   #ffffff
CTA:       #16C2F3 cyan, white text, 16px font, min 44px height, border-radius 6px
Footer bg: #f9f9f9, border-top 1px #eeeeee
```

### Required footer elements (all 4 — CASL compliance):
1. Business name + address: "216 33rd St W, Saskatoon, SK S7L 0V5"
2. Phone: (306) 954-8688
3. Instagram: `<a href="https://instagram.com/truecolorprint">See recent work →</a>` in #16C2F3
4. Unsubscribe: `<a href="{{unsubscribeLink}}">Unsubscribe</a>`

### Subject line rules:
- Lowercase only, max 8 words, no emoji, conversational tone
- Do NOT start with "Hi", "Hey", or the company name
- Must create curiosity or reference a specific pain point

### Body copy rules:
- Open with ONE sentence hitting a specific pain moment — no pleasantries
- Name actual prices (never "ask for a quote")
- Personalize: `{{contact.FIRSTNAME}}` and `{{contact.COMPANY}}`
- ONE CTA per email max
- Sender: "True Color Display Printing" | from: info@true-color.ca

### UTM format:
```
?utm_source=cold_email&utm_medium=email&utm_campaign=[industry]_step[N]&utm_content=email[N]
```

### 10-email cadence (standard for all industries):

| Email | Day | Angle | Link To | Subject style |
|-------|-----|-------|---------|---------------|
| 1 | 0 | Intro — hyper-specific pain moment | `/[industry]-signs-saskatoon` | "pain + product hook" |
| 2 | 7 | Friction remover — one question only | `/[industry]-signs-saskatoon` | "still need [thing]?" |
| 3 | 14 | Soft close — different product angle | `/[industry]-signs-saskatoon` | "quick question about [specific item]" |
| 4 | 30 | Value-add — how to do it / process | `/[industry]-signs-saskatoon` | "how to [task] at once" |
| 5 | 60 | Social proof — local anonymous example | `/products/[primary product]` | "what a local [biz] ordered last month" |
| 6 | 90 | Product pitch — underused product | `/products/[secondary product]` | "one thing most [biz type] forget" |
| 7 | 120 | Instagram visual showcase | `instagram.com/truecolorprint` | "here's what we've been printing (photos)" |
| 8 | 180 | Full price transparency breakdown | `/[industry]-signs-saskatoon` | "what [product] actually costs (no surprises)" |
| 9 | 270 | Seasonal hook (Q3 Sept/Oct timing) | `/[industry]-signs-saskatoon` | "fall is prime time for [seasonal trigger]" |
| 10 | 365 | Last email — honest close | Homepage | "still haven't printed with us yet?" |

**Save to:** `research/emails/drafts/[industry]/email_1.html` through `email_10.html`

**Style reference:** `research/emails/drafts/healthcare/email_2.html` — match exactly.

---

## STEP 4 — BREVO VERIFICATION (before automation goes live)

### ⚠️ Check test recipient for suppressions FIRST

Before sending any test emails, verify the test recipient isn't suppressed:
```
mcp__brevo__contacts_get_contact_info → identifier: "info@true-color.ca"
```
Check: `emailBlacklisted` must be `false` AND `statistics.unsubscriptions.adminUnsubscription` must be empty.

**Brevo returns 204 even for suppressed contacts — it silently drops the email. There is no error.**

**Default test recipient: `info@true-color.ca`** — this is the reliable address. Do NOT use `hasan.sharif@exprealty.com` (admin-unsubscribed since Jan 2026).

---

### ⚠️ CRITICAL: Campaigns and Templates are INDEPENDENT objects

**Brevo bakes HTML into campaigns at creation time.** Updating a transactional template (Layer 1) does NOT update its corresponding scheduled campaign (Layer 2). They are completely separate.

**Rule — any time you change email content after campaigns are created:**
1. Update the template (`mcp__brevo__transac_templates_update_smtp_template_with_sender_email`)
2. ALSO update the campaign (`mcp__brevo__email_campaign_management_update_email_campaign`) — fetch HTML from template → push to campaign
3. Run all campaign updates in parallel. All should return 204.

**Verification after campaign creation:** Always spot-check at least 1 campaign with `mcp__brevo__email_campaign_management_get_campaign_details` to confirm the HTML contains the image header and correct CTA URL — not the base template's placeholder dental/generic link.

---

### Layer 1 — Transactional templates (for QA and reference)

Use `mcp__brevo__transac_templates_create_smtp_template_with_sender_email`
- **Run all 9 creates in parallel**
- Naming convention: `[ABBREV] - Email [N] - [Short Desc] (Day [N])`
  e.g. `HC - Email 2 - Friction Remover (Day 7)`
- Always set: `sender_name: "True Color Display Printing"`, `sender_email: "info@true-color.ca"`, `tag: "[industry]"`, `replyTo: "info@true-color.ca"`, `isActive: true`
- **Sender ID = 1** (info@true-color.ca — the only verified sender, hardcode this everywhere)

### Healthcare template IDs (reference — already created):
| Email | Day | Template ID | Subject |
|-------|-----|-------------|---------|
| Email 2 | 7 | **36** | still need cards for the new hire? |
| Email 3 | 14 | **37** | quick question about your suite sign |
| Email 4 | 30 | **38** | how to order cards for 3 dentists at once |
| Email 5 | 60 | **39** | what a local clinic ordered last month |
| Email 6 | 90 | **40** | one thing most clinics forget at reception |
| Email 7 | 120 | **41** | here's what we've been printing (photos) |
| Email 8 | 180 | **42** | what 250 cards actually costs (no surprises) |
| Email 9 | 270 | **43** | fall is prime time for new associates |
| Email 10 | 365 | **44** | still haven't printed with us yet? |

### Industry header images — REQUIRED for every new industry

Every industry sequence needs two custom email header images before templates go live:
- **Main header** (emails 2–5): 600×250px, dark charcoal `#1c1712`, product flatlay + "Signs & displays for [industry]"
- **Follow-up header** (emails 6–10): 600×250px, dark navy `#1B4F8A`, single hero product + urgency copy
- **Format:** PNG | **Hosted at:** `https://truecolorprinting.ca/images/industries/[industry]/`
- **File names:** `email-header-[industry]-main.png` + `email-header-[industry]-followup.png`
- **ChatGPT prompts template:** `HEALTHCARE_IMAGE_PROMPTS.md` — copy + swap industry, products, and palette
- **Verify live before sending:** `curl -s -o /dev/null -w "%{http_code}" https://truecolorprinting.ca/images/industries/[industry]/email-header-[industry]-main.png` → must return 200
- **HTML tag:** `<tr><td style="background:#1c1712;padding:0;line-height:0;"><img src="..." width="600" style="display:block;width:100%;max-width:600px;height:auto;" /></td></tr>` — NEVER add padding to a TD containing an image

### ⚠️ CTA URL audit (run before every industry's campaign creation)

After writing all 10 email HTML files, grep for any wrong industry slug BEFORE creating templates or campaigns:
```bash
grep -r "dental-office-signs-saskatoon" research/emails/drafts/[industry]/
```
If any results: replace with the correct industry slug. The dental template was used as the base for HC — this bug will repeat if not caught early.

### Send test emails to verify rendering

Send all 9 in parallel via `mcp__brevo__transac_templates_send_test_template`:
```
emailTo: ["info@true-color.ca"]
tags: {"FIRSTNAME": "Test", "COMPANY": "True Color Clinic"}
```
**Always use `info@true-color.ca` as test recipient.** `hasan.sharif@exprealty.com` is admin-unsubscribed — Brevo silently drops it (returns 204 with no send). Always verify test recipient first with `mcp__brevo__contacts_get_contact_info` — check `emailBlacklisted` and `adminUnsubscription` array.

Confirm on all:
- [ ] Subject line renders correctly (no broken tokens)
- [ ] Industry header image loads at top (not plain dark text header)
- [ ] Emails 2–5 use `email-header-[industry]-main.png`, emails 6–10 use `email-header-[industry]-followup.png`
- [ ] CTA button renders cyan (#16C2F3), tappable on mobile
- [ ] CTA URL goes to `/[industry]-signs-saskatoon` (NOT `/dental-office-signs-saskatoon`)
- [ ] Footer shows address + Instagram + unsubscribe link
- [ ] No broken `{{contact.FIRSTNAME}}` tokens (replace with "Test" in preview)
- [ ] Mobile view at 375px — no horizontal scroll, CTA ≥ 44px tall

### Brevo contact attributes (create once — ALREADY CREATED for True Color account):
- `TC_SEQUENCE` (text): e.g. "healthcare" — ✅ created
- `TC_STEP` (float): 0–10 — ✅ created (**use type `float`, NOT `number` or `integer`** — Brevo rejects those)
- `TC_ENROLLED` (date): first email date — ✅ created
- `TC_STATUS` (text): active / replied / unsubscribed / converted — ✅ created

**Do NOT recreate these** — they exist in the account already. Just set values on individual contacts.

### Layer 2 — Scheduled campaigns (the actual sends to the list)

**Fixed cohort vs rolling enrollment — pick the right model:**

| Scenario | Method |
|----------|--------|
| All contacts enrolled same Day 0 (fixed cohort) | Scheduled campaigns via MCP ✅ |
| New contacts added over time (rolling) | Brevo Automation in dashboard (manual UI — can't do via MCP) |

**For fixed cohorts (most industries will be this):** use `mcp__brevo__email_campaign_management_create_email_campaign`:
- `sender_id: 1` (always — hardcoded)
- `replyTo: "info@true-color.ca"`
- `recipients_lists: [[list_id]]`
- `tags: ["[industry]", "cold-email"]`
- `toField: "{{contact.FIRSTNAME}}"`
- `scheduledAt`: see timing rules below

**Run all 9 campaign creates in parallel.**

### ⚠️ Post-creation campaign sync (MANDATORY — do not skip)

After all 9 campaigns are created, immediately run a spot-check:
```
mcp__brevo__email_campaign_management_get_campaign_details → campaignId: [first campaign]
```
Confirm in the returned HTML:
- Image header tag present (`email-header-[industry]-main.png`)
- CTA URL points to `/[industry]-signs-saskatoon` (not dental or old URL)

If either check fails → update ALL campaigns with correct HTML from the templates:
```
mcp__brevo__transac_templates_get_smtp_template → templateId: [each template]
mcp__brevo__email_campaign_management_update_email_campaign → campaignId: [each campaign], htmlContent: [from template]
```
Run all 9 fetches + 9 updates in parallel. All should return 204.

### ⚠️ Send-day optimization (cadence days are targets, not absolutes)

Saskatchewan = **CST year-round** (no DST). 10am CST = **16:00 UTC** always.

Optimal send days: **Tuesday, Wednesday, Thursday only**
- Monday → inbox catch-up from weekend, avoid
- Friday → pre-weekend mode, avoid

**Rule:** Take the target day (Day 7, Day 14, Day 30…) → find the nearest Tue/Wed/Thu **on or after** that date → schedule at 16:00 UTC.

Example: Day 7 from Feb 27 = Mar 6 (Friday) → push to Mar 10 (Tuesday, Day 11). Close enough — timing win beats one day of precision.

### TC attribute update — skip blacklisted contacts

After campaigns are created, set TC attributes on all active contacts:
```
mcp__brevo__lists_get_contacts_from_list → get full list
```
Filter: only update contacts where `emailBlacklisted: false`. For blacklisted contacts set `TC_STATUS = "bounced"` — do not send TC_STEP/TC_ENROLLED to those.

### Exit mechanism for scheduled campaigns

Scheduled campaigns send to everyone in the list at the scheduled time. To stop a contact from future emails:
1. Remove them from the industry list (`unlinkListIds`) in Brevo
2. Set `TC_STATUS = "replied"` or `"converted"` so you know why they were removed
3. Blacklisted contacts are auto-excluded by Brevo — no action needed

---

## STEP 5 — INSTAGRAM + SOCIAL CONTENT (ALWAYS — same session)

For every industry campaign, produce **3 Instagram posts** using the SAME images already in `public/images/industries/[industry]/`. No new image generation needed.

### Post schedule
- Post 1 (Launch): Same date as Email 1 (Day 0)
- Post 2 (Mid): Day 30–60 — case study or social proof angle
- Post 3 (Long-game): Day 90+ — product spotlight for the industry

### Output format for each
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTAGRAM POST [N] — [INDUSTRY] — [DATE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE: public/images/industries/[industry]/[filename].png
PRODUCTION URL: https://truecolorprinting.ca/images/industries/[industry]/[filename].png

CAPTION (150–220 chars):
[Hook — punchy 3–5 words]
[2 lines value/story]
From $[X] before GST.
🌐 truecolorprinting.ca/[slug]?utm_source=social&utm_medium=instagram&utm_campaign=[industry]

HASHTAGS (first comment — 12–15 total):
#Saskatoon #SaskatoonBusiness #SaskatoonPrinting #YXE
#[3 product hashtags] #[3 industry hashtags] #[2 audience hashtags]

BLOTATO ROW:
caption_raw  | [raw caption, single line, no hashtags]
platforms    | instagram,facebook
image_url    | https://truecolorprinting.ca/images/industries/[industry]/[filename].png
schedule_date | [YYYY-MM-DD]
status       | Ready to Post
campaign     | [industry]-2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Save rows to: `research/emails/drafts/[industry]/blotato_queue.csv`
Full hashtag library: `memory/instagram-content-system.md`

---

## STEP 6 — UPDATE TRACKER

After completing the above steps, update `research/outreach/OUTREACH_TRACKER.md`:
1. Add/update the industry section with current enrolled contact list
2. Move contacts from "No Email" to enrolled table when emails are found
3. Log Apify run IDs + net-new lead count in "Apify Supplementation Log"
4. Set status emoji: ⬜→🟡 when enrolled, 🟡→🟢 when converted

---

## STEP 6 — SELF-HEAL (run after every industry completes)

After completing an industry, update this skill file with:
1. Any new Apify queries that found good leads (add to query table in Step 1)
2. Subject lines that got replies or clicks (add note in cadence table)
3. FAQs that get asked a lot in replies (add to landing page FAQ bank)
4. Industries where email 7 (Instagram) performed especially well — consider moving it earlier

Append findings to: `research/outreach/INDUSTRY_CAMPAIGN_PLAYBOOK.md`

---

## Industry-Specific Landing Page Slugs

| Industry | Landing Page | Primary Product Slug |
|----------|-------------|----------------------|
| healthcare | `/healthcare-signs-saskatoon` | `acp-signs` |
| dental | `/dental-office-signs-saskatoon` | `business-cards` |
| real-estate | `/real-estate-signs-saskatoon` | `coroplast-signs` |
| construction | `/construction-signs-saskatoon` | `coroplast-signs` |
| agriculture | `/agriculture-signs-saskatoon` | `coroplast-signs` |
| restaurant | `/restaurant-signs-saskatoon` | `vinyl-banners` |
| events | `/event-banners` | `vinyl-banners` |
| retail | `/retail-signs-saskatoon` (needs building) | `coroplast-signs` |
| nonprofits | `/nonprofit-signs-saskatoon` (needs building) | `vinyl-banners` |
| sports | `/sports-signs-saskatoon` (needs building) | `coroplast-signs` |

---

## SEO Skills Integration

Before building or auditing any landing page, run these skills in order:
1. `/truecolor-seo` — True Color SEO bible, keyword map, competitors, schema templates
2. `/new-seo-page` — new page checklist (metadata, schema, internal links, sitemap)
3. `/schema-markup` — validate Service + FAQPage + BreadcrumbList output
4. `/copy-editing` — review email and page copy for clarity and conversion

These are baked in — do not skip.

---

## Healthcare v1 Notes (Reference Template — 2026-02-27)

**What worked:**
- 38% open rate on Day 0 — subject "new associate Monday? cards by Friday." was strong
- Dental pain point (new associate cards) resonated — high open = right audience
- Batch ordering angle (3 dentists, one invoice) was the right value prop

**What didn't work:**
- 0 clicks — root cause was URL pointing to old Vercel homepage, NOT the landing page
- No GA4 installed — UTM tracking was useless until GA4 added (fixed 2026-03-01)

**Key fix for all future industries:**
- Always use `https://truecolorprinting.ca/[slug]?utm_...` — never relative URLs, never Vercel subdomain
- Verify GA4 is live on truecolorprinting.ca before sending any campaign (check DevTools Network tab for gtag calls)
- Run landing page `/cold-email-industry` audit BEFORE Day 0 send — not after

**Healthcare email sequence files:** `research/emails/drafts/healthcare/email_1.html` through `email_10.html`
**Healthcare leads CSV:** `research/leads/by_industry/healthcare_dental.csv` (40 leads, 26 with email)
