import { pathToFileURL } from "node:url";

const API_VERSION = "v24";
const EXECUTION_CONFIRMATION = "REQUEST_COMPETITOR_RSA_REVIEW";
const OLD_FINAL_URL = "https://truecolorprinting.ca/why-true-color";
const PROPOSED_FINAL_URL = `${OLD_FINAL_URL}?source=google-ads`;
const LANDING_MARKER = "Real printing. Clear pricing. Local pickup.";

const freeze = (value) => Object.freeze(value);

export const COMPETITOR_RSA_REVIEW = freeze({
  apiVersion: API_VERSION,
  customerId: "1072816342",
  loginCustomerId: "1125402990",
  currencyCode: "CAD",
  timeZone: "America/Regina",
  campaign: freeze({
    id: "24048123061",
    name: "GOOG_Search_TC_CompetitorConquest_2026",
    resourceName: "customers/1072816342/campaigns/24048123061",
  }),
  accountCampaigns: freeze([
    freeze({ id: "24048123058", name: "GOOG_Search_TC_CoreProducts_2026" }),
    freeze({ id: "24048123061", name: "GOOG_Search_TC_CompetitorConquest_2026" }),
    freeze({ id: "24048123064", name: "GOOG_Search_TC_BrandDefense_2026" }),
  ]),
  oldFinalUrl: OLD_FINAL_URL,
  proposedFinalUrl: PROPOSED_FINAL_URL,
  landingMarker: LANDING_MARKER,
  confirmation: EXECUTION_CONFIRMATION,
  ads: freeze([
    freeze({
      adGroupId: "197192348086",
      adGroupName: "Comparison - Qwik Signs",
      adGroupResourceName: "customers/1072816342/adGroups/197192348086",
      adId: "817302599511",
      adResourceName: "customers/1072816342/ads/817302599511",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348086~817302599511",
    }),
    freeze({
      adGroupId: "197192348126",
      adGroupName: "Comparison - Minuteman Press",
      adGroupResourceName: "customers/1072816342/adGroups/197192348126",
      adId: "817302599514",
      adResourceName: "customers/1072816342/ads/817302599514",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348126~817302599514",
    }),
    freeze({
      adGroupId: "197192348286",
      adGroupName: "Comparison - 24 Hour Signs",
      adGroupResourceName: "customers/1072816342/adGroups/197192348286",
      adId: "817302599517",
      adResourceName: "customers/1072816342/ads/817302599517",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348286~817302599517",
    }),
    freeze({
      adGroupId: "197192348326",
      adGroupName: "Comparison - Anytime Printing",
      adGroupResourceName: "customers/1072816342/adGroups/197192348326",
      adId: "817302599640",
      adResourceName: "customers/1072816342/ads/817302599640",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348326~817302599640",
    }),
    freeze({
      adGroupId: "197192348366",
      adGroupName: "Comparison - PGI Printers",
      adGroupResourceName: "customers/1072816342/adGroups/197192348366",
      adId: "817302599643",
      adResourceName: "customers/1072816342/ads/817302599643",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348366~817302599643",
    }),
    freeze({
      adGroupId: "197192348526",
      adGroupName: "Comparison - Staples Printing",
      adGroupResourceName: "customers/1072816342/adGroups/197192348526",
      adId: "817302599646",
      adResourceName: "customers/1072816342/ads/817302599646",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348526~817302599646",
    }),
    freeze({
      adGroupId: "197192348566",
      adGroupName: "Comparison - Vistaprint",
      adGroupResourceName: "customers/1072816342/adGroups/197192348566",
      adId: "817302599649",
      adResourceName: "customers/1072816342/ads/817302599649",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/197192348566~817302599649",
    }),
    freeze({
      adGroupId: "198530955037",
      adGroupName: "Comparison - Ink House",
      adGroupResourceName: "customers/1072816342/adGroups/198530955037",
      adId: "817412449904",
      adResourceName: "customers/1072816342/ads/817412449904",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/198530955037~817412449904",
    }),
    freeze({
      adGroupId: "198530955077",
      adGroupName: "Comparison - Rayacom",
      adGroupResourceName: "customers/1072816342/adGroups/198530955077",
      adId: "817412449907",
      adResourceName: "customers/1072816342/ads/817412449907",
      adGroupAdResourceName: "customers/1072816342/adGroupAds/198530955077~817412449907",
    }),
  ]),
});

export const ADSBOT_PROBES = freeze([
  freeze({
    kind: "desktop",
    userAgent: "AdsBot-Google (+http://www.google.com/adsbot.html)",
  }),
  freeze({
    kind: "mobile",
    userAgent:
      "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 "
      + "(KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36 "
      + "(compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)",
  }),
]);

export function parseCompetitorReviewOptions(argv) {
  if (!Array.isArray(argv)) throw new Error("CLI arguments must be an array");
  let execute = false;
  let explicitDryRun = false;
  let confirmation = null;
  const seen = new Set();

  for (const argument of argv) {
    if (typeof argument !== "string") throw new Error("Every CLI argument must be a string");
    const key = argument.startsWith("--confirmation=") ? "--confirmation" : argument;
    if (seen.has(key)) throw new Error(`Duplicate option: ${key}`);
    seen.add(key);
    if (argument === "--execute") {
      execute = true;
    } else if (argument === "--dry-run") {
      explicitDryRun = true;
    } else if (argument.startsWith("--confirmation=")) {
      confirmation = argument.slice("--confirmation=".length);
    } else {
      throw new Error(`Unsupported option: ${argument}`);
    }
  }

  if (execute && explicitDryRun) throw new Error("--execute and --dry-run cannot be combined");
  if (execute && confirmation !== EXECUTION_CONFIRMATION) {
    throw new Error(`Execution requires --confirmation=${EXECUTION_CONFIRMATION}`);
  }
  if (!execute && confirmation !== null) throw new Error("--confirmation is accepted only with --execute");

  return freeze({
    execute,
    mode: execute ? "EXECUTE" : "DRY_RUN",
    confirmation,
  });
}

export function buildAdsMutatePayload({ validateOnly }) {
  if (typeof validateOnly !== "boolean") throw new Error("validateOnly must be a boolean");
  const operations = COMPETITOR_RSA_REVIEW.ads.map((ad) => ({
    update: {
      resourceName: ad.adResourceName,
      finalUrls: [PROPOSED_FINAL_URL],
    },
    updateMask: "final_urls",
  }));
  return {
    operations,
    partialFailure: false,
    validateOnly,
    responseContentType: "MUTABLE_RESOURCE",
  };
}

export function validateCompetitorReviewPreflight(state) {
  validateContainmentState(state);
  const targetAds = selectAndValidateTargetAds(state);
  const urlState = classifyTargetUrlState(targetAds);

  if (urlState === "ORIGINAL") {
    for (const ad of targetAds) {
      if (ad.approvalStatus !== "DISAPPROVED") {
        throw new Error(`${ad.adResourceName} must be DISAPPROVED before the targeted review request`);
      }
      if (ad.reviewStatus !== "REVIEWED") {
        throw new Error(`${ad.adResourceName} must have review status REVIEWED before the targeted review request`);
      }
      validateOnlyDestinationNotWorking(ad);
    }
    return { disposition: "READY", targetAds };
  }

  for (const ad of targetAds) validateNoUnexpectedPolicyTopics(ad);
  return { disposition: "ALREADY_REQUESTED", targetAds };
}

export function validateCompetitorReviewReadback(state) {
  validateContainmentState(state);
  const targetAds = selectAndValidateTargetAds(state);
  const urlState = classifyTargetUrlState(targetAds);
  if (urlState !== "PROPOSED") {
    throw new Error("Competitor RSA readback did not contain the exact proposed URL on all nine ads");
  }
  for (const ad of targetAds) validateNoUnexpectedPolicyTopics(ad);
  return { disposition: "REQUESTED", targetAds };
}

export function validateAdsBotLandingProbes(probes) {
  if (!Array.isArray(probes) || probes.length !== ADSBOT_PROBES.length) {
    throw new Error("Exactly one desktop and one mobile AdsBot landing probe are required");
  }
  const expectedKinds = ADSBOT_PROBES.map((probe) => probe.kind).sort();
  const actualKinds = probes.map((probe) => probe?.kind).sort();
  if (!sameStringArray(actualKinds, expectedKinds)) {
    throw new Error("AdsBot probes must be exactly desktop and mobile");
  }
  for (const probe of probes) {
    if (probe.requestedUrl !== PROPOSED_FINAL_URL || probe.finalUrl !== PROPOSED_FINAL_URL) {
      throw new Error(`${probe.kind} AdsBot landing probe must return the proposed URL without redirect drift`);
    }
    if (probe.redirected !== false) {
      throw new Error(`${probe.kind} AdsBot landing probe must not redirect`);
    }
    if (probe.status !== 200) throw new Error(`${probe.kind} AdsBot landing probe did not return HTTP 200`);
    if (probe.markerFound !== true) throw new Error(`${probe.kind} AdsBot landing probe did not contain the paid-page marker`);
    if (probe.noindex !== true) throw new Error(`${probe.kind} AdsBot landing probe did not contain noindex`);
    if (!String(probe.contentType ?? "").toLowerCase().startsWith("text/html")) {
      throw new Error(`${probe.kind} AdsBot landing probe did not return HTML`);
    }
  }
  return probes;
}

export function validateAdsMutateResponse(response) {
  const resources = (response?.results ?? []).map((result) => String(result?.resourceName ?? "")).sort();
  const expected = COMPETITOR_RSA_REVIEW.ads.map((ad) => ad.adResourceName).sort();
  if (!sameStringArray(resources, expected)) {
    throw new Error("Google Ads mutate response did not return the exact nine ad resources");
  }
  return response;
}

export function validateReviewInvocation(options) {
  if (!options || typeof options !== "object") throw new Error("Review options are required");
  if (options.execute === false && options.mode === "DRY_RUN" && options.confirmation === null) return options;
  if (options.execute === true
    && options.mode === "EXECUTE"
    && options.confirmation === EXECUTION_CONFIRMATION) return options;
  throw new Error("Invalid review invocation; execution requires the exact confirmation contract");
}

export function isAmbiguousMutationError(error) {
  if (error?.ambiguous === true) return true;
  return ["AbortError", "TimeoutError"].includes(error?.name)
    || error instanceof TypeError;
}

export async function runCompetitorRsaReview({
  api,
  options,
  landingProbe,
}) {
  const base = {
    ok: false,
    customerId: COMPETITOR_RSA_REVIEW.customerId,
    campaignId: COMPETITOR_RSA_REVIEW.campaign.id,
    proposedFinalUrl: PROPOSED_FINAL_URL,
    action: "NONE",
  };

  try {
    validateReviewInvocation(options);
  } catch (error) {
    return { ...base, outcome: "INVALID_INVOCATION", error: safeMessage(error) };
  }

  let preflight;
  try {
    preflight = validateCompetitorReviewPreflight(await api.readState());
  } catch (error) {
    return { ...base, outcome: "PREFLIGHT_REFUSED", error: safeMessage(error) };
  }

  if (preflight.disposition === "ALREADY_REQUESTED") {
    return {
      ...base,
      ok: true,
      outcome: "ALREADY_REQUESTED",
      action: "NONE",
      adResources: preflight.targetAds.map((ad) => ad.adResourceName),
    };
  }

  let landing;
  try {
    landing = validateAdsBotLandingProbes(await landingProbe(PROPOSED_FINAL_URL));
  } catch (error) {
    return { ...base, outcome: "LANDING_REFUSED", error: safeMessage(error) };
  }

  const validationPayload = buildAdsMutatePayload({ validateOnly: true });
  try {
    await api.mutateAds(validationPayload);
  } catch (error) {
    return {
      ...base,
      outcome: "VALIDATION_REFUSED",
      error: safeMessage(error),
      policyExemptionRequested: false,
    };
  }

  if (!options.execute) {
    return {
      ...base,
      ok: true,
      outcome: "DRY_RUN_VALIDATED",
      action: "WOULD_REQUEST_REVIEW",
      landing,
      operationCount: validationPayload.operations.length,
      policyExemptionRequested: false,
    };
  }

  let mutationResponse;
  try {
    mutationResponse = await api.mutateAds(buildAdsMutatePayload({ validateOnly: false }));
  } catch (error) {
    if (!isAmbiguousMutationError(error)) {
      return {
        ...base,
        outcome: "MUTATION_REFUSED",
        error: safeMessage(error),
        policyExemptionRequested: false,
      };
    }
    return resolveAmbiguousMutation({ api, base, error });
  }

  let responseError = null;
  try {
    validateAdsMutateResponse(mutationResponse);
  } catch (error) {
    responseError = error;
  }
  try {
    const readback = validateCompetitorReviewReadback(await api.readState());
    if (responseError) throw responseError;
    return {
      ...base,
      ok: true,
      outcome: "REVIEW_REQUESTED",
      action: "UPDATED_FINAL_URLS",
      landing,
      adResources: readback.targetAds.map((ad) => ad.adResourceName),
      policyExemptionRequested: false,
    };
  } catch (error) {
    return {
      ...base,
      outcome: "MUTATION_UNVERIFIED",
      action: "UPDATE_ATTEMPTED",
      error: safeMessage(error),
      policyExemptionRequested: false,
    };
  }
}

async function resolveAmbiguousMutation({ api, base, error }) {
  try {
    const readback = validateCompetitorReviewReadback(await api.readState());
    return {
      ...base,
      ok: true,
      outcome: "REVIEW_REQUESTED_AFTER_AMBIGUOUS_RESPONSE",
      action: "UPDATED_FINAL_URLS",
      warning: safeMessage(error),
      adResources: readback.targetAds.map((ad) => ad.adResourceName),
      policyExemptionRequested: false,
    };
  } catch (readbackError) {
    return {
      ...base,
      outcome: "AMBIGUOUS_MUTATION",
      action: "UPDATE_ATTEMPTED",
      error: `${safeMessage(error)}; immediate readback did not prove the exact requested state: ${safeMessage(readbackError)}`,
      retryAutomatically: false,
      policyExemptionRequested: false,
    };
  }
}

function validateContainmentState(state) {
  if (!state || typeof state !== "object") throw new Error("Google Ads state is required");
  if (String(state.account?.id ?? "") !== COMPETITOR_RSA_REVIEW.customerId
    || state.account?.currencyCode !== COMPETITOR_RSA_REVIEW.currencyCode
    || state.account?.timeZone !== COMPETITOR_RSA_REVIEW.timeZone) {
    throw new Error("Google Ads account identity, currency, or time zone does not match True Color");
  }

  const campaigns = requireArray(state.campaigns, "campaign inventory");
  const expectedCampaignIds = COMPETITOR_RSA_REVIEW.accountCampaigns.map((campaign) => campaign.id).sort();
  const actualCampaignIds = campaigns.map((campaign) => String(campaign.id ?? "")).sort();
  if (!sameStringArray(actualCampaignIds, expectedCampaignIds)) {
    throw new Error("Account campaign inventory does not match the exact three-campaign allowlist");
  }
  for (const expected of COMPETITOR_RSA_REVIEW.accountCampaigns) {
    const campaign = campaigns.find((item) => String(item.id) === expected.id);
    if (campaign?.name !== expected.name) throw new Error(`Campaign ${expected.id} name drifted`);
    if (campaign?.status !== "PAUSED") throw new Error(`Campaign ${expected.id} is not PAUSED`);
  }
  const competitor = campaigns.find((campaign) => String(campaign.id) === COMPETITOR_RSA_REVIEW.campaign.id);
  if (competitor?.resourceName !== COMPETITOR_RSA_REVIEW.campaign.resourceName) {
    throw new Error("Competitor campaign resource name drifted");
  }

  const adGroups = requireArray(state.adGroups, "ad-group inventory");
  if (adGroups.length === 0) throw new Error("Ad-group inventory is empty");
  for (const group of adGroups) {
    if (group.status !== "PAUSED") throw new Error(`Ad group ${group.resourceName ?? group.id} is not PAUSED`);
  }

  const ads = requireArray(state.ads, "ad inventory");
  if (ads.length === 0) throw new Error("Ad inventory is empty");
  for (const ad of ads) {
    if (ad.status !== "PAUSED") throw new Error(`Ad ${ad.adGroupAdResourceName ?? ad.adId} is not PAUSED`);
  }

  const micros = parseMicros(state.accountCostMicros);
  if (micros !== 0n) throw new Error(`True Color account spend must be exactly CA$0, received ${micros} micros`);
}

function selectAndValidateTargetAds(state) {
  const targetAds = state.ads.filter(
    (ad) => String(ad.campaignId ?? "") === COMPETITOR_RSA_REVIEW.campaign.id,
  );
  if (targetAds.length !== COMPETITOR_RSA_REVIEW.ads.length) {
    throw new Error("Competitor campaign must contain exactly nine non-removed ads");
  }

  const actualResources = targetAds.map((ad) => String(ad.adGroupAdResourceName ?? "")).sort();
  const expectedResources = COMPETITOR_RSA_REVIEW.ads.map((ad) => ad.adGroupAdResourceName).sort();
  if (!sameStringArray(actualResources, expectedResources)) {
    throw new Error("Competitor ad resources do not match the exact nine-ad allowlist");
  }

  const targetGroups = state.adGroups.filter(
    (group) => String(group.campaignId ?? "") === COMPETITOR_RSA_REVIEW.campaign.id,
  );
  if (targetGroups.length !== COMPETITOR_RSA_REVIEW.ads.length) {
    throw new Error("Competitor campaign must contain exactly nine non-removed ad groups");
  }

  for (const expected of COMPETITOR_RSA_REVIEW.ads) {
    const ad = targetAds.find((item) => item.adGroupAdResourceName === expected.adGroupAdResourceName);
    const group = targetGroups.find((item) => String(item.id) === expected.adGroupId);
    if (!ad || !group) throw new Error(`Missing exact competitor target ${expected.adGroupName}`);
    const accountWideAssociations = state.ads.filter(
      (item) => String(item.adId ?? "") === expected.adId
        || item.adResourceName === expected.adResourceName,
    );
    if (accountWideAssociations.length !== 1
      || accountWideAssociations[0].adGroupAdResourceName !== expected.adGroupAdResourceName) {
      throw new Error(`Competitor target ad is shared or duplicated outside its allowlisted association: ${expected.adGroupName}`);
    }
    if (String(ad.adId) !== expected.adId
      || ad.adResourceName !== expected.adResourceName
      || String(ad.adGroupId) !== expected.adGroupId
      || ad.adGroupResourceName !== expected.adGroupResourceName
      || ad.adGroupName !== expected.adGroupName
      || String(group.id) !== expected.adGroupId
      || group.resourceName !== expected.adGroupResourceName
      || group.name !== expected.adGroupName
      || group.resourceName !== ad.adGroupResourceName) {
      throw new Error(`Competitor target identity drifted for ${expected.adGroupName}`);
    }
    if (ad.campaignName !== COMPETITOR_RSA_REVIEW.campaign.name
      || ad.campaignResourceName !== COMPETITOR_RSA_REVIEW.campaign.resourceName
      || group.campaignName !== COMPETITOR_RSA_REVIEW.campaign.name
      || group.campaignResourceName !== COMPETITOR_RSA_REVIEW.campaign.resourceName) {
      throw new Error(`Competitor campaign association drifted for ${expected.adGroupName}`);
    }
    if (ad.type !== "RESPONSIVE_SEARCH_AD") {
      throw new Error(`${expected.adGroupName} is not a responsive search ad`);
    }
    if (!Array.isArray(ad.finalUrls) || ad.finalUrls.length !== 1) {
      throw new Error(`${expected.adGroupName} must have exactly one final URL`);
    }
  }
  return COMPETITOR_RSA_REVIEW.ads.map(
    (expected) => targetAds.find((ad) => ad.adGroupAdResourceName === expected.adGroupAdResourceName),
  );
}

function classifyTargetUrlState(targetAds) {
  const urls = new Set(targetAds.map((ad) => ad.finalUrls[0]));
  if (urls.size !== 1) throw new Error("Competitor RSA URLs are in a mixed state");
  const [url] = urls;
  if (url === OLD_FINAL_URL) return "ORIGINAL";
  if (url === PROPOSED_FINAL_URL) return "PROPOSED";
  throw new Error(`Competitor RSA URL is outside the exact old/new allowlist: ${url}`);
}

function validateOnlyDestinationNotWorking(ad) {
  const topics = requireArray(ad.policyTopics, `${ad.adResourceName} policy topics`);
  if (topics.length !== 1 || topics[0] !== "DESTINATION_NOT_WORKING") {
    throw new Error(`${ad.adResourceName} must have only DESTINATION_NOT_WORKING`);
  }
}

function validateNoUnexpectedPolicyTopics(ad) {
  const topics = requireArray(ad.policyTopics, `${ad.adResourceName} policy topics`);
  if (topics.some((topic) => topic !== "DESTINATION_NOT_WORKING")) {
    throw new Error(`${ad.adResourceName} contains a policy topic outside DESTINATION_NOT_WORKING`);
  }
}

function parseMicros(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("Account cost micros must be a non-negative integer string");
  }
  return BigInt(value);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function sameStringArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function createAdsBotLandingProbe({ fetchImpl = fetch } = {}) {
  return async (url) => Promise.all(ADSBOT_PROBES.map(async ({ kind, userAgent }) => {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "cache-control": "no-cache",
        "user-agent": userAgent,
      },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    const robots = response.headers.get("x-robots-tag");
    const metaNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(body)
      || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(body);
    return {
      kind,
      requestedUrl: url,
      finalUrl: response.url,
      redirected: response.redirected,
      status: response.status,
      contentType: response.headers.get("content-type"),
      markerFound: body.includes(LANDING_MARKER),
      noindex: robots?.toLowerCase().includes("noindex") === true || metaNoindex,
    };
  }));
}

export function googleAdsEndpoint(path) {
  if (!["googleAds:search", "ads:mutate"].includes(path)) {
    throw new Error(`Google Ads path is not allowlisted: ${path}`);
  }
  return `https://googleads.googleapis.com/${API_VERSION}/customers/${COMPETITOR_RSA_REVIEW.customerId}/${path}`;
}

export function createCompetitorReviewGoogleAdsApi({ fetchImpl = fetch, env = process.env } = {}) {
  validateGoogleAdsEnvironment(env);
  let headersPromise;
  const headers = () => {
    headersPromise ??= exchangeToken(fetchImpl, env).then((accessToken) => ({
      authorization: `Bearer ${accessToken}`,
      "developer-token": env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "login-customer-id": COMPETITOR_RSA_REVIEW.loginCustomerId,
      "content-type": "application/json",
    }));
    return headersPromise;
  };

  const post = async (path, body, operation) => {
    let response;
    try {
      response = await fetchImpl(googleAdsEndpoint(path), {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      error.ambiguous = path === "ads:mutate";
      throw error;
    }
    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new GoogleAdsRequestError({
        status: response.status,
        operation,
        body: responseBody,
        ambiguous: path === "ads:mutate" && (response.status === 408 || response.status === 429 || response.status >= 500),
      });
    }
    return responseBody;
  };

  const search = async (query, operation) => {
    const results = [];
    const seen = new Set();
    let pageToken;
    for (let page = 0; page < 100; page += 1) {
      const response = await post(
        "googleAds:search",
        { query, ...(pageToken ? { pageToken } : {}) },
        operation,
      );
      results.push(...(response.results ?? []));
      if (!response.nextPageToken) return results;
      if (seen.has(response.nextPageToken)) throw new Error(`${operation} returned a repeated page token`);
      seen.add(response.nextPageToken);
      pageToken = response.nextPageToken;
    }
    throw new Error(`${operation} exceeded 100 result pages`);
  };

  return {
    async readState() {
      const [accountRows, campaignRows, adGroupRows, adRows, spendRows] = await Promise.all([
        search(
          "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
          "account identity read",
        ),
        search(
          "SELECT campaign.id, campaign.resource_name, campaign.name, campaign.status "
          + "FROM campaign WHERE campaign.status != 'REMOVED'",
          "campaign inventory read",
        ),
        search(
          "SELECT campaign.id, campaign.resource_name, campaign.name, ad_group.id, "
          + "ad_group.resource_name, ad_group.name, ad_group.status "
          + "FROM ad_group WHERE ad_group.status != 'REMOVED'",
          "ad-group inventory read",
        ),
        search(
          "SELECT campaign.id, campaign.resource_name, campaign.name, ad_group.id, "
          + "ad_group.resource_name, ad_group.name, ad_group_ad.resource_name, "
          + "ad_group_ad.status, ad_group_ad.ad.id, ad_group_ad.ad.resource_name, "
          + "ad_group_ad.ad.type, ad_group_ad.ad.final_urls, "
          + "ad_group_ad.policy_summary.approval_status, "
          + "ad_group_ad.policy_summary.review_status, "
          + "ad_group_ad.policy_summary.policy_topic_entries "
          + "FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'",
          "ad inventory read",
        ),
        search(
          "SELECT customer.id, metrics.cost_micros FROM customer",
          "account spend read",
        ),
      ]);
      return mapGoogleAdsState({ accountRows, campaignRows, adGroupRows, adRows, spendRows });
    },
    mutateAds(payload) {
      validateMutationPayloadShape(payload);
      return post("ads:mutate", payload, payload.validateOnly ? "ads validate-only mutation" : "ads mutation");
    },
  };
}

export function mapGoogleAdsState({ accountRows, campaignRows, adGroupRows, adRows, spendRows }) {
  const customer = accountRows?.[0]?.customer;
  const exactSpendRows = requireArray(spendRows, "spend rows");
  if (exactSpendRows.length !== 1) {
    throw new Error("Exactly one True Color account spend row is required");
  }
  const [spendRow] = exactSpendRows;
  if (String(spendRow.customer?.id ?? "") !== COMPETITOR_RSA_REVIEW.customerId) {
    throw new Error("Spend row belongs to the wrong Google Ads customer");
  }
  const spend = parseMicros(spendRow.metrics?.costMicros);
  return {
    account: {
      id: String(customer?.id ?? ""),
      currencyCode: customer?.currencyCode,
      timeZone: customer?.timeZone,
    },
    accountCostMicros: spend.toString(),
    campaigns: requireArray(campaignRows, "campaign rows").map((row) => ({
      id: String(row.campaign?.id ?? ""),
      resourceName: row.campaign?.resourceName,
      name: row.campaign?.name,
      status: row.campaign?.status,
    })),
    adGroups: requireArray(adGroupRows, "ad-group rows").map((row) => ({
      campaignId: String(row.campaign?.id ?? ""),
      campaignResourceName: row.campaign?.resourceName,
      campaignName: row.campaign?.name,
      id: String(row.adGroup?.id ?? ""),
      resourceName: row.adGroup?.resourceName,
      name: row.adGroup?.name,
      status: row.adGroup?.status,
    })),
    ads: requireArray(adRows, "ad rows").map((row) => ({
      campaignId: String(row.campaign?.id ?? ""),
      campaignResourceName: row.campaign?.resourceName,
      campaignName: row.campaign?.name,
      adGroupId: String(row.adGroup?.id ?? ""),
      adGroupResourceName: row.adGroup?.resourceName,
      adGroupName: row.adGroup?.name,
      adGroupAdResourceName: row.adGroupAd?.resourceName,
      status: row.adGroupAd?.status,
      adId: String(row.adGroupAd?.ad?.id ?? ""),
      adResourceName: row.adGroupAd?.ad?.resourceName,
      type: row.adGroupAd?.ad?.type,
      finalUrls: row.adGroupAd?.ad?.finalUrls ?? [],
      approvalStatus: row.adGroupAd?.policySummary?.approvalStatus,
      reviewStatus: row.adGroupAd?.policySummary?.reviewStatus,
      policyTopics: (row.adGroupAd?.policySummary?.policyTopicEntries ?? []).map((entry) => entry.topic),
    })),
  };
}

function validateMutationPayloadShape(payload) {
  const expected = buildAdsMutatePayload({ validateOnly: payload?.validateOnly });
  if (JSON.stringify(payload) !== JSON.stringify(expected)) {
    throw new Error("Ads mutation payload differs from the exact review-request contract");
  }
}

class GoogleAdsRequestError extends Error {
  constructor({ status, operation, body, ambiguous }) {
    const requestId = body?.error?.details?.find((detail) => detail.requestId)?.requestId;
    const code = body?.error?.status ?? body?.error?.code;
    super(`${operation} failed with HTTP ${status}${code ? ` (${code})` : ""}${requestId ? ` request ${requestId}` : ""}`);
    this.name = "GoogleAdsRequestError";
    this.status = status;
    this.ambiguous = ambiguous;
  }
}

function validateGoogleAdsEnvironment(env) {
  for (const name of [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
  ]) {
    if (!env[name]) throw new Error(`${name} is required`);
  }
}

async function exchangeToken(fetchImpl, env) {
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(`Google Ads OAuth exchange failed with HTTP ${response.status}`);
  }
  return body.access_token;
}

function safeMessage(error) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function main() {
  let result;
  try {
    const options = parseCompetitorReviewOptions(process.argv.slice(2));
    result = await runCompetitorRsaReview({
      api: createCompetitorReviewGoogleAdsApi(),
      options,
      landingProbe: createAdsBotLandingProbe(),
    });
  } catch (error) {
    result = {
      ok: false,
      outcome: "ERROR",
      action: "NONE",
      error: safeMessage(error),
    };
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
