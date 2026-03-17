-- Social Studio: Add carousel + source tracking columns
-- Run in Supabase SQL editor

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
