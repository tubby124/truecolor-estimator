// READ-ONLY search-term mining -> paste-ready negative keyword candidates.
//
// WHY THIS EXISTS
// ---------------
// The T+7d search-term review is the condition the whole generic-keyword bet rests on, and it
// had no tooling — it was a manual, undefined pass. That matters more now that keywords get
// added every few days to chase the CA$600 target: every keyword added widens the waste
// surface, and nothing was harvesting negatives back. Expansion without pruning is how a
// fixed CA$600 gets spent on garbage instead of on qualifying traffic.
//
// This NEVER mutates. It prints candidates; a human reads them and decides. Google's own
// suggestions are not trusted here — waste is a judgement call about what True Color sells.
//
// Run: railway run node scripts/google-ads/mine-search-terms.mjs [--days 7] [--min-cost 0]

import { createReader, microsToCad } from "./gaql-read.mjs";
import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(args[index + 1]);
  if (!Number.isFinite(value)) throw new Error(`${name} needs a number`);
  return value;
};
for (const arg of args) {
  if (arg.startsWith("--") && !["--days", "--min-cost"].includes(arg)) throw new Error(`unknown argument: ${arg}`);
}

const days = argValue("--days", 7);
const minCost = argValue("--min-cost", 0);
const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

// Terms already negated anywhere in the contract — never re-suggest them.
const existingNegatives = new Set(
  (paidSearchConfig.accountNegatives ?? []).map((negative) => negative.text.toLowerCase()),
);
for (const campaign of paidSearchConfig.campaigns ?? []) {
  for (const term of campaign.campaignNegatives ?? []) existingNegatives.add(String(term).toLowerCase());
  for (const group of campaign.adGroups ?? []) {
    for (const term of group.crossNegatives ?? []) existingNegatives.add(String(term).toLowerCase());
  }
}
const positiveTerms = new Set(
  (paidSearchConfig.campaigns ?? []).flatMap((campaign) => (campaign.adGroups ?? [])
    .flatMap((group) => (group.keywords ?? []).map((keyword) => keyword.text.toLowerCase()))),
);

const { search, account } = await createReader();
console.log(`account: ${account.id} ${account.currencyCode}`);
console.log(`window:  ${since} -> ${today} (${days} days)\n`);

const rows = await search(
  `SELECT search_term_view.search_term, segments.keyword.info.text, campaign.name, ad_group.name,
          metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions
   FROM search_term_view
   WHERE segments.date BETWEEN '${since}' AND '${today}'`,
  "search terms",
);

if (rows.length === 0) {
  console.log("No search-term rows in this window.");
  console.log("At low delivery this is expected — search_term_view only reports terms that actually served.");
  console.log("It is NOT proof that targeting is clean. Re-run after more delivery accumulates.");
  process.exit(0);
}

const byTerm = new Map();
for (const row of rows) {
  const term = row.searchTermView?.searchTerm ?? "";
  if (!term) continue;
  const entry = byTerm.get(term) ?? { term, cost: 0, clicks: 0, impressions: 0, conversions: 0, groups: new Set() };
  entry.cost += microsToCad(row.metrics?.costMicros);
  entry.clicks += Number(row.metrics?.clicks ?? 0);
  entry.impressions += Number(row.metrics?.impressions ?? 0);
  entry.conversions += Number(row.metrics?.conversions ?? 0);
  entry.groups.add(row.adGroup?.name ?? "?");
  byTerm.set(term, entry);
}

const all = [...byTerm.values()].sort((a, b) => b.cost - a.cost || b.clicks - a.clicks);
const spent = all.reduce((sum, entry) => sum + entry.cost, 0);

console.log(`${all.length} distinct search terms, ${`CA$${spent.toFixed(2)}`} total spend\n`);
console.log("ALL TERMS (highest spend first)");
console.log("COST      CLK  IMP  CONV  TERM");
for (const entry of all) {
  console.log(`${`CA$${entry.cost.toFixed(2)}`.padStart(9)} ${String(entry.clicks).padStart(4)} ${String(entry.impressions).padStart(4)} ${String(entry.conversions).padStart(5)}  ${entry.term}`);
}

// Waste candidate = cost, no conversions, not already negated, not one of our own keywords.
const candidates = all.filter((entry) => entry.cost > minCost
  && entry.conversions === 0
  && !positiveTerms.has(entry.term.toLowerCase())
  && ![...existingNegatives].some((negative) => entry.term.toLowerCase().includes(negative)));

console.log(`\n── NEGATIVE CANDIDATES (${candidates.length}) — spend, zero conversions, not already negated ──`);
if (candidates.length === 0) {
  console.log("(none)");
} else {
  console.log("REVIEW EVERY LINE. A term with no conversions is not automatically waste — at this");
  console.log("delivery volume, zero conversions is the expected result for almost everything, and");
  console.log("conversion upload is still unproven. Negate what True Color genuinely does not sell.\n");
  for (const entry of candidates) {
    console.log(`  CA$${entry.cost.toFixed(2).padStart(6)}  ${entry.clicks} clk  "${entry.term}"  [${[...entry.groups].join(", ")}]`);
  }
  console.log("\nPaste-ready for accountNegatives in docs/paid-search/campaign-config.mjs:");
  console.log("  (add the words you actually want to block, not whole search phrases)");
  console.log(`\n${candidates.map((entry) => `    "${entry.term}",`).join("\n")}`);
  console.log("\nThen run: node scripts/google-ads/expand-keywords.mjs --negatives \"term one,term two\"");
  console.log("It prints every file that must change, including the hardcoded counts in the live verifier.");
}
