/**
 * True Color Social Studio — Type definitions
 * Used across all /staff/social routes and components
 */

export type PostStatus = 'draft' | 'ready' | 'posting' | 'posted' | 'failed' | 'skip';
export type Platform = 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'gbp';
export type PostType = 'launch' | 'mid' | 'last-call';
export type CampaignStatus = 'planned' | 'in-progress' | 'complete' | 'archived';

export interface SocialCampaign {
  id: string;
  slug: string;
  name: string;
  campaign_color: string;
  event_date: string | null;
  build_by: string | null;
  brevo_list_id: number | null;
  brevo_campaign_ids: number[];
  landing_page_slug: string | null;
  status: CampaignStatus;
  gbp_posts_total: number;
  gbp_posts_done: number;
  lead_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Derived (from join)
  post_count?: number;
  posts_ready?: number;
  posts_posted?: number;
}

export interface SocialPost {
  business_id?: string;
  approval_version?: number | null;
  caption_gbp?: string | null;
  fact_fingerprint?: string | null;
  product_slug?: string | null;
  product_configuration?: Record<string, unknown> | null;
  offer_id?: string | null;
  batch_id?: string | null;
  creative_id?: string | null;
  generation_job_id?: string | null;
  gbp_payload?: GbpPostPayload | null;
  approved_media_sha256?: string | null;
  approved_rights?: boolean | null;
  approval_hash?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  approval_target?: { platform: 'instagram' | 'facebook' | 'gbp'; accountId: string; pageId: string } | null;
  id: string;
  campaign_id: string | null;
  caption_raw: string;
  caption_instagram: string | null;
  caption_facebook: string | null;
  caption_twitter: string | null;
  hashtags: string | null;
  image_url: string | null;
  image_urls: string[];
  source: 'manual' | 'gbp' | 'image-prompt' | 'skill' | 'batch';
  alt_text: string | null;
  platforms: Platform[];
  schedule_date: string | null;
  schedule_time: string | null;
  use_next_free_slot: boolean;
  status: PostStatus;
  post_type: PostType | null;
  post_number: number | null;
  posted_at: string | null;
  blotato_submission_id: string | null;
  post_public_url: string | null;
  error_message: string | null;
  gbp_post_done: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  campaign?: SocialCampaign | null;
  results?: SocialPostResult[];
}

export interface SocialPostResult {
  id: string;
  post_id: string;
  platform: Platform;
  blotato_submission_id: string | null;
  status: 'in-progress' | 'published' | 'failed';
  public_url: string | null;
  error_message: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  account_name: string | null;
  blotato_account_id: string | null;
  blotato_page_id: string | null;
  is_active: boolean;
  connected_at: string;
}

// API request/response types

export interface CreatePostBody {
  caption_gbp?: string;
  fact_fingerprint?: string;
  product_slug?: string;
  product_configuration?: Record<string, unknown>;
  offer_id?: string;
  generation_job_id?: string;
  gbp_payload?: GbpPostPayload;
  campaign_id?: string | null;
  caption_raw: string;
  caption_instagram?: string;
  caption_facebook?: string;
  caption_twitter?: string;
  hashtags?: string;
  image_url?: string;
  image_urls?: string[];
  source?: string;
  alt_text?: string;
  platforms?: Platform[];
  schedule_date?: string;
  schedule_time?: string;
  use_next_free_slot?: boolean;
  status?: PostStatus;
  post_type?: PostType;
  post_number?: number;
  notes?: string;
}

export interface CaptionRewriteBody {
  caption_raw?: string;       // existing caption to rewrite (optional when image/topic provided)
  campaign_slug?: string;
  image_base64?: string;      // base64-encoded image (no data:... prefix) for vision generation
  image_type?: string;        // MIME type e.g. 'image/jpeg'
  topic?: string;             // free-form topic when no caption and no image
}

export interface CaptionRewriteResponse {
  instagram: string;
  facebook: string;
  twitter: string;
  hashtags?: string;  // post-specific hashtag string from AI
  angle?: string;     // AI's one-sentence marketing strategy note
  alt_text?: string;
}

// N8N webhook payload
export interface N8nWebhookPayload {
  post_id: string;
  platform: Platform;
  status: 'published' | 'failed';
  public_url?: string;
  error_message?: string;
  blotato_submission_id?: string;
}

// Hashtag template per campaign
export interface HashtagTemplate {
  local: string[];      // #Saskatoon #SaskatoonBusiness #SaskatoonPrinting #YXE
  product: string[];    // #VinylBanners #PrintShop etc
  seasonal: string[];   // event-specific
  audience: string[];   // target buyer type
}

export interface GbpDate { year: number; month: number; day: number }
export interface GbpPostPayload {
  topicType: 'STANDARD' | 'OFFER';
  languageCode?: string;
  callToAction?: { actionType: 'LEARN_MORE'; url: string };
  event?: { title: string; schedule: { startDate: GbpDate; endDate: GbpDate; startTime?: { hours: number; minutes: number }; endTime?: { hours: number; minutes: number } } };
  offer?: { couponCode?: string; redeemOnlineUrl?: string; termsConditions?: string };
}
