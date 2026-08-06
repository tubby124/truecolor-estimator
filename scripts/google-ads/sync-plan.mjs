// READ-ONLY diff: approved repo contract vs the live Google Ads account.
//
// Prints exactly what would have to be CREATED to bring the account up to the contract.
// It never mutates, and it never proposes a deletion — the contract is additive by design,
// so anything live-but-not-in-contract is reported as "extra" for a human to judge.
//
// Run: railway run node scripts/google-ads/sync-plan.mjs
import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const V = "v24";

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
  "login-customer-id": LOGIN,
  "content-type": "application/json",
};

async function search(query, label) {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).results ?? [];
}

// ── account identity, fail closed ────────────────────────────────────────────
const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};
if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
  console.error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
  process.exit(1);
}
console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}\n`);

// ── live state ───────────────────────────────────────────────────────────────
const liveGroups = new Map();
for (const row of await search(
  "SELECT ad_group.id, ad_group.name, ad_group.status, campaign.name FROM ad_group WHERE ad_group.status != 'REMOVED'",
  "ad groups",
)) liveGroups.set(row.adGroup.name, { id: row.adGroup.id, status: row.adGroup.status, campaign: row.campaign.name });

const liveKeywords = new Set();
for (const row of await search(
  "SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group_criterion.negative = false AND ad_group_criterion.type = 'KEYWORD'",
  "keywords",
)) liveKeywords.add(`${row.adGroup.name}||${row.adGroupCriterion.keyword.text}||${row.adGroupCriterion.keyword.matchType}`);

const liveCampaignNegatives = new Set();
for (const row of await search(
  "SELECT campaign.name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'",
  "campaign negatives",
)) liveCampaignNegatives.add(`${row.campaign.name}||${row.campaignCriterion.keyword.text}||${row.campaignCriterion.keyword.matchType}`);

const liveAds = new Map();
for (const row of await search(
  "SELECT ad_group.name, ad_group_ad.ad.id FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'",
  "ads",
)) liveAds.set(row.adGroup.name, (liveAds.get(row.adGroup.name) ?? 0) + 1);

// ── contract state ───────────────────────────────────────────────────────────
const MATCH = { EXACT: "EXACT", PHRASE: "PHRASE" };
const newGroups = [];
const newKeywords = [];
const newAds = [];

for (const campaign of paidSearchConfig.campaigns) {
  for (const group of campaign.adGroups) {
    const live = liveGroups.get(group.name);
    if (!live) {
      newGroups.push({ campaign: campaign.name, name: group.name, status: group.status, finalUrl: group.finalUrl });
    }
    // Count-based, not presence-based. The old check only planned an RSA when an ad group had
    // ZERO live ads, so a second variant could never be created and copy edits produced no diff
    // at all. Comparing counts lets variant B be added beside the live, policy-approved variant
    // A — and stays idempotent, so the post-apply re-diff returns zero.
    const plannedAds = [group.rsa, group.rsaVariantB].filter(Boolean);
    const liveAdCount = liveAds.get(group.name) ?? 0;
    for (const ad of plannedAds.slice(liveAdCount)) {
      newAds.push({ group: group.name, headlines: ad.headlines.length, descriptions: ad.descriptions.length });
    }
    for (const kw of group.keywords) {
      const key = `${group.name}||${kw.text}||${MATCH[kw.matchType]}`;
      if (!liveKeywords.has(key)) newKeywords.push({ group: group.name, text: kw.text, matchType: kw.matchType });
    }
  }
}

const negativeTerms = paidSearchConfig.accountNegatives;
const newNegatives = [];
for (const campaign of paidSearchConfig.campaigns) {
  for (const neg of negativeTerms) {
    const key = `${campaign.name}||${neg.text}||${MATCH[neg.matchType]}`;
    if (!liveCampaignNegatives.has(key)) newNegatives.push({ campaign: campaign.name, text: neg.text, matchType: neg.matchType });
  }
}

// ── report ───────────────────────────────────────────────────────────────────
const section = (title, rows, render) => {
  console.log(`=== ${title} (${rows.length}) ===`);
  if (rows.length === 0) console.log("  (none — already in sync)");
  for (const row of rows.slice(0, 60)) console.log(`  + ${render(row)}`);
  if (rows.length > 60) console.log(`  … ${rows.length - 60} more`);
  console.log("");
};

section("AD GROUPS TO CREATE", newGroups, (g) => `${g.name} [${g.status}] -> ${g.finalUrl}  (campaign: ${g.campaign})`);
section("RESPONSIVE SEARCH ADS TO CREATE", newAds, (a) => `RSA in "${a.group}" (${a.headlines} headlines, ${a.descriptions} descriptions)`);
section("KEYWORDS TO ADD", newKeywords, (k) => `[${k.matchType}] ${k.text}   (${k.group})`);
section("CAMPAIGN NEGATIVES TO ADD", newNegatives, (n) => `[${n.matchType}] ${n.text}   (${n.campaign})`);

// Extras — live but not in the contract. Never auto-removed; surfaced for judgement.
const contractGroupNames = new Set(paidSearchConfig.campaigns.flatMap((c) => c.adGroups.map((g) => g.name)));
const extraGroups = [...liveGroups.keys()].filter((name) => !contractGroupNames.has(name));
console.log(`=== LIVE BUT NOT IN CONTRACT (${extraGroups.length}) ===`);
if (extraGroups.length === 0) console.log("  (none)");
for (const name of extraGroups) console.log(`  ? ${name} — review manually; this tool never proposes deletions`);

console.log(`\nSUMMARY: ${newGroups.length} ad groups, ${newAds.length} RSAs, ${newKeywords.length} keywords, ${newNegatives.length} negatives to create.`);
console.log("This tool is READ-ONLY. Nothing was changed.");
