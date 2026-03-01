# /seasonal-outreach [event]

Seasonal and cultural event outreach executor for True Color Display Printing. Handles the complete pipeline end-to-end — cultural intelligence, Apify lead scraping, email writing, AI design concept prompts, Brevo setup — with a mandatory human verification gate before any campaigns are scheduled.

**Usage:** `/seasonal-outreach [event]`
**Examples:** `/seasonal-outreach ramadan` | `/seasonal-outreach eid` | `/seasonal-outreach diwali` | `/seasonal-outreach lunar-new-year` | `/seasonal-outreach powwow`

Different from `/cold-email-industry` in three ways:
- Knows Saskatoon's cultural communities, event calendars, and community-specific print needs — baked in, no web searching required
- Uses a compressed 2–3 email sequence (not 10-email 365-day drip)
- Urgency + community trust is the message angle, not B2B nurture

---

## STEP 0 — Event Calendar Lookup

Look up the event key in the baked-in calendar below. Determine days remaining until event → choose sequence model → state this clearly before proceeding.

**Sequence decision:**

| Days Until Event | Sequence Model |
|-----------------|---------------|
| >21 days | 3-email sequence |
| 7–21 days | 2-email compressed |
| <7 days | 1 email, hard urgency only |

**Seasonal Event Calendar (all dates baked in — no web search needed):**

| Event Key | Full Name | 2026 Dates | Buying Window | Saskatoon Communities |
|-----------|-----------|-----------|--------------|----------------------|
| `ramadan` | Ramadan | Feb 17 – Mar 19, 2026 | Feb 10 – Mar 15 | Somali, Bangladeshi, Pakistani, Syrian, Arabic, South Asian Muslim |
| `eid` / `eid-al-fitr` | Eid al-Fitr | ~Mar 20-21, 2026 | Mar 5 – Mar 19 | Same as Ramadan |
| `eid-al-adha` | Eid al-Adha | ~May 27-28, 2026 | May 10 – May 25 | Same as Ramadan |
| `diwali` | Diwali | ~Oct 20, 2026 | Oct 1 – Oct 17 | Indian (Hindu, Jain, Sikh), Sri Lankan, Nepali |
| `lunar-new-year` | Lunar New Year | ~Jan 28, 2027 | Jan 10 – Jan 25 | Chinese, Vietnamese, Korean, Filipino |
| `holi` | Holi | ~Mar 29, 2027 | Mar 15 – Mar 27 | Indian, Nepali, South Asian |
| `vaisakhi` | Vaisakhi | ~Apr 14, 2026 | Apr 1 – Apr 12 | Punjabi Sikh, Indian |
| `navratri` | Navratri / Garba | ~Oct 2, 2026 | Sep 20 – Oct 1 | Gujarati, Indian |
| `christmas-market` | Christmas markets | Nov–Dec | Nov 1 – Dec 15 | Churches, community halls, charities, nonprofits |
| `powwow` | Indigenous powwow | June–Aug (variable) | 4 weeks before event | First Nations, Métis cultural organizations |
| `pride` | Pride | June | May 15 – Jun 10 | LGBTQ+ orgs, community groups, allied businesses |

**Check OUTREACH_TRACKER first:** Read `research/outreach/OUTREACH_TRACKER.md`. If this event was run in a prior year, existing contacts are tagged `[event]-annual` in Brevo — skip Apify scraping (STEP 1) and use those contacts directly.

---

## STEP 1 — Apify Lead Scraping (run all queries in parallel, async)

Actor: `enckay/google-maps-places-extractor`, `async: true`

**⚠️ ALWAYS call `mcp__apify__fetch-actor-details` with `actor: "enckay/google-maps-places-extractor"` before calling `call-actor` — confirm the required input fields match the schema below. If the schema changed, use the updated fields. Never guess field names.**

Input schema (required — verified 2026-03-01):
```json
{
  "keyword": "[search term]",
  "location": "Saskatoon, Saskatchewan, Canada",
  "maxResults": 40,
  "filterPermanentlyClosed": true,
  "extractContactDetails": true,
  "extractWebsiteEmails": true
}
```

**Fire all queries for the event simultaneously — do not wait for one before starting the next.**

### Ramadan / Eid al-Fitr / Eid al-Adha (run all 8 in parallel):
- "mosque saskatoon"
- "islamic centre saskatoon"
- "halal restaurant saskatoon"
- "somali community centre saskatoon"
- "bangladeshi restaurant saskatoon"
- "arabic restaurant saskatoon"
- "middle eastern restaurant saskatoon"
- "south asian grocery saskatoon"

### Diwali (run all 5 in parallel):
- "hindu temple saskatoon"
- "indian restaurant saskatoon"
- "south asian community centre saskatoon"
- "bollywood restaurant saskatoon"
- "sri lanka community saskatoon"

### Lunar New Year (run all 5 in parallel):
- "chinese cultural association saskatoon"
- "vietnamese restaurant saskatoon"
- "chinese restaurant saskatoon"
- "korean restaurant saskatoon"
- "asian grocery saskatoon"

### Vaisakhi / Holi / Navratri (run all 4 in parallel):
- "gurdwara saskatoon"
- "sikh temple saskatoon"
- "punjabi restaurant saskatoon"
- "indian restaurant saskatoon"

### Christmas markets / Church events (run all 4 in parallel):
- "church saskatoon"
- "community hall saskatoon"
- "charity saskatoon"
- "nonprofit saskatoon"

### Powwow / Indigenous events (run all 3 in parallel):
- "first nations cultural centre saskatoon"
- "indigenous community organization saskatoon"
- "métis association saskatoon"

### Pride (run all 2 in parallel):
- "lgbtq organization saskatoon"
- "community centre saskatoon"

### Post-scrape filter rules:
- **INCLUDE**: mosques, temples, gurdwaras, cultural associations, halal/ethnic restaurants, community centres, student associations
- **EXCLUDE**: national chains (Tim Hortons, McDonald's etc.), out-of-city addresses, any result with no email
- **DEDUPLICATE**: against `research/leads/by_industry/event_planners.csv` and existing List 16 contacts (pull with `mcp__brevo__lists_get_contacts_from_list → list_id: 16`)

### Round 2 scraping — always run a second batch with orthogonal queries:

After Round 1, fire a second parallel batch of queries targeting categories Round 1 didn't cover well. For Ramadan, these supplemental queries found 4 of the 7 confirmed emails:

**Ramadan Round 2 (run all 8 in parallel):**
- "muslim community association saskatoon"
- "islamic school saskatoon"
- "somali african restaurant saskatoon"
- "halal butcher saskatoon"
- "newcomer immigrant settlement saskatoon"
- "south asian indian pakistani restaurant saskatoon"
- "afghan kebab shawarma saskatoon"
- "cultural community centre saskatoon"

Adapt this pattern for other events — use category terms Round 1 missed (nationality-specific restaurants, settlement agencies, cultural schools).

### Email yield by category — Ramadan 2026 learnings:
| Category | Email Rate | Notes |
|----------|-----------|-------|
| Mosques/Islamic centres | ~5% | Almost never on Google Maps — must look up websites manually |
| Islamic schools | ~80% | High priority — always in Google Business Profile |
| Pakistani/Bangladeshi restaurants | ~40% | Active on websites, often have contact pages |
| Halal grocery/butchers | ~30% | Often no website, call-only |
| Settlement agencies | ~90% | Professional orgs always have website emails |
| Afghan/Middle Eastern restaurants | ~25% | Mixed — many no-website small operations |

### Student associations not on Google Maps:
U of S campus orgs (MSA, BSAUS, ISA, cultural clubs) rarely appear on Google Maps. **Note to user:** manually check `students.usask.ca/activities/clubs` for Muslim Student Association, Bangladeshi Student Association, and relevant cultural clubs — look for any with public contact emails and add manually.

**Save results to:** `research/leads/by_industry/[event].csv`
CSV columns: `business_name, contact_name, email, phone, address, website, notes`

---

## STEP 2 — Cultural Briefing (write to OUTREACH_TRACKER)

Append a new section to `research/outreach/OUTREACH_TRACKER.md`:

```markdown
### Seasonal: [Full Event Name] [Year]

- **Event dates:** [range]
- **Days until event:** [N] → using [2/3]-email sequence
- **Brevo list:** 16 (Events)
- **TC_SEQUENCE:** "[event]-[year]"
- **Communities targeted:** [list from calendar]
- **Leads scraped:** [N] total → [N] with verified email
- **CSV:** research/leads/by_industry/[event].csv
- **Product focus:** [from product stack below]
- **Key messaging hooks:** [from knowledge base below]
- **Next event pivot:** [next event] in ~[gap] — mention in Email [N]
- **Annual tag to apply post-campaign:** [event]-annual
```

---

## STEP 3 — Write Email Sequence (2 or 3 emails — NEVER 10)

**HTML standards (identical to `/cold-email-industry` — never deviate):**
```
Layout:    600px max-width table, inline styles only
Header:    #1c1712 background, white "True Color Display Printing" wordmark
Body bg:   #ffffff
CTA:       #16C2F3 cyan, white text, 16px font, min 44px height, border-radius 6px
Footer bg: #f9f9f9, border-top 1px #eeeeee
```

**Required footer elements (CASL):**
1. True Color Display Printing | 216 33rd St W, Saskatoon, SK S7L 0V5
2. (306) 954-8688
3. `<a href="https://instagram.com/truecolorprint">See recent work →</a>` in #16C2F3
4. `<a href="{{unsubscribeLink}}">Unsubscribe</a>`

**UTM format:**
```
?utm_source=cold_email&utm_medium=email&utm_campaign=[event]_step[N]&utm_content=email[N]
```

### 3-email sequence (>21 days):

| # | Timing | Angle | Subject style |
|---|--------|-------|--------------|
| 1 | Day 0 | Name the occasion + product + price + turnaround | "iftar banners ready in 48 hours" |
| 2 | Day 7–10 | Next event pivot OR urgency increase | "eid is in [X] days — ready in 24h" |
| 3 | Day 30+ post-event | Annual relationship + files on record hook | "save your files — same banner next year" |

### 2-email sequence (7–21 days):

| # | Timing | Angle | Subject style |
|---|--------|-------|--------------|
| 1 | Now | Hard urgency + price + turnaround | "eid banners ready in 48 hours — order by [date]" |
| 2 | Day 7 | Last call + next event + annual hook | "last chance before eid — files on record for next year" |

### 1-email sequence (<7 days):
Single urgency email: "ready in 24h — order before noon today"

### Subject line rules (same as `/cold-email-industry`):
- Lowercase only, max 8 words, no emoji, no pleasantries at start
- Must create urgency or name the occasion directly

### Cultural/seasonal email copy rules (these override B2B defaults):
- **Name the occasion directly**: "Ramadan," "Iftar," "Eid Mubarak," "Diwali" — never generic "upcoming event"
- **Turnaround is the primary hook**: "48h ready" or "same-day if ordered before noon" appears in every email
- **BSAUS proof point (Ramadan/Eid only)**: "we printed for a Saskatoon student association's Iftar Night this week" — anonymous, real, converts trust
- **Community trust tone**: "serving Saskatoon's [community] community" framing — not B2B sales pitch
- **Rush fee always disclosed**: same-day +$40 flat, never implied as free
- **Annual hook in last email**: "Ramadan 2027 is 11 days earlier — files on record means zero lead time next year"
- **Personalization tokens**: `{{contact.FIRSTNAME}}` and `{{contact.COMPANY}}`

**Save HTML to:** `research/emails/drafts/[event]/email_1.html`, `email_2.html`, `email_3.html` (if applicable)

---

## STEP 3.5 — Design Concept Prompts (AI mockup generation)

Generate ChatGPT/DALL-E image prompts so prospective customers can visualize what their print piece could look like. Different design directions give options — they can pick a style or use these as conversation starters.

**Save all prompts to:** `research/emails/drafts/[event]/design_prompts.md`

**Format for each prompt:**
```markdown
## [Product] — [Design Direction Name]

**ChatGPT / DALL-E prompt:**
"[~100 word image generation prompt describing: event motifs, colour scheme,
typography style, layout, text/logo placement, product dimensions, print quality.
Always include: 'high-quality commercial print mockup, CMYK-optimized, suitable
for large-format printing, clean bleed edges, professional layout']"

**Tell the customer:**
"[1-sentence plain English description of what this design achieves and why it fits their event]"
```

### Ramadan / Eid design concept prompts to generate:

**Product 1 — Vinyl banner (2×6ft or 4×8ft)**
- Direction A — Traditional: crescent moon + star, gold Arabic calligraphy "Eid Mubarak", deep teal/navy background, hanging lantern motifs, ornate border
- Direction B — Modern minimal: clean sans-serif, white/cream on dark navy, single gold crescent accent, contemporary mosque dome silhouette at bottom
- Direction C — Community event: warm sunset gradient background, event name + details overlaid in bold white, iftar table food imagery inset

**Product 2 — Event flyer (8.5×11, double-sided)**
- Direction A — Formal invitation: floral watercolour border, elegant script font, gold text on cream (similar to BSAUS Iftar Night poster), lantern illustrations
- Direction B — Community announcement: bold typography, high-contrast, food photography (biryani, dates, dessert), clear event info hierarchy
- Direction C — Sponsorship/charity: clean grid layout, logo placeholder zones, professional sans-serif, gold + white on dark background

**Product 3 — Retractable banner (24×80")**
- Direction A — Welcome display: "Welcome to Iftar / Bienvenue à l'Iftar", organization logo space at top, warm gradient, mosque silhouette
- Direction B — Sponsor wall: repeating logo grid with event header, gold + white on dark background, professional gala style

**Always frame prompts for True Color's products:**
- "high-quality commercial print mockup, CMYK-optimized, suitable for large-format vinyl printing"
- "clean bleed edges, professional layout ready for print production"
- Include actual product dimensions in the prompt

### Other events — design motifs + palette (generate prompts when run):

| Event | Key Design Motifs | Colour Palette |
|-------|------------------|---------------|
| Diwali | Diya (oil lamp), rangoli patterns, lotus, fireworks, peacock | Deep red, gold, orange, purple, warm yellow |
| Lunar New Year | Dragon, lanterns, cherry blossom, zodiac animal of the year, lucky clouds | Red, gold, black, white |
| Vaisakhi | Wheat fields, khanda symbol, folk art patterns, Nagar Kirtan | Saffron (orange), green, royal blue |
| Navratri / Garba | Dandiya sticks, kalash, geometric folk patterns, marigold | Vibrant red, orange, green, yellow |
| Powwow | Medicine wheel, eagle feathers, geometric beadwork, dreamcatcher | Earth tones, turquoise, red, black |
| Pride | Rainbow spectrum, bold modern typography, heart motifs | Full ROYGBIV spectrum, white |
| Christmas market | Pine branches, snowflakes, warm string lights, vintage serif | Deep forest green, cranberry red, gold, cream |

---

## ⛔ VERIFICATION GATE — FULL STOP

**Do not create any Brevo templates or campaigns until the user explicitly says "proceed."**

Present this exact summary to the user and STOP:

```
✅ [N] leads scraped — [N] with email → research/leads/by_industry/[event].csv
✅ [N] emails written → research/emails/drafts/[event]/
✅ Design concept prompts saved → research/emails/drafts/[event]/design_prompts.md
✅ Landing page built → /[event-slug]-saskatoon (needs hero image + mockup links)

--- REVIEW CHECKLIST — confirm before I build anything in Brevo ---

Emails:
[ ] Subject lines feel right for this community?
[ ] Opening hook lands with urgency/relevance?
[ ] Prices are accurate (verify against current pricing CSVs)?
[ ] 48h turnaround is achievable with current shop capacity?
[ ] CTA links to correct landing page?
[ ] No cultural missteps or wording that could land wrong?

Design prompts + landing page:
[ ] Run ChatGPT prompts → generate mockup images?
[ ] Upload best mockups to /public/images/seasonal/[event]/ → link to landing page?
[ ] Landing page hero image replaced (currently placeholder)?
[ ] Landing page copy reviewed — does it speak directly to this community?

Leads:
[ ] Any mosques/temples/schools that need manual email lookup before enrolling?
[ ] Student associations checked at students.usask.ca/activities/clubs?

Tell me to proceed when you're satisfied. I won't touch Brevo until you do.
```

---

## STEP 3.7 — Build Community Landing Page

**Every seasonal campaign gets its own landing page.** Build before the verification gate so the user can review it as part of approval.

**Route:** `src/app/[event-slug]-saskatoon/page.tsx`
**Component:** `IndustryPage` (same as all other industry/SEO pages)
**Sitemap:** Add to `src/app/sitemap.ts` with `priority: 0.75`, `changeFrequency: "yearly"`

**Naming convention:**
- Ramadan/Eid: `/ramadan-eid-banners-saskatoon`
- Diwali: `/diwali-banners-saskatoon`
- Lunar New Year: `/lunar-new-year-banners-saskatoon`
- Vaisakhi: `/vaisakhi-banners-saskatoon`
- Powwow: `/powwow-banners-saskatoon`

**Page requirements:**
- `title` and `subtitle` must name the event and community directly (e.g. "Ramadan & Eid Banners — Saskatoon")
- `description` must cite: local proof point (BSAUS for Ramadan), 48h turnaround, in-house printing, local pickup
- `products[]` must match actual event needs — vinyl banners first, then event-specific (flyers, retractable)
- `whyPoints[]` must include actual prices ($90 2×6ft, $216 4×8ft etc.) — not just vague claims
- `faqs[]` must answer community-specific questions (Arabic/Urdu printing, mosque sizes, halal store flyers)
- Hero image: use nearest existing hero as placeholder, add `// TODO: replace with [event] community photo` comment
- `canonicalSlug` and `primaryProductSlug` are required

**Hero image placeholder note:** Community-specific photos are better than generic ones — once ChatGPT mockups are generated, the best visual should become the hero. Store seasonal photos in `/public/images/seasonal/[event]/`.

---

## STEP 4 — Brevo Setup (run after explicit user approval)

### Check test recipient suppression first (always):
```
mcp__brevo__contacts_get_contact_info → identifier: "info@true-color.ca"
```
Confirm: `emailBlacklisted: false` AND `statistics.unsubscriptions.adminUnsubscription` is empty.
**Default test recipient: `info@true-color.ca`** — never use hasan.sharif@exprealty.com (admin-suppressed since Jan 2026).
**Brevo returns 204 for suppressed contacts and silently drops the email — no error shown.**

### Layer 1 — Transactional templates (QA layer):

Use `mcp__brevo__transac_templates_create_smtp_template_with_sender_email` — run all creates in parallel.

- `sender_id: 1` (hardcoded — info@true-color.ca is the only verified sender, never look it up)
- `sender_name: "True Color Display Printing"`
- `sender_email: "info@true-color.ca"`
- `replyTo: "info@true-color.ca"`
- `isActive: true`
- `tag: "[event]"`
- Naming: `[ABBREV] - Email [N] - [Short Desc] (Day [N])` e.g. `RAM - Email 1 - Iftar Banners (Day 0)`

Send test emails in parallel via `mcp__brevo__transac_templates_send_test_template`:
```
emailTo: ["info@true-color.ca"]
tags: {"FIRSTNAME": "Test", "COMPANY": "Test Community Org"}
```
QA: subject renders, header #1c1712, CTA #16C2F3 and ≥44px, footer + unsubscribe, no broken tokens, mobile 375px.

### Layer 2 — Campaigns (create SUSPENDED — user activates manually):

Use `mcp__brevo__email_campaign_management_create_email_campaign` — run all creates in parallel.

- `sender_id: 1`
- `replyTo: "info@true-color.ca"`
- `recipients_lists: [16]` (Events list)
- `toField: "{{contact.FIRSTNAME}}"`
- `tags: ["[event]", "seasonal", "cold-email"]`
- `scheduledAt`: 16:00 UTC (10am CST Saskatchewan, no DST year-round), **Tue/Wed/Thu only**
  - Mon = inbox catch-up → avoid
  - Fri = pre-weekend → avoid
  - Rule: take target day → find nearest Tue/Wed/Thu on or after → schedule at 16:00 UTC

**IMMEDIATELY after creating all 3 campaigns, suspend them:**
```
mcp__brevo-campaigns__update_campaign_status → campaignId: [N], status: "suspended"
```
Run suspensions in parallel for all campaigns. This prevents auto-sending before user review.
**User must manually activate campaigns in Brevo** (Campaigns → click campaign → Schedule) after final approval.

### TC attributes on active contacts (after campaigns created):

Pull list: `mcp__brevo__lists_get_contacts_from_list → list_id: 16, limit: 500`

Filter: **only update contacts where `emailBlacklisted: false`**
- Active contacts: set `TC_SEQUENCE="[event]-[year]"`, `TC_STEP=1` (float — NOT number or integer), `TC_STATUS="active"`, `TC_ENROLLED="[today]"`
- Blacklisted contacts: set `TC_STATUS="bounced"` only — skip TC_STEP and TC_ENROLLED

### Post-Day-0 bounce audit (run after Day 0 send, before scheduling anything):

```
mcp__brevo__lists_get_contacts_from_list → list_id: 16, limit: 500
```
Filter for `emailBlacklisted: true` → set `TC_STATUS="bounced"` → mark BOUNCE in CSV → skip in all future updates.

### Exit mechanism for active contacts:

To stop a contact from future emails: remove from List 16 (`unlinkListIds`), set `TC_STATUS="replied"` or `"converted"`.

---

## STEP 5 — Annual Tagging + Next Event Pivot

1. Tag all active Brevo contacts with `[event]-annual` (e.g. `ramadan-annual`) for re-use next year
2. Update `research/outreach/OUTREACH_TRACKER.md` with:
   - Campaign template IDs
   - Campaign IDs + scheduled send dates
   - Enrolled contact count
   - Next event buying window reminder
3. Next event pivot reference:

| Completed | Next Event | Gap | Action |
|-----------|-----------|-----|--------|
| Ramadan | Eid al-Fitr | ~1 week | Already covered in Email 2 |
| Eid al-Fitr | Eid al-Adha | ~10 weeks | Note in tracker — contact `eid-annual` list ~May 10 |
| Eid al-Adha | Ramadan 2027 | ~8 months | Note in tracker — contact `eid-al-adha-annual` list ~Jan 2027 |
| Diwali | Christmas markets | ~6 weeks | Email 3 mention + log |
| Vaisakhi | Navratri | ~6 months | Log for future |
| Powwow | Next summer | ~10 months | Log for future |

---

## Product Stack Knowledge Base (baked in)

| Event | Primary Products | Secondary Products | Messaging Angle |
|-------|-----------------|-------------------|----------------|
| Ramadan / Eid al-Fitr / Eid al-Adha | Vinyl banners, flyers | Retractable banners, table signs (ACP 24×18") | Community gathering, welcoming guests, faith + dignity; BSAUS local proof |
| Diwali | Vinyl banners (red/gold/orange), flyers | Window decals, retractable | Festival décor, cultural celebration, restaurant promotion |
| Lunar New Year | Vinyl banners (red/gold), window decals, flyers | Table signs, retractable | Restaurant specials, business New Year greetings |
| Vaisakhi | Vinyl banners, flyers | Retractable banners | Nagar Kirtan procession, langar community meal |
| Navratri / Garba | Vinyl banners, flyers | Table signs | Garba night event, cultural venue signage |
| Christmas markets | Vinyl banners, flyers | Table signs, retractable | Market booth signage, church events, charity appeals |
| Powwow | Vinyl banners, flyers | Retractable banners | Entrance signage, sponsor recognition, event programs |
| Pride | Vinyl banners, flyers | Window decals | Community celebration, inclusive business signage |

**True Color pricing reference (verify against current CSVs before quoting):**
- Vinyl banners: 2×6ft $90 | 4×8ft $216 | custom sqft rates
- Flyers 250: 80lb $110 | 100lb $130
- Retractable banner (stand + print): $219 | replacement graphic only $80
- ACP sign 24×18": $72
- Same-day rush: +$40 flat, must order before noon
- Standard turnaround: 1–2 business days

---

## Ramadan 2026 — Campaign Status

**Run: 2026-03-01 | Status: SUSPENDED — awaiting user final approval**

Results from this run:
- 16 Apify queries (2 rounds, 8 each) → 42 leads → 7 with confirmed email
- Contacts added to Brevo List 16: IDs 1018–1024
- Templates created: 54 (Email 1), 55 (Email 2), 56 (Email 3)
- Campaigns created SUSPENDED: 57 (Mar 3), 58 (Mar 10), 59 (Apr 14)
- Landing page built: `/ramadan-eid-banners-saskatoon` (needs hero image)
- TC_SEQUENCE: "ramadan-2026" | TC_STEP: 1 | TC_STATUS: "active" | TC_ENROLLED: "2026-03-03"

**To activate:** User must go to Brevo → Campaigns → unsuspend 57, 58, 59 → confirm schedule.

**Mosques still needing manual email lookup (top priority):**
- saskatoonmosque.com (Prairie Muslim Association)
- islamiccenter.sk.ca (Islamic Association of SK)
- dawahcenter.ca (Saskatoon Dawah Centre)
- jrjsk.ca (Jamia Riyadhul Jannah)
- hussainiassociation.com

**Proof point to use in Email 1:** BSAUS (Bangladeshi student association, U of S) ordered Iftar Night event posters + invitations this week. Reference anonymously: "a Saskatoon student association printed Ramadan event posters with us this week."

---

## STEP 3.6 — Bake Design Concepts Into Emails

After writing the email sequence (STEP 3) and design prompts (STEP 3.5), update **Email 1** with a visual design teaser section. This is what converts cold readers into warm prospects — they can see a direction and reply "I like option B."

**Add to email_1.html** — between the pricing table and the `<!-- CTA -->` comment:

```html
<!-- Design concepts teaser -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
  <tr>
    <td style="background:#f9f4ee;border-left:4px solid #b8860b;padding:16px 20px;border-radius:4px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#1c1712;">What could your banner look like?</p>
      <p style="margin:0 0 10px;font-size:14px;color:#333333;line-height:1.6;"><strong>Traditional</strong> — [event-specific: e.g. deep navy, gold crescent, calligraphy]. Perfect for [venue type].</p>
      <p style="margin:0 0 10px;font-size:14px;color:#333333;line-height:1.6;"><strong>Modern</strong> — [event-specific: e.g. clean white, single gold crescent, bold sans-serif]. Great for [use case].</p>
      <p style="margin:0 0 12px;font-size:14px;color:#333333;line-height:1.6;"><strong>Community</strong> — [event-specific: e.g. warm gradient, event details in white]. Ideal for [event type].</p>
      <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">Tell us which direction fits — or send your existing artwork and we'll match it.</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 28px;font-size:13px;color:#555555;line-height:1.5;">
  See design directions &rarr; <a href="https://truecolorprinting.ca/[event-slug]-saskatoon" style="color:#b8860b;text-decoration:none;">truecolorprinting.ca/[event-slug]-saskatoon</a>
</p>
```

**Add to email_2.html** — one line before the product list, linking to the landing page:
```html
<p style="margin:0 0 16px;font-size:14px;color:#555555;line-height:1.5;">If you need a design, we have 3 banner directions ready — <a href="https://truecolorprinting.ca/[event-slug]-saskatoon" style="color:#16C2F3;">see examples on our [Event] print page</a>.</p>
```

**Rules:**
- Use gold `#b8860b` for the teaser link in Email 1 (supporting role, doesn't compete with main CTA)
- NO images in the teaser box — inline text only (cold email deliverability)
- `&rarr;` for arrows instead of → emoji (safe across Outlook/Gmail)
- Use `<table>` wrapper not `<div>` for Outlook compatibility

---

## STEP 6 — Self-Heal (after every seasonal campaign)

Run this after every completed campaign. Update this skill file with:
1. **Reply rate by subject line** — which subject got most replies? Note in event section
2. **New Apify queries** — which queries found leads that converted? Add to Round 1/2 list
3. **Email yield by new category** — if you scraped a new category, add to the yield table
4. **Landing page learnings** — which FAQ got clicks? Add more like it next time
5. **Design direction wins** — which direction did prospects respond to most? Note it
6. **New events** — add to STEP 0 calendar if a new cultural event comes up
7. **Append a campaign card** to `research/outreach/INDUSTRY_CAMPAIGN_PLAYBOOK.md`:

```markdown
### [Event] [Year] — Campaign Card

| Field | Value |
|-------|-------|
| Run date | [date] |
| Leads scraped | [N] total / [N] with email |
| Contacts enrolled | [N] |
| Templates | [IDs] |
| Campaigns | [IDs + dates] |
| Landing page | /[slug] |
| Email 1 open rate | [%] |
| Reply rate | [%] |
| Conversions | [N] |
| Best subject | "[subject]" |
| Best design direction | [A/B/C] |
| Next run | [date + buying window] |
```

---

## Ramadan 2026 — Full Campaign Retrospective

**Run: 2026-03-01 | Status: SUSPENDED — awaiting user final approval + ChatGPT mockup review**

### What was built this run:
- 16 Apify queries (2 rounds, 8 each) → 42 leads → 7 confirmed emails
- 3 HTML email drafts: `research/emails/drafts/ramadan/email_1.html`, `email_2.html`, `email_3.html`
- Design concept prompts (8 directions): `research/emails/drafts/ramadan/design_prompts.md`
- Design concepts baked into email_1 (teaser box) + email_2 (single link)
- 7 contacts enrolled in Brevo List 16 (IDs 1018–1024), TC_STEP=1, TC_STATUS=active
- 3 Brevo transactional templates: 54, 55, 56
- 3 campaigns SUSPENDED: 57 (Mar 3 16:00 UTC) | 58 (Mar 10 16:00 UTC) | 59 (Apr 14 16:00 UTC)
- SEO landing page deployed: `/ramadan-eid-banners-saskatoon` → commit `3cd12af` → Railway live

### Brevo activation checklist (when user is ready):
- [ ] ChatGPT mockups generated from design_prompts.md → saved to `/public/images/seasonal/ramadan/`
- [ ] Landing page hero updated (currently placeholder: sports-hero-1200x500.webp)
- [ ] Mosque emails found manually (5 websites to check — see tracker)
- [ ] User reviews email_1.html, email_2.html, email_3.html one final time
- [ ] Go Brevo → Campaigns → unsuspend 57 → confirm Mar 3 send
- [ ] Brevo → Campaigns → unsuspend 58 → confirm Mar 10 send
- [ ] Brevo → Campaigns → unsuspend 59 → confirm Apr 14 send

### Key learnings baked into this skill:
- **Mosques**: ~5% email yield from Google Maps — manual website lookup is mandatory for this segment
- **Settlement agencies**: ~90% email yield — always prioritize in Round 1 queries
- **Islamic schools**: ~80% yield — check Google Business Profile, usually has info@ email
- **Round 2 scraping always worth it**: Round 2 added 4 of 7 confirmed emails (57% of yield came from supplemental queries)
- **Design concept teaser in Email 1**: Added in this run — converts cold readers by giving them something specific to react to
- **Campaigns must be SUSPENDED on creation**: Never let campaigns auto-schedule before user approval
- **Landing page before verification gate**: Build `/[event]-saskatoon` in STEP 3.7 so user can review it as part of approval — not after
- **IndustryPage already emits FAQPage schema**: Do NOT add a second FAQPage `<script>` tag in page.tsx — it creates duplicate schema

### Mosques still needing manual email lookup:
- saskatoonmosque.com → Prairie Muslim Association
- islamiccenter.sk.ca → Islamic Association of SK
- dawahcenter.ca → Saskatoon Dawah Centre
- jrjsk.ca → Jamia Riyadhul Jannah
- hussainiassociation.com → Hussaini Association

### Proof point confirmed:
BSAUS ordered Iftar Night event posters + invitations. Use anonymously in all future Ramadan emails: "we just printed for a Saskatoon student association's Iftar Night."
