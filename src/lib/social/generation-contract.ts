/** Browser-safe caption generation contract. Prices always come from the server resolver. */
import type { ProductFacts, ProductFactsConfiguration } from '@/lib/pricing/product-facts';
export const GENERATION_CHANNELS = ['instagram', 'facebook', 'gbp'] as const;
export type GenerationChannel = typeof GENERATION_CHANNELS[number];
export interface GenerationInput {
  requestId: string;
  selectedChannels: GenerationChannel[];
  productSlug?: string;
  configuration?: ProductFactsConfiguration;
  includePrice?: boolean;
  caption_raw?: string;
  topic?: string;
  campaign_slug?: string;
  image_base64?: string;
  image_type?: string;
  angle?: string;
  /** Explicitly start a new attempt for missing channels of a terminal partial job. */
  resumeJobId?: string;
}
export interface GenerationUsage {
  calls: number;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
  provider: string;
  model: string;
  providerRequestIds: string[];
}
export interface GenerationObservation { description: string; alt_text: string; readable: boolean }
export interface GenerationResponse {
  jobId: string;
  status: 'running' | 'completed' | 'partial' | 'held' | 'failed';
  drafts: Partial<Record<GenerationChannel, string>>;
  facts: ProductFacts | null;
  cacheHit: boolean;
  usage: GenerationUsage;
  errors: string[];
  hashtags: string;
  hashtagEvidence: { kind: 'researched' | 'generic'; researchedAt: string | null; sources: string[] };
  observation?: GenerationObservation;
  /** Explicit compatibility adapter: X generation is retired. */
  instagram: string;
  facebook: string;
  gbp: string;
  twitter: '';
  alt_text: string;
  angle: string;
}
export interface GenerationSettings {
  dailyCallLimit: number;
  dailyUsdLimit: number | null;
  maxCostPerCallUsd: number | null;
  usedCalls: number;
  reservedCalls: number;
  usedUsd: number;
  reservedUsd: number;
  configured: boolean;
  providerReady: boolean;
  model: string;
}
