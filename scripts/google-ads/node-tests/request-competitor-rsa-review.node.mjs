import assert from "node:assert/strict";
import test from "node:test";
import {
  ADSBOT_PROBES,
  buildAdsMutatePayload,
  COMPETITOR_RSA_REVIEW,
  googleAdsEndpoint,
  mapGoogleAdsState,
  parseCompetitorReviewOptions,
  runCompetitorRsaReview,
  validateAdsBotLandingProbes,
  validateAdsMutateResponse,
  validateCompetitorReviewPreflight,
  validateCompetitorReviewReadback,
  validateReviewInvocation,
} from "../request-competitor-rsa-review.mjs";

function makeState(url = COMPETITOR_RSA_REVIEW.oldFinalUrl) {
  const competitor = COMPETITOR_RSA_REVIEW.campaign;
  const competitorGroups = COMPETITOR_RSA_REVIEW.ads.map((target) => ({
    campaignId: competitor.id,
    campaignResourceName: competitor.resourceName,
    campaignName: competitor.name,
    id: target.adGroupId,
    resourceName: target.adGroupResourceName,
    name: target.adGroupName,
    status: "PAUSED",
  }));
  const competitorAds = COMPETITOR_RSA_REVIEW.ads.map((target) => ({
    campaignId: competitor.id,
    campaignResourceName: competitor.resourceName,
    campaignName: competitor.name,
    adGroupId: target.adGroupId,
    adGroupResourceName: target.adGroupResourceName,
    adGroupName: target.adGroupName,
    adGroupAdResourceName: target.adGroupAdResourceName,
    status: "PAUSED",
    adId: target.adId,
    adResourceName: target.adResourceName,
    type: "RESPONSIVE_SEARCH_AD",
    finalUrls: [url],
    approvalStatus: "DISAPPROVED",
    reviewStatus: "REVIEWED",
    policyTopics: ["DESTINATION_NOT_WORKING"],
  }));
  return {
    account: {
      id: COMPETITOR_RSA_REVIEW.customerId,
      currencyCode: "CAD",
      timeZone: "America/Regina",
    },
    accountCostMicros: "0",
    campaigns: COMPETITOR_RSA_REVIEW.accountCampaigns.map((campaign) => ({
      ...campaign,
      resourceName: `customers/${COMPETITOR_RSA_REVIEW.customerId}/campaigns/${campaign.id}`,
      status: "PAUSED",
    })),
    adGroups: [
      {
        campaignId: "24048123058",
        campaignResourceName: "customers/1072816342/campaigns/24048123058",
        campaignName: "GOOG_Search_TC_CoreProducts_2026",
        id: "197192347366",
        resourceName: "customers/1072816342/adGroups/197192347366",
        name: "Coroplast Signs",
        status: "PAUSED",
      },
      ...competitorGroups,
      {
        campaignId: "24048123064",
        campaignResourceName: "customers/1072816342/campaigns/24048123064",
        campaignName: "GOOG_Search_TC_BrandDefense_2026",
        id: "197192349999",
        resourceName: "customers/1072816342/adGroups/197192349999",
        name: "Brand",
        status: "PAUSED",
      },
    ],
    ads: [
      {
        campaignId: "24048123058",
        campaignResourceName: "customers/1072816342/campaigns/24048123058",
        campaignName: "GOOG_Search_TC_CoreProducts_2026",
        adGroupId: "197192347366",
        adGroupResourceName: "customers/1072816342/adGroups/197192347366",
        adGroupName: "Coroplast Signs",
        adGroupAdResourceName: "customers/1072816342/adGroupAds/197192347366~817302599484",
        status: "PAUSED",
        adId: "817302599484",
        adResourceName: "customers/1072816342/ads/817302599484",
        type: "RESPONSIVE_SEARCH_AD",
        finalUrls: ["https://truecolorprinting.ca/products/coroplast-signs"],
        approvalStatus: "APPROVED",
        reviewStatus: "REVIEWED",
        policyTopics: [],
      },
      ...competitorAds,
      {
        campaignId: "24048123064",
        campaignResourceName: "customers/1072816342/campaigns/24048123064",
        campaignName: "GOOG_Search_TC_BrandDefense_2026",
        adGroupId: "197192349999",
        adGroupResourceName: "customers/1072816342/adGroups/197192349999",
        adGroupName: "Brand",
        adGroupAdResourceName: "customers/1072816342/adGroupAds/197192349999~817302599999",
        status: "PAUSED",
        adId: "817302599999",
        adResourceName: "customers/1072816342/ads/817302599999",
        type: "RESPONSIVE_SEARCH_AD",
        finalUrls: ["https://truecolorprinting.ca/"],
        approvalStatus: "APPROVED",
        reviewStatus: "REVIEWED",
        policyTopics: [],
      },
    ],
  };
}

function healthyProbes() {
  return ADSBOT_PROBES.map(({ kind }) => ({
    kind,
    requestedUrl: COMPETITOR_RSA_REVIEW.proposedFinalUrl,
    finalUrl: COMPETITOR_RSA_REVIEW.proposedFinalUrl,
    redirected: false,
    status: 200,
    contentType: "text/html; charset=utf-8",
    markerFound: true,
    noindex: true,
  }));
}

function mutateStateToProposed(state) {
  for (const ad of state.ads) {
    if (ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id) {
      ad.finalUrls = [COMPETITOR_RSA_REVIEW.proposedFinalUrl];
      ad.reviewStatus = "REVIEW_IN_PROGRESS";
    }
  }
}

function makeApi({ mutateError = null, ambiguousApplied = false, responseResources = null } = {}) {
  const state = structuredClone(makeState());
  const calls = [];
  return {
    calls,
    state,
    async readState() {
      calls.push({ type: "read" });
      return structuredClone(state);
    },
    async mutateAds(payload) {
      calls.push({ type: "mutate", payload: structuredClone(payload) });
      if (payload.validateOnly) return {};
      if (mutateError) {
        if (ambiguousApplied) mutateStateToProposed(state);
        throw mutateError;
      }
      mutateStateToProposed(state);
      return {
        results: (responseResources ?? COMPETITOR_RSA_REVIEW.ads.map((ad) => ad.adResourceName))
          .map((resourceName) => ({ resourceName })),
      };
    },
  };
}

test("locks exact account, login, campaign, API version, URLs, and nine-ad allowlist", () => {
  assert.equal(COMPETITOR_RSA_REVIEW.apiVersion, "v24");
  assert.equal(COMPETITOR_RSA_REVIEW.customerId, "1072816342");
  assert.equal(COMPETITOR_RSA_REVIEW.loginCustomerId, "1125402990");
  assert.deepEqual(COMPETITOR_RSA_REVIEW.campaign, {
    id: "24048123061",
    name: "GOOG_Search_TC_CompetitorConquest_2026",
    resourceName: "customers/1072816342/campaigns/24048123061",
  });
  assert.equal(COMPETITOR_RSA_REVIEW.oldFinalUrl, "https://truecolorprinting.ca/why-true-color");
  assert.equal(
    COMPETITOR_RSA_REVIEW.proposedFinalUrl,
    "https://truecolorprinting.ca/why-true-color?source=google-ads",
  );
  assert.equal(COMPETITOR_RSA_REVIEW.ads.length, 9);
  assert.deepEqual(
    COMPETITOR_RSA_REVIEW.ads.map((ad) => ad.adGroupAdResourceName),
    [
      "customers/1072816342/adGroupAds/197192348086~817302599511",
      "customers/1072816342/adGroupAds/197192348126~817302599514",
      "customers/1072816342/adGroupAds/197192348286~817302599517",
      "customers/1072816342/adGroupAds/197192348326~817302599640",
      "customers/1072816342/adGroupAds/197192348366~817302599643",
      "customers/1072816342/adGroupAds/197192348526~817302599646",
      "customers/1072816342/adGroupAds/197192348566~817302599649",
      "customers/1072816342/adGroupAds/198530955037~817412449904",
      "customers/1072816342/adGroupAds/198530955077~817412449907",
    ],
  );
  assert.equal(
    googleAdsEndpoint("ads:mutate"),
    "https://googleads.googleapis.com/v24/customers/1072816342/ads:mutate",
  );
  assert.throws(() => googleAdsEndpoint("campaigns:mutate"), /not allowlisted/);
});

test("CLI is dry-run by default and execution requires the exact explicit confirmation", () => {
  assert.deepEqual(parseCompetitorReviewOptions([]), {
    execute: false,
    mode: "DRY_RUN",
    confirmation: null,
  });
  assert.equal(parseCompetitorReviewOptions(["--dry-run"]).mode, "DRY_RUN");
  assert.deepEqual(
    parseCompetitorReviewOptions([
      "--execute",
      "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
    ]),
    {
      execute: true,
      mode: "EXECUTE",
      confirmation: "REQUEST_COMPETITOR_RSA_REVIEW",
    },
  );
  for (const argv of [
    ["--execute"],
    ["--execute", "--confirmation=wrong"],
    ["--confirmation=REQUEST_COMPETITOR_RSA_REVIEW"],
    ["--execute", "--dry-run", "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW"],
    ["--execute", "--execute", "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW"],
    ["activate"],
  ]) {
    assert.throws(() => parseCompetitorReviewOptions(argv));
  }
  assert.throws(
    () => validateReviewInvocation({ execute: true, mode: "EXECUTE", confirmation: "wrong" }),
    /exact confirmation/,
  );
});

test("builds one atomic exact ads:mutate payload with no activation or policy exemption", () => {
  const payload = buildAdsMutatePayload({ validateOnly: true });
  assert.equal(payload.validateOnly, true);
  assert.equal(payload.partialFailure, false);
  assert.equal(payload.responseContentType, "MUTABLE_RESOURCE");
  assert.equal(payload.operations.length, 9);
  assert.deepEqual(payload.operations[0], {
    update: {
      resourceName: "customers/1072816342/ads/817302599511",
      finalUrls: ["https://truecolorprinting.ca/why-true-color?source=google-ads"],
    },
    updateMask: "final_urls",
  });
  assert.deepEqual(
    payload.operations.map((operation) => operation.update.resourceName),
    COMPETITOR_RSA_REVIEW.ads.map((ad) => ad.adResourceName),
  );
  const serialized = JSON.stringify(payload);
  for (const forbidden of [
    "status",
    "ENABLED",
    "policyValidationParameter",
    "ignorablePolicyTopics",
    "campaigns:mutate",
    "adGroupAds:mutate",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
  assert.deepEqual(
    buildAdsMutatePayload({ validateOnly: false }),
    { ...payload, validateOnly: false },
  );
});

test("accepts only the exact paused, zero-spend, DNW-only original state", () => {
  const result = validateCompetitorReviewPreflight(makeState());
  assert.equal(result.disposition, "READY");
  assert.equal(result.targetAds.length, 9);

  const mutations = [
    (state) => { state.account.id = "2200538686"; },
    (state) => { state.account.currencyCode = "USD"; },
    (state) => { state.account.timeZone = "America/Toronto"; },
    (state) => { state.accountCostMicros = "1"; },
    (state) => { state.accountCostMicros = "-1"; },
    (state) => { state.campaigns[0].status = "ENABLED"; },
    (state) => { state.campaigns[1].name = "Wrong campaign"; },
    (state) => { state.campaigns.push({ ...state.campaigns[0], id: "999" }); },
    (state) => { state.adGroups[0].status = "ENABLED"; },
    (state) => { state.ads[0].status = "ENABLED"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).status = "ENABLED"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).type = "TEXT_AD"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).adId = "999"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).adResourceName = "customers/1072816342/ads/999"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).adGroupName = "Wrong group"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).finalUrls = []; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).approvalStatus = "APPROVED"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).reviewStatus = "REVIEW_IN_PROGRESS"; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).policyTopics = []; },
    (state) => { state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).policyTopics = ["DESTINATION_NOT_WORKING", "OTHER"]; },
    (state) => { state.ads = state.ads.filter((ad) => ad.adId !== COMPETITOR_RSA_REVIEW.ads[0].adId); },
    (state) => {
      const original = state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id);
      state.ads.push({ ...structuredClone(original), adId: "999", adGroupAdResourceName: "customers/1072816342/adGroupAds/1~999" });
    },
    (state) => {
      const target = state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id);
      state.ads.push({
        ...structuredClone(state.ads[0]),
        adId: target.adId,
        adResourceName: target.adResourceName,
        adGroupAdResourceName: `customers/1072816342/adGroupAds/${state.ads[0].adGroupId}~${target.adId}`,
      });
    },
    (state) => {
      state.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).finalUrls =
        [COMPETITOR_RSA_REVIEW.proposedFinalUrl];
    },
  ];
  for (const mutate of mutations) {
    const state = structuredClone(makeState());
    mutate(state);
    assert.throws(() => validateCompetitorReviewPreflight(state));
  }
});

test("recognizes the exact proposed URL as idempotently requested but rejects policy drift", () => {
  const requested = makeState(COMPETITOR_RSA_REVIEW.proposedFinalUrl);
  for (const ad of requested.ads) {
    if (ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id) {
      ad.approvalStatus = "UNDER_REVIEW";
      ad.reviewStatus = "REVIEW_IN_PROGRESS";
      ad.policyTopics = [];
    }
  }
  assert.equal(validateCompetitorReviewPreflight(requested).disposition, "ALREADY_REQUESTED");
  assert.equal(validateCompetitorReviewReadback(requested).disposition, "REQUESTED");
  requested.ads.find((ad) => ad.campaignId === COMPETITOR_RSA_REVIEW.campaign.id).policyTopics = ["OTHER"];
  assert.throws(() => validateCompetitorReviewPreflight(requested), /outside DESTINATION_NOT_WORKING/);
});

test("requires desktop and mobile AdsBot direct-200 HTML responses with the marker", () => {
  assert.equal(validateAdsBotLandingProbes(healthyProbes()).length, 2);
  for (const mutate of [
    (probes) => probes.pop(),
    (probes) => { probes[0].kind = "mobile"; },
    (probes) => { probes[0].requestedUrl = COMPETITOR_RSA_REVIEW.oldFinalUrl; },
    (probes) => { probes[0].finalUrl = `${COMPETITOR_RSA_REVIEW.proposedFinalUrl}/`; },
    (probes) => { probes[0].redirected = true; },
    (probes) => { probes[0].status = 403; },
    (probes) => { probes[0].markerFound = false; },
    (probes) => { probes[0].noindex = false; },
    (probes) => { probes[0].contentType = "application/json"; },
  ]) {
    const probes = healthyProbes();
    mutate(probes);
    assert.throws(() => validateAdsBotLandingProbes(probes));
  }
});

test("dry-run performs preflight, AdsBot probes, and validateOnly without executing", async () => {
  const api = makeApi();
  const result = await runCompetitorRsaReview({
    api,
    options: parseCompetitorReviewOptions([]),
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "DRY_RUN_VALIDATED");
  assert.equal(result.action, "WOULD_REQUEST_REVIEW");
  assert.deepEqual(api.calls.map((call) => call.type), ["read", "mutate"]);
  assert.equal(api.calls[1].payload.validateOnly, true);
  assert.equal(result.policyExemptionRequested, false);
});

test("execute validates atomically first, mutates once, and immediately verifies readback", async () => {
  const api = makeApi();
  const result = await runCompetitorRsaReview({
    api,
    options: parseCompetitorReviewOptions([
      "--execute",
      "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
    ]),
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "REVIEW_REQUESTED");
  assert.deepEqual(api.calls.map((call) => call.type), ["read", "mutate", "mutate", "read"]);
  assert.equal(api.calls[1].payload.validateOnly, true);
  assert.equal(api.calls[2].payload.validateOnly, false);
  assert.equal(api.calls[2].payload.partialFailure, false);
  assert.equal(result.policyExemptionRequested, false);
});

test("never executes when preflight, landing, or validation fails, including DNW validation", async () => {
  const executeOptions = parseCompetitorReviewOptions([
    "--execute",
    "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
  ]);
  const activeApi = makeApi();
  activeApi.state.campaigns[0].status = "ENABLED";
  const active = await runCompetitorRsaReview({
    api: activeApi,
    options: executeOptions,
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(active.outcome, "PREFLIGHT_REFUSED");
  assert.equal(activeApi.calls.filter((call) => call.type === "mutate").length, 0);

  const landingApi = makeApi();
  const landing = await runCompetitorRsaReview({
    api: landingApi,
    options: executeOptions,
    landingProbe: async () => healthyProbes().map((probe) => ({ ...probe, status: 403 })),
  });
  assert.equal(landing.outcome, "LANDING_REFUSED");
  assert.equal(landingApi.calls.filter((call) => call.type === "mutate").length, 0);

  const validationCalls = [];
  const validationApi = {
    async readState() { return makeState(); },
    async mutateAds(payload) {
      validationCalls.push(payload);
      throw new Error("POLICY_FINDING_ERROR: DESTINATION_NOT_WORKING");
    },
  };
  const validation = await runCompetitorRsaReview({
    api: validationApi,
    options: executeOptions,
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(validation.outcome, "VALIDATION_REFUSED");
  assert.equal(validationCalls.length, 1);
  assert.equal(validationCalls[0].validateOnly, true);
  assert.equal(validation.policyExemptionRequested, false);
  assert.equal(JSON.stringify(validationCalls).includes("policyValidationParameter"), false);
});

test("idempotent exact proposed state performs no landing probe or mutation", async () => {
  let probes = 0;
  const state = makeState(COMPETITOR_RSA_REVIEW.proposedFinalUrl);
  const calls = [];
  const result = await runCompetitorRsaReview({
    api: {
      async readState() { calls.push("read"); return state; },
      async mutateAds() { calls.push("mutate"); throw new Error("must not mutate"); },
    },
    options: parseCompetitorReviewOptions([
      "--execute",
      "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
    ]),
    landingProbe: async () => { probes += 1; return healthyProbes(); },
  });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "ALREADY_REQUESTED");
  assert.deepEqual(calls, ["read"]);
  assert.equal(probes, 0);
});

test("ambiguous execution proves success by immediate readback and never retries", async () => {
  const ambiguous = Object.assign(new Error("request timed out"), { ambiguous: true });
  const api = makeApi({ mutateError: ambiguous, ambiguousApplied: true });
  const result = await runCompetitorRsaReview({
    api,
    options: parseCompetitorReviewOptions([
      "--execute",
      "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
    ]),
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "REVIEW_REQUESTED_AFTER_AMBIGUOUS_RESPONSE");
  assert.equal(api.calls.filter((call) => call.type === "mutate" && !call.payload.validateOnly).length, 1);
  assert.equal(api.calls.at(-1).type, "read");

  const notAppliedApi = makeApi({ mutateError: ambiguous, ambiguousApplied: false });
  const notApplied = await runCompetitorRsaReview({
    api: notAppliedApi,
    options: parseCompetitorReviewOptions([
      "--execute",
      "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
    ]),
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(notApplied.ok, false);
  assert.equal(notApplied.outcome, "AMBIGUOUS_MUTATION");
  assert.equal(notApplied.retryAutomatically, false);
  assert.equal(notAppliedApi.calls.filter((call) => call.type === "mutate" && !call.payload.validateOnly).length, 1);
});

test("fails closed on an incomplete mutate response or readback drift", async () => {
  assert.throws(() => validateAdsMutateResponse({ results: [] }), /exact nine/);
  const api = makeApi({ responseResources: COMPETITOR_RSA_REVIEW.ads.slice(0, 8).map((ad) => ad.adResourceName) });
  const result = await runCompetitorRsaReview({
    api,
    options: parseCompetitorReviewOptions([
      "--execute",
      "--confirmation=REQUEST_COMPETITOR_RSA_REVIEW",
    ]),
    landingProbe: async () => healthyProbes(),
  });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "MUTATION_UNVERIFIED");
  assert.equal(api.calls.at(-1).type, "read");
});

test("maps Google Ads rows without loosening identifiers or spend", () => {
  const target = COMPETITOR_RSA_REVIEW.ads[0];
  const mapped = mapGoogleAdsState({
    accountRows: [{ customer: { id: "1072816342", currencyCode: "CAD", timeZone: "America/Regina" } }],
    campaignRows: [{
      campaign: {
        id: "24048123061",
        resourceName: COMPETITOR_RSA_REVIEW.campaign.resourceName,
        name: COMPETITOR_RSA_REVIEW.campaign.name,
        status: "PAUSED",
      },
    }],
    adGroupRows: [{
      campaign: {
        id: "24048123061",
        resourceName: COMPETITOR_RSA_REVIEW.campaign.resourceName,
        name: COMPETITOR_RSA_REVIEW.campaign.name,
      },
      adGroup: {
        id: target.adGroupId,
        resourceName: target.adGroupResourceName,
        name: target.adGroupName,
        status: "PAUSED",
      },
    }],
    adRows: [{
      campaign: {
        id: "24048123061",
        resourceName: COMPETITOR_RSA_REVIEW.campaign.resourceName,
        name: COMPETITOR_RSA_REVIEW.campaign.name,
      },
      adGroup: {
        id: target.adGroupId,
        resourceName: target.adGroupResourceName,
        name: target.adGroupName,
      },
      adGroupAd: {
        resourceName: target.adGroupAdResourceName,
        status: "PAUSED",
        ad: {
          id: target.adId,
          resourceName: target.adResourceName,
          type: "RESPONSIVE_SEARCH_AD",
          finalUrls: [COMPETITOR_RSA_REVIEW.oldFinalUrl],
        },
        policySummary: {
          approvalStatus: "DISAPPROVED",
          reviewStatus: "REVIEWED",
          policyTopicEntries: [{ topic: "DESTINATION_NOT_WORKING" }],
        },
      },
    }],
    spendRows: [{ customer: { id: "1072816342" }, metrics: { costMicros: "0" } }],
  });
  assert.equal(mapped.accountCostMicros, "0");
  assert.equal(mapped.ads[0].adGroupAdResourceName, target.adGroupAdResourceName);
  assert.deepEqual(mapped.ads[0].policyTopics, ["DESTINATION_NOT_WORKING"]);
  assert.throws(() => mapGoogleAdsState({
    accountRows: [],
    campaignRows: [],
    adGroupRows: [],
    adRows: [],
    spendRows: [{ customer: { id: "wrong" }, metrics: { costMicros: "0" } }],
  }), /wrong Google Ads customer/);

  for (const spendRows of [
    [],
    [
      { customer: { id: "1072816342" }, metrics: { costMicros: "0" } },
      { customer: { id: "1072816342" }, metrics: { costMicros: "0" } },
    ],
  ]) {
    assert.throws(() => mapGoogleAdsState({
      accountRows: [],
      campaignRows: [],
      adGroupRows: [],
      adRows: [],
      spendRows,
    }), /Exactly one True Color account spend row/);
  }

  for (const metrics of [
    {},
    { costMicros: null },
    { costMicros: "not-micros" },
    { costMicros: "-1" },
  ]) {
    assert.throws(() => mapGoogleAdsState({
      accountRows: [],
      campaignRows: [],
      adGroupRows: [],
      adRows: [],
      spendRows: [{ customer: { id: "1072816342" }, metrics }],
    }), /Account cost micros/);
  }
});
