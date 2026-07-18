const ROOT = "https://truecolorprinting.ca";

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

const keyword = (text, matchType) => ({ text, matchType });
const exactPhrase = (terms) => terms.flatMap((term) => [keyword(term, "EXACT"), keyword(term, "PHRASE")]);

const coreGroup = ({ key, name, product, finalUrl, terms, headlines, crossNegatives = [] }) => ({
  key,
  name,
  status: "PAUSED",
  finalUrl,
  keywords: exactPhrase(terms),
  crossNegatives,
  rsa: rsa(product, headlines),
});

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
  status: "PAUSED",
  channel: "SEARCH",
  networks: { googleSearch: true, searchPartners: false, display: false },
  geoTarget: { criterionId: 1002791, name: "Saskatoon, Saskatchewan, Canada", presenceOnly: true },
  language: "English",
};

const competitorTargets = [
  ["qwik-signs", "Qwik Signs", ["qwik signs"]],
  ["minuteman-press", "Minuteman Press", ["minuteman press saskatoon"]],
  ["24-hour-signs", "24 Hour Signs", ["24 hour signs"]],
  ["anytime-printing", "Anytime Printing", ["anytime printing"]],
  ["pgi-printers", "PGI Printers", ["pgi printers"]],
  ["staples-printing", "Staples Printing", ["staples printing saskatoon"]],
  ["vistaprint", "Vistaprint", ["vistaprint saskatoon"]],
];

export const paidSearchConfig = {
  schemaVersion: 1,
  generatedFor: "True Color Display Printing Ltd.",
  currency: "CAD",
  accountCustomerId: "1072816342",
  pilot: {
    startDate: "2026-07-20",
    endDate: "2026-08-18",
    inclusiveDays: 30,
    regenerateDatesIfGatesNotClearedByStart: true,
    hardStopRequired: true,
    generatorAutoRollsDates: false,
    dateChangeRequiresApprovedContractChange: true,
  },
  maximum30DayCad: 1500,
  bidding: {
    strategy: "MAXIMIZE_CLICKS",
    cpcCeilingCad: null,
    cpcCeilingGate: "CURRENT_KEYWORD_PLANNER_FORECAST",
  },
  tracking: {
    autoTaggingRequired: true,
    finalUrlSuffix: "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&keyword={keyword}&matchtype={matchtype}&device={device}&loc_physical_ms={loc_physical_ms}&loc_interest_ms={loc_interest_ms}&adgroupid={adgroupid}&creative={creative}&campaignid={campaignid}&network={network}",
  },
  liveGoogleAds: {
    apiVersion: "v24",
    status: "VALIDATED_PAUSED",
    validatedAt: "2026-07-17",
    managerCustomerId: "1125402990",
    managerLinkId: "6626494765",
    billingSetupId: "8490021913",
    purchaseConversionActionId: "7689029977",
    purchaseConversionDestination: "AW-18330693756/F1pQCNmStdIcEPzg4KRE",
    campaignIds: {
      GOOG_Search_TC_CoreProducts_2026: "24048123058",
      GOOG_Search_TC_CompetitorConquest_2026: "24048123061",
      GOOG_Search_TC_BrandDefense_2026: "24048123064",
    },
    counts: { campaigns: 3, adGroups: 17, positiveKeywords: 76, negativeCriteria: 127, responsiveSearchAds: 17 },
    policyApprovalStatus: "UNKNOWN",
    spendCad: 0,
  },
  approvedClaims: [
    { text: "Rated 4.9 From 43 Reviews", source: "Known Google review proof: 4.9 rating from 43 reviews" },
    { text: "Work with a Saskatoon print shop rated 4.9 from 43 Google reviews.", source: "Known Google review proof: 4.9 rating from 43 reviews" },
  ],
  launchControls: {
    sourceLessons: ["WILKIE", "DUBOIS"],
    mobilePostClickQaRequired: true,
    oneDomainOnly: "truecolorprinting.ca",
    cityPresenceOnlyCriterionId: 1002791,
    searchOnly: true,
    allowedMatchTypes: ["EXACT", "PHRASE"],
    noBroadeningToManufactureVolume: true,
    realAttributablePaidTestOrderRequired: true,
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
    { code: "CONVERSION_ACTION", status: "VERIFIED", required: "Owned conversion action and verified label", evidence: "Purchase - Website (True Color), action 7689029977, destination AW-18330693756/F1pQCNmStdIcEPzg4KRE" },
    { code: "PROMOTION_ELIGIBILITY", status: "BLOCKED", required: "CA$600 offer eligibility and exact terms confirmed in Billing → Promotions" },
    { code: "PURCHASE_TAG_DEPLOYED", status: "BLOCKED", required: "Verified purchase destination deployed to Railway and observed on the live site" },
    { code: "RSA_POLICY_APPROVAL", status: "BLOCKED", required: "All launch-candidate RSAs approved by Google Ads policy review" },
    { code: "AUCTION_INSIGHTS_SIGNOFF", status: "BLOCKED", required: "Brand campaign justified by Auction Insights or kept paused" },
    { code: "ENHANCED_CONSENT_DECISION", status: "BLOCKED", required: "Purpose-specific enhanced-consent decision" },
    { code: "CURRENT_KEYWORD_PLANNER_FORECAST", status: "BLOCKED", required: "Current forecast from the correct account and approved CPC ceiling", evidence: "2026-07-17 True Color forecast complete; CA$4.00 ceiling recommended and awaiting approval" },
    { code: "BUDGET_APPROVAL", status: "BLOCKED", required: "Pilot budgets approved" },
    { code: "DATES_AND_HARD_STOP", status: "BLOCKED", required: "Current dates, end date, monitoring, and hard stop confirmed" },
    { code: "MOBILE_QA", status: "BLOCKED", required: "Mobile landing-page and conversion-flow QA" },
    { code: "ATTRIBUTABLE_TEST_ORDER", status: "BLOCKED", required: "Real attributable test order before launch" },
    { code: "LAUNCH_CONTROL_SIGNOFF", status: "BLOCKED", required: "Wilkie/Dubois launch controls reviewed and signed off" },
    { code: "PRESENCE_ONLY_AND_EDITOR_PREVIEW", status: "BLOCKED", required: "Presence-only set manually/API and confirmed in Google Ads Editor/account preview" },
  ],
  accountNegatives: exactPhrase([
    "jobs", "hiring", "salary", "career", "course", "class", "tutorial", "printer repair",
    "used printer", "printer ink", "3d printing", "home printer",
  ]),
  campaigns: [
    {
      ...campaignBase,
      kind: "CORE",
      name: "GOOG_Search_TC_CoreProducts_2026",
      dailyBudgetCad: 40,
      maximum30DayCad: 1200,
      campaignNegatives: competitorTargets.flatMap(([, , terms]) => terms),
      gates: [],
      adGroups: [
        coreGroup({
          key: "coroplast", name: "Coroplast Signs", product: "coroplast signs",
          finalUrl: `${ROOT}/products/coroplast-signs`,
          terms: ["coroplast signs saskatoon", "coroplast signs", "coroplast sign printing"],
          headlines: ["Order Coroplast Signs", "Coroplast Signs Saskatoon", "Price Coroplast Signs"],
          crossNegatives: ["stickers", "labels", "vinyl banner", "business cards", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "stickers-labels", name: "Stickers and Labels", product: "stickers and labels",
          finalUrl: `${ROOT}/products/stickers`,
          terms: ["custom stickers saskatoon", "sticker printing saskatoon", "custom labels saskatoon"],
          headlines: ["Order Custom Stickers", "Stickers Printed Locally", "Custom Labels Saskatoon"],
          crossNegatives: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "vinyl-banners", name: "Vinyl Banners", product: "vinyl banners",
          finalUrl: `${ROOT}/products/vinyl-banners`,
          terms: ["vinyl banners saskatoon", "banner printing saskatoon", "custom vinyl banners"],
          headlines: ["Order Vinyl Banners", "Vinyl Banners Saskatoon", "Price Custom Banners"],
          crossNegatives: ["coroplast", "stickers", "labels", "business cards", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "business-cards", name: "Business Cards", product: "business cards",
          finalUrl: `${ROOT}/products/business-cards`,
          terms: ["business cards saskatoon", "business card printing saskatoon", "order business cards online"],
          headlines: ["Order Business Cards", "Business Cards Saskatoon", "Price Business Cards"],
          crossNegatives: ["coroplast", "stickers", "labels", "vinyl banner", "flyers", "retractable banner"],
        }),
        coreGroup({
          key: "flyers", name: "Flyers", product: "flyers",
          finalUrl: `${ROOT}/products/flyers`,
          terms: ["flyer printing saskatoon", "custom flyers saskatoon", "order flyers online"],
          headlines: ["Order Custom Flyers", "Flyer Printing Saskatoon", "Price Flyers Online"],
          crossNegatives: ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "retractable banner"],
        }),
        coreGroup({
          key: "retractable-banners", name: "Retractable Banners", product: "retractable banners",
          finalUrl: `${ROOT}/products/retractable-banners`,
          terms: ["retractable banners saskatoon", "retractable banner printing", "pull up banners saskatoon"],
          headlines: ["Order Retractable Banners", "Retractable Banner Print", "Pull Up Banners Saskatoon"],
          crossNegatives: ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "flyers"],
        }),
        coreGroup({
          key: "rush-same-day", name: "Rush and Same Day", product: "rush printing",
          finalUrl: `${ROOT}/same-day-printing-saskatoon`,
          terms: ["same day printing saskatoon", "rush printing saskatoon", "urgent printing saskatoon"],
          headlines: ["Rush Printing Saskatoon", "Explore Same Day Printing", "Local Rush Print Options"],
          crossNegatives: ["business cards", "flyers", "stickers", "banners", "coroplast"],
        }),
        coreGroup({
          key: "generic-print-price", name: "Generic Print Price", product: "printing",
          finalUrl: `${ROOT}/printing-prices-saskatoon`,
          terms: ["printing prices saskatoon", "print shop prices saskatoon", "printing quote saskatoon"],
          headlines: ["Printing Prices Saskatoon", "See Printing Prices Online", "Configure Printing Online"],
          crossNegatives: ["same day", "rush", "sign shop", "sign company"],
        }),
        coreGroup({
          key: "generic-sign-shop", name: "Generic Sign Shop", product: "signs",
          finalUrl: `${ROOT}/sign-company-saskatoon`,
          terms: ["sign shop saskatoon", "sign company saskatoon", "custom signs saskatoon"],
          headlines: ["Saskatoon Sign Shop", "Custom Signs Saskatoon", "Explore Local Sign Options"],
          crossNegatives: ["same day", "rush", "printing prices", "print shop prices"],
        }),
      ],
    },
    {
      ...campaignBase,
      kind: "COMPETITOR",
      name: "GOOG_Search_TC_CompetitorConquest_2026",
      dailyBudgetCad: 7,
      maximum30DayCad: 210,
      campaignNegatives: [],
      gates: [],
      adGroups: competitorTargets.map(([key, name, terms]) => ({
        key,
        name: `Comparison - ${name}`,
        status: "PAUSED",
        finalUrl: `${ROOT}/why-true-color`,
        keywords: exactPhrase(terms),
        crossNegatives: [],
        rsa: neutralCompetitorRsa,
      })),
    },
    {
      ...campaignBase,
      kind: "BRAND",
      name: "GOOG_Search_TC_BrandDefense_2026",
      dailyBudgetCad: 3,
      maximum30DayCad: 90,
      campaignNegatives: [],
      gates: ["AUCTION_INSIGHTS_REQUIRED"],
      adGroups: [{
        key: "true-color-brand",
        name: "True Color Brand",
        status: "PAUSED",
        finalUrl: `${ROOT}/`,
        keywords: exactPhrase(["true color printing", "true colour printing", "true color saskatoon", "true color display printing"]),
        crossNegatives: [],
        rsa: rsa("printing", ["True Color Printing", "True Color Saskatoon", "True Color Print Shop"]),
      }],
    },
  ],
};

export default paidSearchConfig;
