// Re-assert the held Brand state: every ad group and ad inside the Brand campaign is PAUSED.
//
// WHY THIS EXISTS
// ---------------
// 2026-08-07: the owner enabled Brand's ad group + one Brand RSA from the Google Ads web UI
// (change_event, 11:43, GOOGLE_ADS_WEB_CLIENT). The Brand CAMPAIGN stayed paused so nothing
// served, but the launched verifier correctly went UNSAFE — the contract holds Brand's children
// PAUSED as defense-in-depth: if the campaign is ever accidentally enabled, paused children
// still serve nothing. No existing authority could revert this class of drift (enable-stage-one
// is campaign-status-only), which is how it sat live while every repo check was green.
//
// MUTATION AUTHORITY — sixth holder, scoped strictly to PAUSING children of the Brand campaign:
//   ENABLE a campaign        -> enable-stage-one.mjs
//   PAUSE a campaign         -> hard-stop-monitor.mjs
//   CREATE contract children -> apply-sync.mjs
//   SYNC extension assets    -> apply-assets.mjs
//   SET budgets + ceilings   -> apply-budgets.mjs
//   HOLD Brand children      -> this file (pause-only, Brand-only, cannot enable anything)
//   RETIRE Competitor        -> retire-competitor.mjs (seventh holder, pause-only, Competitor-only)
//
// Run: railway run node scripts/google-ads/hold-brand.mjs           (dry run)
//      railway run node scripts/google-ads/hold-brand.mjs --execute

const V = "v24";
const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const BRAND_ID = "24048123064";

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`unknown argument: ${arg}`);
const EXECUTE = args.includes("--execute");

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

async function readBrandChildren() {
  const groups = await search(
    `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.resource_name, campaign.id
     FROM ad_group WHERE campaign.id = ${BRAND_ID} AND ad_group.status != 'REMOVED'`, "brand ad groups");
  const ads = await search(
    `SELECT ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.resource_name, ad_group.name, campaign.id
     FROM ad_group_ad WHERE campaign.id = ${BRAND_ID} AND ad_group_ad.status != 'REMOVED'`, "brand ads");
  return { groups, ads };
}

// Precondition, fail closed: this tool only makes sense while Brand itself is held paused.
const brandCampaign = (await search(
  `SELECT campaign.id, campaign.status FROM campaign WHERE campaign.id = ${BRAND_ID}`, "brand campaign"))[0]?.campaign;
if (brandCampaign?.status !== "PAUSED") {
  console.error(`ABORT — Brand campaign is ${brandCampaign?.status ?? "MISSING"}, not PAUSED. If Brand was deliberately`);
  console.error("launched, that is a contract change; update the expected maps before running this.");
  process.exit(1);
}

const { groups, ads } = await readBrandChildren();
const groupsToFix = groups.filter((row) => row.adGroup.status !== "PAUSED");
const adsToFix = ads.filter((row) => row.adGroupAd.status !== "PAUSED");

console.log(`Brand campaign ${BRAND_ID} is PAUSED. Children: ${groups.length} ad group(s), ${ads.length} ad(s).`);
console.log(`\nPLAN: pause ${groupsToFix.length} ad group(s), ${adsToFix.length} ad(s)`);
for (const row of groupsToFix) console.log(`  PAUSE ad group: ${row.adGroup.name} [${row.adGroup.status}]`);
for (const row of adsToFix) console.log(`  PAUSE ad ${row.adGroupAd.ad.id} in ${row.adGroup.name} [${row.adGroupAd.status}]`);

if (!groupsToFix.length && !adsToFix.length) { console.log("\nNothing to do — all Brand children already PAUSED."); process.exit(0); }

if (!EXECUTE) {
  console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply.");
  process.exit(0);
}

if (groupsToFix.length) {
  await mutate("adGroups:mutate", groupsToFix.map((row) => ({
    update: { resourceName: row.adGroup.resourceName, status: "PAUSED" },
    updateMask: "status",
  })), "ad group pause");
  console.log(`paused ${groupsToFix.length} ad group(s)`);
}
if (adsToFix.length) {
  await mutate("adGroupAds:mutate", adsToFix.map((row) => ({
    update: { resourceName: row.adGroupAd.resourceName, status: "PAUSED" },
    updateMask: "status",
  })), "ad pause");
  console.log(`paused ${adsToFix.length} ad(s)`);
}

// ── readback ─────────────────────────────────────────────────────────────────
const after = await readBrandChildren();
const residualGroups = after.groups.filter((row) => row.adGroup.status !== "PAUSED");
const residualAds = after.ads.filter((row) => row.adGroupAd.status !== "PAUSED");
if (residualGroups.length || residualAds.length) {
  console.error("readback FAILED — Brand children are not all PAUSED");
  process.exit(1);
}
console.log("readback clean: every Brand ad group and ad is PAUSED.");
