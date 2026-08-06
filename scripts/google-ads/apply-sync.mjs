// One-time Phase 1 import: create the contract objects missing from the live account.
//
// This is the API counterpart of the Google Ads Editor import described in
// docs/paid-search — it applies exactly the gap that sync-plan.mjs reports and
// nothing else. CREATE-ONLY by construction: it never updates, pauses, enables,
// or removes anything. Campaign status stays whatever it is (enable-stage-one.mjs
// remains the only code allowed to ENABLE; the hard-stop monitor the only code
// allowed to PAUSE).
//
// Run: railway run node scripts/google-ads/apply-sync.mjs            (dry-run)
//      railway run node scripts/google-ads/apply-sync.mjs --execute  (apply)
//
// Success = a follow-up sync-plan.mjs run reports all zeros, and
// validate:google-ads:launched stops reporting count drift (20 groups / 20 RSAs /
// 121 positive keywords / 229 negative criteria).
//
// NOTE: the new RSA enters Google policy review on creation. It serves once APPROVED.
import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { HARD_STOP_CUSTOMER_ID, HARD_STOP_LOGIN_CUSTOMER_ID } from "./hard-stop-contract.mjs";

const V = "v24";
const CUSTOMER = HARD_STOP_CUSTOMER_ID;
const BRAND_ID = "24048123064";
const APPROVED_CAMPAIGN_IDS = ["24048123058", "24048123061", BRAND_ID];

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`Unknown argument: ${arg}`);
const execute = args.includes("--execute");

const required = ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);

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
  "login-customer-id": HARD_STOP_LOGIN_CUSTOMER_ID,
  "content-type": "application/json",
};

async function search(query, label) {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 400)}`);
  return (await r.json()).results ?? [];
}

async function mutate(path, operations, label) {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/${path}`, {
    method: "POST", headers, body: JSON.stringify({ operations }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 600)}`);
  return r.json();
}

// ── read live state ──────────────────────────────────────────────────────────
async function readLive() {
  const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};

  const campaigns = new Map(); // name -> { id, status, resourceName }
  for (const row of await search(
    "SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name FROM campaign WHERE campaign.status != 'REMOVED'",
    "campaigns",
  )) campaigns.set(row.campaign.name, { id: row.campaign.id, status: row.campaign.status, resourceName: row.campaign.resourceName });

  const groups = new Map(); // name -> { resourceName, status }
  for (const row of await search(
    "SELECT ad_group.name, ad_group.status, ad_group.resource_name FROM ad_group WHERE ad_group.status != 'REMOVED'",
    "ad groups",
  )) groups.set(row.adGroup.name, { resourceName: row.adGroup.resourceName, status: row.adGroup.status });

  const positives = new Set();
  for (const row of await search(
    "SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group_criterion.negative = false AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED'",
    "positive keywords",
  )) positives.add(`${row.adGroup.name}||${row.adGroupCriterion.keyword.text}||${row.adGroupCriterion.keyword.matchType}`);

  const groupNegatives = new Set();
  for (const row of await search(
    "SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group_criterion.negative = true AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED'",
    "ad group negatives",
  )) groupNegatives.add(`${row.adGroup.name}||${row.adGroupCriterion.keyword.text}||${row.adGroupCriterion.keyword.matchType}`);

  const campaignNegatives = new Set();
  for (const row of await search(
    "SELECT campaign.name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'",
    "campaign negatives",
  )) campaignNegatives.add(`${row.campaign.name}||${row.campaignCriterion.keyword.text}||${row.campaignCriterion.keyword.matchType}`);

  const adsByGroup = new Map();
  for (const row of await search(
    "SELECT ad_group.name, ad_group_ad.ad.id FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'",
    "ads",
  )) adsByGroup.set(row.adGroup.name, (adsByGroup.get(row.adGroup.name) ?? 0) + 1);

  return { account, campaigns, groups, positives, groupNegatives, campaignNegatives, adsByGroup };
}

// ── diff contract vs live (creations only, same logic as sync-plan.mjs) ──────
function computePlan(live) {
  const newGroups = [];
  const newAds = [];
  const newKeywords = [];
  const newGroupNegatives = [];
  const newCampaignNegatives = [];

  for (const campaign of paidSearchConfig.campaigns) {
    for (const group of campaign.adGroups) {
      const liveGroup = live.groups.get(group.name);
      if (!liveGroup) {
        newGroups.push({ campaign: campaign.name, group });
      }
      // Count-based so a second RSA (variant B) can be created beside the live, policy-approved
      // variant A. Still CREATE-ONLY: an ad already live is never updated or removed, and once
      // the shortfall is filled this returns empty, so the post-apply re-diff lands at zero.
      const plannedAds = [
        { label: "rsa", ad: group.rsa },
        ...(group.rsaVariantB ? [{ label: "rsaVariantB", ad: group.rsaVariantB }] : []),
      ];
      const liveAdCount = live.adsByGroup.get(group.name) ?? 0;
      for (const planned of plannedAds.slice(liveAdCount)) {
        newAds.push({ campaign: campaign.name, group, label: planned.label, ad: planned.ad });
      }
      for (const kw of group.keywords) {
        if (!live.positives.has(`${group.name}||${kw.text}||${kw.matchType}`)) {
          newKeywords.push({ group: group.name, text: kw.text, matchType: kw.matchType });
        }
      }
      // Cross-negatives are PHRASE at the ad-group level (matches every live group).
      for (const term of group.crossNegatives ?? []) {
        if (!live.groupNegatives.has(`${group.name}||${term}||PHRASE`)) {
          newGroupNegatives.push({ group: group.name, text: term });
        }
      }
    }
    for (const neg of paidSearchConfig.accountNegatives) {
      if (!live.campaignNegatives.has(`${campaign.name}||${neg.text}||${neg.matchType}`)) {
        newCampaignNegatives.push({ campaign: campaign.name, text: neg.text, matchType: neg.matchType });
      }
    }
  }
  return { newGroups, newAds, newKeywords, newGroupNegatives, newCampaignNegatives };
}

// ── preconditions, fail closed ───────────────────────────────────────────────
const live = await readLive();
const problems = [];
if (live.account.id !== CUSTOMER) problems.push(`account id ${live.account.id} is not ${CUSTOMER}`);
if (live.account.currencyCode !== "CAD") problems.push(`currency ${live.account.currencyCode} is not CAD`);
if (live.account.timeZone !== "America/Regina") problems.push(`time zone ${live.account.timeZone} is not America/Regina`);
const liveIds = [...live.campaigns.values()].map((c) => c.id).sort();
if (JSON.stringify(liveIds) !== JSON.stringify([...APPROVED_CAMPAIGN_IDS].sort())) {
  problems.push(`campaign inventory ${liveIds.join(",")} does not equal the three approved campaigns`);
}
const brand = [...live.campaigns.values()].find((c) => c.id === BRAND_ID);
if (brand?.status !== "PAUSED") problems.push(`Brand campaign must be PAUSED but is ${brand?.status}`);
if (problems.length > 0) {
  console.error("ABORT — preconditions failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`account: ${live.account.id} ${live.account.currencyCode} ${live.account.timeZone}`);

const plan = computePlan(live);
const total = plan.newGroups.length + plan.newAds.length + plan.newKeywords.length
  + plan.newGroupNegatives.length + plan.newCampaignNegatives.length;

console.log(`\nPLAN: ${plan.newGroups.length} ad groups, ${plan.newAds.length} RSAs, ${plan.newKeywords.length} keywords, ${plan.newGroupNegatives.length} ad-group negatives, ${plan.newCampaignNegatives.length} campaign negatives`);
for (const g of plan.newGroups) console.log(`  + ad group "${g.group.name}" [${g.group.status}] -> ${g.group.finalUrl} (${g.campaign})`);
for (const a of plan.newAds) console.log(`  + RSA [${a.label}] in "${a.group.name}" (${a.ad.headlines.length} headlines, ${a.ad.descriptions.length} descriptions)`);
for (const k of plan.newKeywords) console.log(`  + [${k.matchType}] ${k.text}   (${k.group})`);
for (const n of plan.newGroupNegatives) console.log(`  + neg [PHRASE] ${n.text}   (group: ${n.group})`);
for (const n of plan.newCampaignNegatives) console.log(`  + neg [${n.matchType}] ${n.text}   (campaign: ${n.campaign})`);

if (total === 0) {
  console.log("\nNothing to do: live account already matches the contract.");
  process.exit(0);
}

if (!execute) {
  console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply.");
  process.exit(0);
}

// ── apply: ad groups first, then children ────────────────────────────────────
const groupResources = new Map(); // group name -> resource name
for (const [name, g] of live.groups) groupResources.set(name, g.resourceName);

if (plan.newGroups.length > 0) {
  const operations = plan.newGroups.map(({ campaign, group }) => ({
    create: {
      name: group.name,
      campaign: live.campaigns.get(campaign).resourceName,
      status: group.status,
      type: "SEARCH_STANDARD",
      cpcBidMicros: "10000", // matches every existing group; inert under campaign Maximize Clicks ceilings
    },
  }));
  const result = await mutate("adGroups:mutate", operations, "ad group create");
  result.results.forEach((res, i) => groupResources.set(plan.newGroups[i].group.name, res.resourceName));
  console.log(`\ncreated ${result.results.length} ad group(s)`);
}

if (plan.newKeywords.length > 0) {
  const operations = plan.newKeywords.map((k) => ({
    create: {
      adGroup: groupResources.get(k.group),
      status: "ENABLED",
      keyword: { text: k.text, matchType: k.matchType },
    },
  }));
  await mutate("adGroupCriteria:mutate", operations, "keyword create");
  console.log(`created ${operations.length} keyword(s)`);
}

if (plan.newGroupNegatives.length > 0) {
  const operations = plan.newGroupNegatives.map((n) => ({
    create: {
      adGroup: groupResources.get(n.group),
      negative: true,
      keyword: { text: n.text, matchType: "PHRASE" },
    },
  }));
  await mutate("adGroupCriteria:mutate", operations, "ad-group negative create");
  console.log(`created ${operations.length} ad-group negative(s)`);
}

if (plan.newCampaignNegatives.length > 0) {
  const operations = plan.newCampaignNegatives.map((n) => ({
    create: {
      campaign: live.campaigns.get(n.campaign).resourceName,
      negative: true,
      keyword: { text: n.text, matchType: n.matchType },
    },
  }));
  await mutate("campaignCriteria:mutate", operations, "campaign negative create");
  console.log(`created ${operations.length} campaign negative(s)`);
}

if (plan.newAds.length > 0) {
  const operations = plan.newAds.map(({ group, ad }) => ({
    create: {
      adGroup: groupResources.get(group.name),
      // Inherit the ad group's status instead of forcing ENABLED. A new ad in the held Brand
      // group must be created PAUSED — otherwise creating copy would quietly flip a deliberately
      // held ad group into a partially-enabled state the launched verifier would then reject.
      status: group.status === "PAUSED" ? "PAUSED" : "ENABLED",
      ad: {
        finalUrls: [group.finalUrl],
        responsiveSearchAd: {
          headlines: ad.headlines.map((text) => ({ text })),
          descriptions: ad.descriptions.map((text) => ({ text })),
        },
      },
    },
  }));
  await mutate("adGroupAds:mutate", operations, "RSA create");
  console.log(`created ${operations.length} RSA(s) — now in Google policy review`);
}

// ── readback verify: recompute the diff; it must be empty ────────────────────
const after = await readLive();
const residual = computePlan(after);
const residualTotal = residual.newGroups.length + residual.newAds.length + residual.newKeywords.length
  + residual.newGroupNegatives.length + residual.newCampaignNegatives.length;

const afterBrand = [...after.campaigns.values()].find((c) => c.id === BRAND_ID);
const readbackProblems = [];
if (residualTotal !== 0) readbackProblems.push(`${residualTotal} contract objects still missing after apply`);
if (afterBrand?.status !== "PAUSED") readbackProblems.push(`Brand campaign read back ${afterBrand?.status}, expected PAUSED`);

console.log(`\nreadback: ${after.groups.size} ad groups, ${after.positives.size} positive keywords, ${after.groupNegatives.size + after.campaignNegatives.size} negative criteria (${after.campaignNegatives.size} campaign + ${after.groupNegatives.size} ad-group)`);
if (readbackProblems.length > 0) {
  console.error("\nREADBACK FAILED — verify the account manually:");
  for (const problem of readbackProblems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log("readback clean: live account now matches the contract. Run sync-plan.mjs to confirm zeros.");
