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
    // 2026-08-16 PRICE asset. Sitelinks and callouts already carry prices, but they carry them
    // as prose. A price asset renders the price as a PRICE — a structured, scannable table under
    // the ad — which is the single strongest asset True Color has, because the whole competitive
    // position is "the price is on the page and you can see it before you talk to anyone".
    //
    // Every header and description below is run through claimFailureReason() with
    // STRICT_CLAIM_OPTS, exactly like RSA copy: no number appears here that does not resolve to a
    // sourced fact in docs/paid-search/approved-claims.mjs. That is why the photo poster line
    // says "Matte poster from $15" and not "12x18 from $15" — "12x18" is a real spec but it is
    // NOT a registered token, and inventing a token to make copy pass is banned by the registry.
    //
    // Google limits: 3-8 offerings, header <= 25 chars, description <= 25 chars. Eight are
    // declared, the maximum, because Google picks which subset to render per auction and a
    // wider set gives it more to match against the query.
    prices: [
      {
        name: "TC PPC Price - Core Products",
        type: "SERVICES",
        priceQualifier: "FROM",
        languageCode: "en",
        // Linked to all three approved campaigns for symmetry with the existing 13 managed
        // callout/sitelink assets (39 links = 13 x 3). Competitor and Brand are PAUSED, so the
        // extra two links cost nothing and a future re-enable does not need a second pass.
        linkedCampaigns: "ALL_APPROVED",
        offerings: [
          { header: "Coroplast Signs", description: "4mm coroplast from $25", priceCad: 25, finalUrl: `${ROOT}/products/coroplast-signs` },
          { header: "Business Cards", description: "250 cards, 14pt gloss", priceCad: 45, finalUrl: `${ROOT}/products/business-cards` },
          { header: "Vinyl Banners", description: "2x4ft, 13oz scrim", priceCad: 66, finalUrl: `${ROOT}/products/vinyl-banners` },
          { header: "Retractable Banners", description: "Stand and print, $219", priceCad: 219, finalUrl: `${ROOT}/products/retractable-banners` },
          { header: "Custom Stickers", description: "25 die-cut vinyl, $25", priceCad: 25, finalUrl: `${ROOT}/products/stickers` },
          { header: "Photo Posters", description: "Matte poster from $15", priceCad: 15, finalUrl: `${ROOT}/photo-poster-printing-saskatoon` },
          { header: "Custom Flyers", description: "100 flyers, 80lb gloss", priceCad: 45, finalUrl: `${ROOT}/products/flyers` },
          { header: "Boat Numbers", description: "3-inch pair from $39", priceCad: 39, finalUrl: `${ROOT}/boat-registration-numbers` },
        ],
      },
    ],
  },
  // 2026-08-16 OBSERVATION audiences. bid_only = true is the load-bearing field: it makes every
  // audience an OBSERVATION, not a TARGET. A targeting audience would SHRINK reach — on a
  // 35 km presence-only Saskatoon radius with CA$25/day that is the opposite of what is needed.
  // Observation changes nothing about who sees the ads; it only labels the traffic so the next
  // bid decision has a segment to read. Zero delivery risk, real reporting gain.
  //
  // Applied by scripts/google-ads/apply-audiences.mjs. The ad-group allowlist is written out by
  // hand rather than derived from the live account so a future config typo can never silently
  // widen the blast radius (same rule as remove-migrated-keywords.mjs).
  observationAudiences: {
    mode: "OBSERVATION",
    targetRestriction: { targetingDimension: "AUDIENCE", bidOnly: true },
    campaign: "GOOG_Search_TC_CoreProducts_2026",
    criteriaPerAdGroup: 5,
    // 80886 "Signage" is NOT available on the SEARCH channel (user_interest.availabilities:
    // DISPLAY/VIDEO/DEMAND_GEN only) — the live API rejected it 2026-08-16. Four in-market + one list.
    userInterests: [
      { criterionId: "80519", name: "Business Printing & Document Services" },
      { criterionId: "80516", name: "Photo Printing Services" },
      { criterionId: "80517", name: "Advertising & Marketing Services" },
      { criterionId: "80463", name: "Business Services" },
    ],
    // 130 users today — far below the 1,000-user Search serving threshold, so it will not
    // segment anything yet. Attached now because the list only grows once it is attached.
    userLists: [
      { id: "9446693977", name: "All visitors (AdWords)", searchEligible: true },
    ],
    adGroups: [
      { id: "197192347366", name: "Coroplast Signs" },
      { id: "197192347406", name: "Stickers and Labels" },
      { id: "197192347566", name: "Vinyl Banners" },
      { id: "197192347606", name: "Business Cards" },
      { id: "197192347646", name: "Flyers" },
      { id: "197192347806", name: "Retractable Banners" },
      { id: "197192347846", name: "Rush and Same Day" },
      { id: "197192347886", name: "Generic Print Price" },
      { id: "197192348046", name: "Generic Sign Shop" },
      { id: "197370354845", name: "Photo Posters" },
      { id: "199625721792", name: "Boat Registration Decals" },
      { id: "200550934762", name: "Decals" },
      { id: "200731192282", name: "Vehicle Decals" },
      { id: "201694453809", name: "Large Format Printing" },
    ],
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
    qualifiedQuoteLeadAction: {
      eventName: "quote_submit_qualified",
      envVar: "GOOGLE_ADS_QUOTE_LEAD_CONVERSION_ACTION_ID",
      // 2026-08-16 owner created it in the UI (account 107-281-6342); read back via GAQL:
      // id 7723019984, ENABLED, UPLOAD_CLICKS, SUBMIT_LEAD_FORM, ONE_PER_CLICK, 30d window,
      // value 0 (alwaysUseDefaultValue). Google's redesigned creation flow forced
      // primaryForGoal=true and includeInConversionsMetric=true, and the config was edited to
      // MATCH that rather than to correct it (commit 1836242).
      //
      // 2026-08-16 SAME DAY, CORRECTED BACK. Recording the accident as the intent is how a
      // safety contract stops being one. The live consequence was not cosmetic: a primary
      // SUBMIT_LEAD_FORM action made the customer-level "Submit lead form" goal BIDDABLE on the
      // customer and, because all three campaigns inherit at CUSTOMER goal level, on every
      // campaign. Maximize Clicks does not read goals today, but the goal graph is the thing the
      // live verifier pins, and it read UNSAFE on three separate checks until this was reverted.
      //
      // Target and now live intent: SECONDARY and EXCLUDED. A quote submission is a lead, not
      // revenue; only purchase_online and quote_won may influence bidding. Promotion to primary
      // is gated on the evidence below and is a deliberate, separate decision.
      // Applied by scripts/google-ads/apply-conversion-actions.mjs (op i + op ii).
      actionId: "7723019984",
      status: "VERIFIED_LIVE",
      requiredType: "UPLOAD_CLICKS",
      requiredCategory: "SUBMIT_LEAD_FORM",
      primaryForGoal: false,
      promotionGate: "secondary until 10-20 verified paid-click quote submissions are observed and lead quality is acceptable",
      includedInConversions: false,
      currency: "CAD",
      dynamicValue: false,
      valueMode: "NONE",
    },
    // Two browser-side PHONE_CALL_LEAD actions that do not exist yet. They are declared here
    // BEFORE creation so the contract, the validator, and the verifier all describe the same
    // end state and the creation script has an allowlist to work from. Both are permanently
    // SECONDARY and EXCLUDED: a phone call is a lead, and docs/paid-search/ADS-CONVERSION-GAP-MEMO.md
    // forbids any imported or browser-side action from becoming primary. `actionId` stays null
    // until apply-conversion-actions.mjs reads it back live and the ID is pasted here.
    websiteCallAction: {
      eventName: "qualified_call_website_60s",
      envVar: "GOOGLE_ADS_WEBSITE_CALL_CONVERSION_ACTION_ID",
      labelEnvVar: "NEXT_PUBLIC_GOOGLE_ADS_WEBSITE_CALL_LABEL",
      // 2026-08-16 created by apply-conversion-actions.mjs --execute; GAQL readback: ENABLED,
      // WEBSITE_CALL, PHONE_CALL_LEAD, ONE_PER_CLICK, 60s, 30d, primary=false, include=false.
      // The AW-.../LABEL pair lives only in Railway (labelEnvVar). Google rejects a view-through
      // window on WEBSITE_CALL (VALUE_MUST_BE_UNSET), so none is declared.
      actionId: "7723091936",
      status: "VERIFIED_LIVE",
      requiredType: "WEBSITE_CALL",
      requiredCategory: "PHONE_CALL_LEAD",
      primaryForGoal: false,
      countingType: "ONE_PER_CLICK",
      includedInConversions: false,
      minimumDurationSeconds: 60,
      clickThroughLookbackDays: 30,
      viewThroughLookbackDays: null,
      currency: "CAD",
      dynamicValue: false,
      valueMode: "NONE",
    },
    // Click-to-call INTENT, deliberately distinct from the 60-second qualified call above.
    // A tel: tap is not a conversation; counting it as one is exactly the mistake
    // conversionMeasurement.diagnosticEvents.phoneClicksAreQualifiedCalls === false exists to
    // prevent. It is measured because tap volume is the leading indicator for the duration-
    // qualified action, and it is excluded from bidding for the same reason it is measured
    // separately. No server-side ID env var: this fires from the browser via gtag send_to, so
    // only the AW-.../LABEL pair is needed and only the label is public.
    clickToCallIntentAction: {
      eventName: "click_to_call_intent",
      envVar: null,
      labelEnvVar: "NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL",
      // 2026-08-16 created by apply-conversion-actions.mjs --execute; GAQL readback: ENABLED,
      // WEBPAGE, PHONE_CALL_LEAD, ONE_PER_CLICK, 30d, primary=false, include=false.
      actionId: "7723091939",
      status: "VERIFIED_LIVE",
      requiredType: "WEBPAGE",
      requiredCategory: "PHONE_CALL_LEAD",
      primaryForGoal: false,
      countingType: "ONE_PER_CLICK",
      includedInConversions: false,
      minimumDurationSeconds: null,
      clickThroughLookbackDays: 30,
      viewThroughLookbackDays: null,
      currency: "CAD",
      dynamicValue: false,
      valueMode: "NONE",
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
    "t shirt", "tshirt", "shirts", "london drugs", "photo lab",
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
    // 2026-08-10 search-term audit. Three families, all zero-capability or zero-intent:
    // (a) competitors with NO conquest ad group — "mr print", "print bros", "pro print",
    //     "lindas printing", "77 signs", "stickermule", plus "walmart" (retail photo-lab
    //     intent, same family as the Aug 6 "london drugs" / "photo lab" negatives).
    // (b) no-capability products — "feather flag" (zero references anywhere in
    //     products.v1.csv or products-content.ts) and "cd label".
    // (c) research / DIY intent — "print your own", "ideas". Same family as the existing
    //     "how to", "diy", and "template" negatives. "who makes" was negated in this pass
    //     then REVERSED by owner correction 2026-08-16 — see the note beside "avery" below.
    //
    // Deliberately NOT negated, and each for a reason that is already precedent in this file:
    // - "staples" and "rayacom": both are COMPETITOR_TERMS with live (paused) conquest ad
    //   groups, so an account-wide negative is blocked by contract — config-validator's
    //   PROTECTED_ACCOUNT_NEGATIVES guard hard-fails them. The narrow competitor-era
    //   negatives "staples printing saskatoon", "staples saskatoon printing", and
    //   "rayacom saskatoon" already carry this intent as Core campaign negatives.
    // - "art print": True Color sells art posters. gallery-projects.ts carries a real-client
    //   "Art Print — Morris Minor" from $15 routed to /photo-poster-printing-saskatoon, and
    //   the Photo Posters ad group's own approved copy says "Photo & Art Poster Prints".
    //   Negating it would repeat the 2026-08-07 owner correction that reinstated photo demand.
    // - "book binding": binding is a real in-house service — products-content.ts describes
    //   coil-bound booklets that True Color "prints, cuts, punches, and binds in-house".
    // - "invitation": invitations are flat card/sheet printing on stock already carried
    //   (postcards from $35, flyers from $45). Same call as the Aug 5 decision to keep
    //   "logo design" and "resume": a real print job is not waste just because no SKU is
    //   named after it.
    "feather flag", "walmart", "mr print", "print bros", "pro print", "lindas printing",
    "77 signs", "stickermule", "cd label", "print your own", "ideas",
    // 2026-08-14 mining (220 terms / CA$75.30 / 7-day window Aug 7-14).
    // (a) plural gap — "custom t shirts saskatoon" drew a paid click past the Aug 6
    //     "t shirt"/"tshirt" negatives because negative keywords do NOT match plurals
    //     or close variants. "t shirts" closes the second door, same as the Aug 7
    //     "shirt printing" fix closed the first.
    // (b) no-capability — "tarpaulin": zero references in products.v1.csv or
    //     products-content.ts (banners are 13oz scrim vinyl, not tarp restitching).
    // (c) buy-a-device intent — "printing press": same family as the existing "machine",
    //     "equipment", "label printers" negatives. "decal printer" was negated in this pass
    //     then REVERSED same day by owner correction — it reads as "a shop that prints
    //     decals" (buyer language, like the kept "business card printer" keyword and the
    //     2026-08-07 "professional sticker printer" correction), not as a device.
    // (d) marketplace competitor with NO conquest ad group — "etsy": same call as the
    //     Aug 10 "stickermule" negative. Not in COMPETITOR_TERMS, so the
    //     PROTECTED_ACCOUNT_NEGATIVES guard does not apply.
    // Deliberately NOT negated this pass:
    // - "staples same day business cards", "can you print stickers at staples",
    //   "vistaprint business cards" — staples/vistaprint are COMPETITOR_TERMS with live
    //   (paused) conquest groups; account-wide negatives are contract-blocked and the
    //   2026-08-07 owner correction says this intent can route to competitor-comparison.
    //   Flagged for the next conquest-activation review instead.
    // - "photo printing saskatoon" (photo posters from $15 — owner-protected Aug 7),
    //   "roll up banner stand" (retractable banners from $219), "bottle label printing"
    //   (labels from $5.50/sqft), vehicle/rv decal family (real decal demand).
    // - "3d printer saskatoon" and "feather flag" clicks in this window are covered by
    //   the Aug 7/10 negatives; whether those reached the live account is verified by
    //   the sync-plan diff run alongside this edit, not by adding duplicates here.
    "t shirts", "tarpaulin", "printing press", "etsy",
    // 2026-08-16 mining pass #3.
    // (a) "avery" — a label-STOCK brand (Avery 5160 etc.). The query is "where do I buy
    //     blank Avery sheets", i.e. the same buy-a-device/buy-supplies family as the
    //     existing "supplies", "label maker", and "label printers" negatives. True Color
    //     prints finished labels on roll vinyl; it does not sell blank sheet stock.
    // (b) "sticker you" — StickerYou, an online sticker marketplace with NO conquest ad
    //     group. Identical call to the Aug 10 "stickermule" and Aug 14 "etsy" negatives:
    //     not in COMPETITOR_TERMS, so PROTECTED_ACCOUNT_NEGATIVES does not block it, and
    //     with no conquest group there is nowhere legitimate for the click to land.
    // 2026-08-16 OWNER REVERSAL — "who makes" REMOVED from this list (added 2026-08-10 under
    // (c) "research / DIY intent"). That read was wrong: "who makes stickers" is not someone
    // researching how stickers are manufactured, it is a local buyer asking WHO to buy from —
    // the same shop-seeking language as the kept "sticker makers" and "vinyl sticker maker"
    // keywords. As a PHRASE account negative it blocked that whole family on all three
    // campaigns. Earlier today the conflict was resolved by deleting the KEYWORD
    // (remove-conflicting-keywords.mjs, since executed); the owner call is the opposite —
    // delete the NEGATIVE and restore the keyword. remove-account-negatives.mjs takes the six
    // live criteria off the account; the keyword is re-created by apply-sync.mjs.
    "avery", "sticker you",
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
      // 2026-08-14: owner approved CA$21 -> CA$35 after budget-limited delivery
      // and three paid-Google-attributed quote requests. The CA$600 account hard stop is unchanged.
      // 2026-08-14 later, SUPERSEDES the 35: owner re-decided at CA$25 with the full pacing
      // picture (burn CA$19.67/day, 21.3% lost IS to budget; the CA$600 hard stop lands
      // ~Aug 31-Sep 1 at 25 vs ~Aug 26 at 35). 25 spends CompetitorConquest's freed CA$4/day
      // and keeps the ENABLED subset exactly at the CA$25 unmonitored-burn bound — the 35
      // reconcile had silently lifted that bound to 35, which this decision reverts. The
      // Canada-wide LOCATION criterion added to Core at 11:42 the same morning (never
      // contract-backed) was removed; live geo re-verified as 3x Saskatoon 35 km proximity only.
      dailyBudgetCad: 25,
      maximumPilotCad: 1150,
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
            // 2026-08-14 owner-picked from the account's search-terms suggestions: shop-seeking
            // buyer language, same family as the kept "sticker makers" / "vinyl sticker maker".
            "print stickers near me",
            // 2026-08-16 RESTORED after owner correction: "who makes stickers" is local buyer
            // intent, so the blocking "who makes" account negative was deleted, not this keyword.
            "who makes stickers",
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
          // 2026-08-12 vehicle routing: mined car/RV searches now have a dedicated quote group.
          // Block the broad sticker terms from absorbing them again.
          // 2026-08-16 "decal"/"decals": the same routing fix, one door further. Decals have
          // TWO dedicated Core groups (Decals -> /products/window-decals, Vehicle Decals ->
          // /vehicle-decals-saskatoon) and a boat group; a decal query absorbed here lands on
          // the sticker configurator instead. Both singular and plural are listed because
          // negative keywords do not match plurals — the exact gap the 2026-08-14
          // "t shirt" -> "t shirts" fix was opened by.
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "car", "vehicle", "rv", "decal", "decals"],
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
          terms: [
            "business cards saskatoon", "business card printing saskatoon",
            "order business cards online", "business card printing",
            // 2026-08-12 mined, clicked buyer language routed to the orderable calculator.
            "same day business cards printing", "business card price list", "business card printer",
          ],
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
        // 2026-08-12 DESTINATION REPOINT — /printing-prices-saskatoon -> /why-true-color.
        //
        // The /why-true-color price strip is now live above the mobile fold, satisfying the
        // precondition for moving this high-volume generic-price group onto the instrumented paid
        // landing page. Destination is the only experiment variable: variant-B copy, terms, and
        // cross-negatives remain byte-identical.
        //
        // VARIANT A IS DROPPED FROM THE CONTRACT and will be PAUSED, never edited, in the same
        // atomic swap as the old variant B. Leaving either old ad enabled would split the group
        // across two destinations and make the experiment unreadable.
        coreGroup({
          key: "generic-print-price", name: "Generic Print Price", product: "printing",
          finalUrl: `${ROOT}/why-true-color?source=google-ads`,
          terms: ["printing prices saskatoon", "print shop prices saskatoon", "printing quote saskatoon", "printing saskatoon", "printing services saskatoon", "saskatoon printing services", "print shop saskatoon", "print shops saskatoon", "saskatoon print shops", "saskatoon printing", "printing in saskatoon", "printers saskatoon"],
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
          // 2026-08-10: eight product cross-negatives added. This group targets the generic
          // "what does printing cost in Saskatoon" query and lands on a price-index page, so
          // any query that names a specific product must route to that product's own group
          // and its orderable destination instead of being absorbed here. Routing, not waste.
          crossNegatives: [
            "same day", "rush", "sign shop", "sign company",
            "photo printing", "poster printing", "sticker printing", "banner printing",
            "business card", "flyer printing", "coroplast", "decal",
          ],
        }),
        // 2026-08-07 owner correction: "photo printing saskatoon" is not waste. True Color
        // sells photo posters from $15, so route photo-printing demand to the dedicated
        // photo-poster landing page instead of letting Generic Print Price absorb it.
        coreGroup({
          key: "photo-posters", name: "Photo Posters", product: "photo posters",
          finalUrl: `${ROOT}/photo-poster-printing-saskatoon`,
          terms: [
            "photo printing saskatoon", "photo poster printing saskatoon",
            // 2026-08-12 mined poster demand; this page opens the Photo Posters configurator.
            "poster printing saskatoon", "big poster printing",
          ],
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
        // 2026-08-10 DESTINATION REPOINT — /sign-company-saskatoon -> /why-true-color.
        //
        // WHY: this group spent CA$13.87 over 8 clicks on /sign-company-saskatoon and produced
        // ZERO funnel events, because that page emits none — it is an organic SEO page with no
        // paid instrumentation, no price above the fold, and Google rates its landing-page
        // experience BELOW_AVERAGE (the QS-3 cluster). /why-true-color is the opposite on every
        // axis: fully instrumented for paid (view_paid_landing, select_item, paid_landing_cta,
        // click_to_call, generate_lead), 8 priced product cards above the fold, no site-nav
        // escape hatches, noindex, and it currently serves nothing — it was built for the
        // Competitor campaign that was RETIRED 2026-08-09, so it has never received a paid click.
        //
        // /sign-company-saskatoon is NOT edited. It is RECOVERING (34.9 -> 24.0, 259 imp) and
        // protected by seo-protected-pages.md. The AD moves; the PAGE stays for organic. This is
        // the destination experiment the 2026-08-09 retirement entry said must ship on its own.
        //
        // ONE VARIABLE PER CHANGE: copy below is byte-identical to the pre-repoint contract. The
        // headlines still sell signs and every number still resolves in approved-claims.mjs;
        // /why-true-color carries coroplast/ACP/vinyl cards, so the copy stays destination-
        // consistent without editing it. No rule requires a copy change here, so none is made —
        // otherwise the result cannot be attributed to the destination.
        //
        // VARIANT A IS DROPPED FROM THIS GROUP — the contract-side half of the destination change.
        // `headlines` used to build the legacy variant-A ad ("Saskatoon Sign Shop", "Custom Signs
        // Saskatoon", "Explore Local Sign Options" + the 10 shared UI headlines). That live ad is
        // NOT edited and NOT removed: replace-stale-price-ads --swap PAUSES it, because a control
        // arm still pointing at /sign-company-saskatoon would split this group's traffic across
        // two landing pages and make the destination experiment unreadable. Once it stops serving
        // it is no longer part of the contract's inventory, and saying otherwise would make
        // EXPECTED_TOTAL_RESPONSIVE_SEARCH_ADS disagree with the account by exactly one ad.
        // This group now ships variant B alone, like photo-posters, decals, and boat.
        coreGroup({
          key: "generic-sign-shop", name: "Generic Sign Shop", product: "signs",
          finalUrl: `${ROOT}/why-true-color?source=google-ads`,
          terms: ["sign shop saskatoon", "sign company saskatoon", "custom signs saskatoon", "saskatoon sign company", "sign companies saskatoon", "saskatoon signs", "signage saskatoon"],
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
          // 2026-08-12: vehicle terms moved to their own quote group below. These phrase
          // negatives keep generic storefront/window decal keywords from stealing the clicks.
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "boat", "car", "vehicle", "rv"],
        }),
        // 2026-08-12: seven search terms already served through broad sticker/decal keywords,
        // spending CA$10+ on the wrong storefront-window/sticker destinations. Vehicle work is
        // print plus job-specific installation, so it gets one destination and one CTA:
        // /vehicle-decals-saskatoon -> /quote. Ships variant B only; no fake legacy control.
        coreGroup({
          key: "vehicle-decals", name: "Vehicle Decals", product: "vehicle decals",
          finalUrl: `${ROOT}/vehicle-decals-saskatoon`,
          terms: [
            "car stickers near me",
            "custom car stickers",
            "vehicle stickers custom",
            "custom car advertising stickers",
            "rv vinyl decals",
            "car window decals canada",
            "car decals saskatoon",
          ],
          variantB: [
            "Vehicle Decals From $25",
            "Custom Car Decals Saskatoon",
            "Car & Truck Door Decals",
            "Vehicle Lettering Saskatoon",
            "RV Vinyl Decals",
            "Rear Window Decals",
            "Business Vehicle Graphics",
            "Custom Car Stickers",
            "Printed & Installed Locally",
            "Quote Vehicle Decals",
          ],
          priceLine: "Print-only vehicle decals from $25 order total. Installation quoted separately.",
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "boat", "storefront"],
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
      // RETIRED 2026-08-09 on the owner's call, three days early against the 2026-08-12 gate.
      // The gate's own stop-condition was met: zero impressions across the whole pilot, and
      // Core's search terms stayed clean of competitor queries after the Aug 6 15:58 routing
      // sync. Both halves of "conclude thin volume and pause" are satisfied. The budget stays
      // at 4 (exactly the Brand precedent) so the contract TOTAL that
      // LAUNCHABLE_DAILY_BUDGET_CAD asserts does not move; maximumPilotCad drops to 0 because
      // a paused campaign contributes nothing to the qualifying-spend plan.
      status: "PAUSED",
      dailyBudgetCad: 4,
      maximumPilotCad: 0,
      campaignNegatives: [],
      gates: [],
      adGroups: competitorTargets.map(([key, name, terms]) => ({
        key,
        name: `Comparison - ${name}`,
        // Children held PAUSED as defence-in-depth, same as Brand: if this campaign is ever
        // re-enabled by accident (UI, script, or restore), paused children still serve nothing.
        status: "PAUSED",
        launchTier: "RETIRED_THIN_VOLUME",
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
