import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  SOURCED_FACTS,
  VERIFIED_ON,
  PRICING_SOURCE_FILE,
  claimFailureReason,
  hasPriceClaim,
  approvedClaims as SOURCED_APPROVED_CLAIMS,
} from "../../docs/paid-search/approved-claims.mjs";

// A PAUSED campaign keeps its staged daily budget but contributes CA$0 to approved pilot spend.
const EXPECTED = {
  CORE: { name: "GOOG_Search_TC_CoreProducts_2026", daily: 35, maximum: 1610, status: "ENABLED" },
  // 2026-08-09 RETIRED: zero impressions across the whole pilot, and Core's search terms stayed
  // clean of competitor queries after the Aug 6 15:58 routing sync — both halves of the
  // 2026-08-12 gate's "conclude thin volume and pause" branch.
  COMPETITOR: { name: "GOOG_Search_TC_CompetitorConquest_2026", daily: 4, maximum: 0, status: "PAUSED" },
  BRAND: { name: "GOOG_Search_TC_BrandDefense_2026", daily: 3, maximum: 0, status: "PAUSED" },
};
const PILOT_START_DATE = "2026-08-03";
const PILOT_END_DATE = "2026-09-17";
const PILOT_INCLUSIVE_DAYS = 46;
// 2026-08-07: 25 -> 28 (Core 21 + Competitor 4 + Brand 3). This is the contract TOTAL across
// all three campaigns and is deliberately NOT the safety bound. It stays 28 through the
// 2026-08-09 Competitor retirement on purpose: a paused campaign keeps its staged budget, so
// the total is unchanged and this assertion still catches an unintended budget edit.
// MAX_UNMONITORED_DAILY_BURN_CAD binds the ENABLED subset, which the retirement drops from
// CA$25 (Core 21 + Competitor 4, exactly at the bound) to CA$21 (Core alone) — CA$4 of fresh
// headroom under the bound, available to Core on evidence without touching the safety ceiling.
const LAUNCHABLE_DAILY_BUDGET_CAD = 42;
// Enabled-only daily burn ceiling. At CA$18/day an unmonitored account needs 33 days to reach
// the CA$600 ceiling, which is far longer than any plausible monitor outage goes unnoticed.
const MAX_UNMONITORED_DAILY_BURN_CAD = 35;
const launchableDailyBudgetCad = (campaigns) => campaigns
  .filter((campaign) => campaign.status === "ENABLED")
  .reduce((sum, campaign) => sum + (campaign.dailyBudgetCad ?? 0), 0);
const REQUIRED_GATES = [
  "TRUE_COLOR_CUSTOMER_ID", "BILLING_ACTIVE", "AUTO_TAGGING_ENABLED",
  "PURCHASE_UPLOAD_CLICKS_ACTION", "QUOTE_WON_UPLOAD_CLICKS_ACTION", "CONVERSION_GOAL_GRAPH", "OFFLINE_UPLOADER_MIGRATION", "PURCHASE_UPLOAD_CLICKS_OBSERVED", "QUOTE_WON_UPLOAD_CLICKS_OBSERVED",
  "QUALIFIED_CALL_ACTION",
  "PROMOTION_ELIGIBILITY", "COMPETITOR_LANDING_DEPLOYED", "RSA_POLICY_APPROVAL", "AUCTION_INSIGHTS_SIGNOFF",
  "ENHANCED_CONSENT_DECISION", "CURRENT_KEYWORD_PLANNER_FORECAST", "CPC_CEILING_LAUNCH_APPROVAL", "BUDGET_APPROVAL",
  "DATES_AND_HARD_STOP", "MOBILE_QA", "LAUNCH_CONTROL_SIGNOFF",
  "PRESENCE_ONLY_AND_EDITOR_PREVIEW",
];
const VERIFIED_GATE_EVIDENCE = new Map([
  ["TRUE_COLOR_CUSTOMER_ID", "True Color Display Print child account 107-281-6342 under manager 112-540-2990"],
  ["BILLING_ACTIVE", "Billing APPROVED in customer 1072816342; setup 8490021913"],
  ["AUTO_TAGGING_ENABLED", "Auto-tagging enabled in customer 1072816342"],
  ["PURCHASE_UPLOAD_CLICKS_ACTION", "Action 7694360837 purchase_online is enabled, primary, included, dynamic CAD, and owned by customer 1072816342"],
  ["QUOTE_WON_UPLOAD_CLICKS_ACTION", "Action 7694360840 quote_won is enabled, primary, included, dynamic CAD, and owned by customer 1072816342"],
  ["CONVERSION_GOAL_GRAPH", "2026-07-23 readback: customer purchase goal biddable with actions 7694360837 and 7694360840; page-view and call goals non-biddable; historical action 7689029977 secondary and excluded"],
  ["OFFLINE_UPLOADER_MIGRATION", "Google Data Manager events:ingest plus asynchronous request diagnostics are deployed in production; real purchase_online and quote_won observation remain separate gates"],
  ["QUALIFIED_CALL_ACTION", "Action 7694360843 qualified_call_60s is enabled with 60-second duration, secondary, excluded, and its customer goal is non-biddable"],
  ["PROMOTION_ELIGIBILITY", "Owner-confirmed and 2026-07-25 direct-customer API readback: CAD 600 reward, CAD 600 qualifying spend, REDEEMED, fulfillment expiry 2026-09-16 UTC"],
  ["COMPETITOR_LANDING_DEPLOYED", "Live /why-true-color returned HTTP 200 with noindex and working paid-page product routes on 2026-07-23"],
  ["RSA_POLICY_APPROVAL", "2026-07-25 v24 readback: all 19 RSAs, including all nine Competitor RSAs, APPROVED / REVIEWED with no policy topics"],
  ["CURRENT_KEYWORD_PLANNER_FORECAST", "2026-07-17 True Color forecast read from customer 1072816342; forecast-optimal ceilings Core CA$4.00, Competitor CA$2.50, Brand CA$1.50 staged while paused"],
]);
// Last OBSERVED live account state. The account remains paused on the pre-promo-chase budgets and
// ceilings until the owner performs the manual launch, so this snapshot is intentionally decoupled
// from the target budgets, ceilings, dates, and statuses asserted elsewhere in this file.
const LIVE_GOOGLE_ADS = {
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
};
const CONVERSION_MEASUREMENT = {
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
};
const COMPETITOR_TERMS = ["qwik signs", "minuteman press", "ink house", "rayacom", "24 hour signs", "anytime printing", "pgi printers", "staples", "vistaprint", "vista print", "print baron", "mister print", "labels made easy"];
// The exact tracked paid-landing destination. `?source=google-ads` is load-bearing, not cosmetic:
// live-verify-paused fetches this precise href and asserts the paid-page marker, HTML content
// type, noindex, and no redirect. A group routed to bare /why-true-color would pass the pathname
// check and silently fall outside that verification.
//
// 2026-08-10 GENERALISED off Competitor. Until today this constant existed only inside a
// `kind === "COMPETITOR"` branch, which encoded an accident of history — /why-true-color was built
// for the (now RETIRED) Competitor campaign — as if it were a rule. It is a paid landing page, not
// a competitor landing page. Any campaign kind may route to it; what must never relax is that the
// href is EXACT. CORE groups opt in through TRACKED_HREF_ROUTES below, so the pathname map stays
// the single source of truth for every other destination.
const TRACKED_PAID_LANDING_HREF = "https://truecolorprinting.ca/why-true-color?source=google-ads";
// Core groups whose destination is the tracked paid landing page rather than a plain path. Keyed
// by group key so adding one is a one-line, reviewable contract decision.
const TRACKED_HREF_ROUTES = {
  "generic-print-price": TRACKED_PAID_LANDING_HREF,
  "generic-sign-shop": TRACKED_PAID_LANDING_HREF,
};
const ROUTES = {
  coroplast: "/products/coroplast-signs",
  "stickers-labels": "/products/stickers",
  "vinyl-banners": "/products/vinyl-banners",
  "business-cards": "/products/business-cards",
  flyers: "/products/flyers",
  "retractable-banners": "/products/retractable-banners",
  "rush-same-day": "/same-day-printing-saskatoon",
  // 2026-08-12: repointed after the /why-true-color price strip shipped above the mobile fold.
  // The SEO price page stays untouched; paid traffic moves to the instrumented paid page.
  "generic-print-price": "/why-true-color",
  "photo-posters": "/photo-poster-printing-saskatoon",
  // 2026-08-10: repointed off /sign-company-saskatoon. That page emits zero analytics events and
  // carries a BELOW_AVERAGE landing-page-experience rating; it stays live and untouched for
  // organic (RECOVERING, protected). Paid now lands on the instrumented paid page — see
  // TRACKED_HREF_ROUTES, which additionally pins the exact ?source=google-ads href.
  "generic-sign-shop": "/why-true-color",
  decals: "/products/window-decals",
  "vehicle-decals": "/vehicle-decals-saskatoon",
  "large-format": "/large-format-printing-saskatoon",
  // Second Core group routed to an SEO landing page rather than a /products configurator
  // (after large-format). Deliberate: the boat queries are compliance questions — how big,
  // where on the hull, what colour — and the landing page answers them with the configurator
  // one click away. /products/* is noindex by header, so it is the worse ad destination.
  boat: "/boat-registration-numbers",
};
const CORE_TERMS = {
  coroplast: ["coroplast signs saskatoon", "coroplast signs", "coroplast sign printing", "coroplast printing"],
  "stickers-labels": [
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
    "custom sticker lettering",
    "custom labels",
    "vinyl sticker maker",
    "sticker makers",
  ],
  "vinyl-banners": ["vinyl banners saskatoon", "banner printing saskatoon", "custom vinyl banners", "banner printing", "banner with grommets"],
  "business-cards": [
    "business cards saskatoon", "business card printing saskatoon", "order business cards online",
    "business card printing", "same day business cards printing", "business card price list",
    "business card printer",
  ],
  flyers: ["flyer printing saskatoon", "custom flyers saskatoon", "order flyers online", "flyer printing", "flyers printing"],
  "retractable-banners": ["retractable banners saskatoon", "retractable banner printing", "pull up banners saskatoon", "trade show banners printing", "retractable banner"],
  "rush-same-day": ["same day printing saskatoon", "rush printing saskatoon", "urgent printing saskatoon", "same day printing"],
  "generic-print-price": ["printing prices saskatoon", "print shop prices saskatoon", "printing quote saskatoon", "printing saskatoon", "printing services saskatoon", "saskatoon printing services", "print shop saskatoon", "print shops saskatoon", "saskatoon print shops", "saskatoon printing", "printing in saskatoon", "printers saskatoon"],
  "photo-posters": ["photo printing saskatoon", "photo poster printing saskatoon", "poster printing saskatoon", "big poster printing"],
  "generic-sign-shop": ["sign shop saskatoon", "sign company saskatoon", "custom signs saskatoon", "saskatoon sign company", "sign companies saskatoon", "saskatoon signs", "signage saskatoon"],
  "large-format": ["large format printing", "large format printing saskatoon", "large format signs"],
  decals: ["decals saskatoon", "clear window decals for business", "window decals saskatoon", "custom decals"],
  "vehicle-decals": [
    "car stickers near me", "custom car stickers", "vehicle stickers custom",
    "custom car advertising stickers", "rv vinyl decals", "car window decals canada",
    "car decals saskatoon",
  ],
  // 2026-08-06: boat terms split out of `decals` — one destination per ad group, and these
  // two proven queries now land on /boat-registration-numbers.
  boat: ["custom boat decals", "boat decals near me"],
};
const CORE_CROSS_NEGATIVES = {
  coroplast: ["stickers", "labels", "vinyl banner", "business cards", "flyers", "retractable banner"],
  "stickers-labels": ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "car", "vehicle", "rv"],
  "vinyl-banners": ["coroplast", "stickers", "labels", "business cards", "flyers", "retractable banner"],
  "business-cards": ["coroplast", "stickers", "labels", "vinyl banner", "flyers", "retractable banner"],
  flyers: ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "retractable banner"],
  "retractable-banners": ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "flyers"],
  "rush-same-day": ["business cards", "flyers", "stickers", "banners", "coroplast"],
  "generic-print-price": [
    "same day", "rush", "sign shop", "sign company",
    "photo printing", "poster printing", "sticker printing", "banner printing",
    "business card", "flyer printing", "coroplast", "decal",
  ],
  "photo-posters": ["stickers", "labels", "business cards", "flyers"],
  "generic-sign-shop": ["same day", "rush", "printing prices", "print shop prices"],
  "large-format": ["stickers", "labels", "business cards", "flyers"],
  decals: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "boat", "car", "vehicle", "rv"],
  "vehicle-decals": ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "boat", "storefront"],
  boat: ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner", "window decals"],
};
const COMPETITOR_GROUPS = {
  "qwik-signs": ["qwik signs"],
  "minuteman-press": ["minuteman press saskatoon"],
  "ink-house": ["ink house saskatoon"],
  rayacom: ["rayacom saskatoon"],
  "24-hour-signs": ["24 hour signs"],
  "anytime-printing": ["anytime printing"],
  "pgi-printers": ["pgi printers"],
  "staples-printing": ["staples printing saskatoon", "staples saskatoon printing"],
  vistaprint: ["vistaprint saskatoon", "vista print"],
  "print-baron": ["print baron saskatoon"],
  "mister-print": ["mister print saskatoon"],
  "labels-made-easy": ["labels made easy"],
};
const BRAND_GROUPS = {
  "true-color-brand": ["true color printing", "true colour printing", "true color saskatoon", "true color display printing"],
};
const REQUIRED_ACCOUNT_NEGATIVES = [
  "jobs", "hiring", "salary", "career", "course", "class", "tutorial", "printer repair",
  "used printer", "printer ink", "3d printing", "home printer", "free", "template", "diy",
  "how to", "canva", "download", "printable", "machine", "equipment", "supplies",
  "screen printing", "photocopy", "document printing", "print outs",
  "label maker", "label printers",
  "t shirt", "tshirt", "shirts", "london drugs", "photo lab",
  "canvas", "shirt printing", "3d printer",
  // 2026-08-10 search-term audit: untargeted competitors, no-capability products, research
  // intent. "staples", "rayacom", "art print", "book binding", and "invitation" were audited
  // in the same pass and deliberately excluded — see the rationale block in campaign-config.mjs.
  "feather flag", "walmart", "mr print", "print bros", "pro print", "lindas printing",
  "77 signs", "stickermule", "cd label", "who makes", "print your own", "ideas",
  // 2026-08-14 mining: plural gap ("t shirts" — negatives don't match plurals), no-capability
  // ("tarpaulin"), buy-a-device ("printing press"), marketplace competitor with no conquest
  // group ("etsy" — stickermule precedent). "decal printer" was negated then reversed same
  // day by owner correction (buyer language, not a device). Full rationale + the
  // deliberately-NOT-negated list in campaign-config.mjs.
  "t shirts", "tarpaulin", "printing press", "etsy",
];
const PROTECTED_ACCOUNT_NEGATIVES = ["near me", "online", "cheap", ...COMPETITOR_TERMS];
// Claim validation moved to docs/paid-search/approved-claims.mjs (2026-08-06).
//
// The old rule banned EVERY digit unless the exact string sat on a 3-entry allowlist. It was
// meant to stop unsourced claims and instead stopped all claims — the ads could not state a
// price, a turnaround, or a quantity, which put this contract in direct conflict with
// .claude/rules/brand-voice.md. The registry keeps the guard and fixes the aim: every numeric
// token must resolve to a fact with a named source, guarantees are permanently banned, and
// turnaround wording requires an attached price or condition.
//
// LEGACY EXEMPTION: variant-A RSAs are live and policy-APPROVED, must stay byte-identical, and
// were written under the old ban — so their vague rush wording is checked without the
// condition-qualifier rule. New copy gets no such exemption. Retire with variant A.
const LEGACY_CLAIM_OPTS = { requireConditionQualifier: false };
const STRICT_CLAIM_OPTS = { requireConditionQualifier: true };
const MAX_SHARED_HEADLINES_PER_GROUP = 5;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");

/**
 * The moment ads carry real prices, a CSV repricing silently makes every live ad false.
 * Fail validation when the pricing source is newer than the date the facts were last checked.
 */
const pricingSourceUpdatedOn = () => {
  try {
    const text = readFileSync(path.join(REPO_ROOT, PRICING_SOURCE_FILE), "utf8");
    return text.match(/\*\*Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  } catch {
    return null;
  }
};
const TRACKING_MAPPINGS = {
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "{campaignid}",
  utm_term: "{keyword}",
  utm_content: "{creative}",
  keyword: "{keyword}",
  matchtype: "{matchtype}",
  device: "{device}",
  loc_physical_ms: "{loc_physical_ms}",
  loc_interest_ms: "{loc_interest_ms}",
  adgroupid: "{adgroupid}",
  creative: "{creative}",
  campaignid: "{campaignid}",
  network: "{network}",
};
const REQUIRED_CALLOUTS = [
  "Coroplast Signs From $25", "Banners From $66", "250 Cards $45",
  "Same-Day Rush +$40 Flat", "Design $40 Flat", "4.9 From 43 Reviews",
];
const REQUIRED_SITELINK_PATHS = [
  "/products/coroplast-signs", "/products/stickers", "/products/vinyl-banners",
  "/products/business-cards", "/products/flyers", "/products/retractable-banners",
];

const daysInclusive = (start, end) => {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return NaN;
  return Math.round((endMs - startMs) / 86_400_000) + 1;
};
const stringValues = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringValues);
  return [];
};
const sameSet = (actual, expected) => {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  return actualSorted.length === expectedSorted.length && actualSorted.every((item, index) => item === expectedSorted[index]);
};
const hasExactPhrasePairs = (keywords, terms) => {
  if (keywords?.length !== terms.length * 2) return false;
  return terms.every((term) => ["EXACT", "PHRASE"].every((matchType) => keywords.some((keyword) => keyword.text === term && keyword.matchType === matchType)));
};
const hasExactOnly = (keywords, terms) => keywords?.length === terms.length
  && terms.every((term) => keywords.some((keyword) => keyword.text === term && keyword.matchType === "EXACT"));

export function validateConfig(config) {
  const errors = [];
  const fail = (message) => errors.push(message);
  const start = config.pilot?.startDate;
  const end = config.pilot?.endDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(end ?? "") || daysInclusive(start, end) !== PILOT_INCLUSIVE_DAYS) {
    fail(`Pilot must have valid ISO dates spanning exactly ${PILOT_INCLUSIVE_DAYS} inclusive days`);
  }
  if (start !== PILOT_START_DATE || end !== PILOT_END_DATE || config.pilot?.inclusiveDays !== PILOT_INCLUSIVE_DAYS || !config.pilot?.regenerateDatesIfGatesNotClearedByStart || !config.pilot?.hardStopRequired) {
    fail("Pilot dates and hard-stop controls do not match the approved fixed pilot");
  }
  if (config.pilot?.generatorAutoRollsDates !== false || config.pilot?.dateChangeRequiresApprovedContractChange !== true) fail("Pilot date changes must require an approved config and validator contract change");
  if (config.currency !== "CAD") fail("Account currency must be CAD");
  if (config.targetQualifyingSpendCad !== 600 || config.maximumPilotCad !== 600) fail("Pilot must target CA$600 qualifying spend with a CA$600 absolute cap");
  if (JSON.stringify(config.spendControls) !== JSON.stringify({ scope: "EXACT_ACCOUNT_TOTAL", warningCad: 450, protectivePauseCad: 600, absoluteCapCad: 600, monitorCadenceMinutes: 15 })) {
    fail("Spend controls must use exact-account total cost, warn at CA$450, pause at CA$600, cap at CA$600, and run every 15 minutes");
  }
  if (JSON.stringify(config.controlledTest) !== JSON.stringify({
    campaign: "GOOG_Search_TC_CoreProducts_2026",
    adGroupKey: "coroplast",
    dailyBudgetCad: 5,
    protectivePauseCad: 25,
    absoluteCapCad: 30,
    maximumWindowHours: 72,
  })) fail("Controlled test must be Coroplast at CA$5/day with CA$25/CA$30 protection and a 72-hour maximum window");
  if (config.accountCustomerId !== "1072816342") fail("Customer ID must match confirmed True Color child account 1072816342");
  // 2026-08-07: Core ceiling 4 -> 5, approved on the exact evidence the 2026-08-03 rationale
  // demanded — lost IS (rank) 60.2% vs lost IS (budget) 8.6% on Core over Aug 5-7.
  if (config.bidding?.strategy !== "MAXIMIZE_CLICKS"
    || JSON.stringify(config.bidding?.cpcCeilingCadByCampaignKind) !== JSON.stringify({ CORE: 5, COMPETITOR: 2.5, BRAND: 1.5 })
    || config.bidding?.forecastDate !== "2026-07-17") {
    fail("Bidding must use the approved campaign-specific Maximize Clicks ceilings (Core raised to CA$5 on 2026-08-07 lost-IS-rank evidence)");
  }
  if (!config.tracking?.autoTaggingRequired) fail("Auto-tagging must be an external account requirement");
  if (JSON.stringify(config.conversionMeasurement) !== JSON.stringify(CONVERSION_MEASUREMENT)) {
    fail("Revenue measurement must match the freshly verified purchase_online, quote_won, and qualified-call action contract");
  }
  const suffixParams = new URLSearchParams(config.tracking?.finalUrlSuffix ?? "");
  for (const [key, expectedValue] of Object.entries(TRACKING_MAPPINGS)) {
    const values = suffixParams.getAll(key);
    if (values.length !== 1 || values[0] !== expectedValue) fail(`Final URL suffix must map ${key}=${expectedValue} exactly once`);
  }
  const gates = new Map((config.externalGates ?? []).map((gate) => [gate.code, gate]));
  if (!sameSet([...gates.keys()], REQUIRED_GATES)) fail("External gates must match the canonical gate set exactly");
  for (const [code, evidence] of VERIFIED_GATE_EVIDENCE) {
    const gate = gates.get(code);
    if (gate?.status !== "VERIFIED" || gate?.evidence !== evidence) fail(`${code} must contain exact verified live-account evidence`);
  }
  for (const gate of REQUIRED_GATES.filter((code) => !VERIFIED_GATE_EVIDENCE.has(code))) {
    const value = gates.get(gate);
    if (!value || !["BLOCKED", "VERIFIED"].includes(value.status)) fail(`External gate has an unsupported state: ${gate}`);
    if (value?.status === "VERIFIED" && (typeof value.evidence !== "string" || value.evidence.trim().length < 10)) fail(`Verified external gate requires evidence: ${gate}`);
  }
  if (JSON.stringify(config.liveGoogleAds) !== JSON.stringify(LIVE_GOOGLE_ADS)) fail("Recorded live Google Ads snapshot must match the last verified paused state exactly");
  const sitelinks = config.adAssets?.sitelinks ?? [];
  const callouts = config.adAssets?.callouts ?? [];
  const snippet = config.adAssets?.structuredSnippet;
  if (sitelinks.length !== 6 || new Set(sitelinks.map((asset) => asset.text)).size !== 6) fail("Exactly six distinct direct-product sitelinks are required");
  const sitelinkPaths = [];
  for (const asset of sitelinks) {
    let parsed;
    try { parsed = new URL(asset.finalUrl); } catch { fail(`Invalid sitelink URL: ${asset.finalUrl}`); continue; }
    if (parsed.protocol !== "https:" || parsed.hostname !== "truecolorprinting.ca" || !parsed.pathname.startsWith("/products/")) fail(`Sitelink must route directly to a True Color configurator: ${asset.text}`);
    sitelinkPaths.push(parsed.pathname);
    if (!asset.text || asset.text.length > 25 || !asset.description1 || asset.description1.length > 35 || !asset.description2 || asset.description2.length > 35) fail(`Sitelink text limits invalid: ${asset.text}`);
  }
  if (!sameSet(sitelinkPaths, REQUIRED_SITELINK_PATHS)) fail("Sitelinks must cover the six canonical direct configurators exactly");
  if (!sameSet(callouts, REQUIRED_CALLOUTS) || callouts.some((callout) => !callout || callout.length > 25)) fail("Exactly the six canonical callouts within Google limits are required");
  if (snippet?.header !== "Types" || !sameSet(snippet?.values ?? [], sitelinks.map((asset) => asset.text))) fail("Structured snippet must contain the six canonical product types");
  const globalAssetCopy = stringValues(config.adAssets).join(" ").toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  for (const term of COMPETITOR_TERMS) if (globalAssetCopy.includes(term)) fail(`Global ad assets use competitor term: ${term}`);
  for (const claim of [...callouts, ...sitelinks.flatMap((asset) => [asset.text, asset.description1, asset.description2]), ...(snippet?.values ?? [])]) {
    const reason = claimFailureReason(claim, STRICT_CLAIM_OPTS);
    if (reason) fail(`Ad asset ${reason}`);
  }
  const claims = config.approvedClaims ?? [];
  if (claims.length !== SOURCED_APPROVED_CLAIMS.length
    || !claims.every((claim, index) => claim.text === SOURCED_APPROVED_CLAIMS[index].text && claim.source === SOURCED_APPROVED_CLAIMS[index].source)) {
    fail("approvedClaims must be the derived export from docs/paid-search/approved-claims.mjs — do not hand-edit it");
  }
  const pricingUpdatedOn = pricingSourceUpdatedOn();
  if (!pricingUpdatedOn) {
    fail(`Could not read the "**Updated:**" header from ${PRICING_SOURCE_FILE} — the ad price-staleness gate cannot run`);
  } else if (pricingUpdatedOn > VERIFIED_ON) {
    fail(`${PRICING_SOURCE_FILE} was updated ${pricingUpdatedOn} but ad price facts were last verified ${VERIFIED_ON}. Re-check every price in docs/paid-search/approved-claims.mjs against the pricing source, then bump VERIFIED_ON. Live ads quoting a stale price is a trust problem, not a style one.`);
  }
  const controls = config.launchControls;
  if (!controls
    || !sameSet(controls.sourceLessons ?? [], ["WILKIE", "DUBOIS"])
    || controls.mobilePostClickQaRequired !== true
    || controls.oneDomainOnly !== "truecolorprinting.ca"
    || controls.cityPresenceOnlyCriterionId !== 1002791
    || controls.radiusKm !== 35
    || controls.searchOnly !== true
    || !sameSet(controls.allowedMatchTypes ?? [], ["EXACT", "PHRASE"])
    || controls.noBroadeningToManufactureVolume !== true
    || controls.realAttributablePurchaseOnlineRequired !== true
    || controls.realAttributableQuoteWonRequired !== true
    || controls.hardEndRequired !== true
    || controls.dailySearchTermReviewRequired !== true) {
    fail("Missing required Wilkie/Dubois launch-control declaration");
  }
  if (controls?.presenceOnlyManualOrApiRequired !== true || controls?.editorPreviewRequired !== true) fail("Presence-only and Editor/account preview must remain mandatory manual/API launch controls");

  const accountNegatives = config.accountNegatives ?? [];
  if (!hasExactPhrasePairs(accountNegatives, REQUIRED_ACCOUNT_NEGATIVES)) fail("Account-wide negatives must equal the required starter waste allowlist with exact/phrase pairs");
  for (const negative of accountNegatives) {
    const normalized = negative.text?.toLowerCase() ?? "";
    if (PROTECTED_ACCOUNT_NEGATIVES.some((term) => normalized.includes(term))) fail(`Unsafe account-wide negative: ${negative.text}`);
  }

  const campaigns = config.campaigns ?? [];
  // How many ad groups reuse each variant-B headline. Feeds the shared-headline cap below:
  // variant A shares 10 of 15 headlines across every group, so most RSA rotations served
  // generic-on-generic copy. That degrades Ad Relevance, which raises CPC against a fixed
  // CA$600 ceiling. New copy is capped so the same collapse cannot happen again.
  const variantBHeadlineUseCount = new Map();
  for (const campaign of campaigns) {
    for (const group of campaign.adGroups ?? []) {
      for (const headline of new Set(group.rsaVariantB?.headlines ?? [])) {
        variantBHeadlineUseCount.set(headline, (variantBHeadlineUseCount.get(headline) ?? 0) + 1);
      }
    }
  }
  if (campaigns.length !== Object.keys(EXPECTED).length) fail("Configuration must contain exactly the three approved campaigns");
  const campaignNames = campaigns.map((campaign) => campaign.name);
  if (campaignNames.some((name) => typeof name !== "string" || !name.trim()) || new Set(campaignNames).size !== campaignNames.length) fail("Campaign names must be unique and nonblank");
  const adGroupNames = campaigns.flatMap((campaign) => (campaign.adGroups ?? []).map((group) => group.name));
  if (adGroupNames.some((name) => typeof name !== "string" || !name.trim()) || new Set(adGroupNames).size !== adGroupNames.length) fail("Ad-group names must be unique and nonblank");
  for (const campaign of campaigns) {
    if (campaign.status === "PAUSED") {
      if ((campaign.maximumPilotCad ?? 0) !== 0) {
        fail(`${campaign.name} is paused and must contribute CA$0 to the approved pilot maximum`);
      }
      continue;
    }
    if ((campaign.maximumPilotCad ?? 0) !== (campaign.dailyBudgetCad ?? 0) * PILOT_INCLUSIVE_DAYS) {
      fail(`${campaign.name} planning maximum must equal its daily budget across all ${PILOT_INCLUSIVE_DAYS} pilot days`);
    }
  }
  const plannedMaximumCad = campaigns.reduce((sum, campaign) => sum + (campaign.maximumPilotCad ?? 0), 0);
  // Budget CAPACITY (CA$828 over 46 days) deliberately exceeds the CA$600 runtime ceiling.
  // Daily budgets are permission to capture cheap clicks on good days; the 15-minute hard-stop
  // monitor is the binding constraint on total spend, not the budget arithmetic. Capacity must
  // still be able to REACH the qualifying target, or the promotion is unreachable by construction.
  if (plannedMaximumCad < config.targetQualifyingSpendCad) fail("Planned campaign maximums must be able to reach the CA$600 qualifying-spend target");
  // Bound the blast radius if the monitor ever stops running: total enabled daily budget caps
  // how fast an unmonitored account can burn. This replaces the old capacity-vs-cap assertion,
  // which became meaningless once the runtime ceiling dropped to the qualifying target itself.
  if (launchableDailyBudgetCad(campaigns) > MAX_UNMONITORED_DAILY_BURN_CAD) {
    fail(`Total enabled daily budget must stay within CA$${MAX_UNMONITORED_DAILY_BURN_CAD}/day so a monitor outage cannot burn the CA$600 ceiling in under a week`);
  }
  const launchableDailyBudget = campaigns.reduce((sum, campaign) => sum + (campaign.dailyBudgetCad ?? 0), 0);
  if (launchableDailyBudget !== LAUNCHABLE_DAILY_BUDGET_CAD) fail(`Launchable Core, Competitor, and Brand budgets must total CA$${LAUNCHABLE_DAILY_BUDGET_CAD}/day`);
  for (const [kind, expected] of Object.entries(EXPECTED)) {
    const campaign = campaigns.find((item) => item.kind === kind);
    if (!campaign) { fail(`Missing ${kind} campaign`); continue; }
    if (campaign.name !== expected.name || campaign.dailyBudgetCad !== expected.daily || campaign.maximumPilotCad !== expected.maximum) fail(`${kind} campaign budget or name mismatch`);
    if (campaign.status !== expected.status) fail(`${campaign.name} must record the approved launch target status ${expected.status}`);
    if (campaign.language !== "English") fail(`${campaign.name} language must be English`);
    if (campaign.channel !== "SEARCH" || !campaign.networks?.googleSearch || campaign.networks?.searchPartners || campaign.networks?.display) fail(`${campaign.name} must be Google Search only`);
    if (campaign.geoTarget?.criterionId !== 1002791
      || campaign.geoTarget?.center?.latitude !== 52.129728
      || campaign.geoTarget?.center?.longitude !== -106.659637
      || campaign.geoTarget?.radiusKm !== 35
      || campaign.geoTarget?.presenceOnly !== true) fail(`${campaign.name} must target the verified Saskatoon center +35 km presence-only`);
    if (!campaign.adGroups?.length) fail(`${campaign.name} has no ad groups`);
    const expectedGroups = kind === "CORE" ? ROUTES : kind === "COMPETITOR" ? COMPETITOR_GROUPS : BRAND_GROUPS;
    const actualGroupKeys = (campaign.adGroups ?? []).map((group) => group.key);
    if (!sameSet(actualGroupKeys, Object.keys(expectedGroups))) fail(`${campaign.name} ad-group set must match the canonical structure exactly`);
    for (const group of campaign.adGroups ?? []) {
      if (group.status !== expected.status) fail(`${campaign.name}/${group.name} must record the approved launch target status ${expected.status}`);
      const expectedLaunchTier = kind === "CORE"
        ? "TIER_1_PRODUCT"
        : kind === "COMPETITOR" ? "RETIRED_THIN_VOLUME" : "HOLD_AUCTION_INSIGHTS";
      if (group.launchTier !== expectedLaunchTier) fail(`${campaign.name}/${group.name} has the wrong conversion-first launch tier`);
      let parsed;
      try { parsed = new URL(group.finalUrl); } catch { fail(`${campaign.name}/${group.name} has invalid URL`); continue; }
      if (parsed.protocol !== "https:" || parsed.hostname !== "truecolorprinting.ca") fail(`${campaign.name}/${group.name} must use the one approved domain`);
      if (kind === "CORE" && parsed.pathname !== ROUTES[group.key]) fail(`${group.key} has the wrong destination`);
      // A Core group routed to the paid landing page must carry the FULL tracked href, not just
      // the right path — the live verifier only checks the exact query URL.
      if (kind === "CORE" && TRACKED_HREF_ROUTES[group.key] && parsed.href !== TRACKED_HREF_ROUTES[group.key]) {
        fail(`${group.name} must route to the exact tracked ${TRACKED_HREF_ROUTES[group.key]} destination`);
      }
      // Fail-closed the other way too: a Core group that lands on /why-true-color WITHOUT opting
      // into TRACKED_HREF_ROUTES would escape the exact-href assertion entirely.
      if (kind === "CORE" && parsed.pathname === "/why-true-color" && !TRACKED_HREF_ROUTES[group.key]) {
        fail(`${group.name} routes to the paid landing page but is not declared in TRACKED_HREF_ROUTES`);
      }
      if (kind === "COMPETITOR" && parsed.href !== TRACKED_PAID_LANDING_HREF) {
        fail(`${group.name} must route to the exact tracked /why-true-color Google Ads destination`);
      }
      if (kind === "BRAND" && parsed.pathname !== "/") fail(`${group.name} must route to the homepage`);
      if (!group.keywords?.length) fail(`${group.name} must contain high-intent keywords`);
      for (const kw of group.keywords ?? []) if (!["EXACT", "PHRASE"].includes(kw.matchType)) fail(`${group.name} contains a non-exact/phrase keyword`);
      if (kind === "CORE" && !hasExactPhrasePairs(group.keywords, CORE_TERMS[group.key] ?? [])) fail(`${group.name} Core keywords must match canonical exact/phrase pairs`);
      if (kind === "COMPETITOR" && !hasExactOnly(group.keywords, COMPETITOR_GROUPS[group.key] ?? [])) fail(`${group.name} competitor targets must be canonical exact-only terms`);
      if (kind === "BRAND" && !hasExactPhrasePairs(group.keywords, BRAND_GROUPS[group.key] ?? [])) fail(`${group.name} brand variants must match canonical exact/phrase pairs`);
      const expectedCrossNegatives = kind === "CORE" ? CORE_CROSS_NEGATIVES[group.key] ?? [] : [];
      if (!sameSet(group.crossNegatives ?? [], expectedCrossNegatives)) fail(`${group.name} cross-negatives must match the canonical routing set`);
      // Exactly the two approved RSA keys: "rsa" (variant A, live/approved, legacy copy) and
      // optional "rsaVariantB" (price-anchored). Anything else is an unreviewed ad payload.
      const rsaKeys = Object.keys(group).filter((key) => /rsa|responsive.*ad/i.test(key));
      const isRsaObject = (value) => Boolean(value) && !Array.isArray(value) && typeof value === "object";
      if (!rsaKeys.every((key) => key === "rsa" || key === "rsaVariantB")) {
        fail(`${group.name} may only contain "rsa" and "rsaVariantB" ad payloads`);
      }
      // `rsa` (variant A) is OPTIONAL. It exists only where a legacy policy-approved ad is
      // already serving and must stay byte-identical. Ad groups created from here on ship
      // variant B alone — there is no reason to invent a vague ad for a group that never had one.
      if ("rsa" in group && !isRsaObject(group.rsa)) fail(`${group.name} rsa must be an RSA object when present`);
      // Variant B is MANDATORY on every ad group. This is the structural guarantee that a new
      // ad group can never ship with vague, number-free copy: no variant B, no valid config,
      // no import. Optional would mean the standard applies only when someone remembers it.
      if (!isRsaObject(group.rsaVariantB)) {
        fail(`${group.name} must have an rsaVariantB — every ad group ships price-anchored copy, no exceptions`);
      }

      const variants = [
        ...(group.rsa ? [{ label: "rsa", ad: group.rsa, strict: false }] : []),
        ...(group.rsaVariantB ? [{ label: "rsaVariantB", ad: group.rsaVariantB, strict: true }] : []),
      ];
      for (const { label, ad, strict } of variants) {
        const headlines = ad?.headlines ?? [];
        const descriptions = ad?.descriptions ?? [];
        const where = `${group.name}/${label}`;
        if (headlines.length < 12 || headlines.length > 15 || new Set(headlines).size !== headlines.length) fail(`${where} must have 12-15 distinct headlines`);
        if (descriptions.length !== 4 || new Set(descriptions).size !== descriptions.length) fail(`${where} must have four distinct descriptions`);
        for (const headline of headlines) if (headline.length > 30) fail(`${where} headline exceeds 30 characters: ${headline}`);
        for (const description of descriptions) if (description.length > 90) fail(`${where} description exceeds 90 characters: ${description}`);
        for (const claim of [...headlines, ...descriptions]) {
          const reason = claimFailureReason(claim, strict ? STRICT_CLAIM_OPTS : LEGACY_CLAIM_OPTS);
          if (reason) fail(`${where} ${reason}`);
        }
      }

      // Relevance floor for new copy. These two assertions are the mechanical form of "the ad
      // must speak to the customer" — vague copy cannot satisfy either one.
      if (group.rsaVariantB) {
        const variantHeadlines = group.rsaVariantB.headlines ?? [];
        if (!variantHeadlines.some((headline) => hasPriceClaim(headline))) {
          fail(`${group.name}/rsaVariantB must carry at least one headline with a sourced price — an ad with no number is the problem this contract exists to prevent`);
        }
        // The shared-headline cap only binds on CORE. Core ad groups answer genuinely different
        // queries, so shared copy there is what collapses Ad Relevance. The nine Competitor
        // groups target one offer on one page and are forbidden from naming the competitor, so
        // they have nothing legitimate to differentiate on and deliberately share one payload.
        if (kind === "CORE") {
          const sharedCount = variantHeadlines.filter((headline) => variantBHeadlineUseCount.get(headline) > 1).length;
          if (sharedCount > MAX_SHARED_HEADLINES_PER_GROUP) {
            fail(`${group.name}/rsaVariantB reuses ${sharedCount} headlines from other ad groups (max ${MAX_SHARED_HEADLINES_PER_GROUP}) — shared generic copy is what collapses Ad Relevance and raises CPC`);
          }
        }
      }
      if (kind === "COMPETITOR") {
        // Must cover BOTH variants. Checking only `group.rsa` would have let a competitor name
        // ship in variant-B copy — caught by test, not by review.
        const copy = stringValues([group.rsa, group.rsaVariantB ?? {}, group.assets ?? []]).join(" ").toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
        for (const term of COMPETITOR_TERMS) if (copy.includes(term)) fail(`${group.name} uses competitor term in ad copy: ${term}`);
      }
    }
  }
  const core = campaigns.find((item) => item.kind === "CORE");
  const requiredCompetitorNegatives = Object.values(COMPETITOR_GROUPS).flat();
  if (!sameSet(core?.campaignNegatives ?? [], requiredCompetitorNegatives)) fail("Core competitor routing negatives must match canonical target terms exactly");
  for (const term of COMPETITOR_TERMS) {
    if (!(core?.campaignNegatives ?? []).some((negative) => negative.toLowerCase().includes(term))) fail(`Core campaign missing competitor routing negative: ${term}`);
  }
  const brand = campaigns.find((item) => item.kind === "BRAND");
  if (!brand?.gates?.includes("AUCTION_INSIGHTS_REQUIRED")) fail("Brand campaign missing AUCTION_INSIGHTS_REQUIRED gate");

  const localStatus = errors.length ? "INVALID" : "VALIDATED";
  return {
    localStatus,
    liveStatus: "LIVE_UNVERIFIED",
    campaignsCreated: null,
    launched: null,
    spendCad: null,
    errors,
    blockers: (config.externalGates ?? []).filter((gate) => gate.status === "BLOCKED").map((gate) => gate.code),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { paidSearchConfig } = await import("../../docs/paid-search/campaign-config.mjs");
  const result = validateConfig(paidSearchConfig);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.localStatus === "VALIDATED" ? 0 : 1;
}
