import { COMMERCE_POLICY } from '@/lib/commerce/policies';

export const SAFE_RUSH_ENQUIRY = 'Need it sooner? Ask us to confirm rush availability.';

export type BusinessFactStatus = 'owner_confirmed' | 'source_verified' | 'needs_verification' | 'missing';
export type BusinessServiceFact = {
  id: string;
  statement: string | null;
  status: BusinessFactStatus;
  provenance: { kind: 'owner_confirmation' | 'repository_source'; reference: string; checkedOn: string }[];
  useInGeneration: boolean;
  sourceText?: string;
  reviewNote?: string;
};

/** Maintained intake-shaped facts, not an intake form or another business onboarding. */
export const TRUE_COLOR_BUSINESS_PROFILE = {
  schemaVersion: 1,
  version: 'truecolor-shop-voice-v4',
  businessSlug: 'true-color',
  name: 'True Color Display Printing',
  location: 'Saskatoon',
  serviceFacts: [
    {
      id: 'onsite-graphic-designer',
      statement: 'An onsite graphic designer is available at True Color.',
      status: 'owner_confirmed',
      provenance: [{ kind: 'owner_confirmation', reference: 'Owner-confirmed business service', checkedOn: '2026-09-06' }],
      useInGeneration: true,
    },
    {
      id: 'online-ordering',
      statement: 'Standard print products can be ordered online, with artwork upload when ready.',
      status: 'source_verified',
      provenance: [{ kind: 'repository_source', reference: 'src/app/checkout/page.tsx; src/app/api/orders/route.ts; src/lib/commerce/policies.ts', checkedOn: '2026-09-06' }],
      useInGeneration: true, reviewNote: 'Do not promise that every product or order needs no conversation: rush and shipping require staff confirmation or a quote.',
    },
    {
      id: 'rush-options',
      statement: SAFE_RUSH_ENQUIRY,
      sourceText: COMMERCE_POLICY.rush.summary,
      status: 'source_verified',
      provenance: [{ kind: 'repository_source', reference: 'src/lib/commerce/policies.ts:COMMERCE_POLICY.rush; src/lib/business-info.ts:sameDayRush; data/tables/config.v1.csv:rush_fee_flat', checkedOn: '2026-09-06' }],
      useInGeneration: true, reviewNote: 'The configured fee is a production surcharge, not delivery. Numeric fees and same-day/cutoff claims need an approved trusted disclosure; do not insert them into generated prose.',
    },
    {
      id: 'standard-turnaround',
      statement: `Print production starts after ${COMMERCE_POLICY.production.startsAfter}.`,
      sourceText: COMMERCE_POLICY.production.summary,
      status: 'source_verified',
      provenance: [{ kind: 'repository_source', reference: 'src/lib/commerce/policies.ts:COMMERCE_POLICY.production', checkedOn: '2026-09-06' }],
      useInGeneration: true, reviewNote: 'The current numerical window remains in the canonical policy. Numeric timing is not allowed in generated prose and needs a separately approved trusted disclosure.',
    },
    {
      id: 'design-fee-and-proof-timing', statement: null, status: 'missing', provenance: [],
      useInGeneration: false, reviewNote: 'Onsite designer availability does not establish a design fee, included design work or a proof deadline for this caption profile.',
    },
  ] satisfies BusinessServiceFact[],
  rotatingServiceIds: ['onsite-graphic-designer', 'online-ordering', 'rush-options', 'standard-turnaround'],
  coreMetaHashtags: ['#TrueColorPrinting', '#SaskatoonPrintShop'],
  voice: 'Friendly, casual shop language. Lead with the pictured or selected print product and a practical customer use. Explain a specific relevant benefit, then connect it to a confirmed shop service or a light invitation when useful. Reject generic design lectures disconnected from the product or its use. Vary openings; no corporate filler. A showcase may omit prices.',
  voiceExamples: [
    'A banner can help visitors find the event entrance. Tell us where yours will hang and what it needs to say.',
    'Need help with the artwork for your display? An onsite graphic designer is available at True Color.',
  ],
  avoid: ['Generic design lectures', 'Invented customer stories or results', 'Unverified service fees or turnaround', 'Manufactured urgency', 'Corporate filler', 'Repeated openings and service messages'],
  imageRules: [
    'Preserve exact printed artwork, lettering, logos, colours and layout; never invent or repair unreadable detail.',
    'Mix clean studio treatments with authentic finished-product, workshop and installation photos across the month. Use a neutral studio background when it improves product clarity; preserve shape, proportions and artwork exactly.',
    'Keep an original that is already clean, complete and readable; a style preference alone is not a reason to regenerate it.',
    'Keep useful installation context for window graphics, vehicle graphics and mounted signs; do not extract away the setting that demonstrates their use.',
    'Hold a studio treatment when the product is cropped, obscured or too unclear to preserve. Obtain a complete source instead of inventing edges or printed detail.',
    'Record KEEP, REVISE or HOLD with the observed reason before editing. REVISE authorizes a candidate for review, never automatic acceptance; independently compare the candidate with the immutable original.',
    'Process photos retain their authentic scene with minimal cleanup; captions never authorize image edits.',
    'Label generated backgrounds as staged. Hold any output with changed lettering, QR codes, printed photographs, artwork colours or invented detail, even if the backdrop looks better.',
    'Social rights and privacy need explicit evidence. A public website image is not social-use permission.',
    'Use only visible or source-confirmed product detail; do not infer material, order price, customer endorsement or job history.',
  ],
  imagePolicyProvenance: { kind: 'owner_confirmation', reference: 'Owner preference for clean studio backgrounds on finished products and authentic process photographs', checkedOn: '2026-09-06' },
} as const;

export function generationServiceFacts() {
  return TRUE_COLOR_BUSINESS_PROFILE.serviceFacts.filter(fact =>
    fact.useInGeneration && fact.statement && (fact.status === 'owner_confirmed' || fact.status === 'source_verified'),
  );
}
