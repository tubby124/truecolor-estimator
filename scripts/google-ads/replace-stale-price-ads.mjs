// Replace Core RSAs whose live copy has drifted from the contract, without a delivery gap.
//
// WHY THIS EXISTS
// ---------------
// 2026-08-06 moved in-house design to a flat $40 and retired the $35/$50/$75 ladder. The contract
// copy was corrected the same day, but 12 ENABLED Core RSAs kept serving "In-House Design $35 Flat"
// and "In-house designer, $35 flat, same-day proof" for three days. Nothing was broken — there was
// simply no authority that could reach ad TEXT:
//
//   apply-sync is CREATE-ONLY and diffs ads by COUNT, not content. Counts matched, so it reported
//   "0 RSAs to create" forever while every ad quoted a price the shop no longer charges.
//
// That is the same blind-spot shape as the assets/campaign-negatives trap: a diff tool that cannot
// see a class of change reports "in sync" permanently. Ads quoting a dead price is a consumer-trust
// and consumer-protection problem, not a style one (see .claude/rules/google-ads-copy.md, and
// truecolor-pricing-comms.md which bans $35 for design outright).
//
// WHY TWO PHASES
// --------------
// Google RSA text is immutable — "editing" an ad means creating a new one, and every new ad enters
// policy review. Editing in place would have sent all 12 ENABLED ads into review at once, mid-pilot,
// against a CA$26 pacing margin. Instead:
//
//   --create : build the replacement from the CONTRACT and create it PAUSED. It enters review while
//              the stale ad keeps serving. Nothing stops delivering. Nothing starts serving either.
//   --swap   : once a replacement reads back APPROVED, enable it and pause the stale ad in ONE
//              mutate. Zero delivery gap AND zero window where both versions serve.
//
// HOW STALENESS IS DECIDED — deliberately NOT a "$35" grep
// -------------------------------------------------------
// $35 is a legitimate live price (postcards, from $35). Grepping for it would eventually mangle a
// correct ad. Instead every live ad is compared against the contract's own copy for its ad group:
//
//   matches variant A  -> LEGACY CONTROL ARM, never touched (google-ads-copy.md: "do not edit")
//   matches variant B  -> already current, skipped
//   matches neither    -> stale variant B, replaced with contract variant B
//
// This generalises: it catches ANY copy drift from contract, not just this one price.
//
// MUTATION AUTHORITY — eighth holder, scoped strictly to Core RSA copy replacement:
//   ENABLE a campaign          -> enable-stage-one.mjs
//   PAUSE a campaign on spend  -> hard-stop-monitor.mjs
//   CREATE contract children   -> apply-sync.mjs
//   SYNC extension assets      -> apply-assets.mjs
//   SET budgets + ceilings     -> apply-budgets.mjs
//   HOLD Brand children        -> hold-brand.mjs
//   RETIRE Competitor          -> retire-competitor.mjs
//   REPLACE stale Core ad copy -> this file (Core-only; creates and pauses ads, never keywords,
//                                 never budgets, never campaign status, never variant A)
//
// Run: railway run node scripts/google-ads/replace-stale-price-ads.mjs --create           (dry run)
//      railway run node scripts/google-ads/replace-stale-price-ads.mjs --create --execute
//      railway run node scripts/google-ads/replace-stale-price-ads.mjs --swap             (dry run)
//      railway run node scripts/google-ads/replace-stale-price-ads.mjs --swap --execute

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const V = "v24";
const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const CORE_ID = "24048123058";
const CORE_NAME = "GOOG_Search_TC_CoreProducts_2026";

const args = process.argv.slice(2);
for (const arg of args) {
  if (!["--create", "--swap", "--execute"].includes(arg)) throw new Error(`unknown argument: ${arg}`);
}
const EXECUTE = args.includes("--execute");
const MODE = args.includes("--create") ? "create" : args.includes("--swap") ? "swap" : null;
if (!MODE) throw new Error("pass exactly one of --create or --swap");
if (args.includes("--create") && args.includes("--swap")) throw new Error("--create and --swap are mutually exclusive");

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

// Order-independent identity for a block of ad copy. Google returns assets in serving order, which
// is not guaranteed to match contract order, so comparing raw arrays would report false drift.
const fingerprint = (headlines, descriptions) => JSON.stringify({
  h: [...headlines].map((t) => t.trim()).sort(),
  d: [...descriptions].map((t) => t.trim()).sort(),
});

const coreContract = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
if (!coreContract) throw new Error("CORE campaign missing from the contract");

const contractByGroup = new Map();
for (const group of coreContract.adGroups) {
  contractByGroup.set(group.name, {
    finalUrl: group.finalUrl,
    variantA: group.rsa ? fingerprint(group.rsa.headlines, group.rsa.descriptions) : null,
    variantB: group.rsaVariantB
      ? { fp: fingerprint(group.rsaVariantB.headlines, group.rsaVariantB.descriptions), ad: group.rsaVariantB }
      : null,
  });
}

// Fail closed: the replacement copy is only worth shipping if the contract itself is already
// correct. A contract still carrying the retired design ladder would otherwise be faithfully
// republished as "the fix".
const RETIRED_DESIGN_PRICES = /(design[^.|]{0,40}\$(35|50|75))|(\$(35|50|75)[^.|]{0,20}flat[^.|]{0,20}(proof|design))/i;
for (const [name, entry] of contractByGroup) {
  if (!entry.variantB) continue;
  const text = [...entry.variantB.ad.headlines, ...entry.variantB.ad.descriptions].join(" | ");
  if (RETIRED_DESIGN_PRICES.test(text)) {
    console.error(`ABORT — contract variant B for "${name}" still quotes a retired design price.`);
    console.error("Fix docs/paid-search/campaign-config.mjs first; this tool republishes the contract verbatim.");
    process.exit(1);
  }
}

async function readCoreAds() {
  const rows = await search(
    `SELECT campaign.name, ad_group.id, ad_group.name, ad_group.resource_name,
            ad_group_ad.status, ad_group_ad.resource_name,
            ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status
     FROM ad_group_ad
     WHERE campaign.id = ${CORE_ID} AND ad_group_ad.status != 'REMOVED'`, "core ads");
  return rows.map((row) => {
    const rsa = row.adGroupAd.ad.responsiveSearchAd ?? { headlines: [], descriptions: [] };
    const headlines = (rsa.headlines ?? []).map((asset) => asset.text);
    const descriptions = (rsa.descriptions ?? []).map((asset) => asset.text);
    return {
      groupId: String(row.adGroup.id),
      groupName: row.adGroup.name,
      groupResource: row.adGroup.resourceName,
      adId: String(row.adGroupAd.ad.id),
      adResource: row.adGroupAd.resourceName,
      status: row.adGroupAd.status,
      approval: row.adGroupAd.policySummary?.approvalStatus ?? "UNKNOWN",
      review: row.adGroupAd.policySummary?.reviewStatus ?? "UNKNOWN",
      fp: fingerprint(headlines, descriptions),
      sample: [...headlines, ...descriptions].filter((t) => /\$\d/.test(t)).slice(0, 2),
    };
  });
}

const ads = await readCoreAds();
if (!ads.length) { console.error(`ABORT — no ads found under ${CORE_NAME}.`); process.exit(1); }

// Classify every live Core ad against its ad group's contract copy.
const classified = ads.map((ad) => {
  const contract = contractByGroup.get(ad.groupName);
  if (!contract) return { ...ad, kind: "UNKNOWN_GROUP" };
  if (contract.variantA && ad.fp === contract.variantA) return { ...ad, kind: "VARIANT_A", contract };
  if (contract.variantB && ad.fp === contract.variantB.fp) return { ...ad, kind: "VARIANT_B_CURRENT", contract };
  return { ...ad, kind: "STALE", contract };
});

const unknownGroups = classified.filter((ad) => ad.kind === "UNKNOWN_GROUP");
if (unknownGroups.length) {
  console.error("ABORT — live Core ad groups missing from the contract (run sync-plan / git fetch first):");
  for (const ad of unknownGroups) console.error(`  ${ad.groupName}`);
  process.exit(1);
}

console.log(`${CORE_NAME}: ${ads.length} ads`);
console.log(`  variant A (legacy control, never touched): ${classified.filter((a) => a.kind === "VARIANT_A").length}`);
console.log(`  variant B already current:                 ${classified.filter((a) => a.kind === "VARIANT_B_CURRENT").length}`);
console.log(`  stale vs contract:                         ${classified.filter((a) => a.kind === "STALE").length}\n`);

if (MODE === "create") {
  // Only ENABLED stale ads matter: a paused stale ad serves nothing, so replacing it spends policy
  // review budget on an ad nobody sees.
  const stale = classified.filter((ad) => ad.kind === "STALE" && ad.status === "ENABLED");
  const groupsWithReplacement = new Set(
    classified.filter((ad) => ad.kind === "VARIANT_B_CURRENT").map((ad) => ad.groupId),
  );
  const todo = stale.filter((ad) => !groupsWithReplacement.has(ad.groupId));
  const skipped = stale.filter((ad) => groupsWithReplacement.has(ad.groupId));

  for (const ad of skipped) console.log(`  SKIP ${ad.groupName} — a current-copy replacement already exists`);
  console.log(`\nPLAN: create ${todo.length} replacement RSA(s), each PAUSED, from contract variant B`);
  for (const ad of todo) {
    console.log(`  CREATE in ${ad.groupName} (replaces ad ${ad.adId})`);
    for (const line of ad.sample) console.log(`      live now: ${line}`);
  }
  if (!todo.length) { console.log("\nNothing to do."); process.exit(0); }
  if (!EXECUTE) { console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply."); process.exit(0); }

  const operations = todo.map((ad) => ({
    create: {
      adGroup: ad.groupResource,
      // PAUSED on purpose: it enters policy review without serving, so the stale ad keeps
      // delivering until --swap flips both at once.
      status: "PAUSED",
      ad: {
        finalUrls: [ad.contract.finalUrl],
        responsiveSearchAd: {
          headlines: ad.contract.variantB.ad.headlines.map((text) => ({ text })),
          descriptions: ad.contract.variantB.ad.descriptions.map((text) => ({ text })),
        },
      },
    },
  }));
  await mutate("adGroupAds:mutate", operations, "replacement RSA create");
  console.log(`\ncreated ${operations.length} replacement RSA(s) — PAUSED, now in Google policy review`);

  const after = await readCoreAds();
  const landed = after.filter((ad) => {
    const contract = contractByGroup.get(ad.groupName);
    return contract?.variantB && ad.fp === contract.variantB.fp && ad.status === "PAUSED";
  });
  if (landed.length < operations.length) {
    console.error(`readback FAILED — expected at least ${operations.length} paused current-copy ads, found ${landed.length}`);
    process.exit(1);
  }
  console.log(`readback clean: ${landed.length} paused replacement(s) present.`);
  console.log("\nNEXT: wait for APPROVED, then run --swap to enable each replacement and pause its stale ad in one mutate.");
}

if (MODE === "swap") {
  const staleEnabled = classified.filter((ad) => ad.kind === "STALE" && ad.status === "ENABLED");
  const replacements = new Map();
  for (const ad of classified) {
    if (ad.kind === "VARIANT_B_CURRENT" && ad.status === "PAUSED") replacements.set(ad.groupId, ad);
  }

  const ready = [];
  const waiting = [];
  for (const ad of staleEnabled) {
    const replacement = replacements.get(ad.groupId);
    if (!replacement) { waiting.push({ ad, why: "no paused replacement — run --create first" }); continue; }
    // Fail closed on review state: enabling a replacement that Google has not cleared would trade a
    // stale price for an ad that may not serve at all.
    if (replacement.approval !== "APPROVED" || !["REVIEWED", "REVIEW_IN_PROGRESS"].includes(replacement.review)) {
      waiting.push({ ad, why: `replacement ${replacement.adId} is ${replacement.approval}/${replacement.review}` });
      continue;
    }
    if (replacement.review !== "REVIEWED") {
      waiting.push({ ad, why: `replacement ${replacement.adId} still under review (${replacement.review})` });
      continue;
    }
    ready.push({ ad, replacement });
  }

  for (const item of waiting) console.log(`  WAIT ${item.ad.groupName} — ${item.why}`);
  console.log(`\nPLAN: swap ${ready.length} ad group(s) — enable replacement + pause stale, atomically`);
  for (const { ad, replacement } of ready) console.log(`  SWAP ${ad.groupName}: enable ${replacement.adId}, pause ${ad.adId}`);
  if (!ready.length) { console.log("\nNothing ready to swap."); process.exit(0); }
  if (!EXECUTE) { console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply."); process.exit(0); }

  // One mutate: Google applies the operation list atomically, so the ad group is never left with
  // both versions serving, nor with neither.
  const operations = ready.flatMap(({ ad, replacement }) => [
    { update: { resourceName: replacement.adResource, status: "ENABLED" }, updateMask: "status" },
    { update: { resourceName: ad.adResource, status: "PAUSED" }, updateMask: "status" },
  ]);
  await mutate("adGroupAds:mutate", operations, "stale copy swap");
  console.log(`\nswapped ${ready.length} ad group(s)`);

  const after = await readCoreAds();
  const problems = [];
  for (const { ad, replacement } of ready) {
    const nowStale = after.find((row) => row.adId === ad.adId);
    const nowNew = after.find((row) => row.adId === replacement.adId);
    if (nowStale?.status !== "PAUSED") problems.push(`stale ad ${ad.adId} read back ${nowStale?.status}`);
    if (nowNew?.status !== "ENABLED") problems.push(`replacement ${replacement.adId} read back ${nowNew?.status}`);
  }
  if (problems.length) {
    console.error("readback FAILED:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  const residualStale = after.filter((ad) => ad.kind !== "VARIANT_A" && ad.status === "ENABLED"
    && contractByGroup.get(ad.groupName)?.variantB
    && ad.fp !== contractByGroup.get(ad.groupName).variantB.fp
    && ad.fp !== contractByGroup.get(ad.groupName).variantA);
  console.log(`readback clean: replacements ENABLED, stale ads PAUSED. Remaining enabled stale ads: ${residualStale.length}`);
}
