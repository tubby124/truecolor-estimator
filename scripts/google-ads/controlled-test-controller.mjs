import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  buildBudgetOperations,
  buildStatusOperations,
  CONTROLLED_TEST,
  parseControlledTestOptions,
  validateActivatedState,
  validateBudgetStagedState,
  validateMonitorAttestation,
  validatePreflightState,
  validateRolledBackState,
} from "./controlled-test-contract.mjs";

const API_VERSION = "v24";

export async function runControlledTestController({
  api,
  options,
  monitorAttestation,
  now = new Date(),
}) {
  const base = {
    ok: false,
    mode: options.mode,
    executionMode: options.execute ? "EXECUTE" : "READ_ONLY",
    customerId: CONTROLLED_TEST.customerId,
  };
  if (options.mode === "preflight") {
    try {
      const state = validatePreflightState(await api.readState());
      const monitor = monitorAttestation
        ? validateMonitorAttestation(monitorAttestation, { now })
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
  if (options.mode === "rollback") {
    return runRollback({ api, base });
  }

  let activationStarted = false;
  try {
    const monitor = validateMonitorAttestation(monitorAttestation, { now });
    validatePreflightState(await api.readState());

    activationStarted = true;
    await mutateValidated(api.setBudget, CONTROLLED_TEST.budget.controlledMicros);
    validateBudgetStagedState(await api.readState());

    await mutateValidated(
      api.setKeywordStatuses,
      CONTROLLED_TEST.keywords.map((keyword) => keyword.resourceName),
      "ENABLED",
    );
    await mutateValidated(api.setAdStatuses, [CONTROLLED_TEST.rsa.resourceName], "ENABLED");
    await mutateValidated(api.setAdGroupStatuses, [CONTROLLED_TEST.adGroup.resourceName], "ENABLED");
    await mutateValidated(api.setCampaignStatuses, [CONTROLLED_TEST.campaign.resourceName], "ENABLED");

    const state = validateActivatedState(await api.readState());
    return {
      ...base,
      ok: true,
      outcome: "ACTIVATED",
      monitor,
      summary: stateSummary(state),
    };
  } catch (error) {
    if (!activationStarted) {
      return { ...base, outcome: "ACTIVATION_REFUSED", error: safeMessage(error) };
    }
    const rollback = await runRollback({ api, base: { ...base, mode: "rollback" } });
    return {
      ...base,
      outcome: rollback.ok ? "ACTIVATION_FAILED_ROLLED_BACK" : "ACTIVATION_FAILED_ROLLBACK_UNVERIFIED",
      error: safeMessage(error),
      rollback,
    };
  }
}

async function runRollback({ api, base }) {
  const errors = [];
  let campaigns = null;
  try {
    campaigns = await api.readCampaigns();
  } catch (error) {
    errors.push(`Rollback account-wide campaign inventory read failed: ${safeMessage(error)}`);
  }

  const campaignResources = campaigns
    ?.filter((campaign) => campaign.status !== "REMOVED")
    .map((campaign) => campaign.resourceName);
  await rollbackBatch(errors, "account-wide campaign pause", async () => {
    const resources = campaignResources?.length
      ? campaignResources
      : CONTROLLED_TEST.campaigns.map((campaign) => campaign.resourceName);
    await mutateValidated(api.setCampaignStatuses, resources, "PAUSED");
  });
  await rollbackBatch(errors, "keyword pause", () => mutateValidated(
    api.setKeywordStatuses,
    CONTROLLED_TEST.keywords.map((keyword) => keyword.resourceName),
    "PAUSED",
  ));
  await rollbackBatch(errors, "RSA pause", () => mutateValidated(
    api.setAdStatuses,
    [CONTROLLED_TEST.rsa.resourceName],
    "PAUSED",
  ));
  await rollbackBatch(errors, "ad-group pause", () => mutateValidated(
    api.setAdGroupStatuses,
    [CONTROLLED_TEST.adGroup.resourceName],
    "PAUSED",
  ));
  await rollbackBatch(errors, "budget restoration", () => mutateValidated(
    api.setBudget,
    CONTROLLED_TEST.budget.normalMicros,
  ));

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
      },
    );
    const responseBody = await response.json();
    if (!response.ok) {
      const requestId = responseBody?.error?.details?.find((detail) => detail.requestId)?.requestId;
      throw new Error(`${operation} failed with HTTP ${response.status}${requestId ? ` request ${requestId}` : ""}`);
    }
    return responseBody;
  };
  const search = async (query, operation) => (
    await post("googleAds:search", { query }, operation)
  ).results ?? [];
  const mutate = async (path, operations, { validateOnly }, operation) => {
    if (!Array.isArray(operations) || operations.length === 0) throw new Error(`${operation} has no operations`);
    return post(path, {
      operations,
      validateOnly,
      partialFailure: false,
      responseContentType: "MUTABLE_RESOURCE",
    }, `${operation}${validateOnly ? " validation" : ""}`);
  };

  return {
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
      const [
        accountRows,
        campaignRows,
        adGroupRows,
        adRows,
        keywordRows,
      ] = await Promise.all([
        search(
          "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
          "account read",
        ),
        search(
          "SELECT campaign.id, campaign.resource_name, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.campaign_budget, campaign_budget.id, campaign_budget.resource_name, campaign_budget.status, campaign_budget.amount_micros, campaign_budget.explicitly_shared, campaign_budget.reference_count FROM campaign WHERE campaign.status != 'REMOVED'",
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
      const customer = accountRows[0]?.customer;
      const coreRow = campaignRows.find(
        (row) => row.campaign?.resourceName === CONTROLLED_TEST.campaign.resourceName,
      );
      return {
        account: {
          id: customer?.id,
          currencyCode: customer?.currencyCode,
          timeZone: customer?.timeZone,
        },
        campaigns: campaignRows.map((row) => ({
          id: row.campaign.id,
          resourceName: row.campaign.resourceName,
          name: row.campaign.name,
          status: row.campaign.status,
          channel: row.campaign.advertisingChannelType,
          budgetResourceName: row.campaign.campaignBudget,
        })),
        budget: coreRow ? {
          id: coreRow.campaignBudget?.id,
          resourceName: coreRow.campaignBudget?.resourceName,
          status: coreRow.campaignBudget?.status,
          amountMicros: coreRow.campaignBudget?.amountMicros,
          explicitlyShared: coreRow.campaignBudget?.explicitlyShared,
          referenceCount: coreRow.campaignBudget?.referenceCount,
        } : null,
        adGroups: adGroupRows.map((row) => ({
          id: row.adGroup.id,
          resourceName: row.adGroup.resourceName,
          name: row.adGroup.name,
          status: row.adGroup.status,
          campaignResourceName: row.campaign.resourceName,
        })),
        ads: adRows.map((row) => ({
          id: row.adGroupAd.ad.id,
          resourceName: row.adGroupAd.resourceName,
          status: row.adGroupAd.status,
          type: row.adGroupAd.ad.type,
          finalUrls: row.adGroupAd.ad.finalUrls ?? [],
          approvalStatus: row.adGroupAd.policySummary?.approvalStatus,
          reviewStatus: row.adGroupAd.policySummary?.reviewStatus,
          adGroupResourceName: row.adGroup.resourceName,
        })),
        keywords: keywordRows.map((row) => ({
          criterionId: row.adGroupCriterion.criterionId,
          resourceName: row.adGroupCriterion.resourceName,
          status: row.adGroupCriterion.status,
          negative: row.adGroupCriterion.negative === true,
          text: row.adGroupCriterion.keyword?.text,
          matchType: row.adGroupCriterion.keyword?.matchType,
          adGroupResourceName: row.adGroup.resourceName,
        })),
      };
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
