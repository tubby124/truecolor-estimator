// Remove positive keywords that a live NEGATIVE keyword permanently blocks.
//
// WHY THIS EXISTS AND WHY IT IS NOT remove-migrated-keywords.mjs
// -------------------------------------------------------------
// remove-migrated-keywords.mjs removes a keyword because the SAME term is confirmed live in a
// destination ad group — a completed move, where coverage provably cannot drop. That safety rule
// does not apply here and must not be stretched to cover this case, because nothing is moving.
//
// This file removes a keyword that CANNOT SERVE AT ALL. On 2026-08-10 "who makes" was added as
// an account-wide negative (EXACT + PHRASE, all three campaigns). On 2026-08-14 "who makes
// stickers" was added as a positive keyword to Stickers and Labels. A phrase negative blocks
// every query containing it, so the positive keyword has never been eligible in any auction and
// never will be while the negative stands. It is not underperforming; it is unreachable.
//
// SAFETY RULE
// -----------
// A keyword is only removed when the BLOCKING NEGATIVE is confirmed live first, as an account
// negative on the ad group's own campaign, with a match type that actually blocks it. If the
// negative is gone, the keyword is reachable again and the removal is REFUSED. That inverts
// the migration script's rule for the same reason: prove the removal is a no-op for coverage
// before making it.
//
// Anything not on REMOVALS below is untouchable. This file's only verb is REMOVE a positive
// ad-group keyword — it cannot create, enable, pause, or edit anything.
//
// Run: railway run node scripts/google-ads/remove-conflicting-keywords.mjs            (dry-run)
//      railway run node scripts/google-ads/remove-conflicting-keywords.mjs --execute  (apply)

import { HARD_STOP_CUSTOMER_ID, HARD_STOP_LOGIN_CUSTOMER_ID } from "./hard-stop-contract.mjs";

const V = "v24";
const CUSTOMER = HARD_STOP_CUSTOMER_ID;

// Explicit, auditable, and intentionally NOT derived from the contract. Deriving "live but no
// longer in the config" would let any future config typo silently delete live keywords.
const REMOVALS = [
  {
    adGroupId: "197192347406",
    adGroup: "Stickers and Labels",
    campaign: "GOOG_Search_TC_CoreProducts_2026",
    text: "who makes stickers",
    matchTypes: ["EXACT", "PHRASE"],
    blockedBy: "who makes",
    note: "2026-08-10 account negative 'who makes' blocks every query this could match",
  },
];

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

const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};
if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
  throw new Error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
}
console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}\n`);

const POSITIVE_QUERY =
  "SELECT campaign.name, ad_group.id, ad_group.name, ad_group_criterion.resource_name, "
  + "ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status "
  + "FROM ad_group_criterion WHERE ad_group_criterion.negative = false AND ad_group_criterion.type = 'KEYWORD'";
const CAMPAIGN_NEGATIVE_QUERY =
  "SELECT campaign.name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type "
  + "FROM campaign_criterion WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'";

const [positives, campaignNegatives] = await Promise.all([
  search(POSITIVE_QUERY, "positive keywords"),
  search(CAMPAIGN_NEGATIVE_QUERY, "campaign negatives"),
]);

const positiveIndex = new Map();
for (const row of positives) {
  positiveIndex.set(
    `${String(row.adGroup?.id ?? "")}||${row.adGroupCriterion.keyword.text}||${row.adGroupCriterion.keyword.matchType}`,
    { resourceName: row.adGroupCriterion.resourceName, adGroupName: row.adGroup?.name, campaign: row.campaign?.name },
  );
}
const negativeIndex = new Set(campaignNegatives.map(
  (row) => `${row.campaign?.name}||${row.campaignCriterion.keyword.text.toLowerCase()}||${row.campaignCriterion.keyword.matchType}`,
));
console.log(`live positive keywords: ${positives.length}`);
console.log(`live campaign negatives: ${campaignNegatives.length}\n`);

const toRemove = [];
const skipped = [];
for (const removal of REMOVALS) {
  // The blocking negative must be live as a PHRASE negative on this keyword's campaign.
  // PHRASE is what makes it total: an EXACT negative would only block the bare term.
  const blockerKey = `${removal.campaign}||${removal.blockedBy.toLowerCase()}||PHRASE`;
  const blockerLive = negativeIndex.has(blockerKey);
  for (const matchType of removal.matchTypes) {
    const key = `${removal.adGroupId}||${removal.text}||${matchType}`;
    const live = positiveIndex.get(key);
    if (!live) { skipped.push(`[${matchType}] "${removal.text}" — already absent from ${removal.adGroup}`); continue; }
    if (live.adGroupName !== removal.adGroup) {
      skipped.push(`[${matchType}] "${removal.text}" — REFUSED, ad group ${removal.adGroupId} is "${live.adGroupName}", not "${removal.adGroup}"`);
      continue;
    }
    if (!blockerLive) {
      skipped.push(`[${matchType}] "${removal.text}" — REFUSED, blocking phrase negative "${removal.blockedBy}" is NOT live on ${removal.campaign}; the keyword is reachable again`);
      continue;
    }
    toRemove.push({
      resourceName: live.resourceName,
      label: `[${matchType}] "${removal.text}" from ${removal.adGroup}`,
      note: removal.note,
    });
  }
}

console.log(`PLAN: remove ${toRemove.length} conflicting keyword(s)`);
for (const item of toRemove) console.log(`  - ${item.label}  (${item.note})`);
for (const reason of skipped) console.log(`  · skip ${reason}`);

const summary = {
  customerId: CUSTOMER,
  livePositiveKeywords: positives.length,
  planned: toRemove.map((item) => item.label),
  skipped,
};

if (!toRemove.length) {
  console.log(`\nNothing to do.\n${JSON.stringify({ ...summary, mode: "NO_OP" }, null, 2)}`);
  process.exit(0);
}
if (!execute) {
  console.log(`\nDRY RUN — pass --execute to apply.\n${JSON.stringify({ ...summary, mode: "DRY_RUN" }, null, 2)}`);
  process.exit(0);
}

const response = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/adGroupCriteria:mutate`, {
  method: "POST",
  headers,
  body: JSON.stringify({ operations: toRemove.map((item) => ({ remove: item.resourceName })), partialFailure: false }),
});
if (!response.ok) throw new Error(`mutate failed: HTTP ${response.status} ${(await response.text()).slice(0, 500)}`);
console.log(`\nremoved ${toRemove.length} keyword(s)`);

const after = await search(POSITIVE_QUERY, "positive keywords (readback)");
const stillPresent = after.filter((row) => REMOVALS.some(
  (removal) => String(row.adGroup?.id ?? "") === removal.adGroupId
    && row.adGroupCriterion.keyword.text === removal.text
    && removal.matchTypes.includes(row.adGroupCriterion.keyword.matchType),
));
console.log(JSON.stringify({
  ...summary,
  mode: "EXECUTED",
  removed: toRemove.length,
  positiveKeywordsAfter: after.length,
  readback: stillPresent.length ? "FAILED" : "CLEAN",
}, null, 2));
if (stillPresent.length) {
  console.error("readback FAILED — removed keywords are still live");
  process.exitCode = 1;
} else {
  console.log(`readback clean: ${after.length} positive keywords live (contract pin expects 190).`);
}
