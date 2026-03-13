/**
 * Industry Blitz — Type definitions
 * Maps to Supabase tables: tc_leads, tc_niche_registry, tc_campaigns, tc_email_templates
 */

export type DripStatus = "queued" | "active" | "paused" | "completed" | "bounced";

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
  created_at: string;
  updated_at: string;
}

export interface BlitzCampaign {
  id: string;
  slug: string;
  name: string;
  status: CampaignStage;
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
  created_at: string;
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
