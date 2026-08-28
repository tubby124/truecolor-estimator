// Controlled restart: enable Core only. Competitor and Brand stay held.
//
// Dry-run by default. Pass --execute to mutate. Every precondition is checked
// against a live readback before any write, and the end state is re-read and
// re-verified after. Any surprise aborts without mutating.
//
// This is the ONLY code in the repository allowed to enable a campaign. The
// hard-stop monitor remains the only code allowed to pause one.
import {
  HARD_STOP_CAMPAIGNS,
  HARD_STOP_CUSTOMER_ID,
  HARD_STOP_LOGIN_CUSTOMER_ID,
} from "./hard-stop-contract.mjs";
import { readFreshProductionMonitorEvidence } from "./stage-one-monitor-evidence.mjs";

const API_VERSION = "v24";

const CORE_ID = "24048123058";
const COMPETITOR_ID = "24048123061";
const BRAND_ID = "24048123064";

// Campaign this script is permitted to enable. Competitor and Brand are deliberately held.
const ENABLE_IDS = Object.freeze([CORE_ID]);
// Campaigns that must remain PAUSED both before and after.
const MUST_STAY_PAUSED_IDS = Object.freeze([COMPETITOR_ID, BRAND_ID]);

const EXPECTED_ACCOUNT = Object.freeze({
  id: HARD_STOP_CUSTOMER_ID,
  currencyCode: "CAD",
  timeZone: "America/Regina",
});

const execute = process.argv.slice(2).includes("--execute");
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--execute");
if (unknownArgs.length > 0) {
  throw new Error(`Usage: node scripts/google-ads/enable-stage-one.mjs [--execute]`);
}

const required = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);

async function accessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google Ads token exchange failed with HTTP ${response.status}`);
  return (await response.json()).access_token;
}

let headersPromise;
const headers = () => (headersPromise ??= accessToken().then((token) => ({
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": HARD_STOP_LOGIN_CUSTOMER_ID,
  "content-type": "application/json",
})));

async function post(path, body, operation) {
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${HARD_STOP_CUSTOMER_ID}/${path}`,
    { method: "POST", headers: await headers(), body: JSON.stringify(body) },
  );
  if (!response.ok) {
    throw new Error(`${operation} failed with HTTP ${response.status}: ${(await response.text()).slice(0, 400)}`);
  }
  return response.json();
}

const search = async (query, operation) => (await post("googleAds:search", { query }, operation)).results ?? [];

async function readAccount() {
  const rows = await search(
    "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
    "account read",
  );
  const customer = rows[0]?.customer ?? {};
  return { id: customer.id, currencyCode: customer.currencyCode, timeZone: customer.timeZone };
}

async function readCampaigns() {
  const rows = await search(
    "SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.status != 'REMOVED'",
    "campaign inventory read",
  );
  return rows.map((row) => ({
    id: row.campaign.id,
    name: row.campaign.name,
    status: row.campaign.status,
    dailyBudgetCad: Number(row.campaignBudget?.amountMicros ?? 0) / 1_000_000,
  }));
}

function assertPreconditions(account, campaigns) {
  const problems = [];

  if (account.id !== EXPECTED_ACCOUNT.id) problems.push(`account id ${account.id} is not ${EXPECTED_ACCOUNT.id}`);
  if (account.currencyCode !== EXPECTED_ACCOUNT.currencyCode) problems.push(`currency ${account.currencyCode} is not CAD`);
  if (account.timeZone !== EXPECTED_ACCOUNT.timeZone) problems.push(`time zone ${account.timeZone} is not America/Regina`);

  const expectedIds = HARD_STOP_CAMPAIGNS.map((campaign) => campaign.id).sort();
  const actualIds = campaigns.map((campaign) => campaign.id).sort();
  if (JSON.stringify(expectedIds) !== JSON.stringify(actualIds)) {
    problems.push(`campaign inventory ${actualIds.join(",")} does not equal the three approved campaigns`);
  }

  for (const id of MUST_STAY_PAUSED_IDS) {
    const held = campaigns.find((campaign) => campaign.id === id);
    if (!held) problems.push(`held campaign ${id} is missing`);
    else if (held.status !== "PAUSED") problems.push(`held campaign ${held.name} must be PAUSED but is ${held.status}`);
  }

  return problems;
}

const monitorReceipt = await readFreshProductionMonitorEvidence();
console.log(`monitor: production Railway heartbeat ${monitorReceipt.id} at ${monitorReceipt.at}`);

const account = await readAccount();
const before = await readCampaigns();
const problems = assertPreconditions(account, before);

console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
for (const campaign of before) {
  console.log(`  before: ${campaign.name} status=${campaign.status} budget=CA$${campaign.dailyBudgetCad}/day`);
}

if (problems.length > 0) {
  console.error("ABORT — preconditions failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const targets = before.filter((campaign) => ENABLE_IDS.includes(campaign.id));
const alreadyEnabled = targets.filter((campaign) => campaign.status === "ENABLED");
const toEnable = targets.filter((campaign) => campaign.status === "PAUSED");
const unexpectedState = targets.filter((campaign) => !["ENABLED", "PAUSED"].includes(campaign.status));

if (unexpectedState.length > 0) {
  console.error("ABORT — a target campaign is in an unexpected state:");
  for (const campaign of unexpectedState) console.error(`  - ${campaign.name} is ${campaign.status}`);
  process.exit(1);
}

if (toEnable.length === 0) {
  console.log("Nothing to do: Core is already ENABLED.");
  process.exit(0);
}

if (!execute) {
  console.log("\nDRY RUN — would enable:");
  for (const campaign of toEnable) console.log(`  + ${campaign.name}`);
  console.log(`  (already enabled: ${alreadyEnabled.length}) (held paused: ${MUST_STAY_PAUSED_IDS.length})`);
  console.log("\nRe-run with --execute to apply.");
  process.exit(0);
}

const operations = toEnable.map((campaign) => ({
  update: { resourceName: `customers/${HARD_STOP_CUSTOMER_ID}/campaigns/${campaign.id}`, status: "ENABLED" },
  updateMask: "status",
}));
await post("campaigns:mutate", { operations, responseContentType: "MUTABLE_RESOURCE" }, "Stage 1 campaign enable");

const after = await readCampaigns();
const readbackProblems = [];
for (const id of ENABLE_IDS) {
  const campaign = after.find((item) => item.id === id);
  if (campaign?.status !== "ENABLED") readbackProblems.push(`${campaign?.name ?? id} did not read back ENABLED (${campaign?.status})`);
}
for (const id of MUST_STAY_PAUSED_IDS) {
  const campaign = after.find((item) => item.id === id);
  if (campaign?.status !== "PAUSED") readbackProblems.push(`${campaign?.name ?? id} must still be PAUSED but read back ${campaign?.status}`);
}

console.log("");
for (const campaign of after) {
  console.log(`  after:  ${campaign.name} status=${campaign.status} budget=CA$${campaign.dailyBudgetCad}/day`);
}

if (readbackProblems.length > 0) {
  console.error("\nREADBACK FAILED — verify the account manually:");
  for (const problem of readbackProblems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("\nControlled restart verified: Core ENABLED; Competitor + Brand held PAUSED.");
