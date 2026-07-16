import { pathToFileURL } from "node:url";

const EXPECTED = {
  CORE: { name: "GOOG_Search_TC_CoreProducts_2026", daily: 40, maximum: 1200 },
  COMPETITOR: { name: "GOOG_Search_TC_CompetitorConquest_2026", daily: 7, maximum: 210 },
  BRAND: { name: "GOOG_Search_TC_BrandDefense_2026", daily: 3, maximum: 90 },
};
const REQUIRED_GATES = [
  "TRUE_COLOR_CUSTOMER_ID", "BILLING_ACTIVE", "AUTO_TAGGING_ENABLED", "CONVERSION_ACTION",
  "ENHANCED_CONSENT_DECISION", "CURRENT_KEYWORD_PLANNER_FORECAST", "BUDGET_APPROVAL",
  "DATES_AND_HARD_STOP", "MOBILE_QA", "ATTRIBUTABLE_TEST_ORDER",
];
const VALUE_TRACK_FIELDS = [
  "keyword", "matchtype", "device", "loc_physical_ms", "loc_interest_ms", "adgroupid",
  "creative", "campaignid", "network",
];
const COMPETITOR_TERMS = ["qwik signs", "minuteman press", "24 hour signs", "anytime printing", "pgi printers", "staples", "vistaprint"];
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
  if (config.maximum30DayCad !== 1500) fail("Total 30-day maximum must be CA$1,500");
  if (config.accountCustomerId !== null) fail("Customer ID must remain null until the True Color account is confirmed");
  if (config.bidding?.strategy !== "MAXIMIZE_CLICKS" || config.bidding?.cpcCeilingCad !== null || config.bidding?.cpcCeilingGate !== "CURRENT_KEYWORD_PLANNER_FORECAST") {
    fail("Bidding must use gated Maximize Clicks with a null CPC ceiling");
  }
  if (!config.tracking?.autoTaggingRequired) fail("Auto-tagging must be an external account requirement");
  for (const field of VALUE_TRACK_FIELDS) {
    if (!config.tracking?.finalUrlSuffix?.includes(`${field}={`)) fail(`Final URL suffix missing ${field}`);
  }
  const gates = new Map((config.externalGates ?? []).map((gate) => [gate.code, gate]));
  for (const gate of REQUIRED_GATES) {
    if (gates.get(gate)?.status !== "BLOCKED") fail(`Missing blocked external gate: ${gate}`);
  }

  const campaigns = config.campaigns ?? [];
  if (campaigns.length !== Object.keys(EXPECTED).length) fail("Configuration must contain exactly the three approved campaigns");
  if (campaigns.reduce((sum, campaign) => sum + (campaign.maximum30DayCad ?? 0), 0) !== config.maximum30DayCad) fail("Campaign maximums must reconcile to the total 30-day maximum");
  for (const [kind, expected] of Object.entries(EXPECTED)) {
    const campaign = campaigns.find((item) => item.kind === kind);
    if (!campaign) { fail(`Missing ${kind} campaign`); continue; }
    if (campaign.name !== expected.name || campaign.dailyBudgetCad !== expected.daily || campaign.maximum30DayCad !== expected.maximum) fail(`${kind} campaign budget or name mismatch`);
    if (campaign.status !== "PAUSED") fail(`${campaign.name} must be paused`);
    if (campaign.channel !== "SEARCH" || !campaign.networks?.googleSearch || campaign.networks?.searchPartners || campaign.networks?.display) fail(`${campaign.name} must be Google Search only`);
    if (campaign.geoTarget?.criterionId !== 1002791 || campaign.geoTarget?.presenceOnly !== true) fail(`${campaign.name} must target Saskatoon presence-only`);
    if (!campaign.adGroups?.length) fail(`${campaign.name} has no ad groups`);
    for (const group of campaign.adGroups ?? []) {
      if (group.status !== "PAUSED") fail(`${campaign.name}/${group.name} must be paused`);
      let parsed;
      try { parsed = new URL(group.finalUrl); } catch { fail(`${campaign.name}/${group.name} has invalid URL`); continue; }
      if (parsed.protocol !== "https:" || parsed.hostname !== "truecolorprinting.ca") fail(`${campaign.name}/${group.name} must use the one approved domain`);
      if (kind === "CORE" && ROUTES[group.key] && parsed.pathname !== ROUTES[group.key]) fail(`${group.key} has the wrong destination`);
      if (kind === "COMPETITOR" && parsed.pathname !== "/why-true-color") fail(`${group.name} must route to /why-true-color`);
      if (!group.keywords?.length) fail(`${group.name} must contain high-intent keywords`);
      for (const kw of group.keywords ?? []) if (!["EXACT", "PHRASE"].includes(kw.matchType)) fail(`${group.name} contains a non-exact/phrase keyword`);
      const headlines = group.rsa?.headlines ?? [];
      const descriptions = group.rsa?.descriptions ?? [];
      if (headlines.length < 12 || headlines.length > 15 || new Set(headlines).size !== headlines.length) fail(`${group.name} must have 12-15 distinct headlines`);
      if (descriptions.length !== 4 || new Set(descriptions).size !== descriptions.length) fail(`${group.name} must have four distinct descriptions`);
      for (const headline of headlines) if (headline.length > 30) fail(`${group.name} headline exceeds 30 characters: ${headline}`);
      for (const description of descriptions) if (description.length > 90) fail(`${group.name} description exceeds 90 characters`);
      if (kind === "COMPETITOR") {
        const copy = stringValues([group.rsa, group.assets ?? []]).join(" ").toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
        for (const term of COMPETITOR_TERMS) if (copy.includes(term)) fail(`${group.name} uses competitor term in ad copy: ${term}`);
      }
    }
  }
  const core = campaigns.find((item) => item.kind === "CORE");
  for (const term of COMPETITOR_TERMS) {
    if (!(core?.campaignNegatives ?? []).some((negative) => negative.toLowerCase().includes(term))) fail(`Core campaign missing competitor routing negative: ${term}`);
  }
  const brand = campaigns.find((item) => item.kind === "BRAND");
  if (!brand?.gates?.includes("AUCTION_INSIGHTS_REQUIRED")) fail("Brand campaign missing AUCTION_INSIGHTS_REQUIRED gate");

  return {
    localStatus: errors.length ? "INVALID" : "VALIDATED",
    apiStatus: "BLOCKED",
    campaignsCreated: false,
    launched: false,
    spendCad: 0,
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
