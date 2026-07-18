import { pathToFileURL } from "node:url";

const EXPECTED = {
  CORE: { name: "GOOG_Search_TC_CoreProducts_2026", daily: 40, maximum: 1200 },
  COMPETITOR: { name: "GOOG_Search_TC_CompetitorConquest_2026", daily: 7, maximum: 210 },
  BRAND: { name: "GOOG_Search_TC_BrandDefense_2026", daily: 3, maximum: 90 },
};
const REQUIRED_GATES = [
  "TRUE_COLOR_CUSTOMER_ID", "BILLING_ACTIVE", "AUTO_TAGGING_ENABLED", "CONVERSION_ACTION",
  "PROMOTION_ELIGIBILITY", "PURCHASE_TAG_DEPLOYED", "COMPETITOR_LANDING_DEPLOYED", "RSA_POLICY_APPROVAL", "AUCTION_INSIGHTS_SIGNOFF",
  "ENHANCED_CONSENT_DECISION", "CURRENT_KEYWORD_PLANNER_FORECAST", "CPC_CEILING_LAUNCH_APPROVAL", "BUDGET_APPROVAL",
  "DATES_AND_HARD_STOP", "MOBILE_QA", "ATTRIBUTABLE_TEST_ORDER", "LAUNCH_CONTROL_SIGNOFF",
  "PRESENCE_ONLY_AND_EDITOR_PREVIEW",
];
const VERIFIED_GATE_EVIDENCE = new Map([
  ["TRUE_COLOR_CUSTOMER_ID", "True Color Display Print child account 107-281-6342 under manager 112-540-2990"],
  ["BILLING_ACTIVE", "Billing APPROVED in customer 1072816342; setup 8490021913"],
  ["AUTO_TAGGING_ENABLED", "Auto-tagging enabled in customer 1072816342"],
  ["CONVERSION_ACTION", "Purchase - Website (True Color), action 7689029977, destination AW-18330693756/F1pQCNmStdIcEPzg4KRE"],
  ["CURRENT_KEYWORD_PLANNER_FORECAST", "2026-07-17 True Color forecast; Core CA$4.00, Competitor CA$2.50, Brand CA$1.50 staged paused"],
]);
const LIVE_GOOGLE_ADS = {
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
  counts: { campaigns: 3, adGroups: 19, positiveKeywords: 71, negativeCriteria: 189, responsiveSearchAds: 19, manualAssets: 13, campaignAssetLinks: 39 },
  cpcCeilingCadByCampaignKind: { CORE: 4, COMPETITOR: 2.5, BRAND: 1.5 },
  policyApprovalStatus: "UNKNOWN",
  spendCad: 0,
};
const COMPETITOR_TERMS = ["qwik signs", "minuteman press", "ink house", "rayacom", "24 hour signs", "anytime printing", "pgi printers", "staples", "vistaprint"];
const ROUTES = {
  coroplast: "/products/coroplast-signs",
  "stickers-labels": "/products/stickers",
  "vinyl-banners": "/products/vinyl-banners",
  "business-cards": "/products/business-cards",
  flyers: "/products/flyers",
  "retractable-banners": "/products/retractable-banners",
  "rush-same-day": "/same-day-printing-saskatoon",
  "generic-print-price": "/printing-prices-saskatoon",
  "generic-sign-shop": "/sign-company-saskatoon",
};
const CORE_TERMS = {
  coroplast: ["coroplast signs saskatoon", "coroplast signs", "coroplast sign printing"],
  "stickers-labels": ["custom stickers saskatoon", "sticker printing saskatoon", "custom labels saskatoon"],
  "vinyl-banners": ["vinyl banners saskatoon", "banner printing saskatoon", "custom vinyl banners"],
  "business-cards": ["business cards saskatoon", "business card printing saskatoon", "order business cards online"],
  flyers: ["flyer printing saskatoon", "custom flyers saskatoon", "order flyers online"],
  "retractable-banners": ["retractable banners saskatoon", "retractable banner printing", "pull up banners saskatoon"],
  "rush-same-day": ["same day printing saskatoon", "rush printing saskatoon", "urgent printing saskatoon"],
  "generic-print-price": ["printing prices saskatoon", "print shop prices saskatoon", "printing quote saskatoon"],
  "generic-sign-shop": ["sign shop saskatoon", "sign company saskatoon", "custom signs saskatoon"],
};
const CORE_CROSS_NEGATIVES = {
  coroplast: ["stickers", "labels", "vinyl banner", "business cards", "flyers", "retractable banner"],
  "stickers-labels": ["coroplast", "vinyl banner", "business cards", "flyers", "retractable banner"],
  "vinyl-banners": ["coroplast", "stickers", "labels", "business cards", "flyers", "retractable banner"],
  "business-cards": ["coroplast", "stickers", "labels", "vinyl banner", "flyers", "retractable banner"],
  flyers: ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "retractable banner"],
  "retractable-banners": ["coroplast", "stickers", "labels", "vinyl banner", "business cards", "flyers"],
  "rush-same-day": ["business cards", "flyers", "stickers", "banners", "coroplast"],
  "generic-print-price": ["same day", "rush", "sign shop", "sign company"],
  "generic-sign-shop": ["same day", "rush", "printing prices", "print shop prices"],
};
const COMPETITOR_GROUPS = {
  "qwik-signs": ["qwik signs"],
  "minuteman-press": ["minuteman press saskatoon"],
  "ink-house": ["ink house saskatoon"],
  rayacom: ["rayacom saskatoon"],
  "24-hour-signs": ["24 hour signs"],
  "anytime-printing": ["anytime printing"],
  "pgi-printers": ["pgi printers"],
  "staples-printing": ["staples printing saskatoon"],
  vistaprint: ["vistaprint saskatoon"],
};
const BRAND_GROUPS = {
  "true-color-brand": ["true color printing", "true colour printing", "true color saskatoon", "true color display printing"],
};
const REQUIRED_ACCOUNT_NEGATIVES = [
  "jobs", "hiring", "salary", "career", "course", "class", "tutorial", "printer repair",
  "used printer", "printer ink", "3d printing", "home printer", "free", "template", "diy",
  "how to", "canva", "download", "printable", "machine", "equipment", "supplies",
];
const PROTECTED_ACCOUNT_NEGATIVES = ["near me", "online", "cheap", ...COMPETITOR_TERMS];
const APPROVED_CLAIMS = new Map([
  ["Rated 4.9 From 43 Reviews", "Known Google review proof: 4.9 rating from 43 reviews"],
  ["4.9 From 43 Reviews", "Known Google review proof: 4.9 rating from 43 reviews"],
  ["Work with a Saskatoon print shop rated 4.9 from 43 Google reviews.", "Known Google review proof: 4.9 rating from 43 reviews"],
]);
const FORBIDDEN_CLAIM_PATTERNS = [
  /\bguarante(?:e|ed)\b/i,
  /\b(?:ready today|cut[ -]?off)\b/i,
  /\b(?:same day|next day|24[ -]?hour|48[ -]?hour)\b.*\b(?:ready|turnaround|delivery|pickup)\b/i,
  /\b(?:ready|turnaround|delivery|pickup)\b.*\b(?:same day|next day|24[ -]?hour|48[ -]?hour)\b/i,
];
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
  "Exact Online Pricing", "Local Saskatoon Pickup", "Upload Artwork Online",
  "Order Printing Online", "Rush Options Available", "4.9 From 43 Reviews",
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(end ?? "") || daysInclusive(start, end) !== 30) {
    fail("Pilot must have valid ISO dates spanning exactly 30 inclusive days");
  }
  if (start !== "2026-07-20" || end !== "2026-08-18" || config.pilot?.inclusiveDays !== 30 || !config.pilot?.regenerateDatesIfGatesNotClearedByStart || !config.pilot?.hardStopRequired) {
    fail("Pilot dates and hard-stop controls do not match the approved fixed pilot");
  }
  if (config.pilot?.generatorAutoRollsDates !== false || config.pilot?.dateChangeRequiresApprovedContractChange !== true) fail("Pilot date changes must require an approved config and validator contract change");
  if (config.currency !== "CAD") fail("Account currency must be CAD");
  if (config.maximum30DayCad !== 1500) fail("Total 30-day maximum must be CA$1,500");
  if (config.accountCustomerId !== "1072816342") fail("Customer ID must match confirmed True Color child account 1072816342");
  if (config.bidding?.strategy !== "MAXIMIZE_CLICKS"
    || JSON.stringify(config.bidding?.cpcCeilingCadByCampaignKind) !== JSON.stringify({ CORE: 4, COMPETITOR: 2.5, BRAND: 1.5 })
    || config.bidding?.forecastDate !== "2026-07-17") {
    fail("Bidding must use the forecast-backed campaign-specific Maximize Clicks ceilings");
  }
  if (!config.tracking?.autoTaggingRequired) fail("Auto-tagging must be an external account requirement");
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
    if (/\d|[$£€]|\b(?:cad|usd)\b/i.test(claim) && !APPROVED_CLAIMS.has(claim)) fail(`Ad asset contains an unapproved numeric or price claim: ${claim}`);
    if (FORBIDDEN_CLAIM_PATTERNS.some((pattern) => pattern.test(claim)) && !APPROVED_CLAIMS.has(claim)) fail(`Ad asset contains an unapproved guarantee, turnaround, or cutoff claim: ${claim}`);
  }
  const claims = config.approvedClaims ?? [];
  if (claims.length !== APPROVED_CLAIMS.size || !claims.every((claim) => APPROVED_CLAIMS.get(claim.text) === claim.source)) fail("Approved factual claims must match sourced review proof exactly");
  const controls = config.launchControls;
  if (!controls
    || !sameSet(controls.sourceLessons ?? [], ["WILKIE", "DUBOIS"])
    || controls.mobilePostClickQaRequired !== true
    || controls.oneDomainOnly !== "truecolorprinting.ca"
    || controls.cityPresenceOnlyCriterionId !== 1002791
    || controls.searchOnly !== true
    || !sameSet(controls.allowedMatchTypes ?? [], ["EXACT", "PHRASE"])
    || controls.noBroadeningToManufactureVolume !== true
    || controls.realAttributablePaidTestOrderRequired !== true
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
  if (campaigns.length !== Object.keys(EXPECTED).length) fail("Configuration must contain exactly the three approved campaigns");
  const campaignNames = campaigns.map((campaign) => campaign.name);
  if (campaignNames.some((name) => typeof name !== "string" || !name.trim()) || new Set(campaignNames).size !== campaignNames.length) fail("Campaign names must be unique and nonblank");
  const adGroupNames = campaigns.flatMap((campaign) => (campaign.adGroups ?? []).map((group) => group.name));
  if (adGroupNames.some((name) => typeof name !== "string" || !name.trim()) || new Set(adGroupNames).size !== adGroupNames.length) fail("Ad-group names must be unique and nonblank");
  if (campaigns.reduce((sum, campaign) => sum + (campaign.maximum30DayCad ?? 0), 0) !== config.maximum30DayCad) fail("Campaign maximums must reconcile to the total 30-day maximum");
  for (const [kind, expected] of Object.entries(EXPECTED)) {
    const campaign = campaigns.find((item) => item.kind === kind);
    if (!campaign) { fail(`Missing ${kind} campaign`); continue; }
    if (campaign.name !== expected.name || campaign.dailyBudgetCad !== expected.daily || campaign.maximum30DayCad !== expected.maximum) fail(`${kind} campaign budget or name mismatch`);
    if (campaign.status !== "PAUSED") fail(`${campaign.name} must be paused`);
    if (campaign.language !== "English") fail(`${campaign.name} language must be English`);
    if (campaign.channel !== "SEARCH" || !campaign.networks?.googleSearch || campaign.networks?.searchPartners || campaign.networks?.display) fail(`${campaign.name} must be Google Search only`);
    if (campaign.geoTarget?.criterionId !== 1002791 || campaign.geoTarget?.presenceOnly !== true) fail(`${campaign.name} must target Saskatoon presence-only`);
    if (!campaign.adGroups?.length) fail(`${campaign.name} has no ad groups`);
    const expectedGroups = kind === "CORE" ? ROUTES : kind === "COMPETITOR" ? COMPETITOR_GROUPS : BRAND_GROUPS;
    const actualGroupKeys = (campaign.adGroups ?? []).map((group) => group.key);
    if (!sameSet(actualGroupKeys, Object.keys(expectedGroups))) fail(`${campaign.name} ad-group set must match the canonical structure exactly`);
    for (const group of campaign.adGroups ?? []) {
      if (group.status !== "PAUSED") fail(`${campaign.name}/${group.name} must be paused`);
      const expectedLaunchTier = kind === "CORE"
        ? (["rush-same-day", "generic-print-price", "generic-sign-shop"].includes(group.key) ? "TIER_2_EXPANSION" : "TIER_1_PRODUCT")
        : kind === "COMPETITOR" ? "TIER_1_CONQUEST" : "HOLD_AUCTION_INSIGHTS";
      if (group.launchTier !== expectedLaunchTier) fail(`${campaign.name}/${group.name} has the wrong conversion-first launch tier`);
      let parsed;
      try { parsed = new URL(group.finalUrl); } catch { fail(`${campaign.name}/${group.name} has invalid URL`); continue; }
      if (parsed.protocol !== "https:" || parsed.hostname !== "truecolorprinting.ca") fail(`${campaign.name}/${group.name} must use the one approved domain`);
      if (kind === "CORE" && parsed.pathname !== ROUTES[group.key]) fail(`${group.key} has the wrong destination`);
      if (kind === "COMPETITOR" && parsed.pathname !== "/why-true-color") fail(`${group.name} must route to /why-true-color`);
      if (kind === "BRAND" && parsed.pathname !== "/") fail(`${group.name} must route to the homepage`);
      if (!group.keywords?.length) fail(`${group.name} must contain high-intent keywords`);
      for (const kw of group.keywords ?? []) if (!["EXACT", "PHRASE"].includes(kw.matchType)) fail(`${group.name} contains a non-exact/phrase keyword`);
      if (kind === "CORE" && !hasExactPhrasePairs(group.keywords, CORE_TERMS[group.key] ?? [])) fail(`${group.name} Core keywords must match canonical exact/phrase pairs`);
      if (kind === "COMPETITOR" && !hasExactOnly(group.keywords, COMPETITOR_GROUPS[group.key] ?? [])) fail(`${group.name} competitor targets must be canonical exact-only terms`);
      if (kind === "BRAND" && !hasExactPhrasePairs(group.keywords, BRAND_GROUPS[group.key] ?? [])) fail(`${group.name} brand variants must match canonical exact/phrase pairs`);
      const expectedCrossNegatives = kind === "CORE" ? CORE_CROSS_NEGATIVES[group.key] ?? [] : [];
      if (!sameSet(group.crossNegatives ?? [], expectedCrossNegatives)) fail(`${group.name} cross-negatives must match the canonical routing set`);
      const rsaKeys = Object.keys(group).filter((key) => /rsa|responsive.*ad/i.test(key));
      if (rsaKeys.length !== 1 || rsaKeys[0] !== "rsa" || !group.rsa || Array.isArray(group.rsa) || typeof group.rsa !== "object") fail(`${group.name} must contain exactly one RSA object`);
      const headlines = group.rsa?.headlines ?? [];
      const descriptions = group.rsa?.descriptions ?? [];
      if (headlines.length < 12 || headlines.length > 15 || new Set(headlines).size !== headlines.length) fail(`${group.name} must have 12-15 distinct headlines`);
      if (descriptions.length !== 4 || new Set(descriptions).size !== descriptions.length) fail(`${group.name} must have four distinct descriptions`);
      for (const headline of headlines) if (headline.length > 30) fail(`${group.name} headline exceeds 30 characters: ${headline}`);
      for (const description of descriptions) if (description.length > 90) fail(`${group.name} description exceeds 90 characters`);
      for (const claim of [...headlines, ...descriptions]) {
        if (/\d|[$£€]|\b(?:cad|usd)\b/i.test(claim) && !APPROVED_CLAIMS.has(claim)) fail(`${group.name} contains an unapproved numeric, price, or turnaround claim: ${claim}`);
        if (FORBIDDEN_CLAIM_PATTERNS.some((pattern) => pattern.test(claim)) && !APPROVED_CLAIMS.has(claim)) fail(`${group.name} contains an unapproved guarantee, turnaround, or cutoff claim: ${claim}`);
      }
      if (kind === "COMPETITOR") {
        const copy = stringValues([group.rsa, group.assets ?? []]).join(" ").toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
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
