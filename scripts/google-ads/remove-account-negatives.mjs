// Remove an account-wide NEGATIVE keyword (campaign-level negative criteria) from all three campaigns.
//
// WHY THIS EXISTS AND WHY IT IS NOT apply-sync.mjs
// -----------------------------------------------
// apply-sync.mjs is create-only by design: it adds what the contract declares and never deletes,
// because a diff-driven deleter would turn any config typo into live destruction. That leaves no
// path for the one case this file covers — a negative that was ADDED IN ERROR and is now suppressing
// real demand. Deleting it needs its own verb, its own allowlist, and its own refusal rules.
//
// On 2026-08-10 "who makes" was added as an account negative (EXACT + PHRASE, all three campaigns)
// under a "research / DIY intent" read. On 2026-08-16 the owner reversed that read: "who makes
// stickers" is a local buyer asking WHO to buy from, the same shop-seeking language as the kept
// "sticker makers" and "vinyl sticker maker" keywords. As a PHRASE negative it blocked that whole
// family. Earlier the same day remove-conflicting-keywords.mjs resolved the conflict from the other
// end by deleting the keyword; this file resolves it the way the owner actually wants it resolved.
//
// SAFETY RULE — THE CHECKER MUST AGREE FIRST
// ------------------------------------------
// The contract is edited BEFORE the account, never after. If docs/paid-search/campaign-config.mjs
// still lists the term in accountNegatives, this file REFUSES to run: removing it live would leave
// the account contradicting its own contract, and the next apply-sync.mjs would put it straight
// back. That is the inverse of remove-conflicting-keywords.mjs, which requires the blocking negative
// to be PRESENT — same principle both times: prove the removal is consistent before making it.
//
// Anything not on REMOVALS below is untouchable. This file's only verb is REMOVE a campaign-level
// negative keyword criterion — it cannot create, enable, pause, or edit anything, and it cannot
// touch a positive keyword or an ad-group negative.
//
// Run: railway run node scripts/google-ads/remove-account-negatives.mjs            (dry-run)
//      railway run node scripts/google-ads/remove-account-negatives.mjs --execute  (apply)

import { HARD_STOP_CAMPAIGNS, HARD_STOP_CUSTOMER_ID, HARD_STOP_LOGIN_CUSTOMER_ID } from "./hard-stop-contract.mjs";
import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const V = "v24";
const CUSTOMER = HARD_STOP_CUSTOMER_ID;

// Explicit, auditable, and intentionally NOT derived from a diff of contract-vs-live. Deriving
// "live but no longer in the config" would let any future config deletion silently strip live
// negatives — the exact failure mode apply-sync.mjs stays create-only to avoid.
const REMOVALS = [
  {
    text: "who makes",
    matchTypes: ["EXACT", "PHRASE"],
    campaigns: [
      { id: "24048123058", name: "GOOG_Search_TC_CoreProducts_2026" },
      { id: "24048123061", name: "GOOG_Search_TC_CompetitorConquest_2026" },
      { id: "24048123064", name: "GOOG_Search_TC_BrandDefense_2026" },
    ],
    note: "2026-08-16 owner reversal — 'who makes stickers' is local buyer intent, not research",
  },
];

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`Unknown argument: ${arg}`);
const execute = args.includes("--execute");

// Gate 1 — the contract must already agree. Checked before any network call so a forgotten
// contract edit costs a second, not a live mutation.
const contractNegatives = new Set(paidSearchConfig.accountNegatives.map((negative) => negative.text.toLowerCase()));
const stillContracted = REMOVALS.filter((removal) => contractNegatives.has(removal.text.toLowerCase()));
if (stillContracted.length) {
  throw new Error(
    `REFUSED — the contract still lists ${stillContracted.map((r) => `"${r.text}"`).join(", ")} in `
    + "accountNegatives. Remove it from docs/paid-search/campaign-config.mjs (and the "
    + "config-validator.mjs mirror) first; the checker moves before the account.",
  );
}

// Gate 2 — the allowlist may only name the three campaigns the hard-stop contract knows about.
const knownCampaigns = new Map(HARD_STOP_CAMPAIGNS.map((campaign) => [campaign.id, campaign.name]));
for (const removal of REMOVALS) {
  for (const campaign of removal.campaigns) {
    if (knownCampaigns.get(campaign.id) !== campaign.name) {
      throw new Error(`REFUSED — campaign ${campaign.id} "${campaign.name}" is not in HARD_STOP_CAMPAIGNS`);
    }
  }
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

const CAMPAIGN_NEGATIVE_QUERY =
  "SELECT campaign.id, campaign.name, campaign_criterion.resource_name, campaign_criterion.keyword.text, "
  + "campaign_criterion.keyword.match_type "
  + "FROM campaign_criterion WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'";

const before = await search(CAMPAIGN_NEGATIVE_QUERY, "campaign negatives");
const negativeIndex = new Map();
for (const row of before) {
  negativeIndex.set(
    `${String(row.campaign?.id ?? "")}||${row.campaignCriterion.keyword.text.toLowerCase()}||${row.campaignCriterion.keyword.matchType}`,
    { resourceName: row.campaignCriterion.resourceName, campaignName: row.campaign?.name },
  );
}
console.log(`live campaign negatives (pre): ${before.length}\n`);

const toRemove = [];
const skipped = [];
for (const removal of REMOVALS) {
  for (const campaign of removal.campaigns) {
    for (const matchType of removal.matchTypes) {
      const key = `${campaign.id}||${removal.text.toLowerCase()}||${matchType}`;
      const live = negativeIndex.get(key);
      if (!live) { skipped.push(`[${matchType}] "${removal.text}" — already absent from ${campaign.name}`); continue; }
      if (live.campaignName !== campaign.name) {
        skipped.push(`[${matchType}] "${removal.text}" — REFUSED, campaign ${campaign.id} is "${live.campaignName}", not "${campaign.name}"`);
        continue;
      }
      toRemove.push({
        resourceName: live.resourceName,
        label: `[${matchType}] "${removal.text}" from ${campaign.name}`,
        note: removal.note,
      });
    }
  }
}

console.log(`PLAN: remove ${toRemove.length} account-negative criteri${toRemove.length === 1 ? "on" : "a"}`);
for (const item of toRemove) console.log(`  - ${item.label}  (${item.note})`);
for (const reason of skipped) console.log(`  · skip ${reason}`);

const summary = {
  customerId: CUSTOMER,
  terms: REMOVALS.map((removal) => removal.text),
  campaignNegativesBefore: before.length,
  planned: toRemove.map((item) => item.label),
  skipped,
};

if (!toRemove.length) {
  console.log(`\nNothing to do.\n${JSON.stringify({ ...summary, mode: "NO_OP" }, null, 2)}`);
  process.exit(0);
}
if (!execute) {
  console.log(
    `\ncampaign negatives ${before.length} -> ${before.length - toRemove.length} once applied.`
    + `\nDRY RUN — pass --execute to apply.\n${JSON.stringify({ ...summary, mode: "DRY_RUN" }, null, 2)}`,
  );
  process.exit(0);
}

const response = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/campaignCriteria:mutate`, {
  method: "POST",
  headers,
  body: JSON.stringify({ operations: toRemove.map((item) => ({ remove: item.resourceName })), partialFailure: false }),
});
if (!response.ok) throw new Error(`mutate failed: HTTP ${response.status} ${(await response.text()).slice(0, 500)}`);
console.log(`\nremoved ${toRemove.length} campaign negative(s)`);

const after = await search(CAMPAIGN_NEGATIVE_QUERY, "campaign negatives (readback)");
const stillPresent = after.filter((row) => REMOVALS.some(
  (removal) => removal.campaigns.some((campaign) => campaign.id === String(row.campaign?.id ?? ""))
    && row.campaignCriterion.keyword.text.toLowerCase() === removal.text.toLowerCase()
    && removal.matchTypes.includes(row.campaignCriterion.keyword.matchType),
));
console.log(JSON.stringify({
  ...summary,
  mode: "EXECUTED",
  removed: toRemove.length,
  campaignNegativesAfter: after.length,
  readback: stillPresent.length ? "FAILED" : "CLEAN",
}, null, 2));
if (stillPresent.length) {
  console.error("readback FAILED — removed negatives are still live");
  process.exitCode = 1;
} else {
  console.log(`readback clean: ${after.length} campaign negatives live (expected 332 after this pass).`);
}
