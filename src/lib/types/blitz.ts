/**
 * Industry Blitz — Type definitions
 * Maps to Supabase tables: tc_leads, tc_niche_registry, tc_campaigns, tc_email_templates
 */

export type DripStatus = "queued" | "active" | "paused" | "completed" | "bounced" | "unsubscribed";

export type CampaignStage = "draft" | "canary" | "ramping" | "active" | "paused" | "completed";

export interface BlitzLead {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  province: string;
  address: string | null;
  industry_tags: string[];
  business_type: string | null;
  score: number;
  rating: number | null;
  review_count: number | null;
  // Drip columns
  drip_status: DripStatus | null;
  drip_step: number | null;
  drip_niche: string | null;
  drip_variant: string | null;
  drip_enrolled_at: string | null;
  next_email_at: string | null;
  last_brevo_message_id: string | null;
  // Engagement
  emails_sent: number | null;
  emails_opened: number | null;
  emails_clicked: number | null;
  last_opened_at: string | null;
  last_clicked_at: string | null;
  // Manual outreach
  manual_outreach_ready: boolean | null;
  manual_outreach_at: string | null;
  // Validation
  email_validated: boolean | null;
  email_validation_result: string | null;
  validation_status: 'valid' | 'risky' | 'invalid' | 'catch_all' | 'unknown' | null;
  unsubscribed_at: string | null;
  last_sent_at: string | null;
  // Segmentation
  segment: 'full' | 'partner' | 'short' | 'suppress' | null;
  email_route: 'core_buyer' | 'supplier' | 'borderline' | null;
  engagement_state: 'none' | 'opened' | 'clicked' | 'replied';
  priority_tier: 1 | 2 | 3 | null;
  suppression_reason: string | null;
  // Meta
  is_customer: boolean | null;
  status: string;
  first_added: string | null;
  last_updated: string | null;
}

export interface BlitzNiche {
  id: string;
  niche_slug: string;
  display_name: string;
  search_terms: string[];
  has_landing_page: boolean;
  has_campaign: boolean;
  lead_count: number;
  priority: number;
  gbp_posts_generated: boolean;
  landing_page_slug: string | null;
  google_categories: string[];
  image_prompts: { id: string; name: string; category: string; prompt: string; imagePath: string }[] | null;
  created_at: string;
  updated_at: string;
}

export interface BlitzCampaign {
  id: string;
  slug: string;
  name: string;
  status: CampaignStage;
  niche_slug: string | null;
  total_enrolled: number | null;
  total_sent: number | null;
  total_bounced: number | null;
  bounce_rate: number | null;
  apify_run_ids: string[];
  apify_dataset_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface BlitzTemplate {
  id: string;
  niche_slug: string;
  step: number;
  brevo_template_id: number;
  subject: string | null;
  wait_days: number;
  sequence_version: number;
  sequence_type: 'full' | 'partner' | 'short';
  subject_bucket: 'operational' | 'asset_based' | 'local_speed' | 'soft_cta' | 'breakup' | null;
  created_at: string;
}

export interface BrevoHtmlCampaign {
  id: number;
  name: string;
  status: "sent" | "scheduled" | "draft";
  sentDate: string | null;
  scheduledAt: string | null;
  stats: {
    sent: number;
    delivered: number;
    uniqueOpens: number;
    clicks: number;
  };
}

export interface BrevoHtmlNicheStep {
  day: number;
  status: "sent" | "scheduled";
  date: string | null;
  openRate: number | null;
}

export interface BrevoHtmlNicheGroup {
  nicheSlug: string;
  displayName: string;
  steps: BrevoHtmlNicheStep[];
  nextTouchpoint: string | null;
  htmlContactedCount: number;
}

export interface BlitzStats {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  bouncedLeads: number;
  pausedLeads: number;
  nichesLive: number;
  lastEngineRun: string | null;
}
