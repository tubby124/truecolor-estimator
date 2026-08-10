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
// DESTINATION IS PART OF THE AD (2026-08-10)
// ------------------------------------------
// The identity above was copy-only, so an ad with byte-identical contract copy pointing at a
// SUPERSEDED URL read back as "already current" and the tool reported nothing to do. A destination
// repoint is exactly as invisible to apply-sync as a price edit was — same blind-spot shape, one
// class of change further out. The current-copy test is therefore headlines + descriptions +
// sorted finalUrls; same copy at a different destination now classifies STALE.
//
// Variant A identification stays COPY-ONLY on purpose. The legacy control arm must remain
// recognisable as variant A even when it sits at a destination the contract has moved off — you
// cannot make a retirement decision about an ad you have stopped being able to name.
//
// 🔴 DOCUMENTED EXCEPTION TO "NEVER TOUCH VARIANT A"
// -------------------------------------------------
// google-ads-copy.md says the legacy variant-A ad is the control arm and must not be edited. That
// rule is preserved literally — this tool never edits variant A, and never will: RSA text is
// immutable and this file has no code path that rewrites an existing ad.
//
// But when a group's DESTINATION changes, the legacy variant-A ad still points at the OLD page.
// Leaving it ENABLED after the swap splits the group's traffic across two destinations, which
// destroys the very experiment the repoint exists to run — the result would be uninterpretable at
// any spend level, and this account has CA$600 of qualifying spend to allocate.
//
// So, for a group whose destination changed and ONLY for such a group, variant A is PAUSED in the
// same atomic swap. Pausing is not editing: the ad, its copy, its policy approval, and its history
// are intact and one status flip away from returning. The copy-only staleness case is unchanged —
// variant A at the contract destination is never touched, exactly as before.
//
// Note on how that ad READS BACK: when the repoint also drops `headlines` from the contract group
// (it must, or EXPECTED_TOTAL_RESPONSIVE_SEARCH_ADS counts a paused ad as live inventory), the
// legacy ad no longer matches any contract variant and classifies as plain STALE rather than
// VARIANT_A_STALE_URL. Same outcome, same rationale — the swap's `destinationChanged` flag is
// derived from the URLs, not from the label, so the exception is reported either way.
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
//                                 never budgets, never campaign status; never EDITS any ad, and
//                                 pauses variant A only on a destination change — see above)
//
// Run: railway run node scripts/google-ads/replace-stale-price-ads.mjs --create           (dry run)
//      railway run node scripts/google-ads/replace-stale-price-ads.mjs --create --execute
//      railway run node scripts/google-ads/replace-stale-price-ads.mjs --swap             (dry run)
//      railway run node scripts/google-ads/replace-stale-price-ads.mjs --swap --execute

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import {
  buildCoreContractIndex,
  buildSwapOperations,
  classifyLiveCoreAds,
  findRetiredPriceInContract,
  fingerprintCopy,
  fingerprintDestinations,
  planDestinationSwap,
  planReplacementCreates,
} from "./stale-ad-replacement-contract.mjs";

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

const contractByGroup = buildCoreContractIndex(
  paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE"),
);

const contractCarryingRetiredPrice = findRetiredPriceInContract(contractByGroup);
if (contractCarryingRetiredPrice) {
  console.error(`ABORT — contract variant B for "${contractCarryingRetiredPrice}" still quotes a retired design price.`);
  console.error("Fix docs/paid-search/campaign-config.mjs first; this tool republishes the contract verbatim.");
  process.exit(1);
}

async function readCoreAds() {
  const rows = await search(
    `SELECT campaign.name, ad_group.id, ad_group.name, ad_group.resource_name,
            ad_group_ad.status, ad_group_ad.resource_name,
            ad_group_ad.ad.id, ad_group_ad.ad.final_urls,
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status
     FROM ad_group_ad
     WHERE campaign.id = ${CORE_ID} AND ad_group_ad.status != 'REMOVED'`, "core ads");
  return rows.map((row) => {
    const rsa = row.adGroupAd.ad.responsiveSearchAd ?? { headlines: [], descriptions: [] };
    const headlines = (rsa.headlines ?? []).map((asset) => asset.text);
    const descriptions = (rsa.descriptions ?? []).map((asset) => asset.text);
    const finalUrls = row.adGroupAd.ad.finalUrls ?? [];
    return {
      finalUrls,
      urlFp: fingerprintDestinations(finalUrls),
      groupId: String(row.adGroup.id),
      groupName: row.adGroup.name,
      groupResource: row.adGroup.resourceName,
      adId: String(row.adGroupAd.ad.id),
      adResource: row.adGroupAd.resourceName,
      status: row.adGroupAd.status,
      approval: row.adGroupAd.policySummary?.approvalStatus ?? "UNKNOWN",
      review: row.adGroupAd.policySummary?.reviewStatus ?? "UNKNOWN",
      fp: fingerprintCopy(headlines, descriptions),
      sample: [...headlines, ...descriptions].filter((t) => /\$\d/.test(t)).slice(0, 2),
    };
  });
}

const ads = await readCoreAds();
if (!ads.length) { console.error(`ABORT — no ads found under ${CORE_NAME}.`); process.exit(1); }

// Classify every live Core ad against its ad group's contract copy AND destination.
const classified = classifyLiveCoreAds(ads, contractByGroup);

const unknownGroups = classified.filter((ad) => ad.kind === "UNKNOWN_GROUP");
if (unknownGroups.length) {
  console.error("ABORT — live Core ad groups missing from the contract (run sync-plan / git fetch first):");
  for (const ad of unknownGroups) console.error(`  ${ad.groupName}`);
  process.exit(1);
}

const countOf = (kind) => classified.filter((ad) => ad.kind === kind).length;
console.log(`${CORE_NAME}: ${ads.length} ads`);
console.log(`  variant A (legacy control, never touched): ${countOf("VARIANT_A")}`);
console.log(`  variant A at a SUPERSEDED destination:     ${countOf("VARIANT_A_STALE_URL")}`);
console.log(`  variant B already current:                 ${countOf("VARIANT_B_CURRENT")}`);
console.log(`  stale vs contract (copy or destination):   ${countOf("STALE")}\n`);
for (const ad of classified.filter((a) => a.kind === "VARIANT_A_STALE_URL")) {
  console.log(`  DESTINATION CHANGED in ${ad.groupName}: legacy variant A ${ad.adId} still points at ${ad.finalUrls.join(", ")}`);
  console.log(`      contract now says ${ad.contract.finalUrl} — it will be PAUSED (never edited) at --swap`);
}
if (classified.some((a) => a.kind === "VARIANT_A_STALE_URL")) console.log("");

if (MODE === "create") {
  const { todo, skipped } = planReplacementCreates(classified);

  for (const item of skipped) console.log(`  SKIP ${item.ad.groupName} ad ${item.ad.adId} — ${item.why}`);
  console.log(`\nPLAN: create ${todo.length} replacement RSA(s), each PAUSED, from contract variant B`);
  for (const ad of todo) {
    // One replacement per GROUP. It supersedes every enabled non-current ad in that group, which
    // is more than one whenever the destination moved — --swap retires the whole set.
    const supersedes = classified.filter((other) => other.groupId === ad.groupId
      && other.status === "ENABLED" && other.kind !== "VARIANT_A");
    console.log(`  CREATE in ${ad.groupName} (supersedes ${supersedes.length} enabled ad(s): ${supersedes.map((s) => s.adId).join(", ")})`);
    console.log(`      destination: ${ad.contract.finalUrl}`);
    if (ad.urlFp !== ad.contract.urlFp) console.log(`      live now at: ${ad.finalUrls.join(", ")}  <- DESTINATION REPOINT`);
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

  // Readback reclassifies through the same rules, so a replacement that landed at the WRONG
  // destination fails here instead of quietly counting as current.
  const after = classifyLiveCoreAds(await readCoreAds(), contractByGroup);
  const landed = after.filter((ad) => ad.kind === "VARIANT_B_CURRENT" && ad.status === "PAUSED");
  if (landed.length < operations.length) {
    console.error(`readback FAILED — expected at least ${operations.length} paused current-copy ads, found ${landed.length}`);
    process.exit(1);
  }
  console.log(`readback clean: ${landed.length} paused replacement(s) present.`);
  console.log("\nNEXT: wait for APPROVED, then run --swap to enable each replacement and pause its stale ad in one mutate.");
}

if (MODE === "swap") {
  const { ready, waiting } = planDestinationSwap(classified);

  for (const item of waiting) console.log(`  WAIT ${item.groupName} — ${item.why}`);
  console.log(`\nPLAN: swap ${ready.length} ad group(s) — enable replacement + pause every superseded ad, atomically`);
  for (const item of ready) {
    console.log(`  SWAP ${item.groupName}: enable ${item.replacement.adId}, pause ${item.retire.map((ad) => `${ad.adId} (${ad.kind})`).join(" + ")}`);
    if (item.destinationChanged) {
      console.log("      DESTINATION CHANGE — the legacy variant-A ad is retired too. Leaving it enabled would");
      console.log("      split this group's traffic across two landing pages and destroy the experiment.");
      console.log("      It is PAUSED, never edited: copy, policy approval, and history are all intact.");
    }
  }
  if (!ready.length) { console.log("\nNothing ready to swap."); process.exit(0); }
  if (!EXECUTE) { console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply."); process.exit(0); }

  // One mutate: Google applies the operation list atomically, so the ad group is never left with
  // both destinations serving, nor with neither.
  const operations = buildSwapOperations(ready);
  await mutate("adGroupAds:mutate", operations, "stale copy swap");
  console.log(`\nswapped ${ready.length} ad group(s)`);

  const after = classifyLiveCoreAds(await readCoreAds(), contractByGroup);
  const problems = [];
  for (const { replacement, retire } of ready) {
    const nowNew = after.find((row) => row.adId === replacement.adId);
    if (nowNew?.status !== "ENABLED") problems.push(`replacement ${replacement.adId} read back ${nowNew?.status}`);
    for (const ad of retire) {
      const nowRetired = after.find((row) => row.adId === ad.adId);
      if (nowRetired?.status !== "PAUSED") problems.push(`superseded ad ${ad.adId} read back ${nowRetired?.status}`);
    }
  }
  if (problems.length) {
    console.error("readback FAILED:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  const residual = after.filter((ad) => ad.status === "ENABLED"
    && (ad.kind === "STALE" || ad.kind === "VARIANT_A_STALE_URL"));
  console.log(`readback clean: replacements ENABLED, superseded ads PAUSED. Remaining enabled superseded ads: ${residual.length}`);
}
