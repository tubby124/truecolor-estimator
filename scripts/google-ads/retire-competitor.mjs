// Retire CompetitorConquest: PAUSE the campaign, then PAUSE every ad group and ad inside it.
//
// WHY THIS EXISTS
// ---------------
// 2026-08-09: the owner retired the Competitor campaign. The 2026-08-07 zero-delivery diagnosis
// set a decision gate for ~2026-08-12 with an explicit stop-condition: "if still zero impressions
// AND Core's search terms stay clean of competitor queries -> conclude thin volume and pause the
// campaign rather than manufacture delivery". Both halves held early — CA$0.00 spend and zero
// impressions across the entire pilot, with Core's search terms clean since the Aug 6 15:58
// routing sync — so the gate resolved to its documented pause branch three days ahead of
// schedule. Retiring it also returns CA$4/day of headroom under MAX_UNMONITORED_DAILY_BURN_CAD.
//
// The existing authorities could not do this. hard-stop-monitor pauses campaigns only on a spend
// threshold, and pausing a campaign is deliberately outside apply-sync (create-only),
// apply-budgets (spend controls), apply-assets (extensions), and hold-brand (Brand children).
// The alternative was a Google Ads UI toggle — the exact second-author drift that went undetected
// on 2026-08-07 and had to be reverted. A retirement is a contract state, so it gets a scripted,
// evidence-producing authority like every other contract state.
//
// MUTATION AUTHORITY — seventh holder, scoped strictly to the Competitor campaign, pause-only:
//   ENABLE a campaign          -> enable-stage-one.mjs
//   PAUSE a campaign on spend  -> hard-stop-monitor.mjs
//   CREATE contract children   -> apply-sync.mjs
//   SYNC extension assets      -> apply-assets.mjs
//   SET budgets + ceilings     -> apply-budgets.mjs
//   HOLD Brand children        -> hold-brand.mjs
//   RETIRE Competitor          -> this file (pause-only, Competitor-only, cannot enable anything)
//
// It can only ever move Competitor toward PAUSED. It cannot enable, create, or remove anything,
// and it refuses to touch any other campaign id.
//
// Run: railway run node scripts/google-ads/retire-competitor.mjs           (dry run)
//      railway run node scripts/google-ads/retire-competitor.mjs --execute

const V = "v24";
const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const COMPETITOR_ID = "24048123061";
const PILOT_START = "2026-08-03";

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

const today = new Date().toISOString().slice(0, 10);

async function readCompetitor() {
  const campaign = (await search(
    `SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name
     FROM campaign WHERE campaign.id = ${COMPETITOR_ID}`, "competitor campaign"))[0]?.campaign;
  const groups = await search(
    `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.resource_name, campaign.id
     FROM ad_group WHERE campaign.id = ${COMPETITOR_ID} AND ad_group.status != 'REMOVED'`, "competitor ad groups");
  const ads = await search(
    `SELECT ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.resource_name, ad_group.name, campaign.id
     FROM ad_group_ad WHERE campaign.id = ${COMPETITOR_ID} AND ad_group_ad.status != 'REMOVED'`, "competitor ads");
  return { campaign, groups, ads };
}

// ── identity guard, fail closed ──────────────────────────────────────────────
const { campaign, groups, ads } = await readCompetitor();
if (!campaign) { console.error(`ABORT — campaign ${COMPETITOR_ID} not found in customer ${CUSTOMER}.`); process.exit(1); }
if (campaign.name !== "GOOG_Search_TC_CompetitorConquest_2026") {
  console.error(`ABORT — campaign ${COMPETITOR_ID} is "${campaign.name}", not the Competitor campaign.`);
  process.exit(1);
}

// ── evidence guard, fail closed ──────────────────────────────────────────────
// The retirement decision rests on "zero impressions across the pilot". If that is no longer
// true, the campaign started delivering and this is a live judgement call, not a documented
// gate outcome — refuse and make a human decide with the fresh numbers.
const metrics = (await search(
  `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros
   FROM campaign
   WHERE campaign.id = ${COMPETITOR_ID} AND segments.date BETWEEN '${PILOT_START}' AND '${today}'`,
  "competitor metrics"))[0]?.metrics;
const impressions = Number(metrics?.impressions ?? 0);
const clicks = Number(metrics?.clicks ?? 0);
const costCad = Number(metrics?.costMicros ?? 0) / 1_000_000;

console.log(`campaign ${COMPETITOR_ID} "${campaign.name}" is ${campaign.status}`);
console.log(`pilot-to-date ${PILOT_START}..${today}: ${impressions} impressions, ${clicks} clicks, CA$${costCad.toFixed(2)}\n`);

if (impressions > 0) {
  console.error(`ABORT — Competitor has ${impressions} impression(s) since ${PILOT_START}. The retirement rationale`);
  console.error("was zero delivery. It is now delivering, so lost-IS rows exist and the CA$2.50 ceiling can be");
  console.error("evaluated on evidence instead. Re-decide with fresh data before retiring.");
  process.exit(1);
}

const groupsToFix = groups.filter((row) => row.adGroup.status !== "PAUSED");
const adsToFix = ads.filter((row) => row.adGroupAd.status !== "PAUSED");
const campaignNeedsPause = campaign.status !== "PAUSED";

console.log(`PLAN: ${campaignNeedsPause ? "pause campaign, " : ""}pause ${groupsToFix.length} ad group(s), ${adsToFix.length} ad(s)`);
if (campaignNeedsPause) console.log(`  PAUSE campaign: ${campaign.name} [${campaign.status}]`);
for (const row of groupsToFix) console.log(`  PAUSE ad group: ${row.adGroup.name} [${row.adGroup.status}]`);
for (const row of adsToFix) console.log(`  PAUSE ad ${row.adGroupAd.ad.id} in ${row.adGroup.name} [${row.adGroupAd.status}]`);

if (!campaignNeedsPause && !groupsToFix.length && !adsToFix.length) {
  console.log("\nNothing to do — Competitor and every child are already PAUSED.");
  process.exit(0);
}

if (!EXECUTE) {
  console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply.");
  process.exit(0);
}

// Campaign first: it is the boundary that actually stops serving. Children follow as
// defence-in-depth so a future accidental re-enable of the campaign still serves nothing.
if (campaignNeedsPause) {
  await mutate("campaigns:mutate", [{
    update: { resourceName: campaign.resourceName, status: "PAUSED" },
    updateMask: "status",
  }], "campaign pause");
  console.log("paused campaign");
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
const after = await readCompetitor();
const residualGroups = after.groups.filter((row) => row.adGroup.status !== "PAUSED");
const residualAds = after.ads.filter((row) => row.adGroupAd.status !== "PAUSED");
if (after.campaign?.status !== "PAUSED" || residualGroups.length || residualAds.length) {
  console.error("readback FAILED — Competitor is not fully PAUSED");
  console.error(`  campaign=${after.campaign?.status} residualGroups=${residualGroups.length} residualAds=${residualAds.length}`);
  process.exit(1);
}
console.log("readback clean: Competitor campaign, every ad group, and every ad are PAUSED.");
