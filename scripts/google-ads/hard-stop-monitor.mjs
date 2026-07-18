import { pathToFileURL } from "node:url";
import {
  gaqlDateRange,
  HARD_STOP_CAMPAIGNS,
  HARD_STOP_CUSTOMER_ID,
  HARD_STOP_LOGIN_CUSTOMER_ID,
  HARD_STOP_PROFILES,
  HARD_STOP_TIME_ZONE,
  localNow,
  parseHardStopOptions,
  stopDecision,
  sumSpendMicros,
  validateAccount,
  validateCampaigns,
} from "./hard-stop-contract.mjs";

const API_VERSION = "v24";

export async function runHardStopMonitor({ api, options, now = new Date() }) {
  const profile = HARD_STOP_PROFILES[options.profile];
  const timestampLocal = localNow(now);
  const base = {
    ok: false,
    customerId: HARD_STOP_CUSTOMER_ID,
    profile: options.profile,
    executionMode: options.execute ? "EXECUTE" : "DRY_RUN",
    timeZone: HARD_STOP_TIME_ZONE,
    timestampUtc: now.toISOString(),
    timestampLocal,
    windowStartLocal: options.windowStart,
    windowEndLocal: options.windowEnd,
    thresholdCad: profile.thresholdCad,
    approvedCapCad: profile.approvedCapCad,
  };

  let campaignsBefore;
  try {
    const account = await api.readAccount();
    validateAccount(account);
    campaignsBefore = await api.readCampaigns();
    validateCampaigns(campaignsBefore);
  } catch (error) {
    return { ...base, outcome: "ERROR", action: "NONE", error: safeMessage(error) };
  }

  const range = gaqlDateRange(options.windowStart, options.windowEnd);
  let spend;
  try {
    spend = sumSpendMicros(await api.readSpend(range), {
      windowStart: options.windowStart,
      windowEnd: options.windowEnd,
    });
  } catch (error) {
    if (!options.execute) {
      return {
        ...base,
        outcome: "ERROR",
        action: "NONE",
        campaignsBefore,
        error: `Cumulative spend could not be verified: ${safeMessage(error)}`,
      };
    }
    return failClosedPause({ api, base, campaignsBefore, cause: error });
  }

  const decision = stopDecision({
    profileName: options.profile,
    spendCad: spend.cad,
    nowLocal: timestampLocal,
    windowStart: options.windowStart,
    windowEnd: options.windowEnd,
  });
  const common = {
    ...base,
    spendCad: spend.cad,
    spendMicros: spend.micros.toString(),
    queryDateRange: range,
    decisionReason: decision.reason,
    campaignsBefore,
  };

  if (!decision.shouldPause) return { ...common, ok: true, outcome: "BELOW_STOP", action: "NONE" };
  if (!options.execute) return { ...common, ok: true, outcome: "STOP_REQUIRED", action: "WOULD_PAUSE" };
  return pauseAndVerify({ api, common, failClosed: false });
}

async function failClosedPause({ api, base, campaignsBefore, cause }) {
  const common = {
    ...base,
    outcome: "ERROR",
    decisionReason: "SPEND_READ_FAILED",
    campaignsBefore,
    error: `Cumulative spend could not be verified: ${safeMessage(cause)}`,
  };
  return pauseAndVerify({ api, common, failClosed: true });
}

async function pauseAndVerify({ api, common, failClosed }) {
  const enabled = common.campaignsBefore.filter((campaign) => campaign.status !== "PAUSED");
  try {
    if (enabled.length > 0) await api.pauseCampaigns(HARD_STOP_CAMPAIGNS);
    const campaignsAfter = await api.readCampaigns();
    validateCampaigns(campaignsAfter);
    const unpaused = campaignsAfter.filter((campaign) => campaign.status !== "PAUSED");
    if (unpaused.length > 0) throw new Error(`Pause verification failed for ${unpaused.map((campaign) => campaign.id).join(",")}`);
    return {
      ...common,
      ok: !failClosed,
      outcome: failClosed ? "ERROR_FAIL_CLOSED_PAUSED" : "STOPPED",
      action: enabled.length > 0 ? "PAUSED" : "ALREADY_PAUSED",
      pauseVerified: true,
      campaignsAfter,
    };
  } catch (error) {
    return {
      ...common,
      ok: false,
      outcome: "ERROR_PAUSE_UNVERIFIED",
      action: enabled.length > 0 ? "PAUSE_ATTEMPTED" : "VERIFY_ATTEMPTED",
      pauseVerified: false,
      error: `${common.error ? `${common.error}; ` : ""}Campaign pause could not be verified: ${safeMessage(error)}`,
    };
  }
}

export function createGoogleAdsApi({ fetchImpl = fetch, env = process.env } = {}) {
  const required = ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"];
  for (const name of required) if (!env[name]) throw new Error(`${name} is required`);

  let headersPromise;
  const getHeaders = async () => {
    headersPromise ??= exchangeToken(fetchImpl, env).then((accessToken) => ({
      authorization: `Bearer ${accessToken}`,
      "developer-token": env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "login-customer-id": HARD_STOP_LOGIN_CUSTOMER_ID,
      "content-type": "application/json",
    }));
    return headersPromise;
  };
  const post = async (path, body, operation) => {
    const response = await fetchImpl(`https://googleads.googleapis.com/${API_VERSION}/customers/${HARD_STOP_CUSTOMER_ID}/${path}`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`${operation} failed with HTTP ${response.status}`);
    return response.json();
  };
  const search = async (query, operation) => (await post("googleAds:search", { query }, operation)).results ?? [];
  const ids = HARD_STOP_CAMPAIGNS.map((campaign) => campaign.id).join(",");

  return {
    async readAccount() {
      const rows = await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "Google Ads account read");
      const customer = rows[0]?.customer;
      return { id: customer?.id, currencyCode: customer?.currencyCode, timeZone: customer?.timeZone };
    },
    async readCampaigns() {
      const rows = await search(`SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.id IN (${ids})`, "Google Ads campaign read");
      return rows.map((row) => ({ id: row.campaign.id, name: row.campaign.name, status: row.campaign.status }));
    },
    async readSpend({ startDate, endDate }) {
      const rows = await search(`SELECT campaign.id, campaign.name, segments.date, segments.hour, metrics.cost_micros FROM campaign WHERE campaign.id IN (${ids}) AND segments.date BETWEEN '${startDate}' AND '${endDate}'`, "Google Ads spend read");
      return rows.map((row) => ({
        id: row.campaign.id,
        name: row.campaign.name,
        date: row.segments?.date,
        hour: row.segments?.hour,
        costMicros: row.metrics?.costMicros ?? "0",
      }));
    },
    async pauseCampaigns(campaigns) {
      const operations = campaigns.map((campaign) => ({
        update: { resourceName: `customers/${HARD_STOP_CUSTOMER_ID}/campaigns/${campaign.id}`, status: "PAUSED" },
        updateMask: "status",
      }));
      await post("campaigns:mutate", { operations, responseContentType: "MUTABLE_RESOURCE" }, "Google Ads campaign pause");
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
  if (!response.ok || !body.access_token) throw new Error(`Google Ads OAuth exchange failed with HTTP ${response.status}`);
  return body.access_token;
}

function safeMessage(error) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function main() {
  let result;
  try {
    const options = parseHardStopOptions(process.argv.slice(2));
    result = await runHardStopMonitor({ api: createGoogleAdsApi(), options });
  } catch (error) {
    result = { ok: false, outcome: "ERROR", action: "NONE", error: safeMessage(error) };
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
