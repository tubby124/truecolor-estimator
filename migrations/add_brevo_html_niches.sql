-- Phase 2: Per-lead Brevo HTML campaign tracking
-- Safe to run live — additive column, no locks on existing queries
-- After running: hit POST /api/staff/social/blitz/sync-brevo-lists to populate

ALTER TABLE tc_leads ADD COLUMN IF NOT EXISTS brevo_html_niches TEXT[] DEFAULT '{}';

-- GIN index for efficient array containment queries (@> operator)
CREATE INDEX IF NOT EXISTS idx_tc_leads_brevo_html_niches
  ON tc_leads USING GIN (brevo_html_niches);
