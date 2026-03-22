# Plan: Social Studio Full Build-Out

## Context

The Social Studio (`/staff/social`) has working pieces — Compose wizard, GBP page, image-prompts page, calendar, queue — but they don't connect. GBP posts and skill-generated images can't flow into the social queue. Compose Step 3 is just a URL text box (no upload/library). No carousel support. Skills (`/truecolor-page`, `/gmb-update`) generate images but never feed the queue. Goal: one system where all content flows into the same calendar and publishes via Blotato.

## Research Findings (Resolved)

| Question | Answer | Source |
|----------|--------|--------|
| Blotato carousel? | YES — `mediaUrls` array supports multiple images on IG, FB, Twitter, TikTok, Pinterest | Perplexity + existing code |
| Blotato API format | `{ post: { accountId, content: { text, mediaUrls: [...], platform }, target }, scheduledTime? }` | publish/route.ts lines 164-175 |
| Rate limits | 30 req/min posts, 10 req/min media uploads, 1GB/file | Blotato docs |
| Instagram image formats | JPG + PNG only — NO WebP | Meta docs |
| IG carousel limits | 2-10 images per carousel, 1:1 ratio recommended (1080x1080), 30MB/image | Meta docs |
| Blotato activation status | Publish route + accounts sync route fully built — only missing `BLOTATO_API_KEY` env var value | Codebase verified |
| `mediaType: "reel"` bug | Publish route hardcodes `mediaType: "reel"` for IG/FB — must be conditional: "reel" for video, omit or "post" for image | publish/route.ts line 148-150 |

## What Already Exists (reuse everything)

| Asset | Path | Status |
|-------|------|--------|
| SocialPost type | `src/lib/types/social.ts` | Has `image_url: string \| null` — add `image_urls`, `source`, `alt_text` |
| Upload API | `src/app/api/staff/social/upload/route.ts` | Working — bucket `social-images`, returns public URL |
| Caption AI | `src/app/api/staff/social/captions/route.ts` | Working — OpenRouter claude-sonnet-4-6, vision-capable |
| CaptionRewriter | `src/components/social/CaptionRewriter.tsx` | Working — drag/drop, compress, upload, AI rewrite |
| Caption prompts | `src/lib/data/social-hashtags.ts` | `TC_VOICE_PROMPT`, `TC_GENERATE_FROM_IMAGE_PROMPT`, `TC_GENERATE_FROM_TOPIC_PROMPT` |
| ComposeForm | `src/components/social/ComposeForm.tsx` | Step 3 = URL text input (line 308-332), Step 5 = inline IG preview (line 418-443) |
| BatchScheduler | `src/components/social/BatchScheduler.tsx` | `spreadSchedule()` exported — Mon/Wed/Fri spread |
| GBPPostCard | `src/components/social/GBPPostCard.tsx` | Has copy buttons — no "Send to Social" yet |
| ImagePromptCard | `src/components/social/ImagePromptCard.tsx` | Copy button only — no queue button |
| PostQueueTable | `src/components/social/PostQueueTable.tsx` | Tab filter, realtime, **already has 48x48 image thumbnails** — needs duplicate + batch actions |
| CalendarGrid | `src/components/social/CalendarGrid.tsx` | Month view only — no year view |
| Posts API | `src/app/api/staff/social/posts/route.ts` | GET (filtered) + POST (`CreatePostBody`) — extend, don't duplicate |
| Posts CRUD | `src/app/api/staff/social/posts/[id]/route.ts` | PATCH + DELETE — already used by PostQueueTable |
| Publish API | `src/app/api/staff/social/posts/[id]/publish/route.ts` | Full Blotato direct publish + n8n fallback — needs mediaType fix |
| Accounts sync | `src/app/api/staff/social/accounts/route.ts` | Syncs from Blotato API on GET |

## Prerequisites (before Wave 1)

- `npm install sharp` — adds server-side image processing (~25MB native dep, increases build time slightly)
- `BLOTATO_API_KEY` must be set in Railway env vars before testing Wave 5 (publish). Get from blotato.com Settings.

## Data Model Decision: `image_url` vs `image_urls`

**Strategy: `image_urls` is the canonical source. `image_url` is deprecated/legacy.**

- All **writes** set both: `image_url = urls[0]`, `image_urls = urls`
- All **new reads** use `image_urls` (falling back to `[image_url]` if `image_urls` is empty for old rows)
- Backfill migration copies existing `image_url` values into `image_urls[0]`
- `image_url` column stays (no schema break) but is never the primary read path

---

## Phase 1 — DB + Types + Image Foundation

### 1a. Migration (`migrations/add_social_image_carousel.sql`)

```sql
-- Add carousel + source tracking columns
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS alt_text TEXT;
-- source: 'manual' | 'gbp' | 'image-prompt' | 'skill' | 'batch'

-- Backfill: copy existing image_url into image_urls[0]
UPDATE social_posts
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_url != ''
  AND (image_urls IS NULL OR image_urls = '{}');

-- Storage policy for listing files in social-images bucket
CREATE POLICY "Allow authenticated listing"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'social-images');
```

### 1b. Update types (`src/lib/types/social.ts`)

Add to `SocialPost`:
```ts
image_urls: string[];
source: 'manual' | 'gbp' | 'image-prompt' | 'skill' | 'batch';
alt_text: string | null;
```

Add to `CreatePostBody`:
```ts
image_urls?: string[];
source?: string;
alt_text?: string;
```

### 1c. New `ImagePicker` component (`src/components/social/ImagePicker.tsx`)

Three tabs:

1. **Upload** — drag/drop or file picker -> `POST /api/staff/social/upload` -> Supabase public URL. Multi-file for carousel. Server auto-converts WebP/HEIC to JPEG (Phase 1d). Client never worries about format.
2. **Library** — grid from `social-images` bucket via new GET route. Click to select/deselect.
3. **Paste URL** — current flow, kept as a tab.

Props: `value: string[]`, `onChange: (urls: string[]) => void`, `maxImages?: number` (default 10)

Warnings:
- Aspect ratio outside 1:1 / 4:5 / 1.91:1 -> "Instagram may crop this image" (uses `width`/`height` from upload response)
- File > 30MB -> block upload with error

### 1d. Upgrade upload route (`src/app/api/staff/social/upload/route.ts`)

Add server-side image processing using Sharp:

1. Read uploaded file into buffer
2. Detect format — if WebP or HEIC, convert to JPEG
3. Resize images wider than 1080px to 1080px (maintain aspect ratio)
4. Compress to quality 85
5. Strip EXIF metadata (privacy — no GPS coords from phone photos)
6. **Determine final extension AFTER conversion** (not from original filename):
   - If converted from WebP -> ext = `jpg`, contentType = `image/jpeg`
   - If PNG -> keep as PNG (no lossy conversion)
   - If already JPEG -> keep as JPEG
7. Build path: `social/{year}/{uuid}.{final_ext}`
8. Return `{ url, width, height, format }` (width/height enable client-side ratio warnings in ImagePicker)

### 1e. New `GET /api/staff/social/images` route

- `requireStaffUser()` (mandatory)
- Lists files in `social-images` Supabase bucket
- Returns `{ images: [{ url, name, created_at }] }`
- Uses `createServiceClient()` (server-side only)

### 1f. Fix publish route mediaType bug (`posts/[id]/publish/route.ts`)

Lines 146-162: Change from hardcoded `mediaType: "reel"` to conditional:

- If `image_url` ends with video extension (`.mp4`, `.mov`, `.webm`) -> `mediaType: "reel"`
- Otherwise -> omit `mediaType` (Blotato auto-detects image posts)

Update `mediaUrls` to use: `post.image_urls?.length ? post.image_urls : (post.image_url ? [post.image_url] : [])`

Also update the n8n fallback path (lines 82-93): no media changes needed there (it just marks as "ready"), but add a comment noting `image_urls` is now the canonical field.

---

## Phase 2 — Post Preview + Compose Upgrades

### 2a. New `PostPreview` component (`src/components/social/PostPreview.tsx`)

Platform tabs: Instagram | Facebook

- **IG mockup:** phone frame, avatar "truecolorprinting" + location, image (carousel dots if multiple), caption, hashtags (first comment style), like/comment/share icons
- **FB mockup:** page name + avatar, image, caption + "See more", reactions bar
- Character count bar per platform: IG 2,200 / FB 63,000 / Twitter 280 — yellow at 90%, red at 100%

Extract existing IG preview from ComposeForm lines 418-443 into this component. Accept props: `imageUrls: string[]`, `caption: string`, `hashtags?: string`, `platform: 'instagram' | 'facebook'`

### 2b. Upgrade ComposeForm Step 3

Replace `<input type="url">` (lines 308-332) with `<ImagePicker>`

- `imageUrl` state (line 68) -> `imageUrls: string[]`
- Backwards compat in `handleSave`: `image_url = imageUrls[0]`, `image_urls = imageUrls`

### 2c. Upgrade ComposeForm Step 5

Replace inline IG preview (lines 418-443) with `<PostPreview>` showing IG + FB tabs.

### 2d. Update Posts API (`posts/route.ts`)

Accept `image_urls` array + `source` + `alt_text` fields in POST handler.
Write both `image_url` (first item) and `image_urls` (full array) to DB.
No new route needed — extend existing POST.

### 2e. Alt text auto-generation in captions API (`captions/route.ts`)

When `image_base64` is provided, add to the AI prompt: "Also return an `alt_text` field: a concise, descriptive alt text for this image (under 125 chars, no hashtags, describe what's physically in the image for screen readers)."

Add `alt_text?: string` to `CaptionRewriteResponse`.

Flows into SendToSocialModal and ComposeForm as an editable field.
Published to Blotato (if their API supports alt text) and stored in DB.

---

## Phase 3 — GBP -> Social Queue Connection

### 3a. New `SendToSocialModal` component (`src/components/social/SendToSocialModal.tsx`)

Lightweight modal (stays on current page). Pre-fills from any source:

- **Image:** URL (GBP paths converted via `toPublicUrl()` helper)
- **Caption:** editable textarea. **"Generate Caption" button** calls captions API directly (does NOT embed full CaptionRewriter — too heavy for a modal). Auto-triggers ONLY when `caption_raw` is empty. If pre-filled, show existing text with "Regenerate" button.
- **Campaign:** auto-linked if source data includes `campaign_id`. Dropdown to override.
- **Platforms:** IG + FB toggleable
- **Date + time:** editable, defaults to source's date @ 9:00 AM
- **Alt text:** editable field, pre-filled from AI if image was vision-analyzed
- **Preview:** `<PostPreview>` showing current IG/FB captions with character counts

Two actions: "Save Draft" | "Mark Ready"

On save: POST to existing `/api/staff/social/posts` with `source` field -> toast "Added to queue" -> modal closes.

### 3b. `toPublicUrl()` helper (`src/lib/utils/social.ts`)

```ts
export function toPublicUrl(imagePath: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://truecolorprinting.ca';
  const cleaned = imagePath.replace(/^public\//, '');
  return `${siteUrl}/${cleaned}`;
}
```

### 3c. Add "-> Social Queue" button to GBPPostCard

`GBPPostCard.tsx` — opens `SendToSocialModal` with GBP post data (title, description, imagePath converted via `toPublicUrl()`).

### 3d. Add "-> Queue" button to ImagePromptCard

`ImagePromptCard.tsx` — shows button when image URL is present. Opens `SendToSocialModal`.

### 3e. Add duplicate + batch actions to PostQueueTable

`PostQueueTable.tsx`:

- ~~Thumbnail~~ (already exists — 48x48 at lines 190-202, no changes needed)
- **Duplicate button:** per-row action -> copies post data, clears date, saves as new draft. One-click for recurring content.
- **Batch status update:** checkbox per row + bulk action bar ("Mark Ready" / "Mark Draft" / "Delete"). Uses existing PATCH endpoint per selected post (loop client-side).

---

## Phase 4 — Calendar + Mobile Upload

### 4a. CalendarGrid 3-month view toggle

`CalendarGrid.tsx`:

- Toggle button: "Month" <-> "Quarter" (3-month rolling view)
- Quarter view: 3 months side-by-side, each showing Mon/Wed/Fri posting slots
- Empty Mon/Wed/Fri slots show "+" button -> opens `SendToSocialModal` with date pre-filled
- NO drag-to-reschedule (too complex for ROI — defer)
- NO full year view (52-week grid is too much UI work for the value — quarter view covers gap identification)

### 4b. Mobile upload shortcut page (`src/app/staff/social/upload/page.tsx`)

Minimal page under `/staff/` (middleware handles auth). `ImagePicker` upload tab + "Save to Library" button. Staff opens on phone at the shop -> snap photo -> uploads to Supabase (auto-converted to JPEG, resized to 1080px). Appears in Library tab next compose.

### 4c. Quick-post flow on mobile upload page

After upload completes, show "Create Post from This?" button:

- Tapping it sends the uploaded image to captions API (vision mode) -> auto-generates caption + alt text
- Pre-fills `SendToSocialModal` with image + AI caption + "draft" status
- One-tap flow: snap -> upload -> AI caption -> save draft. Entire shop-floor workflow in 3 taps.

---

## Phase 5 — Publish Enhancements

**Prerequisite:** `BLOTATO_API_KEY` must be set in Railway before testing this phase.

### 5a. First-comment hashtags in publish route

`publish/route.ts`: If post has hashtags and platform is Instagram, send hashtags as `firstComment` in Blotato payload (if Blotato supports it — test first, fall back to appending to caption if unsupported). Best practice: hashtags in first comment, not caption body.

### 5b. Failure email notification

`publish/route.ts`: After polling, if `finalStatus === "failed"`:

- POST to Brevo transactional API (reuse `src/lib/email/smtp.ts`) with:
  - To: `STAFF_EMAIL` env var
  - Subject: "Social post failed: {caption preview}"
  - Body: platform, error message, link to `/staff/social/queue`
- Catches failures that happen at 9 AM when nobody is watching the dashboard

---

## Phase 6 — Skills Integration

### 6a. `/truecolor-page` skill hook

After generating + uploading an image, POST to `/api/staff/social/posts`:

```json
{
  "source": "skill",
  "caption_raw": "{niche} — {product} printing in Saskatoon from $X/sqft",
  "image_url": "{supabase public URL}",
  "image_urls": ["{supabase public URL}"],
  "platforms": ["instagram", "facebook"],
  "status": "draft"
}
```

Add as post-deploy step in `~/.claude/skills/truecolor-page/SKILL.md`.

### 6b. `/gmb-update` skill hook

Same pattern — after GBP image generation, push draft to queue via posts API.

---

## Phase 7 — Pages Tab (Existing Landing Pages -> Social)

### 7a. Pages tab (`src/app/staff/social/pages/page.tsx`)

Lists all active landing pages (pulled from `sitemap.ts` static data). Each card shows: slug, title, OG image thumbnail, last social post date. Button: "Create Post from This Page" -> opens `SendToSocialModal` with topic = page title + target keyword. Caption generated via captions API using `TC_GENERATE_FROM_TOPIC_PROMPT`.

---

## Build Order (Parallelizable Waves)

### Wave 1 (independent — parallel agents)

| Task | Files | Agent |
|------|-------|-------|
| 1a Migration | SQL file | Manual (Supabase SQL editor) |
| 1b Types | `social.ts` | Agent A |
| 1c ImagePicker | New component | Agent B |
| 2a PostPreview | New component | Agent C |

**Prerequisite:** `npm install sharp` before Wave 2.

### Wave 2 (depends on Wave 1)

| Task | Files | Agent |
|------|-------|-------|
| 1d Upload route upgrade (Sharp) | `upload/route.ts` | Agent A |
| 1e Images API | New route | Agent A |
| 1f Publish fix (mediaType + image_urls) | `publish/route.ts` | Agent A |
| 2b ComposeForm Step 3 | `ComposeForm.tsx` | Agent B (after ImagePicker) |
| 2c ComposeForm Step 5 | `ComposeForm.tsx` | Agent B (after PostPreview) |
| 2d Posts API (image_urls + source + alt_text) | `posts/route.ts` | Agent A |
| 2e Alt text in captions API | `captions/route.ts` | Agent A |

### Wave 3 (depends on Wave 2)

| Task | Files | Agent |
|------|-------|-------|
| 3a SendToSocialModal | New component | Agent A |
| 3b toPublicUrl | New utility | Agent A |
| 3e PostQueueTable (duplicate + batch) | Existing component | Agent B |

### Wave 4 (depends on Wave 3)

| Task | Files | Agent |
|------|-------|-------|
| 3c GBPPostCard button | Existing component | Agent A |
| 3d ImagePromptCard button | Existing component | Agent A |
| 4a CalendarGrid quarter view | Existing component | Agent B |
| 4b+4c Mobile upload + quick-post page | New page | Agent B |

### Wave 5 (depends on Wave 4)

**Prerequisite:** `BLOTATO_API_KEY` in Railway.

| Task | Files | Agent |
|------|-------|-------|
| 5a First-comment hashtags | `publish/route.ts` | Agent A |
| 5b Failure email notification | `publish/route.ts` | Agent A |
| 6a truecolor-page skill hook | Skill `.md` file | Agent B |
| 6b gmb-update skill hook | Skill `.md` file | Agent B |

### Wave 6 (independent)

| Task | Files |
|------|-------|
| 7a Pages tab | New page |

**`npm run build` + verify after each wave.**

---

## What Was Cut

| Item | Why |
|------|-----|
| "Site Images" tab (4th tab in ImagePicker) | No static manifest exists — maintenance burden for low value |
| Calendar drag-to-reschedule | Complex native DnD across day slots — low ROI vs clicking the post |
| Full year view (52-week grid) | Too much UI for the value — quarter view covers gap identification |
| Bulk AI Generate | 39+ OpenRouter calls for a quarter — add later with cost confirmation |
| `from-source` API route | Duplicate of existing POST `/posts` — just extend it with `source` + `image_urls` |
| n8n carousel fix | Direct Blotato publish handles it — n8n is fallback only |
| In-browser image cropping | Photoshop exists in-house, over-engineering |
| Video/Reels upload flow | Separate project — current system handles images |
| Analytics/engagement polling | Depends on Blotato engagement API — unknown, defer |
| Content recycling / evergreen queue | Nice but not blocking core flow |
| PostQueueTable thumbnail task | Already exists (lines 190-202) — no changes needed |

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Blotato carousel silently fails on one platform | Medium | Test with 2 images per platform before shipping. Store `image_urls` in DB regardless — if Blotato sends only `[0]`, data isn't lost |
| `mediaType: "reel"` sends image as video | High | Fix in Phase 1f — omit `mediaType` for image posts (Blotato auto-detects) |
| WebP rejected by Instagram | Eliminated | Server auto-converts WebP -> JPEG on upload (Phase 1d). Extension determined AFTER conversion, not from filename. |
| Facebook `pageId` empty until Blotato connected | Medium | SendToSocialModal + ComposeForm check `social_accounts` on open. Show banner: "Connect Facebook in Settings first" |
| Supabase bucket listing requires policy | Low | Migration 1a includes `CREATE POLICY ON storage.objects` for authenticated listing |
| Instagram aspect ratio cropping | Low | ImagePicker detects ratio from upload response `{ width, height }`, shows warning. Informational only |
| Sharp not available on Railway | Low | Sharp is a common Node.js native dep. If unavailable, fall back to passing through without conversion (graceful degradation) |
| Blotato firstComment unsupported | Low | Test in Phase 5a. If unsupported, append hashtags to caption body (current behavior). No data loss |
| Brevo transactional email for failure alerts | Low | Already integrated for order emails. Reuse `src/lib/email/smtp.ts` send function |
| `image_url` vs `image_urls` confusion | Low | Documented above: `image_urls` is canonical, `image_url` is legacy. All writes set both. All reads use `image_urls` with `[image_url]` fallback. |

---

## Verification

1. Run migration in Supabase SQL editor — verify backfill populated `image_urls` for existing posts
2. `npm run build` after each wave
3. Test upload: upload JPG (passes through), upload WebP (auto-converts to JPEG — verify `.jpg` extension in storage path), upload PNG (passes through), verify dimensions capped at 1080px
4. Test ImagePicker: multi-select for carousel, library tab loads existing images
5. Test alt text: upload image -> captions API returns `alt_text` alongside captions
6. Test PostPreview: character count bar shows yellow/red at limits, carousel dots for multiple images
7. Test SendToSocialModal: open from GBP card, verify campaign auto-linked, "Generate Caption" button works, save as draft, check queue
8. Test ComposeForm: full 5-step flow with ImagePicker replacing URL input
9. Test queue: duplicate button creates copy, batch select + "Mark Ready" works
10. Test publish: set `BLOTATO_API_KEY`, publish single-image post, then carousel, then verify first-comment hashtag
11. Test failure notification: simulate failed publish, verify email sent to `STAFF_EMAIL`
12. Test mobile upload: open `/staff/social/upload` on phone, snap photo, verify auto-convert + correct extension, "Create Post" flow generates AI caption
13. Test calendar quarter view: verify Mon/Wed/Fri slots, "+" button opens modal with correct date
14. `npm run test` — existing 47 tests should still pass
