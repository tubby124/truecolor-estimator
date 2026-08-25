// Synchronize the campaign final URL suffix from the paid-search contract.
//
// This is deliberately a separate mutation authority. It can change only
// campaign.final_url_suffix for the three approved True Color campaigns; it never
// changes campaign status, bids, budgets, ads, keywords, or assets.
//
// Run: railway run node scripts/google-ads/apply-tracking-suffix.mjs
//      railway run node scripts/google-ads/apply-tracking-suffix.mjs --execute

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "./config-validator.mjs";

const API_VERSION = "v24";
const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const APPROVED_CAMPAIGN_IDS = new Set(["24048123058", "24048123061", "24048123064"]);

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`unknown argument: ${arg}`);
const execute = args.includes("--execute");

const validation = validateConfig(paidSearchConfig);
if (validation.localStatus !== "VALIDATED") {
  throw new Error(`ABORT — paid-search contract is invalid: ${validation.errors.join("; ")}`);
}

for (const name of ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"]) {
  if (!process.env[name]) throw new Error(`${name} is required — run through railway run`);
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});
if (!tokenResponse.ok) throw new Error(`token exchange failed: HTTP ${tokenResponse.status}`);
const { access_token: token } = await tokenResponse.json();

const headers = {
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": LOGIN,
  "content-type": "application/json",
};

async function search(query, label) {
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER}/googleAds:search`,
    { method: "POST", headers, body: JSON.stringify({ query }) },
  );
  if (!response.ok) throw new Error(`${label} failed: HTTP ${response.status} ${(await response.text()).slice(0, 400)}`);
  return (await response.json()).results ?? [];
}

async function mutate(operations) {
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER}/campaigns:mutate`,
    { method: "POST", headers, body: JSON.stringify({ operations }) },
  );
  if (!response.ok) throw new Error(`tracking suffix update failed: HTTP ${response.status} ${(await response.text()).slice(0, 600)}`);
}

async function readLive() {
  const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account identity"))[0]?.customer ?? {};
  if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
    throw new Error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
  }
  const rows = await search(
    "SELECT campaign.id, campaign.name, campaign.resource_name, campaign.status, campaign.final_url_suffix FROM campaign WHERE campaign.status != 'REMOVED'",
    "campaign tracking suffixes",
  );
  const campaigns = new Map(rows
    .filter((row) => APPROVED_CAMPAIGN_IDS.has(row.campaign.id))
    .map((row) => [row.campaign.id, {
      id: row.campaign.id,
      name: row.campaign.name,
      resourceName: row.campaign.resourceName,
      status: row.campaign.status,
      finalUrlSuffix: row.campaign.finalUrlSuffix ?? "",
    }]));
  if (campaigns.size !== APPROVED_CAMPAIGN_IDS.size) {
    throw new Error(`ABORT — expected exactly ${APPROVED_CAMPAIGN_IDS.size} approved campaigns, found ${campaigns.size}`);
  }
  return campaigns;
}

const target = paidSearchConfig.tracking.finalUrlSuffix;
const live = await readLive();
const changes = [...live.values()].filter((campaign) => campaign.finalUrlSuffix !== target);

console.log(`PLAN: ${changes.length} tracking suffix change(s); bids, budgets, ads, keywords, assets, and statuses are out of scope.`);
for (const campaign of changes) console.log(`  ${campaign.name} [${campaign.status}]: replace final URL suffix`);
if (!changes.length) {
  console.log("Nothing to do — all approved campaigns already match the contract.");
  process.exit(0);
}
if (!execute) {
  console.log("DRY RUN — nothing changed. Re-run with --execute to update only final URL suffixes.");
  process.exit(0);
}

await mutate(changes.map((campaign) => ({
  update: { resourceName: campaign.resourceName, finalUrlSuffix: target },
  updateMask: "final_url_suffix",
})));

const after = await readLive();
const residual = [...after.values()].filter((campaign) => campaign.finalUrlSuffix !== target);
if (residual.length) throw new Error(`readback FAILED — ${residual.map((campaign) => campaign.name).join(", ")} did not match the contract`);
console.log("readback clean: all three approved campaigns now use the contracted final URL suffix.");
