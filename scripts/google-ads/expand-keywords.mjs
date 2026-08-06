// Prints the EXACT edits required to add keywords or negatives. Changes nothing itself.
//
// WHY THIS EXISTS
// ---------------
// Adding one keyword requires synchronized edits in four places, each an exact-equality
// assertion:
//   1. docs/paid-search/campaign-config.mjs        the keyword itself
//   2. scripts/google-ads/config-validator.mjs     CORE_TERMS (exact set match)
//   3. scripts/google-ads/config-validator.mjs     REQUIRED_ACCOUNT_NEGATIVES (exact set match)
//   4. scripts/google-ads/live-verification-contract.mjs   hardcoded positive/negative counts
//
// Miss one and either local validation fails, or — far worse — the LIVE verifier reports drift
// that is actually your own edit, and you learn to ignore a verifier. Ignoring a verifier is
// precisely how this project's config-drift incident happened.
//
// The duplication between contract and checker is DELIBERATE and is not collapsed here. A
// checker that imports its expectations from the thing it checks is not a checker. This script
// removes the error-prone manual hunt while leaving the human to apply and confirm each edit.
//
// Run:
//   node scripts/google-ads/expand-keywords.mjs --group coroplast --terms "yard signs,lawn signs"
//   node scripts/google-ads/expand-keywords.mjs --negatives "screen print,embroidery"

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const args = process.argv.slice(2);
const KNOWN_FLAGS = ["--group", "--terms", "--negatives"];
for (const arg of args) {
  if (arg.startsWith("--") && !KNOWN_FLAGS.includes(arg)) throw new Error(`unknown argument: ${arg}`);
}
const flag = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] ?? null;
};
const list = (value) => (value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);

const groupKey = flag("--group");
const terms = list(flag("--terms"));
const negatives = list(flag("--negatives"));

if (!terms.length && !negatives.length) {
  console.error("Nothing to do. Pass --terms and/or --negatives.\n");
  console.error("  --group <key> --terms \"a,b\"   add positive keywords to a Core ad group");
  console.error("  --negatives \"a,b\"             add account-wide negatives\n");
  console.error(`Core ad group keys: ${(paidSearchConfig.campaigns.find((c) => c.kind === "CORE")?.adGroups ?? []).map((g) => g.key).join(", ")}`);
  process.exit(1);
}

const core = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
const group = groupKey ? (core?.adGroups ?? []).find((item) => item.key === groupKey) : null;
if (terms.length && !group) {
  console.error(`--terms needs a valid --group. Known Core keys: ${(core?.adGroups ?? []).map((item) => item.key).join(", ")}`);
  process.exit(1);
}

// ── current counts, computed from the contract ───────────────────────────────
const countPositives = () => paidSearchConfig.campaigns
  .flatMap((campaign) => campaign.adGroups ?? [])
  .reduce((sum, item) => sum + (item.keywords?.length ?? 0), 0);
// Live negative criteria = account negatives applied per campaign + ad-group cross-negatives.
const countNegatives = () => {
  const perCampaign = (paidSearchConfig.accountNegatives?.length ?? 0) * paidSearchConfig.campaigns.length;
  const crossNegatives = paidSearchConfig.campaigns
    .flatMap((campaign) => campaign.adGroups ?? [])
    .reduce((sum, item) => sum + (item.crossNegatives?.length ?? 0), 0);
  const campaignNegatives = paidSearchConfig.campaigns
    .reduce((sum, campaign) => sum + (campaign.campaignNegatives?.length ?? 0), 0);
  return { perCampaign, crossNegatives, campaignNegatives };
};

const positivesNow = countPositives();
const negativeParts = countNegatives();
// Each new term becomes an EXACT + PHRASE pair; each new account negative applies to all campaigns.
const positivesAfter = positivesNow + terms.length * 2;
const accountNegativePairsAdded = negatives.length * 2 * paidSearchConfig.campaigns.length;

const existingTerms = new Set((group?.keywords ?? []).map((keyword) => keyword.text.toLowerCase()));
const duplicateTerms = terms.filter((term) => existingTerms.has(term));
const existingNegatives = new Set((paidSearchConfig.accountNegatives ?? []).map((negative) => negative.text.toLowerCase()));
const duplicateNegatives = negatives.filter((term) => existingNegatives.has(term));

const rule = (title) => console.log(`\n${"─".repeat(78)}\n${title}\n${"─".repeat(78)}`);

console.log("EXPANSION PLAN — apply these edits by hand, then run the verification block at the end.");
if (duplicateTerms.length) console.log(`\nWARN: already present in ${groupKey}, skip these: ${duplicateTerms.join(", ")}`);
if (duplicateNegatives.length) console.log(`\nWARN: already negated, skip these: ${duplicateNegatives.join(", ")}`);

const newTerms = terms.filter((term) => !existingTerms.has(term));
const newNegatives = negatives.filter((term) => !existingNegatives.has(term));

if (newTerms.length) {
  rule(`FILE 1/4  docs/paid-search/campaign-config.mjs — coreGroup({ key: "${groupKey}" }) terms:`);
  console.log("Add to the `terms:` array:");
  for (const term of newTerms) console.log(`            "${term}",`);

  rule(`FILE 2/4  scripts/google-ads/config-validator.mjs — CORE_TERMS["${groupKey}"]`);
  console.log("Add the SAME terms (this set is exact-matched against the contract):");
  for (const term of newTerms) console.log(`    "${term}",`);
}

if (newNegatives.length) {
  rule("FILE 1/4  docs/paid-search/campaign-config.mjs — accountNegatives");
  for (const term of newNegatives) console.log(`    "${term}",`);

  rule("FILE 3/4  scripts/google-ads/config-validator.mjs — REQUIRED_ACCOUNT_NEGATIVES");
  console.log("Add the SAME negatives (exact-matched):");
  for (const term of newNegatives) console.log(`  "${term}",`);
  console.log("\nCHECK FIRST: PROTECTED_ACCOUNT_NEGATIVES forbids negating \"near me\", \"online\", \"cheap\",");
  console.log("and any competitor term. Those are demand, not waste.");
}

rule("FILE 4/4  scripts/google-ads/live-verification-contract.mjs — hardcoded counts");
console.log("Find:  if (live.positiveKeywords !== N || live.negativeCriteria !== M)");
console.log(`\n  positiveKeywords:  ${positivesNow}  ->  ${positivesAfter}`);
if (newNegatives.length) {
  console.log(`  negativeCriteria:  add ${accountNegativePairsAdded} (${newNegatives.length} negative(s) x EXACT+PHRASE x ${paidSearchConfig.campaigns.length} campaigns)`);
} else {
  console.log("  negativeCriteria:  unchanged");
}
console.log(`\n  (current contract composition: ${negativeParts.perCampaign} account-negative criteria +`);
console.log(`   ${negativeParts.crossNegatives} ad-group cross-negatives + ${negativeParts.campaignNegatives} campaign negatives)`);
console.log("\n  Update the comment above that line with today's date and what changed. The next person");
console.log("  needs to know whether reported drift is an intended import signal or a real fault.");

rule("IF THIS ADDS A NEW AD GROUP");
console.log("A new ad group MUST also get an `rsaVariantB` that passes the relevance floor:");
console.log("  - at least one headline carrying a sourced price from docs/paid-search/approved-claims.mjs");
console.log("  - at most 5 headlines shared with any other ad group");
console.log("An ad group without copy serves nothing. See .claude/rules/google-ads-copy.md.");

rule("VERIFY (all four must pass before apply)");
console.log("  node scripts/google-ads/config-validator.mjs          # expect VALIDATED");
console.log("  npm run test:google-ads                              # expect all pass");
console.log("  npm run verify:google-ads-destinations               # expect all 200");
console.log("  railway run node scripts/google-ads/sync-plan.mjs     # review, then apply-sync --execute");
console.log("\nThen append what you added and why to docs/paid-search/COPY-LEARNING-LOG.md.");
