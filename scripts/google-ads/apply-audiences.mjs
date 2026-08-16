// Attach OBSERVATION audiences to every enabled Core ad group.
//
// WHY OBSERVATION AND NOT TARGETING
// ---------------------------------
// `bid_only: true` on the ad group's AUDIENCE target restriction is the single load-bearing
// field in this script. With it, an audience is an OBSERVATION: it changes nothing about who
// sees the ads and only labels the traffic so a future bid decision has a segment to read.
// Without it — bid_only false, the DEFAULT when a dimension is absent — the same criteria become
// TARGETING and delivery collapses to list members only. On a 35 km presence-only Saskatoon
// radius at CA$25/day that is a delivery outage, not a tuning change. The restriction is
// therefore written FIRST, and the readback asserts it on every group.
//
// MUTATION AUTHORITY
// ------------------
// Seventh authority, scoped to exactly one noun: AD-GROUP AUDIENCE CRITERIA (plus the AUDIENCE
// target restriction that makes them observational). It cannot touch keywords, ads, budgets,
// bids, status, or conversion measurement.
//
// IDEMPOTENCE
// -----------
// Every criterion is keyed by ad group + resource name, and existing ones are skipped. The
// target restriction is only written where the AUDIENCE dimension is missing or reads
// bid_only=false. Re-running after a partial failure completes the job and creates no duplicates.
//
// Run: railway run node scripts/google-ads/apply-audiences.mjs            (dry run)
//      railway run node scripts/google-ads/apply-audiences.mjs --execute  (apply)

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { HARD_STOP_CUSTOMER_ID, HARD_STOP_LOGIN_CUSTOMER_ID } from "./hard-stop-contract.mjs";

const V = "v24";
const CUSTOMER = HARD_STOP_CUSTOMER_ID;
const AUDIENCES = paidSearchConfig.observationAudiences;
if (!AUDIENCES || AUDIENCES.mode !== "OBSERVATION" || AUDIENCES.targetRestriction?.bidOnly !== true) {
  throw new Error("ABORT — observationAudiences must declare OBSERVATION mode with bid_only true");
}

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`Unknown argument: ${arg}`);
const execute = args.includes("--execute");

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
  if (!r.ok) throw new Error(`token refresh failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
})();

const headers = {
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": HARD_STOP_LOGIN_CUSTOMER_ID,
  "content-type": "application/json",
};
const search = async (query, label) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 400)}`);
  return (await r.json()).results ?? [];
};
const mutate = async (path, body, label) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/${path}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 600)}`);
  return r.json();
};

const AD_GROUP_QUERY =
  `SELECT campaign.name, ad_group.id, ad_group.name, ad_group.status, `
  + `ad_group.targeting_setting.target_restrictions FROM ad_group `
  + `WHERE campaign.name = '${AUDIENCES.campaign}' AND ad_group.status = 'ENABLED'`;
const CRITERION_QUERY =
  "SELECT ad_group.id, ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.type, "
  + "ad_group_criterion.status, ad_group_criterion.user_interest.user_interest_category, "
  + "ad_group_criterion.user_list.user_list FROM ad_group_criterion "
  + "WHERE ad_group_criterion.type IN ('USER_INTEREST','USER_LIST') AND ad_group_criterion.status != 'REMOVED'";

const readLive = async () => {
  const [adGroupRows, criterionRows] = await Promise.all([
    search(AD_GROUP_QUERY, "core ad groups"),
    search(CRITERION_QUERY, "audience criteria"),
  ]);
  return {
    adGroups: adGroupRows.map((row) => ({
      id: String(row.adGroup.id),
      name: row.adGroup.name,
      status: row.adGroup.status,
      // The FULL current restriction list. It must be echoed back on update — the API replaces
      // the array wholesale, so writing only AUDIENCE would silently delete any other dimension.
      targetRestrictions: row.adGroup.targetingSetting?.targetRestrictions ?? [],
    })),
    criteria: criterionRows.map((row) => ({
      adGroupId: String(row.adGroup.id),
      adGroupName: row.adGroup.name,
      resourceName: row.adGroupCriterion.resourceName,
      type: row.adGroupCriterion.type,
      userInterest: row.adGroupCriterion.userInterest?.userInterestCategory ?? null,
      userList: row.adGroupCriterion.userList?.userList ?? null,
    })),
  };
};

// ── preconditions, fail closed ───────────────────────────────────────────────
const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};
if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
  throw new Error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
}
console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}\n`);

const live = await readLive();
const declared = new Map(AUDIENCES.adGroups.map((group) => [group.id, group.name]));
const liveIds = live.adGroups.map((group) => group.id).sort();
const declaredIds = [...declared.keys()].sort();
const problems = [];
if (JSON.stringify(liveIds) !== JSON.stringify(declaredIds)) {
  // A hand-written allowlist that disagrees with the account is the whole reason this check
  // exists: it means an ad group was added, paused, or renamed since the contract was written.
  problems.push(`enabled ${AUDIENCES.campaign} ad groups ${liveIds.join(",")} do not equal the declared allowlist ${declaredIds.join(",")}`);
}
for (const group of live.adGroups) {
  const expectedName = declared.get(group.id);
  if (expectedName && expectedName !== group.name) problems.push(`ad group ${group.id} is "${group.name}", declared as "${expectedName}"`);
}
if (problems.length) {
  console.error("ABORT — preconditions failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

// ── desired criteria ─────────────────────────────────────────────────────────
const wantCriteria = [
  ...AUDIENCES.userInterests.map((item) => ({
    kind: "USER_INTEREST",
    label: `in-market ${item.criterionId} ${item.name}`,
    key: `customers/${CUSTOMER}/userInterests/${item.criterionId}`,
    payload: { userInterest: { userInterestCategory: `customers/${CUSTOMER}/userInterests/${item.criterionId}` } },
  })),
  ...AUDIENCES.userLists.map((item) => ({
    kind: "USER_LIST",
    label: `remarketing list ${item.id} ${item.name}`,
    key: `customers/${CUSTOMER}/userLists/${item.id}`,
    payload: { userList: { userList: `customers/${CUSTOMER}/userLists/${item.id}` } },
  })),
];
if (wantCriteria.length !== AUDIENCES.criteriaPerAdGroup) {
  throw new Error(`ABORT — contract declares ${AUDIENCES.criteriaPerAdGroup} criteria per ad group but built ${wantCriteria.length}`);
}

const liveKeys = new Set(live.criteria.map((criterion) => `${criterion.adGroupId}||${criterion.userInterest ?? criterion.userList}`));
const criteriaToCreate = [];
for (const group of live.adGroups) {
  for (const want of wantCriteria) {
    if (liveKeys.has(`${group.id}||${want.key}`)) continue;
    criteriaToCreate.push({
      adGroupId: group.id,
      adGroupName: group.name,
      label: want.label,
      operation: { create: { adGroup: `customers/${CUSTOMER}/adGroups/${group.id}`, status: "ENABLED", ...want.payload } },
    });
  }
}

const restrictionUpdates = live.adGroups
  .filter((group) => !group.targetRestrictions.some(
    (restriction) => restriction.targetingDimension === "AUDIENCE" && restriction.bidOnly === true,
  ))
  .map((group) => ({
    adGroupId: group.id,
    adGroupName: group.name,
    operation: {
      updateMask: "targeting_setting.target_restrictions",
      update: {
        resourceName: `customers/${CUSTOMER}/adGroups/${group.id}`,
        targetingSetting: {
          // Echo every non-AUDIENCE restriction back verbatim, then append the observation one.
          targetRestrictions: [
            ...group.targetRestrictions.filter((restriction) => restriction.targetingDimension !== "AUDIENCE"),
            { targetingDimension: "AUDIENCE", bidOnly: true },
          ],
        },
      },
    },
  }));

console.log(`PLAN: ${restrictionUpdates.length} ad group(s) need the AUDIENCE bid-only restriction, ${criteriaToCreate.length} audience criteria to create`);
for (const item of restrictionUpdates) console.log(`  ~ ${item.adGroupName} (${item.adGroupId}): targeting_setting AUDIENCE -> bid_only true (OBSERVATION)`);
for (const item of criteriaToCreate) console.log(`  + ${item.adGroupName} (${item.adGroupId}): ${item.label}`);
if (!restrictionUpdates.length && !criteriaToCreate.length) console.log("  · nothing to do — every enabled Core ad group already observes all six audiences");

const planSummary = {
  customerId: CUSTOMER,
  campaign: AUDIENCES.campaign,
  enabledAdGroups: live.adGroups.length,
  criteriaPerAdGroup: AUDIENCES.criteriaPerAdGroup,
  expectedTotalCriteria: live.adGroups.length * AUDIENCES.criteriaPerAdGroup,
  liveAudienceCriteria: live.criteria.length,
  restrictionUpdates: restrictionUpdates.map((item) => `${item.adGroupName}:${item.adGroupId}`),
  criteriaToCreate: criteriaToCreate.length,
};

if (!execute) {
  console.log(`\nDRY RUN — nothing was changed. Re-run with --execute to apply.`);
  console.log(JSON.stringify({ ...planSummary, mode: "DRY_RUN" }, null, 2));
  process.exit(0);
}

// ── apply: restriction FIRST, then criteria ──────────────────────────────────
// Order is a safety property, not a style choice. Creating audience criteria on an ad group that
// has no AUDIENCE bid_only restriction makes them TARGETING for however long the gap lasts, and
// that window is a live delivery cut.
if (restrictionUpdates.length) {
  await mutate("adGroups:mutate", {
    operations: restrictionUpdates.map((item) => item.operation),
    partialFailure: false,
  }, "ad group targeting setting");
  console.log(`\nset AUDIENCE bid-only on ${restrictionUpdates.length} ad group(s)`);
}
if (criteriaToCreate.length) {
  await mutate("adGroupCriteria:mutate", {
    operations: criteriaToCreate.map((item) => item.operation),
    partialFailure: false,
  }, "ad group audience criteria");
  console.log(`created ${criteriaToCreate.length} audience criteria`);
}

// ── readback ─────────────────────────────────────────────────────────────────
const after = await readLive();
const afterProblems = [];
const countByGroup = new Map();
for (const criterion of after.criteria) {
  countByGroup.set(criterion.adGroupId, (countByGroup.get(criterion.adGroupId) ?? 0) + 1);
}
for (const group of after.adGroups) {
  const observational = group.targetRestrictions.some(
    (restriction) => restriction.targetingDimension === "AUDIENCE" && restriction.bidOnly === true,
  );
  if (!observational) afterProblems.push(`${group.name} (${group.id}) is not AUDIENCE bid-only — its audiences are TARGETING and are cutting delivery`);
  const count = countByGroup.get(group.id) ?? 0;
  if (count !== AUDIENCES.criteriaPerAdGroup) afterProblems.push(`${group.name} (${group.id}) has ${count} audience criteria, expected ${AUDIENCES.criteriaPerAdGroup}`);
}
const summary = {
  ...planSummary,
  mode: "EXECUTED",
  audienceCriteriaAfter: after.criteria.length,
  perAdGroup: Object.fromEntries([...countByGroup].sort()),
  readbackProblems: afterProblems,
  readback: afterProblems.length ? "FAILED" : "CLEAN",
};
console.log(`\n${JSON.stringify(summary, null, 2)}`);
if (afterProblems.length) {
  console.error("readback FAILED — live audience state does not match the contract");
  process.exitCode = 1;
} else {
  console.log(`readback clean: ${after.criteria.length} bid-only observation criteria across ${after.adGroups.length} enabled Core ad groups.`);
}
