import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  buildBudgetOperations,
  buildStatusOperations,
  CONTROLLED_TEST,
  parseControlledTestOptions,
  validateActivatedState,
  validateBudgetStagedState,
  validateControlledAccount,
  validateMonitorAttestation,
  validatePreflightState,
  validateResourcesStagedState,
  validateRolledBackState,
} from "./controlled-test-contract.mjs";

const API_VERSION = "v24";

export async function runControlledTestController({
  api,
  options,
  monitorAttestation,
  attestationSecret,
  landingProbe,
  now = new Date(),
}) {
  const base = {
    ok: false,
    mode: options.mode,
    executionMode: options.execute ? "EXECUTE" : "READ_ONLY",
    customerId: CONTROLLED_TEST.customerId,
  };
  const invocationError = validateInvocation(options);
  if (invocationError) return { ...base, outcome: "INVALID_INVOCATION", error: invocationError };
  if (options.mode === "preflight") return runPreflight({
    api, base, monitorAttestation, attestationSecret, now,
  });
  if (options.mode === "rollback") return runRollback({ api, base });
  return runActivation({
    api, base, monitorAttestation, attestationSecret, landingProbe, now,
  });
}

async function runPreflight({ api, base, monitorAttestation, attestationSecret, now }) {
  try {
    const state = validatePreflightState(await api.readState());
    const monitor = monitorAttestation
      ? validateMonitorAttestation(monitorAttestation, { now, signingSecret: attestationSecret })
      : null;
    return {
      ...base,
      ok: true,
      outcome: "PREFLIGHT_PASSED",
      monitor,
      summary: stateSummary(state),
    };
  } catch (error) {
    return { ...base, outcome: "PREFLIGHT_FAILED", error: safeMessage(error) };
  }
}

async function runActivation({
  api,
  base,
  monitorAttestation,
  attestationSecret,
  landingProbe,
  now,
}) {
  let monitor;
  let landing;
  try {
    monitor = validateMonitorAttestation(monitorAttestation, {
      now,
      signingSecret: attestationSecret,
    });
    validatePreflightState(await api.readState());
    landing = validateLandingProbe(await landingProbe(CONTROLLED_TEST.rsa.finalUrl));
  } catch (error) {
    return { ...base, outcome: "ACTIVATION_REFUSED", error: safeMessage(error) };
  }
  try {
    await applyActivationPhases(api);
    const state = validateActivatedState(await api.readState());
    return {
      ...base,
      ok: true,
      outcome: "ACTIVATED",
      monitor,
      landing,
      summary: stateSummary(state),
    };
  } catch (error) {
    const rollback = await runRollback({ api, base: { ...base, mode: "rollback" } });
    return {
      ...base,
      outcome: rollback.ok ? "ACTIVATION_FAILED_ROLLED_BACK" : "ACTIVATION_FAILED_ROLLBACK_UNVERIFIED",
      error: safeMessage(error),
      rollback,
    };
  }
}

async function applyActivationPhases(api) {
  await mutateValidated(api.setBudget, CONTROLLED_TEST.budget.controlledMicros);
  validateBudgetStagedState(await api.readState());
  await mutateValidated(
    api.setKeywordStatuses,
    CONTROLLED_TEST.keywords.map((keyword) => keyword.resourceName),
    "ENABLED",
  );
  await mutateValidated(api.setAdStatuses, [CONTROLLED_TEST.rsa.resourceName], "ENABLED");
  await mutateValidated(api.setAdGroupStatuses, [CONTROLLED_TEST.adGroup.resourceName], "ENABLED");
  validateResourcesStagedState(await api.readState());
  await mutateValidated(api.setCampaignStatuses, [CONTROLLED_TEST.campaign.resourceName], "ENABLED");
}

function validateInvocation(options) {
  if (!options || !["preflight", "activate", "rollback"].includes(options.mode)) {
    return "Mode must be exactly preflight, activate, or rollback";
  }
  if (options.mode === "preflight" && options.execute !== false) {
    return "preflight must be read-only";
  }
  if (options.mode !== "preflight" && options.execute !== true) {
    return `${options.mode} requires execute=true`;
  }
  return null;
}

async function runRollback({ api, base }) {
  const errors = [];
  try {
    validateControlledAccount(await api.readAccount());
  } catch (error) {
    return {
      ...base,
      ok: false,
      outcome: "ROLLBACK_UNVERIFIED",
      errors: [`Rollback account identity verification failed: ${safeMessage(error)}`],
      summary: null,
    };
  }
  const campaignResources = await readRollbackCampaigns(api, errors);
  await rollbackBatch(errors, "account-wide campaign pause", () => mutateValidated(
    api.setCampaignStatuses,
    campaignResources,
    "PAUSED",
  ));
  const targets = await readRollbackResourceTargets(api, errors);
  await rollbackBatch(errors, "keyword pause", () => mutateValidated(
    api.setKeywordStatuses,
    targets.keywordResources,
    "PAUSED",
  ));
  await rollbackBatch(errors, "RSA pause", () => mutateValidated(
    api.setAdStatuses,
    targets.adResources,
    "PAUSED",
  ));
  await rollbackBatch(errors, "ad-group pause", () => mutateValidated(
    api.setAdGroupStatuses,
    targets.adGroupResources,
    "PAUSED",
  ));
  await rollbackBatch(errors, "budget restoration", () => mutateValidated(
    api.setBudget,
    CONTROLLED_TEST.budget.normalMicros,
  ));
  return verifyRollbackReadback(api, base, errors);
}

async function readRollbackCampaigns(api, errors) {
  try {
    const campaigns = await api.readCampaigns();
    const resources = campaigns
      .filter((campaign) => campaign.status !== "REMOVED")
      .map((campaign) => campaign.resourceName);
    if (resources.length > 0) return resources;
  } catch (error) {
    errors.push(`Rollback account-wide campaign inventory read failed: ${safeMessage(error)}`);
  }
  return CONTROLLED_TEST.campaigns.map((campaign) => campaign.resourceName);
}

async function readRollbackResourceTargets(api, errors) {
  try {
    const state = await api.readState();
    return {
      keywordResources: state.keywords
        .filter((keyword) => keyword.negative !== true)
        .map((keyword) => keyword.resourceName),
      adResources: state.ads.map((ad) => ad.resourceName),
      adGroupResources: state.adGroups.map((adGroup) => adGroup.resourceName),
    };
  } catch (error) {
    errors.push(`Rollback account-wide resource inventory read failed: ${safeMessage(error)}`);
    return {
      keywordResources: CONTROLLED_TEST.keywords.map((keyword) => keyword.resourceName),
      adResources: [CONTROLLED_TEST.rsa.resourceName],
      adGroupResources: [CONTROLLED_TEST.adGroup.resourceName],
    };
  }
}

async function verifyRollbackReadback(api, base, errors) {
  let state;
  try {
    state = validateRolledBackState(await api.readState());
  } catch (error) {
    errors.push(`Rollback readback failed: ${safeMessage(error)}`);
  }
  if (errors.length > 0) {
    return {
      ...base,
      ok: false,
      outcome: "ROLLBACK_UNVERIFIED",
      errors,
      summary: state ? stateSummary(state) : null,
    };
  }
  return {
    ...base,
    ok: true,
    outcome: "ROLLED_BACK",
    summary: stateSummary(state),
  };
}

async function mutateValidated(method, ...args) {
  await method(...args, { validateOnly: true });
  await method(...args, { validateOnly: false });
}

async function rollbackBatch(errors, label, run) {
  try {
    await run();
  } catch (error) {
    errors.push(`${label} failed: ${safeMessage(error)}`);
  }
}

function stateSummary(state) {
  return {
    budgetCad: Number(state.budget.amountMicros) / 1_000_000,
    enabledCampaigns: state.campaigns.filter((item) => item.status === "ENABLED").map((item) => item.resourceName),
    enabledAdGroups: state.adGroups.filter((item) => item.status === "ENABLED").map((item) => item.resourceName),
    enabledAds: state.ads.filter((item) => item.status === "ENABLED").map((item) => item.resourceName),
    enabledPositiveKeywords: state.keywords
      .filter((item) => item.negative !== true && item.status === "ENABLED")
      .map((item) => item.resourceName),
  };
}

export function createControlledTestGoogleAdsApi({ fetchImpl = fetch, env = process.env } = {}) {
  const required = [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
  ];
  for (const name of required) if (!env[name]) throw new Error(`${name} is required`);

  let headersPromise;
  const getHeaders = async () => {
    headersPromise ??= exchangeToken(fetchImpl, env).then((accessToken) => ({
      authorization: `Bearer ${accessToken}`,
      "developer-token": env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "login-customer-id": CONTROLLED_TEST.loginCustomerId,
      "content-type": "application/json",
    }));
    return headersPromise;
  };
  const post = async (path, body, operation) => {
    const response = await fetchImpl(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${CONTROLLED_TEST.customerId}/${path}`,
      {
        method: "POST",
        headers: await getHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const responseBody = await response.json();
    if (!response.ok) {
      const requestId = responseBody?.error?.details?.find((detail) => detail.requestId)?.requestId;
      throw new Error(`${operation} failed with HTTP ${response.status}${requestId ? ` request ${requestId}` : ""}`);
    }
    return responseBody;
  };
  const search = async (query, operation) => {
    const results = [];
    const seenTokens = new Set();
    let pageToken;
    for (let page = 0; page < 100; page += 1) {
      const response = await post(
        "googleAds:search",
        { query, ...(pageToken ? { pageToken } : {}) },
        operation,
      );
      results.push(...(response.results ?? []));
      if (!response.nextPageToken) return results;
      if (seenTokens.has(response.nextPageToken)) {
        throw new Error(`${operation} returned a repeated page token`);
      }
      seenTokens.add(response.nextPageToken);
      pageToken = response.nextPageToken;
    }
    throw new Error(`${operation} exceeded 100 result pages`);
  };
  const mutate = async (path, operations, { validateOnly }, operation) => {
    if (!Array.isArray(operations) || operations.length === 0) throw new Error(`${operation} has no operations`);
    return post(path, {
      operations,
      validateOnly,
      partialFailure: false,
      responseContentType: "MUTABLE_RESOURCE",
    }, `${operation}${validateOnly ? " validation" : ""}`);
  };
  const readAccount = async () => {
    const rows = await search(
      "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
      "account read",
    );
    const customer = rows[0]?.customer;
    return {
      id: customer?.id,
      currencyCode: customer?.currencyCode,
      timeZone: customer?.timeZone,
    };
  };

  return {
    readAccount,
    async readCampaigns() {
      const rows = await search(
        "SELECT campaign.id, campaign.resource_name, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.campaign_budget FROM campaign WHERE campaign.status != 'REMOVED'",
        "account-wide campaign read",
      );
      return rows.map((row) => ({
        id: row.campaign.id,
        resourceName: row.campaign.resourceName,
        name: row.campaign.name,
        status: row.campaign.status,
        channel: row.campaign.advertisingChannelType,
        budgetResourceName: row.campaign.campaignBudget,
      }));
    },
    async readState() {
      return readControlledState(search, readAccount);
    },
    setBudget(amountMicros, options) {
      return mutate(
        "campaignBudgets:mutate",
        buildBudgetOperations(amountMicros),
        options,
        "budget mutation",
      );
    },
    setKeywordStatuses(resourceNames, status, options) {
      return mutate(
        "adGroupCriteria:mutate",
        buildStatusOperations(resourceNames, status),
        options,
        "keyword mutation",
      );
    },
    setAdStatuses(resourceNames, status, options) {
      return mutate(
        "adGroupAds:mutate",
        buildStatusOperations(resourceNames, status),
        options,
        "ad mutation",
      );
    },
    setAdGroupStatuses(resourceNames, status, options) {
      return mutate(
        "adGroups:mutate",
        buildStatusOperations(resourceNames, status),
        options,
        "ad-group mutation",
      );
    },
    setCampaignStatuses(resourceNames, status, options) {
      return mutate(
        "campaigns:mutate",
        buildStatusOperations(resourceNames, status),
        options,
        "campaign mutation",
      );
    },
  };
}

async function readControlledState(search, readAccount) {
  const [account, campaignRows, adGroupRows, adRows, keywordRows] = await Promise.all([
    readAccount(),
    search(
      "SELECT campaign.id, campaign.resource_name, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.campaign_budget, campaign.target_spend.cpc_bid_ceiling_micros, campaign_budget.id, campaign_budget.resource_name, campaign_budget.status, campaign_budget.amount_micros, campaign_budget.explicitly_shared, campaign_budget.reference_count FROM campaign WHERE campaign.status != 'REMOVED'",
      "campaign and budget read",
    ),
    search(
      "SELECT campaign.resource_name, ad_group.id, ad_group.resource_name, ad_group.name, ad_group.status FROM ad_group WHERE ad_group.status != 'REMOVED'",
      "ad-group read",
    ),
    search(
      "SELECT ad_group.resource_name, ad_group_ad.resource_name, ad_group_ad.status, ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status, ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'",
      "ad read",
    ),
    search(
      "SELECT ad_group.resource_name, ad_group_criterion.criterion_id, ad_group_criterion.resource_name, ad_group_criterion.status, ad_group_criterion.negative, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED'",
      "keyword read",
    ),
  ]);
  return mapControlledState({ account, campaignRows, adGroupRows, adRows, keywordRows });
}

function mapControlledState({ account, campaignRows, adGroupRows, adRows, keywordRows }) {
  const coreRow = campaignRows.find(
    (row) => row.campaign?.resourceName === CONTROLLED_TEST.campaign.resourceName,
  );
  return {
    account,
    campaigns: campaignRows.map(mapCampaignRow),
    budget: coreRow ? mapBudgetRow(coreRow) : null,
    adGroups: adGroupRows.map(mapAdGroupRow),
    ads: adRows.map(mapAdRow),
    keywords: keywordRows.map(mapKeywordRow),
  };
}

const mapCampaignRow = (row) => ({
  id: row.campaign.id,
  resourceName: row.campaign.resourceName,
  name: row.campaign.name,
  status: row.campaign.status,
  channel: row.campaign.advertisingChannelType,
  budgetResourceName: row.campaign.campaignBudget,
  cpcBidCeilingMicros: row.campaign.targetSpend?.cpcBidCeilingMicros,
});

const mapBudgetRow = (row) => ({
  id: row.campaignBudget?.id,
  resourceName: row.campaignBudget?.resourceName,
  status: row.campaignBudget?.status,
  amountMicros: row.campaignBudget?.amountMicros,
  explicitlyShared: row.campaignBudget?.explicitlyShared,
  referenceCount: row.campaignBudget?.referenceCount,
});

const mapAdGroupRow = (row) => ({
  id: row.adGroup.id,
  resourceName: row.adGroup.resourceName,
  name: row.adGroup.name,
  status: row.adGroup.status,
  campaignResourceName: row.campaign.resourceName,
});

const mapAdRow = (row) => ({
  id: row.adGroupAd.ad.id,
  resourceName: row.adGroupAd.resourceName,
  status: row.adGroupAd.status,
  type: row.adGroupAd.ad.type,
  finalUrls: row.adGroupAd.ad.finalUrls ?? [],
  approvalStatus: row.adGroupAd.policySummary?.approvalStatus,
  reviewStatus: row.adGroupAd.policySummary?.reviewStatus,
  adGroupResourceName: row.adGroup.resourceName,
});

const mapKeywordRow = (row) => ({
  criterionId: row.adGroupCriterion.criterionId,
  resourceName: row.adGroupCriterion.resourceName,
  status: row.adGroupCriterion.status,
  negative: row.adGroupCriterion.negative === true,
  text: row.adGroupCriterion.keyword?.text,
  matchType: row.adGroupCriterion.keyword?.matchType,
  adGroupResourceName: row.adGroup.resourceName,
});

export function createCoroplastLandingProbe({ fetchImpl = fetch } = {}) {
  return async (url) => {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "TrueColor-Controlled-Test-Preflight/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    await response.body?.cancel();
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
    };
  };
}

export function validateLandingProbe(probe) {
  if (probe?.requestedUrl !== CONTROLLED_TEST.rsa.finalUrl
    || probe?.finalUrl !== CONTROLLED_TEST.rsa.finalUrl
    || probe?.status !== 200) {
    throw new Error("Coroplast activation URL did not return HTTP 200 without redirect drift");
  }
  return probe;
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
  const body = await response.json();
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
    const options = parseControlledTestOptions(process.argv.slice(2));
    const monitorAttestation = options.monitorAttestationPath
      ? JSON.parse(await readFile(options.monitorAttestationPath, "utf8"))
      : null;
    result = await runControlledTestController({
      api: createControlledTestGoogleAdsApi(),
      options,
      monitorAttestation,
      attestationSecret: process.env.GOOGLE_ADS_CONTROLLED_TEST_ATTESTATION_SECRET,
      landingProbe: createCoroplastLandingProbe(),
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
