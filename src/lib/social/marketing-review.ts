import { TRUE_COLOR_BUSINESS_PROFILE } from './generation/business-profile';
import type { GenerationChannel } from './generation-contract';

export type MarketingFinding = { code: string; message: string };
export type MarketingReview = {
  status: 'FIX' | 'REVIEW_REQUIRED';
  profileVersion: string;
  findings: MarketingFinding[];
  manualChecks: readonly string[];
};

/** Cheap editorial preflight, not image understanding or a publication approval. */
export function reviewMarketingCaption(input: {
  caption: string;
  channel: GenerationChannel;
  recentCaptions?: string[];
}): MarketingReview {
  const { caption, channel } = input;
  const findings: MarketingFinding[] = [];
  const prose = caption.replace(/#[\p{L}\p{N}_]+/gu, '').trim();
  const tags: string[] = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (!prose) findings.push({ code: 'empty', message: 'Write the product, useful purpose and relevant shop help before owner review.' });
  if (channel !== 'gbp') {
    for (const tag of TRUE_COLOR_BUSINESS_PROFILE.coreMetaHashtags) {
      if (!tags.includes(tag)) findings.push({ code: 'brand-tag', message: `Include ${tag} in this destination caption.` });
    }
  }
  if (channel === 'gbp' && tags.length) findings.push({ code: 'google-tags', message: 'Remove hashtags from Google Business Profile copy.' });
  if (tags.length > 5 || new Set(tags.map(t => t.toLowerCase())).size !== tags.length) {
    findings.push({ code: 'tag-variety', message: 'Use no more than five distinct, relevant hashtags.' });
  }
  if (!/\b(?:(?:banner|sign|display|flyer|card|poster|decal|brochure|booklet|sticker|label)s?|lettering|print(?:ing|s)?)\b/i.test(prose)) {
    findings.push({ code: 'product', message: 'Name the pictured or selected print product; generic layout advice is not enough.' });
  }
  if (!/\b(?:designer|design help|design support|artwork|order|online|we can help|we offer|we print|printing|our shop|True Color|production)\b/i.test(prose)) {
    findings.push({ code: 'service', message: 'Connect the useful product to a confirmed True Color service or a practical way to order.' });
  }
  if (/^(?:take a few steps back|one sign\. one main message|small card\. useful details|the useful details come first)/i.test(prose)) {
    findings.push({ code: 'generic-advice', message: 'Lead with the real product and its customer use, rather than an abstract design lesson.' });
  }
  const normalized = (text: string) => text.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (input.recentCaptions?.some(previous => normalized(previous) === normalized(caption))) {
    findings.push({ code: 'duplicate', message: 'This repeats recent copy. Choose a different useful angle; keep the approved brand tags.' });
  }
  return {
    status: findings.length ? 'FIX' : 'REVIEW_REQUIRED',
    profileVersion: TRUE_COLOR_BUSINESS_PROFILE.version,
    findings,
    manualChecks: [
      'Inspect the actual photo, caption and destination together: is the product and practical customer benefit immediately understandable?',
      'Confirm the service claim against the maintained profile and current catalogue; reject invented timing, results or testimonials.',
      'Compare the final image with its source at full size and phone size. Preserve every printed letter, logo, colour, photograph, QR code and physical product detail.',
      ...TRUE_COLOR_BUSINESS_PROFILE.imageRules,
      'Check natural channel copy, a useful light invitation, variation against recent creative, and explicit rights/provenance. Recheck each revision before owner approval.',
    ],
  };
}
