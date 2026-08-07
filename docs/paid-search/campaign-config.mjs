import { approvedClaims as sourcedApprovedClaims } from "./approved-claims.mjs";

const ROOT = "https://truecolorprinting.ca";

// ─── VARIANT A (legacy, LIVE, policy-APPROVED — DO NOT EDIT) ─────────────────
// Written under the old contract, which banned every number from ad copy. Kept byte-identical
// because these 20 RSAs are serving right now; they are the control arm against variant B.
// Their weaknesses are known and deliberate: 10 of 15 headlines are shared across every ad
// group (collapsing Ad Relevance), and every line describes the website's checkout UI rather
// than anything a customer wants. Retire only after variant B is APPROVED and has data.
const sharedHeadlines = [
  "Order Printing Online",
  "Exact Prices Online",
  "Local Saskatoon Pickup",
  "Rush Options Available",
  "Upload Your Artwork",
  "Configure Your Order",
  "Saskatoon Print Shop",
  "Clear Online Pricing",
  "Print Locally in Saskatoon",
  "Rated 4.9 From 43 Reviews",
];

const descriptions = (product) => [
  `Configure ${product} online, see exact pricing, and submit your order online.`,
  "Choose local Saskatoon pickup and upload your artwork with your order.",
  "Rush options are available. Review your configuration and price before ordering.",
  "Work with a Saskatoon print shop rated 4.9 from 43 Google reviews.",
];

const rsa = (product, specificHeadlines) => ({
  headlines: [...specificHeadlines, ...sharedHeadlines].slice(0, 15),
  descriptions: descriptions(product),
});

// ─── VARIANT B (new) ─────────────────────────────────────────────────────────
// Every number below resolves against docs/paid-search/approved-claims.mjs. The validator
// rejects any digit that does not. Structure is 10 group-specific + 5 shared headlines, so
// query-to-ad relevance survives rotation instead of collapsing into generic-on-generic.
//
// Rule: a headline sells the OUTCOME (the sign, the price, the deadline). It never describes
// the website's UI. "Configure Your Order" is not a reason anyone clicks an ad.
const sharedProofHeadlines = [
  "Rated 4.9 From 43 Reviews",
  "Same-Day Rush +$40 Flat",
  "In-House Design $40 Flat",
  "Pick Up in Saskatoon",
  "Printed In-House Locally",
];

const variantDescriptions = (priceLine) => [
  priceLine,
  "Standard orders ready in 1-3 business days. Same-day rush +$40 flat.",
  "Pick up at 216 33rd St W in Saskatoon. Upload your artwork with the order.",
  "In-house designer, $40 flat, same-day proof. Rated 4.9 from 43 reviews.",
];

const rsaVariantB = (specificHeadlines, priceLine) => ({
  headlines: [...specificHeadlines, ...sharedProofHeadlines],
  descriptions: variantDescriptions(priceLine),
});

const keyword = (text, matchType) => ({ text, matchType });
const exactPhrase = (terms) => terms.flatMap((term) => [keyword(term, "EXACT"), keyword(term, "PHRASE")]);

// `headlines` builds the legacy variant-A ad and is omitted for ad groups created after
// 2026-08-06 — those ship variant B alone rather than inventing a vague ad to sit beside it.
const coreGroup = ({ key, name, product, finalUrl, terms, headlines, variantB, priceLine, crossNegatives = [], launchTier = "TIER_1_PRODUCT" }) => ({
  key,
  name,
  status: "ENABLED",
  launchTier,
  finalUrl,
  keywords: exactPhrase(terms),
  crossNegatives,
  ...(headlines ? { rsa: rsa(product, headlines) } : {}),
  ...(variantB ? { rsaVariantB: rsaVariantB(variantB, priceLine) } : {}),
});

// Competitor variant B. All nine conquest groups share ONE payload, unlike Core.
// That is not laziness: the nine groups target one offer on one landing page, and naming the
// competitor in copy is forbidden (validator strips COMPETITOR_TERMS from ad text), so there is
// nothing legitimate left to differentiate on. What DOES change vs variant A is that every line
// now carries a real number, and the pitch answers "why switch" instead of "compare us".
const competitorVariantB = {
  headlines: [
    "Signs From $25 In Saskatoon",
    "250 Cards $45, 100 Flyers $45",
    "Banners From $66, 2x4ft",
    "See Every Price Online",
    "No Quote, No Waiting",
    "Local Shop, Not Mail Order",
    "Printed Here, Picked Up Here",
    "Compare Saskatoon Print Shops",
    "Stickers From $25",
    "Aluminum Signs $39",
    ...sharedProofHeadlines,
  ],
  descriptions: [
    "Compare before you order: signs from $25, cards $45, banners from $66.",
    ...variantDescriptions("").slice(1),
  ],
};

const brandVariantB = {
  headlines: [
    "True Color Printing",
    "Signs From $25 Saskatoon",
    "250 Business Cards $45 Here",
    "Banners From $66 In Store",
    "Order Direct From True Color",
    "216 33rd St W Saskatoon",
    "True Color Display Printing",
    "Your Local Print Shop",
    "Stickers, Signs, Banners",
    "Design $40, Rush +$40",
    ...sharedProofHeadlines,
  ],
  descriptions: [
    "True Color Display Printing, 216 33rd St W Saskatoon. Signs from $25.",
    ...variantDescriptions("").slice(1),
  ],
};

const neutralCompetitorRsa = {
  headlines: [
    "Compare Saskatoon Printing",
    "Order Printing Online",
    "Exact Prices Online",
    "Local Saskatoon Pickup",
    "Rush Options Available",
    "Upload Your Artwork",
    "Configure Your Order",
    "Saskatoon Print Shop",
    "Clear Online Pricing",
    "Explore Printing Options",
    "Print Locally in Saskatoon",
    "Rated 4.9 From 43 Reviews",
  ],
  descriptions: [
    "Compare your options, configure printing online, and see exact pricing before ordering.",
    "Choose local Saskatoon pickup and upload your artwork with your online order.",
    "Explore signs, banners, stickers, cards, flyers, and other printing options.",
    "Work with a Saskatoon print shop rated 4.9 from 43 Google reviews.",
  ],
};

const campaignBase = {
  status: "ENABLED",
  channel: "SEARCH",
  networks: { googleSearch: true, searchPartners: false, display: false },
  geoTarget: {
    criterionId: 1002791,
    name: "Saskatoon, Saskatchewan, Canada",
    center: { latitude: 52.129728, longitude: -106.659637 },
    radiusKm: 35,
    presenceOnly: true,
  },
  language: "English",
};

const competitorTargets = [
  ["qwik-signs", "Qwik Signs", ["qwik signs"]],
  ["minuteman-press", "Minuteman Press", ["minuteman press saskatoon"]],
  ["ink-house", "Ink House", ["ink house saskatoon"]],
  ["rayacom", "Rayacom", ["rayacom saskatoon"]],
  ["24-hour-signs", "24 Hour Signs", ["24 hour signs"]],
  ["anytime-printing", "Anytime Printing", ["anytime printing"]],
  ["pgi-printers", "PGI Printers", ["pgi printers"]],
  ["staples-printing", "Staples Printing", ["staples printing saskatoon", "staples saskatoon printing"]],
  // "vista print" (spaced) was leaking into Core because the "vistaprint" negative never
  // matched it. Adding it here both captures the conquest query and, because Core's campaign
  // negatives are derived from this list, stops the leak in the same edit.
  ["vistaprint", "Vistaprint", ["vistaprint saskatoon", "vista print"]],
  // 2026-08-06 harvest: Saskatoon competitors that were showing on Core with no routing
  // negative. Ship variant B only — there is no legacy approved ad for these groups.
  ["print-baron", "Print Baron", ["print baron saskatoon"]],
  ["mister-print", "Mister Print", ["mister print saskatoon"]],
  ["labels-made-easy", "Labels Made Easy", ["labels made easy"]],
];
// Competitor groups that predate 2026-08-06 carry a legacy policy-approved variant-A ad that
// must stay byte-identical. New groups ship variant B alone.
const LEGACY_COMPETITOR_KEYS = new Set([
  "qwik-signs", "minuteman-press", "ink-house", "rayacom", "24-hour-signs",
  "anytime-printing", "pgi-printers", "staples-printing", "vistaprint",
]);

export const paidSearchConfig = {
  schemaVersion: 1,
  generatedFor: "True Color Display Printing Ltd.",
  currency: "CAD",
  accountCustomerId: "1072816342",
  pilot: {
    startDate: "2026-08-03",
    endDate: "2026-09-17",
    inclusiveDays: 46,
    regenerateDatesIfGatesNotClearedByStart: true,
    hardStopRequired: true,
    generatorAutoRollsDates: false,
    dateChangeRequiresApprovedContractChange: true,
  },
  // Owner's absolute maximum. Equal to the qualifying-spend target on purpose: the account
  // reaches CA$600, qualifies for the promotion, and the runtime monitor pauses on that tick.
  maximumPilotCad: 600,
  targetQualifyingSpendCad: 600,
  spendControls: {
    scope: "EXACT_ACCOUNT_TOTAL",
    warningCad: 450,
    protectivePauseCad: 600,
    absoluteCapCad: 600,
    monitorCadenceMinutes: 15,
  },
  controlledTest: {
    campaign: "GOOG_Search_TC_CoreProducts_2026",
    adGroupKey: "coroplast",
    dailyBudgetCad: 5,
    protectivePauseCad: 25,
    absoluteCapCad: 30,
    maximumWindowHours: 72,
  },
  bidding: {
    strategy: "MAXIMIZE_CLICKS",
    cpcCeilingCadByCampaignKind: { CORE: 5, COMPETITOR: 2.5, BRAND: 1.5 },
    forecastDate: "2026-07-17",
    rationale: "Owner directive 2026-08-03 PM: buy the cheapest clicks the market offers; do not pre-pay for delivery. Weeks 1-2 are a measurement phase — raise ceilings only if Search lost IS (rank) proves auctions are lost to rank rather than to a thin market. 2026-08-07: that condition was met — Core lost 60.2% of impression share to RANK vs 8.6% to budget over Aug 5-7 (184 impressions, directionally consistent since Aug 6). Owner approved raising the Core ceiling CA$4.00 -> CA$5.00; Competitor and Brand ceilings unchanged (Competitor has zero impressions — its gate is 2026-08-12, and a ceiling raise there is explicitly deferred to that gate). Caveat recorded honestly: 184 impressions is a small sample, so judge this raise at the Aug 12 gate on fresh lost-IS data, not on day-over-day noise.",
  },
  adAssets: {
    // Sitelinks and callouts render on EVERY impression across all 20 ad groups — more surface
    // than any single RSA. They carried the same vague, number-free copy as variant A; every
    // line below now states a sourced price or spec.
    sitelinks: [
      { text: "Coroplast Signs", description1: "Coroplast signs from $25", description2: "4mm, single or double sided", finalUrl: `${ROOT}/products/coroplast-signs` },
      { text: "Custom Stickers", description1: "25 stickers from $25", description2: "Die-cut to any shape", finalUrl: `${ROOT}/products/stickers` },
      { text: "Vinyl Banners", description1: "2x4ft vinyl banner $66", description2: "13oz scrim, grommets included", finalUrl: `${ROOT}/products/vinyl-banners` },
      { text: "Business Cards", description1: "250 cards $45, 500 for $65", description2: "14pt gloss, double sided", finalUrl: `${ROOT}/products/business-cards` },
      { text: "Custom Flyers", description1: "100 flyers from $45", description2: "80lb gloss, double sided", finalUrl: `${ROOT}/products/flyers` },
      { text: "Retractable Banners", description1: "Stand and print from $219", description2: "Portable trade show display", finalUrl: `${ROOT}/products/retractable-banners` },
    ],
    callouts: [
      "Coroplast Signs From $25",
      "Banners From $66",
      "250 Cards $45",
      "Same-Day Rush +$40 Flat",
      "Design $40 Flat",
      "4.9 From 43 Reviews",
    ],
    structuredSnippet: {
      header: "Types",
      values: ["Coroplast Signs", "Custom Stickers", "Vinyl Banners", "Business Cards", "Custom Flyers", "Retractable Banners"],
    },
  },
  tracking: {
    autoTaggingRequired: true,
    finalUrlSuffix: "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&keyword={keyword}&matchtype={matchtype}&device={device}&loc_physical_ms={loc_physical_ms}&loc_interest_ms={loc_interest_ms}&adgroupid={adgroupid}&creative={creative}&campaignid={campaignid}&network={network}",
  },
  conversionMeasurement: {
    revenueSource: "SERVER_UPLOAD_CLICKS",
    requiredUploadClickActions: {
      purchaseOnline: {
        eventName: "purchase_online",
        envVar: "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID",
        actionId: "7694360837",
        status: "VERIFIED_LIVE",
        requiredType: "UPLOAD_CLICKS",
        primaryForGoal: true,
        includedInConversions: true,
        currency: "CAD",
        dynamicValue: true,
      },
      quoteWon: {
        eventName: "quote_won",
        envVar: "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID",
        actionId: "7694360840",
        status: "VERIFIED_LIVE",
        requiredType: "UPLOAD_CLICKS",
        primaryForGoal: true,
        includedInConversions: true,
        currency: "CAD",
        dynamicValue: true,
      },
    },
    qualifiedCallAction: {
      envVar: "GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID",
      actionId: "7694360843",
      status: "VERIFIED_LIVE",
      allowedTypes: ["AD_CALL", "WEBSITE_CALL", "UPLOAD_CALLS"],
      requiredCategory: "PHONE_CALL_LEAD",
      primaryForGoal: false,
      includedInConversions: false,
      minimumDurationSeconds: 60,
    },
    diagnosticEvents: {
      channel: "GA4",
      eventNames: ["purchase_online", "quote_won", "directions_click", "reviews_click"],
      googleAdsDelivery: false,
      optimizationRole: "NONE",
      phoneClicksAreQualifiedCalls: false,
    },
  },
  // Last OBSERVED live account state, not the target state above. The account is still paused on the
  // pre-promo-chase budgets and ceilings until the owner performs the manual launch, so this block
  // deliberately diverges from pilot/bidding/campaign target values and must not be "corrected" to match them.
  liveGoogleAds: {
    apiVersion: "v24",
    status: "VALIDATED_PAUSED",
    validatedAt: "2026-07-25",
    managerCustomerId: "1125402990",
    managerLinkId: "6626494765",
    billingSetupId: "8490021913",
    historicalBrowserPurchaseConversion: {
      actionId: "7689029977",
      destination: "AW-18330693756/F1pQCNmStdIcEPzg4KRE",
      revenueDelivery: false,
      primaryForGoal: false,
      includedInConversions: false,
    },
    campaignIds: {
      GOOG_Search_TC_CoreProducts_2026: "24048123058",
      GOOG_Search_TC_CompetitorConquest_2026: "24048123061",
      GOOG_Search_TC_BrandDefense_2026: "24048123064",
    },
    counts: { campaigns: 3, adGroups: 19, positiveKeywords: 83, negativeCriteria: 189, responsiveSearchAds: 19, manualAssets: 13, campaignAssetLinks: 39 },
    geoTarget: {
      kind: "PROXIMITY",
      center: { latitude: 52.129728, longitude: -106.659637 },
      radiusKm: 35,
      positiveLocationCriteria: 0,
      proximityCriteria: 3,
      presence: "PRESENCE",
    },
    conversionGoalGraph: {
      configLevel: "CUSTOMER",
      customerGoals: {
        purchaseWebsite: { biddable: true },
        pageViewWebsite: { biddable: false },
        phoneCallLeadCallFromAds: { biddable: false },
      },
      biddingActionIds: ["7694360837", "7694360840"],
    },
    cpcCeilingCadByCampaignKind: { CORE: 4, COMPETITOR: 2.5, BRAND: 1.5 },
    policyApprovalStatus: "ALL_RSAS_APPROVED_REVIEWED",
    disapprovedCompetitorResponsiveSearchAds: 0,
    allCampaignsPaused: true,
    spendCad: 0,
  },
  // Derived from docs/paid-search/approved-claims.mjs — never hand-edit. Every entry is a
  // numeric fact with a named source; the validator rejects any number in ad copy that does
  // not resolve to one of these.
  approvedClaims: sourcedApprovedClaims,
  launchControls: {
    sourceLessons: ["WILKIE", "DUBOIS"],
    mobilePostClickQaRequired: true,
    oneDomainOnly: "truecolorprinting.ca",
    cityPresenceOnlyCriterionId: 1002791,
    radiusKm: 35,
    searchOnly: true,
    allowedMatchTypes: ["EXACT", "PHRASE"],
    noBroadeningToManufactureVolume: true,
    realAttributablePurchaseOnlineRequired: true,
    realAttributableQuoteWonRequired: true,
    hardEndRequired: true,
    dailySearchTermReviewRequired: true,
    presenceOnlyManualOrApiRequired: true,
    editorPreviewRequired: true,
  },
  externalGates: [
    {
      code: "TRUE_COLOR_CUSTOMER_ID",
      status: "VERIFIED",
      required: "True Color Google Ads customer ID and ownership",
      evidence: "True Color Display Print child account 107-281-6342 under manager 112-540-2990",
    },
    { code: "BILLING_ACTIVE", status: "VERIFIED", required: "Billing configured and confirmed", evidence: "Billing APPROVED in customer 1072816342; setup 8490021913" },
    { code: "AUTO_TAGGING_ENABLED", status: "VERIFIED", required: "Auto-tagging enabled in the correct account", evidence: "Auto-tagging enabled in customer 1072816342" },
    { code: "PURCHASE_UPLOAD_CLICKS_ACTION", status: "VERIFIED", required: "Distinct primary UPLOAD_CLICKS action ID for purchase_online supplied by fresh live-account verification", evidence: "Action 7694360837 purchase_online is enabled, primary, included, dynamic CAD, and owned by customer 1072816342" },
    { code: "QUOTE_WON_UPLOAD_CLICKS_ACTION", status: "VERIFIED", required: "Distinct primary UPLOAD_CLICKS action ID for quote_won supplied by fresh live-account verification", evidence: "Action 7694360840 quote_won is enabled, primary, included, dynamic CAD, and owned by customer 1072816342" },
    { code: "CONVERSION_GOAL_GRAPH", status: "VERIFIED", required: "Only purchase_online and quote_won influence bidding; historical browser purchase, page views, and calls remain excluded", evidence: "2026-07-23 readback: customer purchase goal biddable with actions 7694360837 and 7694360840; page-view and call goals non-biddable; historical action 7689029977 secondary and excluded" },
    { code: "OFFLINE_UPLOADER_MIGRATION", status: "VERIFIED", required: "Move revenue delivery off the deprecated Google Ads API UploadClickConversion path and prove the supported production uploader", evidence: "Google Data Manager events:ingest plus asynchronous request diagnostics are deployed in production; real purchase_online and quote_won observation remain separate gates" },
    { code: "PURCHASE_UPLOAD_CLICKS_OBSERVED", status: "BLOCKED", required: "One real paid purchase_online click conversion imported with transaction ID, CAD value, and observed in Google Ads" },
    { code: "QUOTE_WON_UPLOAD_CLICKS_OBSERVED", status: "BLOCKED", required: "One real paid quote_won click conversion imported with transaction ID, CAD value, and observed in Google Ads" },
    { code: "QUALIFIED_CALL_ACTION", status: "VERIFIED", required: "Duration-qualified phone-call action ID and approved duration threshold read back live as secondary and excluded from bidding", evidence: "Action 7694360843 qualified_call_60s is enabled with 60-second duration, secondary, excluded, and its customer goal is non-biddable" },
    { code: "PROMOTION_ELIGIBILITY", status: "VERIFIED", required: "CA$600 offer eligibility and exact terms confirmed", evidence: "Owner-confirmed and 2026-07-25 direct-customer API readback: CAD 600 reward, CAD 600 qualifying spend, REDEEMED, fulfillment expiry 2026-09-16 UTC" },
    { code: "COMPETITOR_LANDING_DEPLOYED", status: "VERIFIED", required: "Live /why-true-color returns 200, remains noindex, passes mobile QA, and has working product links", evidence: "Live /why-true-color returned HTTP 200 with noindex and working paid-page product routes on 2026-07-23" },
    { code: "RSA_POLICY_APPROVAL", status: "VERIFIED", required: "All launch-candidate RSAs approved by Google Ads policy review", evidence: "2026-07-25 v24 readback: all 19 RSAs, including all nine Competitor RSAs, APPROVED / REVIEWED with no policy topics" },
    { code: "AUCTION_INSIGHTS_SIGNOFF", status: "VERIFIED", required: "Brand campaign justified by Auction Insights or kept paused", evidence: "2026-08-03 owner decision: Brand stays PAUSED for the pilot. True Color already holds the organic #1 for its brand terms, no Auction Insights evidence of a competitor bidding on them exists, and brand clicks would distort the non-brand conversion data this pilot is being run to collect. Satisfied by the 'or kept paused' branch." },
    { code: "ENHANCED_CONSENT_DECISION", status: "VERIFIED", required: "Purpose-specific enhanced-consent decision", evidence: "2026-08-03 owner decision: Enhanced Conversions stays OFF. No customer-data hashing, no purpose-specific consent surface required." },
    { code: "CURRENT_KEYWORD_PLANNER_FORECAST", status: "VERIFIED", required: "Current forecast from the correct account and CPC ceilings staged while paused", evidence: "2026-07-17 True Color forecast read from customer 1072816342; forecast-optimal ceilings Core CA$4.00, Competitor CA$2.50, Brand CA$1.50 staged while paused" },
    { code: "CPC_CEILING_LAUNCH_APPROVAL", status: "VERIFIED", required: "Owner approves the staged Core CA$4.00, Competitor CA$2.50, and Brand CA$1.50 ceilings for launch", evidence: "2026-08-03 owner directive: spend the least per click for the most clicks and conversions; do not overshoot bids to force delivery. Ceilings held at the 2026-07-17 forecast-optimal values." },
    { code: "BUDGET_APPROVAL", status: "VERIFIED", required: "Pilot budgets approved", evidence: "Core CA$14/day, Competitor CA$4/day live at launch; Brand CA$3/day staged but PAUSED and excluded from pilot spend; controlled Coroplast test CA$5/day" },
    { code: "DATES_AND_HARD_STOP", status: "VERIFIED", required: "46-day pilot dates 2026-08-03 to 2026-09-17, 15-minute scheduler heartbeat, CA$450 warning, CA$600 protective pause, and CA$600 absolute cap confirmed live", evidence: "Profile public-pilot verified live 2026-08-03T18:26:44Z (accountVerified true, windowEnd 2026-12-31T00:00, outcome BELOW_STOP, action NONE, spend CA$0), superseding the controlled-test profile whose expired 2026-07-26 window had been emitting STOPPED/ALREADY_PAUSED every 15 minutes. Thresholds lowered 2026-08-05 from 1000/1250/1300 to 450/600/600 on owner directive that CA$600 is the absolute maximum, not merely the qualifying target." },
    { code: "MOBILE_QA", status: "VERIFIED", required: "Mobile landing-page and conversion-flow QA", evidence: "2026-08-03 owner attestation: mobile landing page and conversion flow reviewed on device and accepted." },
    { code: "LAUNCH_CONTROL_SIGNOFF", status: "BLOCKED", required: "Wilkie/Dubois launch controls reviewed and signed off" },
    { code: "PRESENCE_ONLY_AND_EDITOR_PREVIEW", status: "VERIFIED", required: "Presence-only set manually/API and confirmed in Google Ads Editor/account preview", evidence: "2026-08-03 credential-gated v24 readback of customer 1072816342: all three campaigns return geo target type PRESENCE with a single PROXIMITY criterion at 52.129728,-106.659637 radius 35 KILOMETERS, zero positive LOCATION criteria, and Search-only networks (searchNetwork/contentNetwork/partnerSearchNetwork all false). Satisfies the manual/API branch; API readback is stronger evidence than an Editor screenshot." },
  ],
  accountNegatives: exactPhrase([
    "jobs", "hiring", "salary", "career", "course", "class", "tutorial", "printer repair",
    "used printer", "printer ink", "3d printing", "home printer", "free", "template", "diy",
    "how to", "canva", "download", "printable", "machine", "equipment", "supplies",
    // 2026-08-05: proven waste from the GSC survey. "screen printing" drew 95 impressions and
    // True Color does not offer it (eco-solvent Roland + digital press only). The rest are
    // copy-shop or buy-a-device intent. "logo design" and "resume" were deliberately NOT added:
    // in-house design is a real CA$40 service and resume printing is a real print job.
    "screen printing", "photocopy", "document printing", "print outs",
    "label maker", "label printers",
    // 2026-08-06 search-term mining (first real harvest, 41 terms / CA$8.05 / 14 days).
    // Apparel: True Color has no garment capability (eco-solvent Roland + digital press).
    // "london drugs" + "photo lab": retail photo-developing intent, drew 9 impressions.
    // "photo printing" deliberately NOT negated — photo posters are a real product from $15.
    "t shirt", "tshirt", "london drugs", "photo lab",
    // 2026-08-07 mining (52 terms / CA$12.98 / 7 days, first window with real delivery).
    // "canvas": zero references to canvas anywhere in products.v1.csv or products-content.ts —
    // True Color has no canvas capability. "shirt printing": the Aug 6 "t shirt"/"tshirt"
    // phrase-negatives do NOT block "shirt printing saskatoon" (verified: neither substring
    // appears in it), so apparel intent was still leaking through a second door.
    // Deliberately NOT negated: every boat term ("boat hull registration numbers",
    // "custom boat decals", "boat decals near me") — boat registration numbers are a real
    // product with 45 references in products-content.ts. Also NOT negated: "photo printing
    // saskatoon", "professional sticker printer", "business card price list", which the miner
    // flagged as zero-conversion waste. All three are core products; the miner cannot see
    // conversions because ad-attributed conversion upload has not fired yet, so its
    // zero-conversion signal is currently meaningless.
    // 2026-08-07 owner correction: "signs saskatoon" and "professional sticker printer"
    // are legitimate buyer language, and "staples saskatoon printing" / "photo printing
    // saskatoon" are not waste by default because they can route to competitor-comparison,
    // premium/product, or photo-poster demand. Only "3d printer" is a hard mismatch.
    "canvas", "shirt printing", "3d printer",
  ]),
  campaigns: [
    {
      ...campaignBase,
      kind: "CORE",
      name: "GOOG_Search_TC_CoreProducts_2026",
      // 2026-08-06: raised 14 -> 18. Evidence, not pacing anxiety: Aug 6 spent CA$13.72 against
      // the CA$14 budget and Core lost 32.1% of impression share to budget. Enabled daily total
      // becomes CA$22, still inside the CA$25 unmonitored-burn bound. The CA$600 hard stop is
      // unchanged and remains the binding constraint on total spend.
      // 2026-08-07: raised 18 -> 21, the ceiling reachable without lifting
      // MAX_UNMONITORED_DAILY_BURN_CAD (enabled total becomes exactly CA$25 = Core 21 +
      // Competitor 4; Brand stays PAUSED at 3). Evidence: Aug 6 spent CA$18.09 against the
      // CA$18 budget — a full cap-out — and Core still loses 8.6% of impression share to budget.
      // Honest expectation, recorded so the next raise is judged against it: this is a SMALL
      // lever. Average burn is CA$9.69/day against CA$22/day of already-enabled capacity, so
      // headroom only binds on strong days like Aug 6. Lost IS to RANK is 60.2% — seven times
      // the budget loss — and no budget number touches that. Do not read a weak pacing response
      // as evidence the raise failed; read it as confirmation that rank, not budget, is binding.
      dailyBudgetCad: 21,
      maximumPilotCad: 966,
      campaignNegatives: competitorTargets.flatMap(([, , terms]) => terms),
      gates: [],
      adGroups: [
        coreGroup({
          key: "coroplast", name: "Coroplast Signs", product: "coroplast signs",
          finalUrl: `${ROOT}/products/coroplast-signs`,
          terms: ["coroplast signs saskatoon", "coroplast signs", "coroplast sign printing", "coroplast printing"],
          headlines: ["Order Coroplast Signs", "Coroplast Signs Saskatoon", "Price Coroplast Signs"],
          variantB: [
            "Coroplast Signs From $25",
            "4mm Coroplast, $8/sqft",
            "Yard & Job Site Signs",
            "Real Estate Signs",
            "Election & Event Signs",
            "Coroplast Signs Saskatoon",
            "Custom Coroplast Printing",
            "Single or Double Sided",
            "Weatherproof Yard Signs",
            "H-Stakes Available",
          ],
          priceLine: "Coroplast signs from $25. See your exact price online before you order.",
          crossNegatives: ["stickers", "labels", "vinyl banner", "business cards", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "stickers-labels", name: "Stickers and Labels", product: "stickers and labels",
          finalUrl: `${ROOT}/products/stickers`,
          terms: [
            "custom stickers saskatoon",
            "sticker printing saskatoon",
            "custom labels saskatoon",
            "sticker printing",
            "die cut stickers near me",
            "custom die cut stickers near me",
            "custom stickers near me",
            "custom labels near me",
            "die cut labels near me",
            "custom die cut labels near me",
            // 2026-08-06 mined: real queries that served but had no matching keyword.
            "custom sticker lettering",
            "custom labels",
            "vinyl sticker maker",
            "sticker makers",
          ],
          headlines: ["Order Custom Stickers", "Stickers Printed Locally", "Custom Labels Saskatoon"],
          variantB: [
            "Custom Stickers From $25",
            "25 Stickers From $25",
            "Die-Cut to Any Shape",
            "Product & Jar Labels",
            "Waterproof Vinyl Stickers",
            "Custom Labels Saskatoon",
            "Sticker Printing Saskatoon",
            "Logo & Brand Stickers",
            "Any Size, Any Shape",
            "Small Runs Welcome",
          ],
          priceLine: "Custom stickers from $25 for 25. See your exact price online before ordering.",
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "vinyl-banners", name: "Vinyl Banners", product: "vinyl banners",
          finalUrl: `${ROOT}/products/vinyl-banners`,
          terms: ["vinyl banners saskatoon", "banner printing saskatoon", "custom vinyl banners", "banner printing", "banner with grommets"],
          headlines: ["Order Vinyl Banners", "Vinyl Banners Saskatoon", "Price Custom Banners"],
          variantB: [
            "Vinyl Banners From $66",
            "2x4ft Vinyl Banner $66",
            "13oz Scrim Vinyl",
            "Grommets Included",
            "Grand Opening Banners",
            "Trade Show Banners",
            "Banner Printing $8.25/sqft",
            "Outdoor Vinyl Banners",
            "Custom Size Banners",
            "Banner Printing Saskatoon",
          ],
          priceLine: "Vinyl banners from $66 for 2x4ft. See your exact price online before ordering.",
          crossNegatives: ["coroplast", "stickers", "labels", "business cards", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "business-cards", name: "Business Cards", product: "business cards",
          finalUrl: `${ROOT}/products/business-cards`,
          terms: ["business cards saskatoon", "business card printing saskatoon", "order business cards online", "business card printing"],
          headlines: ["Order Business Cards", "Business Cards Saskatoon", "Price Business Cards"],
          variantB: [
            "250 Business Cards $45",
            "500 Cards $65, 1000 $110",
            "14pt Gloss, Double Sided",
            "Business Cards From $45",
            "Business Cards Saskatoon",
            "Matte or Gloss Finish",
            "Card Printing Saskatoon",
            "Realtor & Trade Cards",
            "Double Sided Included",
            "Order Business Cards",
          ],
          priceLine: "250 double-sided business cards for $45 on 14pt gloss. Price it online now.",
          crossNegatives: ["coroplast", "stickers", "labels", "vinyl banner", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "flyers", name: "Flyers", product: "flyers",
          finalUrl: `${ROOT}/products/flyers`,
          terms: ["flyer printing saskatoon", "custom flyers saskatoon", "order flyers online", "flyer printing", "flyers printing"],
          headlines: ["Order Custom Flyers", "Flyer Printing Saskatoon", "Price Flyers Online"],
          variantB: [
            "100 Flyers From $45",
            "Full Letter, Double Sided",
            "80lb Gloss Text",
            "Flyer Printing From $45",
            "Menus, Handbills, Inserts",
            "Flyer Printing Saskatoon",
            "Custom Flyers Saskatoon",
            "Promo & Event Flyers",
            "Bulk Flyer Printing",
            "Half or Full Letter",
          ],
          priceLine: "100 double-sided flyers from $45 on 80lb gloss. Price it online now.",
          crossNegatives: ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "retractable banner"],
        }),
        coreGroup({
          key: "retractable-banners", name: "Retractable Banners", product: "retractable banners",
          finalUrl: `${ROOT}/products/retractable-banners`,
          terms: ["retractable banners saskatoon", "retractable banner printing", "pull up banners saskatoon", "trade show banners printing", "retractable banner"],
          headlines: ["Order Retractable Banners", "Retractable Banner Print", "Pull Up Banners Saskatoon"],
          variantB: [
            "Retractable Banners $219",
            "Stand & Print Included",
            "Trade Show Displays",
            "Pull Up Banner From $219",
            "Ready For Your Next Show",
            "Retractable Banner Stands",
            "Portable Display Banners",
            "Conference & Expo Banners",
            "Reusable Banner Stand",
            "Banner Stands Saskatoon",
          ],
          priceLine: "Retractable banners from $219 with the stand and print included.",
          crossNegatives: ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "flyers"],
        }),
        coreGroup({
          key: "rush-same-day", name: "Rush and Same Day", product: "rush printing",
          finalUrl: `${ROOT}/same-day-printing-saskatoon`,
          terms: ["same day printing saskatoon", "rush printing saskatoon", "urgent printing saskatoon", "same day printing"],
          headlines: ["Rush Printing Saskatoon", "Explore Same Day Printing", "Local Rush Print Options"],
          variantB: [
            "Need It Today? Rush +$40",
            "Order Before 10 AM Today",
            "Rush Printing Saskatoon +$40",
            "Standard: 1-3 Business Days",
            "Rush Signs & Banners +$40",
            "Rush Flyers & Cards +$40",
            "Urgent Print Jobs +$40",
            "Last Minute Printing +$40",
            "Local Rush Print +$40",
            "Rush Printing From $25",
          ],
          priceLine: "Same-day rush is +$40 flat when you order before 10 AM. Price it online now.",
          crossNegatives: ["business cards", "flyers", "stickers", "banners", "coroplast"],
        }),
        coreGroup({
          key: "generic-print-price", name: "Generic Print Price", product: "printing",
          finalUrl: `${ROOT}/printing-prices-saskatoon`,
          terms: ["printing prices saskatoon", "print shop prices saskatoon", "printing quote saskatoon", "printing saskatoon", "printing services saskatoon", "saskatoon printing services", "print shop saskatoon", "print shops saskatoon", "saskatoon print shops", "saskatoon printing", "printing in saskatoon", "printers saskatoon"],
          headlines: ["Printing Prices Saskatoon", "See Printing Prices Online", "Configure Printing Online"],
          variantB: [
            "Signs From $25, Cards $45",
            "Printing Prices Saskatoon",
            "Banners From $66",
            "Flyers From $45",
            "See Exact Prices Online",
            "No Quote Needed",
            "Real Prices, Not Estimates",
            "Price It Yourself Online",
            "Print Shop Saskatoon",
            "Printing Services Saskatoon",
          ],
          priceLine: "Signs from $25, 250 cards $45, banners from $66. Every price is online.",
          crossNegatives: ["same day", "rush", "sign shop", "sign company"],
        }),
        // 2026-08-07 owner correction: "photo printing saskatoon" is not waste. True Color
        // sells photo posters from $15, so route photo-printing demand to the dedicated
        // photo-poster landing page instead of letting Generic Print Price absorb it.
        coreGroup({
          key: "photo-posters", name: "Photo Posters", product: "photo posters",
          finalUrl: `${ROOT}/photo-poster-printing-saskatoon`,
          terms: ["photo printing saskatoon", "photo poster printing saskatoon"],
          variantB: [
            "Photo Posters From $15",
            "Photo Printing Saskatoon",
            "Premium Matte Photo Paper",
            "Matte Posters From $15",
            "Photo Posters Saskatoon",
            "Gallery-Quality Colour",
            "Print Photos Locally",
            "Event & Art Photo Prints",
            "Photo & Art Poster Prints",
            "Matte Photo Prints From $15",
          ],
          priceLine: "Photo posters start at $15 on matte photo paper, printed locally in Saskatoon.",
          crossNegatives: ["stickers", "labels", "business cards", "flyers"],
        }),
        coreGroup({
          key: "generic-sign-shop", name: "Generic Sign Shop", product: "signs",
          finalUrl: `${ROOT}/sign-company-saskatoon`,
          terms: ["sign shop saskatoon", "sign company saskatoon", "custom signs saskatoon", "saskatoon sign company", "sign companies saskatoon", "saskatoon signs", "signage saskatoon"],
          headlines: ["Saskatoon Sign Shop", "Custom Signs Saskatoon", "Explore Local Sign Options"],
          variantB: [
            "Custom Signs From $25",
            "Aluminum Signs From $39",
            "Saskatoon Sign Shop",
            "Coroplast, Aluminum, Vinyl",
            "Sign Company Saskatoon",
            "Signs Printed In-House",
            "Storefront & Yard Signs",
            "Custom Signs Saskatoon",
            "Business & Safety Signs",
            "Local Saskatoon Signs",
          ],
          priceLine: "Custom signs from $25, aluminum from $39. See your exact price online.",
          crossNegatives: ["same day", "rush", "printing prices", "print shop prices"],
        }),
        // 2026-08-06: created from the first search-term harvest, not from planner estimates.
        // "clear window decals for business", "decals saskatoon", "custom boat decals", and
        // "boat decals near me" all served with no matching ad group, so the queries were being
        // absorbed by looser groups. Routed straight to the /products configurator so the click
        // lands on something orderable, not a brochure page. Ships variant B only — there is no
        // legacy approved ad here to preserve.
        coreGroup({
          key: "decals", name: "Decals", product: "decals",
          finalUrl: `${ROOT}/products/window-decals`,
          // 2026-08-06: "custom boat decals" and "boat decals near me" MOVED OUT to the new
          // `boat` group. An ad group can only carry one destination, and those two queries
          // deserve /boat-registration-numbers, not the generic window-decal configurator.
          terms: ["decals saskatoon", "clear window decals for business", "window decals saskatoon", "custom decals"],
          variantB: [
            "Custom Decals From $25",
            "Window Decals $11/sqft",
            "Clear & Frosted Window Vinyl",
            "Boat & Vehicle Decals",
            "Storefront Window Decals",
            "Decals Saskatoon",
            "Cut To Any Shape",
            "Business Hours & Logo Decals",
            "Indoor & Outdoor Vinyl",
            "Custom Window Graphics",
          ],
          priceLine: "Custom decals from $25, window vinyl $11/sqft. See your price online.",
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "boat"],
        }),
        // 2026-08-06: split out of the Decals group the day /boat-registration-numbers went
        // live. "custom boat decals" and "boat decals near me" are proven search-term-harvest
        // queries, not planner guesses — they were already serving, just landing on the generic
        // window-decal configurator. No new speculative terms were added: expansion rules say
        // terms come from mined search terms or GSC evidence only.
        //
        // Destination is the SEO landing page rather than /products/*, because /products/* is
        // noindex by header and the landing page carries the compliance answer the query is
        // actually asking (how big, where, what colour) with the configurator one click away.
        coreGroup({
          key: "boat", name: "Boat Registration Decals", product: "boat registration decals",
          finalUrl: `${ROOT}/boat-registration-numbers`,
          terms: ["custom boat decals", "boat decals near me"],
          variantB: [
            "Boat Decals From $39 A Pair",
            "SK Boat Registration Numbers",
            "Boat Licence Numbers $39",
            "3-Inch Legal Block Letters",
            "Boat Name Decals $18",
            "Meets Transport Canada Rules",
            "Both Sides Of The Bow",
            "Sticks To Aluminum Hulls",
            "Nine Colours, No Upcharge",
            "Preview Your Number Online",
          ],
          priceLine: "Boat registration decals from $39 a pair. 3-inch block letters, both sides of the bow.",
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "window decals"],
        }),
        // Only Core group routed to an SEO landing page rather than a /products configurator.
        // Deliberate: "large format printing" spans banners/coroplast/ACP so no single
        // configurator matches, and the SEO page carries the keyword in its H1. Doubles as the
        // SEO-page-vs-configurator conversion experiment.
        coreGroup({
          key: "large-format", name: "Large Format Printing", product: "large format printing",
          finalUrl: `${ROOT}/large-format-printing-saskatoon`,
          terms: ["large format printing", "large format printing saskatoon", "large format signs"],
          headlines: ["Large Format Printing", "Large Format Saskatoon", "Price Large Format Print"],
          variantB: [
            "Large Format From $8.25/sqft",
            "Up To 4x8ft Panels",
            "Banners, Coroplast, ACP",
            "Large Format Printing",
            "Roland Eco-Solvent Print",
            "Large Format Saskatoon",
            "Wide Format Printing",
            "Big Signs & Displays",
            "Trade Show & Event Print",
            "Large Signs Saskatoon",
          ],
          priceLine: "Large format from $8.25/sqft, panels up to 4x8ft. Price it online now.",
          crossNegatives: ["stickers", "labels", "business cards", "flyers"],
        }),
      ],
    },
    {
      ...campaignBase,
      kind: "COMPETITOR",
      name: "GOOG_Search_TC_CompetitorConquest_2026",
      dailyBudgetCad: 4,
      maximumPilotCad: 184,
      campaignNegatives: [],
      gates: [],
      adGroups: competitorTargets.map(([key, name, terms]) => ({
        key,
        name: `Comparison - ${name}`,
        status: "ENABLED",
        launchTier: "TIER_1_CONQUEST",
        finalUrl: `${ROOT}/why-true-color?source=google-ads`,
        keywords: terms.map((term) => keyword(term, "EXACT")),
        crossNegatives: [],
        ...(LEGACY_COMPETITOR_KEYS.has(key) ? { rsa: neutralCompetitorRsa } : {}),
        rsaVariantB: competitorVariantB,
      })),
    },
    {
      ...campaignBase,
      kind: "BRAND",
      name: "GOOG_Search_TC_BrandDefense_2026",
      status: "PAUSED",
      dailyBudgetCad: 3,
      maximumPilotCad: 0,
      campaignNegatives: [],
      gates: ["AUCTION_INSIGHTS_REQUIRED"],
      adGroups: [{
        key: "true-color-brand",
        name: "True Color Brand",
        status: "PAUSED",
        launchTier: "HOLD_AUCTION_INSIGHTS",
        finalUrl: `${ROOT}/`,
        keywords: exactPhrase(["true color printing", "true colour printing", "true color saskatoon", "true color display printing"]),
        crossNegatives: [],
        rsa: rsa("printing", ["True Color Printing", "True Color Saskatoon", "True Color Print Shop"]),
        // Brand is PAUSED, so this serves nothing today. It exists so that if Brand is ever
        // unpaused — currently the cheapest lever toward the CA$600 qualifying target — the copy
        // is already price-anchored instead of the vague legacy set.
        rsaVariantB: brandVariantB,
      }],
    },
  ],
};

export default paidSearchConfig;
