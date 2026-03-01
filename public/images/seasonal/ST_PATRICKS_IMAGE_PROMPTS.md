# St. Patrick's Day — ChatGPT Image Generation Prompts
Drop generated images in: `public/images/seasonal/st-patricks/`

## Hero Image
**Path:** `/images/seasonal/st-patricks/hero.png`
**Dimensions:** 1200×500px
**Prompt:**
> Photorealistic wide-format print shop display showing a Saskatoon Irish pub storefront. Large emerald green vinyl banner hanging above the entrance reading "St. Patrick's Day Specials — Live Music March 17". Shamrock window decals on the glass. Bright daylight. Clean, professional print quality. No text on banner (leave as decorative green). Canadian storefront architecture.

---

## Banner Design Directions (3 horizontal banner mockups, 3:1 aspect ratio)

### 1. Classic Shamrock
**Path:** `/images/seasonal/st-patricks/banner-shamrock-green.png`
**Dimensions:** 900×300px (3:1 ratio)
**Prompt:**
> Photorealistic vinyl banner mockup, horizontal 3:1 ratio. Emerald green background. Large white shamrock cluster on the left. Bold white sans-serif text: "St. Patrick's Day" large, "Specials & Live Music" smaller below. Gold Celtic border frame around edges. Grommets visible on left and right edges. Print shop quality. No faces.

### 2. Modern Bar
**Path:** `/images/seasonal/st-patricks/banner-pub-modern.png`
**Dimensions:** 900×300px
**Prompt:**
> Photorealistic vinyl banner mockup, horizontal 3:1 ratio. Dark forest green background. Minimal design. Large white text "March 17" in elegant serif font. Below: "St. Patrick's Day Event" in thin gold letters. Single small shamrock icon bottom right. Very modern, nightclub aesthetic. Grommets on edges.

### 3. Celtic Traditional
**Path:** `/images/seasonal/st-patricks/banner-celtic-traditional.png`
**Dimensions:** 900×300px
**Prompt:**
> Photorealistic vinyl banner mockup, horizontal 3:1 ratio. Deep hunter green background. Ornate Celtic knotwork border in gold. Center: vintage-style harp illustration. Text: "Celebrating St. Patrick's Day" in gold Celtic-style font. Warm, traditional Irish pub aesthetic. Grommets on edges.

---

## Window Decal Directions (square mockups, 1:1 aspect ratio)

### 1. Shamrock Cluster
**Path:** `/images/seasonal/st-patricks/decal-shamrock-cluster.png`
**Dimensions:** 600×600px
**Prompt:**
> Vinyl window decal design, square format. White background (to simulate glass). 3 large bright green shamrocks arranged as a cluster, varying sizes. Clean vector illustration style. Simple, cheerful. No text.

### 2. Event Hours Sign
**Path:** `/images/seasonal/st-patricks/decal-open-sign.png`
**Dimensions:** 600×600px
**Prompt:**
> Vinyl window decal design, square format. Bright emerald green border (3cm thick) on white background. Center text in green: "St. Patrick's Day" large at top, "Open Until Midnight" below, small shamrock divider. Clean sans-serif font. Professional print quality.

### 3. Full Window Graphic
**Path:** `/images/seasonal/st-patricks/decal-full-window.png`
**Dimensions:** 600×600px
**Prompt:**
> Vinyl window graphic design, square format. Full emerald green background. Large white shamrock taking up 70% of the space. Bottom strip: "Happy St. Patrick's Day" in white. Designed to cover an entire storefront window. Bold, eye-catching.

---

## Notes for owner
- Generate all images at 2× resolution and scale down for crispness
- After adding hero image, update `heroImage` prop in `src/app/st-patricks-day-printing-saskatoon/page.tsx` to `/images/seasonal/st-patricks/hero.png`
- Add the design direction grid section to `descriptionNode` once images are ready (copy pattern from `ramadan-eid-banners-saskatoon/page.tsx`)
