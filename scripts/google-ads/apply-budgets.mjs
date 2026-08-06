// Push the contract's daily budgets to the live account.
//
// WHY THIS EXISTS
// ---------------
// Budgets are the one contract field with no mutation path: apply-sync is create-only,
// enable-stage-one only flips status, and the controlled-test controller is scoped to the
// coroplast test. So a budget change lived in the repo and never reached Google. Built
// 2026-08-06 when Core needed CA$14 -> CA$18 on evidence (32.1% of impression share lost to
// budget), and stepped increases are expected from here.
//
// MUTATION AUTHORITY — the fifth and final holder, scoped strictly to campaign budgets:
//   ENABLE a campaign        -> enable-stage-one.mjs
//   PAUSE a campaign         -> hard-stop-monitor.mjs
//   CREATE contract children -> apply-sync.mjs
//   SYNC extension assets    -> apply-assets.mjs
//   SET daily budgets        -> this file
//
// It reads the target from the CONTRACT, never from a CLI number. That keeps
// docs/paid-search/campaign-config.mjs the single source of truth and means every raise has
// already passed the validator's caps (LAUNCHABLE_DAILY_BUDGET_CAD and the
// MAX_UNMONITORED_DAILY_BURN_CAD blast-radius bound) before it can reach the account.
//
// It never changes status, never touches Brand while Brand is paused, and re-reads to prove it.
//
// Run: railway run node scripts/google-ads/apply-budgets.mjs           (dry run)
//      railway run node scripts/google-ads/apply-budgets.mjs --execute

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "./config-validator.mjs";

const V = "v24";
const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const BRAND_ID = "24048123064";
// Hard ceiling on total ENABLED daily budget, mirroring config-validator's blast-radius bound.
// Asserted independently here on purpose: a checker that trusts the thing it checks is not one.
const MAX_ENABLED_DAILY_BURN_CAD = 25;

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`unknown argument: ${arg}`);
const EXECUTE = args.includes("--execute");

// Fail before touching the network if the contract itself is invalid.
const validation = validateConfig(paidSearchConfig);
if (validation.localStatus !== "VALIDATED") {
  console.error("ABORT — contract is INVALID; fix it before pushing budgets:");
  for (const error of validation.errors) console.error(`  - ${error}`);
  process.exit(1);
}

for (const name of ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"]) {
  if (!process.env[name]) throw new Error(`${name} is required — run through "railway run"`);
}

const token = await (async () => {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`token exchange failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
})();

const headers = {
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": LOGIN,
  "content-type": "application/json",
};

const search = async (query, label) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 400)}`);
  return (await r.json()).results ?? [];
};

const mutate = async (path, operations, label) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/${path}`, {
    method: "POST", headers, body: JSON.stringify({ operations }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 600)}`);
  return r.json();
};

async function readLive() {
  const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};
  const campaigns = new Map();
  for (const row of await search(
    `SELECT campaign.id, campaign.name, campaign.status,
            campaign_budget.resource_name, campaign_budget.amount_micros
     FROM campaign`, "campaigns")) {
    campaigns.set(row.campaign.name, {
      id: row.campaign.id,
      status: row.campaign.status,
      budgetResource: row.campaignBudget?.resourceName,
      dailyCad: Number(row.campaignBudget?.amountMicros ?? 0) / 1_000_000,
    });
  }
  return { account, campaigns };
}

const live = await readLive();

// ── preconditions, fail closed ───────────────────────────────────────────────
const problems = [];
if (live.account.id !== CUSTOMER) problems.push(`account id ${live.account.id} is not ${CUSTOMER}`);
if (live.account.currencyCode !== "CAD") problems.push(`currency ${live.account.currencyCode} is not CAD`);
if (live.account.timeZone !== "America/Regina") problems.push(`time zone ${live.account.timeZone} is not America/Regina`);
const brand = [...live.campaigns.values()].find((c) => c.id === BRAND_ID);
if (brand?.status !== "PAUSED") problems.push(`Brand campaign must be PAUSED but is ${brand?.status}`);

const enabledTotal = paidSearchConfig.campaigns
  .filter((campaign) => campaign.status === "ENABLED")
  .reduce((sum, campaign) => sum + campaign.dailyBudgetCad, 0);
if (enabledTotal > MAX_ENABLED_DAILY_BURN_CAD) {
  problems.push(`contract enabled daily budget CA$${enabledTotal} exceeds the CA$${MAX_ENABLED_DAILY_BURN_CAD} unmonitored-burn bound`);
}
if (problems.length) {
  console.error("ABORT — preconditions failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`account: ${live.account.id} ${live.account.currencyCode} ${live.account.timeZone}`);

// ── diff ─────────────────────────────────────────────────────────────────────
const changes = [];
for (const campaign of paidSearchConfig.campaigns) {
  const current = live.campaigns.get(campaign.name);
  if (!current) { console.error(`ABORT — campaign not found live: ${campaign.name}`); process.exit(1); }
  if (current.dailyCad === campaign.dailyBudgetCad) continue;
  changes.push({
    name: campaign.name,
    from: current.dailyCad,
    to: campaign.dailyBudgetCad,
    budgetResource: current.budgetResource,
  });
}

console.log(`\nPLAN: ${changes.length} budget change(s)`);
for (const change of changes) {
  const direction = change.to > change.from ? "RAISE" : "LOWER";
  console.log(`  ${direction} ${change.name}: CA$${change.from}/day -> CA$${change.to}/day`);
}
console.log(`\nenabled daily total after: CA$${enabledTotal}/day (bound CA$${MAX_ENABLED_DAILY_BURN_CAD})`);
console.log(`spend ceiling unchanged: warn CA$${paidSearchConfig.spendControls.warningCad} / pause CA$${paidSearchConfig.spendControls.protectivePauseCad} / cap CA$${paidSearchConfig.spendControls.absoluteCapCad}`);

if (!changes.length) { console.log("\nNothing to do — live budgets already match the contract."); process.exit(0); }

if (!EXECUTE) {
  console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply.");
  console.log("Raising a budget does NOT raise the hard stop. The 15-minute monitor still pauses at the cap.");
  process.exit(0);
}

await mutate("campaignBudgets:mutate", changes.map((change) => ({
  update: { resourceName: change.budgetResource, amountMicros: String(Math.round(change.to * 1_000_000)) },
  updateMask: "amount_micros",
})), "budget update");
console.log(`applied ${changes.length} budget change(s)`);

// ── readback ─────────────────────────────────────────────────────────────────
const after = await readLive();
const residual = paidSearchConfig.campaigns.filter((campaign) => after.campaigns.get(campaign.name)?.dailyCad !== campaign.dailyBudgetCad);
const brandAfter = [...after.campaigns.values()].find((c) => c.id === BRAND_ID);
for (const campaign of paidSearchConfig.campaigns) {
  const current = after.campaigns.get(campaign.name);
  console.log(`  ${campaign.name}: CA$${current?.dailyCad}/day [${current?.status}]`);
}
if (residual.length || brandAfter?.status !== "PAUSED") {
  console.error("readback FAILED — live budgets do not match the contract, or Brand is no longer paused");
  process.exit(1);
}
console.log("readback clean: live budgets match the contract and Brand is still paused.");
