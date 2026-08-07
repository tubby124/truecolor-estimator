// Remove positive keywords left behind in a SOURCE ad group after the same term was
// migrated to a DESTINATION ad group.
//
// WHY THIS EXISTS AS ITS OWN FILE
// -------------------------------
// Mutation authority in this repo is deliberately split, one power per named file
// (see gaql-read.mjs): ENABLE -> enable-stage-one.mjs, PAUSE -> hard-stop-monitor.mjs,
// CREATE -> apply-sync.mjs. apply-sync is create-only "by construction" and must stay that
// way, so it cannot finish a MOVE: it adds the term to the new group and leaves the old copy
// serving. On 2026-08-06 that left "custom boat decals" and "boat decals near me" live in
// BOTH Decals and Boat Registration Decals, pointing at two different landing pages.
//
// This file is the fourth authority and its power is exactly one verb: REMOVE a positive
// ad-group keyword. It cannot create, enable, pause, or edit anything.
//
// THE SAFETY RULE
// ---------------
// A keyword is only removed when the SAME text and match type is confirmed LIVE in the
// destination group first. That makes the operation a completed move rather than a deletion —
// coverage can never drop, because the replacement is verified before the original goes.
// Anything not on the MIGRATIONS list below is untouchable.
//
// Run: railway run node scripts/google-ads/remove-migrated-keywords.mjs            (dry-run)
//      railway run node scripts/google-ads/remove-migrated-keywords.mjs --execute  (apply)
import { HARD_STOP_CUSTOMER_ID, HARD_STOP_LOGIN_CUSTOMER_ID } from "./hard-stop-contract.mjs";

const V = "v24";
const CUSTOMER = HARD_STOP_CUSTOMER_ID;

// Explicit, auditable, and intentionally NOT derived from the contract. Deriving "what is live
// but no longer in the contract" would let any future config typo silently delete live
// keywords. Every removal is written here by hand, once, for a known migration.
const MIGRATIONS = [
  { from: "Decals", to: "Boat Registration Decals", text: "custom boat decals", note: "2026-08-06 boat split" },
  { from: "Decals", to: "Boat Registration Decals", text: "boat decals near me", note: "2026-08-06 boat split" },
];
const MATCH_TYPES = ["EXACT", "PHRASE"];

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
  if (!r.ok) throw new Error(`token refresh failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
})();

const headers = {
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": HARD_STOP_LOGIN_CUSTOMER_ID,
  "content-type": "application/json",
};

const search = async (query) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`search failed: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).results ?? [];
};

const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1"))[0]?.customer ?? {};
if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
  throw new Error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
}
console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}\n`);

const live = await search(
  "SELECT ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status "
  + "FROM ad_group_criterion WHERE ad_group_criterion.negative = false AND ad_group_criterion.type = 'KEYWORD'",
);
const index = new Map();
for (const row of live) {
  index.set(
    `${row.adGroup.name}||${row.adGroupCriterion.keyword.text}||${row.adGroupCriterion.keyword.matchType}`,
    row.adGroupCriterion.resourceName,
  );
}
console.log(`live positive keywords: ${live.length}`);

const toRemove = [];
const skipped = [];
for (const migration of MIGRATIONS) {
  for (const matchType of MATCH_TYPES) {
    const sourceKey = `${migration.from}||${migration.text}||${matchType}`;
    const destKey = `${migration.to}||${migration.text}||${matchType}`;
    const sourceResource = index.get(sourceKey);
    if (!sourceResource) { skipped.push(`${sourceKey} — already absent from ${migration.from}`); continue; }
    // The safety rule: never remove until the replacement is confirmed live.
    if (!index.has(destKey)) { skipped.push(`${sourceKey} — REFUSED, not yet live in ${migration.to}`); continue; }
    toRemove.push({ resourceName: sourceResource, label: `[${matchType}] "${migration.text}" from ${migration.from}`, note: migration.note });
  }
}

console.log(`\nPLAN: remove ${toRemove.length} migrated keyword(s)`);
for (const item of toRemove) console.log(`  - ${item.label}  (${item.note})`);
for (const reason of skipped) console.log(`  · skip ${reason}`);

if (!toRemove.length) { console.log("\nNothing to do."); process.exit(0); }
if (!execute) { console.log("\nDRY RUN — pass --execute to apply."); process.exit(0); }

const response = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/adGroupCriteria:mutate`, {
  method: "POST",
  headers,
  body: JSON.stringify({ operations: toRemove.map((item) => ({ remove: item.resourceName })), partialFailure: false }),
});
if (!response.ok) throw new Error(`mutate failed: HTTP ${response.status} ${(await response.text()).slice(0, 500)}`);
console.log(`\nremoved ${toRemove.length} keyword(s)`);

const after = await search(
  "SELECT ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group_criterion.negative = false AND ad_group_criterion.type = 'KEYWORD'",
);
console.log(`readback: ${after.length} positive keywords live`);
