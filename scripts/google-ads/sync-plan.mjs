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

// Ad-group destinations, so a slug retired out from under a live ad group is visible here and
// not only in the separate destination check.
const liveGroupUrls = new Map();
for (const row of await search(
  "SELECT ad_group.name, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'",
  "ad final urls",
)) for (const url of row.adGroupAd?.ad?.finalUrls ?? []) {
  if (!liveGroupUrls.has(row.adGroup.name)) liveGroupUrls.set(row.adGroup.name, new Set());
  liveGroupUrls.get(row.adGroup.name).add(url);
}

// Extension assets. These were previously INVISIBLE to this diff: the contract's callouts and
// sitelink descriptions could be rewritten and this tool would still report "in sync" while the
// account served entirely different text on every impression. apply-sync has no asset authority,
// so these are reported for a human to action, never auto-created.
// Read through campaign_asset, not the asset table. An asset that exists but is linked to no
// campaign serves nothing — reporting it as drift is noise, and noise is how a warning list
// gets ignored.
const liveCallouts = new Set();
const liveSitelinks = new Map();
for (const row of await search(
  `SELECT asset.type, asset.callout_asset.callout_text, asset.sitelink_asset.link_text,
          asset.sitelink_asset.description1, asset.sitelink_asset.description2
   FROM campaign_asset
   WHERE campaign_asset.status != 'REMOVED' AND asset.type IN ('CALLOUT','SITELINK')`,
  "linked assets",
)) {
  if (row.asset?.type === "CALLOUT") liveCallouts.add(row.asset.calloutAsset?.calloutText ?? "");
  if (row.asset?.type === "SITELINK") {
    liveSitelinks.set(row.asset.sitelinkAsset?.linkText ?? "", {
      description1: row.asset.sitelinkAsset?.description1 ?? null,
      description2: row.asset.sitelinkAsset?.description2 ?? null,
    });
  }
}

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
  // Campaign-scoped routing negatives (Core's competitor terms), exported as PHRASE. These
  // were previously invisible to the diff, so a newly contracted competitor never got blocked
  // on Core and the drift never showed up here.
  for (const term of campaign.campaignNegatives ?? []) {
    const key = `${campaign.name}||${term}||PHRASE`;
    if (!liveCampaignNegatives.has(key)) newNegatives.push({ campaign: campaign.name, text: term, matchType: "PHRASE" });
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

// ── drift this tool can SEE but apply-sync cannot FIX ────────────────────────
// apply-sync is create-only and holds no authority over assets, ad content, or destinations.
// Reporting these separately is deliberate: silence used to read as "in sync" when it only
// meant "not looked at".
const driftWarnings = [];

for (const campaign of paidSearchConfig.campaigns) {
  for (const group of campaign.adGroups) {
    const urls = liveGroupUrls.get(group.name);
    if (urls && !urls.has(group.finalUrl)) {
      driftWarnings.push(`ad group "${group.name}" serves ${[...urls].join(", ")} but the contract says ${group.finalUrl}`);
    }
  }
}

const contractCallouts = paidSearchConfig.adAssets?.callouts ?? [];
for (const callout of contractCallouts) {
  if (!liveCallouts.has(callout)) driftWarnings.push(`callout "${callout}" is in the contract but NOT live`);
}
for (const callout of liveCallouts) {
  if (!contractCallouts.includes(callout)) driftWarnings.push(`callout "${callout}" is live but NOT in the contract`);
}

for (const sitelink of paidSearchConfig.adAssets?.sitelinks ?? []) {
  const live = liveSitelinks.get(sitelink.text);
  if (!live) { driftWarnings.push(`sitelink "${sitelink.text}" is in the contract but NOT live`); continue; }
  if (live.description1 !== sitelink.description1 || live.description2 !== sitelink.description2) {
    driftWarnings.push(`sitelink "${sitelink.text}" description drift — live: "${live.description1} / ${live.description2}" vs contract: "${sitelink.description1} / ${sitelink.description2}"`);
  }
}

console.log(`\n=== ASSET / DESTINATION DRIFT — apply-sync CANNOT fix these (${driftWarnings.length}) ===`);
if (driftWarnings.length === 0) {
  console.log("  (none)");
} else {
  for (const warning of driftWarnings) console.log(`  ! ${warning}`);
  console.log("\n  Extension-asset drift is fixed by:  railway run node scripts/google-ads/apply-assets.mjs");
  console.log("  Destination drift is NOT auto-fixable — correct the contract or the ad group by hand.");
  console.log("  A clean SUMMARY below does NOT mean these are resolved.");
}

console.log(`\nSUMMARY: ${newGroups.length} ad groups, ${newAds.length} RSAs, ${newKeywords.length} keywords, ${newNegatives.length} negatives to create.`);
if (driftWarnings.length) console.log(`WARNING: ${driftWarnings.length} asset/destination drift item(s) above are NOT covered by that summary.`);
console.log("This tool is READ-ONLY. Nothing was changed.");
