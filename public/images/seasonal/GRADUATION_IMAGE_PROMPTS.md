# Graduation Banners — ChatGPT Image Generation Prompts
Drop generated images in: `public/images/seasonal/graduation/`

## Hero Image
**Path:** `/images/seasonal/graduation/hero.png`
**Dimensions:** 1200×500px
**Prompt:**
> Photorealistic wide-format print shop display. A large vinyl graduation banner (4×8 ft) hanging at the entrance of a Saskatoon school gymnasium. Banner shows "Congratulations Class of 2026" in navy blue and gold on a white background with school crest silhouette. On the left, a foam board photo display on an easel. On the right, a retractable banner stand. Clean, professional setting. Bright indoor lighting.

---

## Banner Design Directions (3 horizontal banner mockups, 3:1 aspect ratio)

### 1. School Colours
**Path:** `/images/seasonal/graduation/banner-school-colors.png`
**Dimensions:** 900×300px (3:1)
**Prompt:**
> Photorealistic vinyl banner mockup, horizontal 3:1 ratio. Royal blue and gold colour scheme. Left side: circular school crest/shield silhouette in gold. Right side: large text "Class of 2026" in gold serif font. Below: "Congratulations Graduates" in white on blue background. Clean, professional graduation banner. Grommets visible on edges.

### 2. Classic Gold
**Path:** `/images/seasonal/graduation/banner-gold-classic.png`
**Dimensions:** 900×300px
**Prompt:**
> Photorealistic vinyl banner mockup, horizontal 3:1 ratio. Deep navy blue background. Centered: large gold graduation cap icon at top. Below: "Congratulations" in elegant gold serif font, large. "Class of 2026" in smaller gold italic below. Thin gold border frame. Timeless, formal convocation aesthetic. Grommets on edges.

### 3. Modern Minimal
**Path:** `/images/seasonal/graduation/banner-modern-minimal.png`
**Dimensions:** 900×300px
**Prompt:**
> Photorealistic vinyl banner mockup, horizontal 3:1 ratio. Clean white background. Single thin gold horizontal line across the center. Above the line: "Class of 2026" in large black modern sans-serif. Below the line: "Congratulations" in elegant thin serif gold. Minimal, contemporary aesthetic for upscale grad parties. Grommets on edges.

---

## Foam Board / Photo Backdrop Directions

### 1. Photo Backdrop Panel (portrait)
**Path:** `/images/seasonal/graduation/foamboard-portrait.png`
**Dimensions:** 450×600px (3:4 portrait ratio)
**Prompt:**
> Photorealistic foam board display panel, portrait orientation (24×36 inch), mounted on a tabletop easel. Navy and gold design. Top: graduation cap icon. Center: large decorative frame with space for a photo (leave frame empty/blank). Below: "Class of 2026" in gold. Clean, elegant. No actual photo inside the frame.

### 2. Step-and-Repeat Wall
**Path:** `/images/seasonal/graduation/foamboard-steprepeat.png`
**Dimensions:** 450×600px (portrait)
**Prompt:**
> Photorealistic retractable banner stand (24×80 inch vertical). Step-and-repeat pattern: alternating graduation cap icon and "2026" text in a 3-column grid on navy blue background. Gold accents. Professional photo backdrop used at graduation ceremonies. Stand hardware visible at base. No people.

---

## Notes for owner
- Generate all images at 2× resolution and scale down for crispness
- After adding hero image, update `heroImage` prop in `src/app/graduation-banners-saskatoon/page.tsx` to `/images/seasonal/graduation/hero.png`
- Add the design direction grid section to `descriptionNode` once images are ready (copy pattern from `ramadan-eid-banners-saskatoon/page.tsx`)
