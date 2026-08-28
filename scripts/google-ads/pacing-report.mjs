// READ-ONLY pacing projection against the CA$600 promotional qualifying target.
//
// WHY THIS EXISTS
// ---------------
// The promo needs CA$600 of qualifying spend by 2026-09-16. Day-1 delivery was CA$6.89, which
// projects to roughly CA$282 — less than half. Without a number on screen, "are we going to hit
// CA$600?" stays a feeling, and pacing anxiety is exactly what makes people pull the wrong
// lever. This prints the gap AND the lost-impression-share split that says which lever is even
// legitimate.
//
// THE DISCIPLINE THIS ENFORCES
//   lost IS (rank) high    -> auctions exist, losing on price      -> raising the CPC ceiling is justified
//   lost IS (budget) > 0   -> budget-limited                       -> raising daily budget is justified
//   both ~0 and spend low  -> thin market                          -> NO bid change fixes this
//
// That last row is the one that matters. If the market is thin, more budget and higher bids buy
// nothing, and the only remaining levers (unpause Brand, Search Partners, broader match) each
// require a deliberate contract change — see .claude/rules/google-ads-copy.md.
//
// Run: railway run node scripts/google-ads/pacing-report.mjs

import { createReader, microsToCad } from "./gaql-read.mjs";
import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const PROMO_DEADLINE = "2026-09-16"; // promotion fulfillment expiry (UTC), per PROMOTION_ELIGIBILITY gate
const TARGET_CAD = paidSearchConfig.targetQualifyingSpendCad ?? 600;
const PROTECTIVE_PAUSE_CAD = paidSearchConfig.spendControls?.protectivePauseCad ?? 600;
const HARD_CAP_CAD = paidSearchConfig.spendControls?.absoluteCapCad ?? 600;
const PILOT_START = paidSearchConfig.pilot?.startDate ?? "2026-08-03";

const today = new Date().toISOString().slice(0, 10);
const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const cad = (value) => `CA$${value.toFixed(2)}`;

const { search, account } = await createReader();
console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
console.log(`window:  ${PILOT_START} -> ${today}   promo deadline ${PROMO_DEADLINE}\n`);

// ── spend to date ────────────────────────────────────────────────────────────
const campaignRows = await search(
  `SELECT campaign.name, campaign.status, campaign_budget.amount_micros,
          metrics.cost_micros, metrics.clicks, metrics.impressions,
          metrics.search_rank_lost_impression_share, metrics.search_budget_lost_impression_share
   FROM campaign
   WHERE segments.date BETWEEN '${PILOT_START}' AND '${today}'`,
  "campaign metrics",
);

let totalSpend = 0;
let totalClicks = 0;
let totalImpressions = 0;
console.log("CAMPAIGN                                   STATUS    SPEND     CLICKS  IMPR   lostIS(rank)  lostIS(budget)");
for (const row of campaignRows) {
  const spend = microsToCad(row.metrics?.costMicros);
  const clicks = Number(row.metrics?.clicks ?? 0);
  const impressions = Number(row.metrics?.impressions ?? 0);
  totalSpend += spend;
  totalClicks += clicks;
  totalImpressions += impressions;
  const rankLost = Number(row.metrics?.searchRankLostImpressionShare ?? 0);
  const budgetLost = Number(row.metrics?.searchBudgetLostImpressionShare ?? 0);
  console.log(
    `${row.campaign.name.padEnd(42)} ${String(row.campaign.status).padEnd(9)} ${cad(spend).padStart(9)} ${String(clicks).padStart(7)} ${String(impressions).padStart(6)}   ${(rankLost * 100).toFixed(1).padStart(10)}%  ${(budgetLost * 100).toFixed(1).padStart(12)}%`,
  );
}

// ── projection ───────────────────────────────────────────────────────────────
// Burn must be measured over days that actually DELIVERED, not days since the pilot start
// date. Campaigns were enabled 2026-08-05, two days after PILOT_START, so dividing by elapsed
// days halved the apparent burn rate and made the projection look far worse than reality.
const dailyRows = await search(
  `SELECT segments.date, metrics.cost_micros FROM campaign
   WHERE segments.date BETWEEN '${PILOT_START}' AND '${today}'`,
  "daily spend",
);
const spendByDate = new Map();
for (const row of dailyRows) {
  const date = row.segments?.date;
  if (!date) continue;
  spendByDate.set(date, (spendByDate.get(date) ?? 0) + microsToCad(row.metrics?.costMicros));
}
const deliveringDays = [...spendByDate.values()].filter((amount) => amount > 0).length;
const elapsedDays = Math.max(1, deliveringDays || daysBetween(PILOT_START, today) + 1);
const daysLeft = daysBetween(today, PROMO_DEADLINE);
const burnPerDay = totalSpend / elapsedDays;
const projected = totalSpend + burnPerDay * Math.max(0, daysLeft);
const gap = TARGET_CAD - projected;
const requiredPerDay = daysLeft > 0 ? (TARGET_CAD - totalSpend) / daysLeft : Infinity;
const enabledDailyBudget = (paidSearchConfig.campaigns ?? [])
  .filter((campaign) => campaign.status === "ENABLED")
  .reduce((sum, campaign) => sum + (campaign.dailyBudgetCad ?? 0), 0);

console.log(`\n── PACING vs ${cad(TARGET_CAD)} qualifying spend ──`);
console.log(`spend to date        ${cad(totalSpend)}   over ${elapsedDays} delivering day(s)`);
if (deliveringDays) {
  const dates = [...spendByDate.entries()].filter(([, amount]) => amount > 0).sort();
  console.log(`daily                ${dates.map(([date, amount]) => `${date.slice(5)} ${cad(amount)}`).join("  ")}`);
}
console.log(`current burn         ${cad(burnPerDay)}/day   (${totalClicks} clicks, ${totalImpressions} impressions)`);
console.log(`days to deadline     ${daysLeft}`);
console.log(`projected at ${PROMO_DEADLINE}  ${cad(projected)}`);
console.log(`required burn        ${Number.isFinite(requiredPerDay) ? `${cad(requiredPerDay)}/day` : "n/a — deadline passed"}`);
console.log(`enabled budget       ${cad(enabledDailyBudget)}/day of capacity`);

if (gap <= 0) {
  console.log(`\nON TRACK — projected to clear ${cad(TARGET_CAD)} with ${cad(-gap)} to spare.`);
} else {
  console.log(`\nSHORT BY ${cad(gap)} — needs ${(requiredPerDay / (burnPerDay || 1)).toFixed(1)}x the current burn rate.`);
  if (requiredPerDay > enabledDailyBudget) {
    console.log(`  Required burn EXCEEDS enabled daily budget (${cad(enabledDailyBudget)}/day). Budget is now a binding constraint too.`);
  } else {
    console.log(`  Budget capacity is sufficient (${cad(enabledDailyBudget)}/day). DELIVERY is the constraint, not budget.`);
  }
}

// ── which lever, if any, is legitimate ───────────────────────────────────────
const worstRankLost = Math.max(0, ...campaignRows.map((row) => Number(row.metrics?.searchRankLostImpressionShare ?? 0)));
const worstBudgetLost = Math.max(0, ...campaignRows.map((row) => Number(row.metrics?.searchBudgetLostImpressionShare ?? 0)));

console.log("\n── DIAGNOSIS (do not pull a lever this does not justify) ──");
if (worstBudgetLost > 0.05) {
  console.log(`lost IS (budget) is ${(worstBudgetLost * 100).toFixed(1)}% -> BUDGET-LIMITED. Raising daily budget is justified.`);
  console.log("   Note: LAUNCHABLE_DAILY_BUDGET_CAD in config-validator.mjs asserts the total exactly — update it in the same pass.");
} else if (worstRankLost > 0.30) {
  console.log(`lost IS (rank) is ${(worstRankLost * 100).toFixed(1)}% -> LOSING ON PRICE. Raising the CPC ceiling is justified.`);
} else {
  console.log(`lost IS rank ${(worstRankLost * 100).toFixed(1)}% / budget ${(worstBudgetLost * 100).toFixed(1)}% -> THIN MARKET.`);
  console.log("   No bid or budget change fixes this. The auctions are not there to win.");
  console.log("   Remaining levers, cheapest first, each needing a deliberate decision:");
  console.log("     1. more keywords from mined search terms + GSC evidence (free, likely insufficient alone)");
  console.log("     2. unpause Brand      — cheapest qualifying spend; distorts the non-brand baseline");
  console.log("     3. Search Partners on — approved contract change; keeps exact/phrase and geo intact");
  console.log("     4. broad match / wider radius — highest waste risk; blocked by noBroadeningToManufactureVolume");
  console.log("     5. accept missing the promo — legitimate. CA$600 of credit is not worth CA$600 of bad clicks.");
}

console.log(`\nReminder: the qualifying target is ${cad(TARGET_CAD)} and the protective pause starts at ${cad(PROTECTIVE_PAUSE_CAD)}.`);
console.log(`The owner-approved qualification buffer is ${cad(HARD_CAP_CAD - TARGET_CAD)}. The monitor cannot distinguish`);
console.log(`cash cost from promotional-credit cost; ${cad(HARD_CAP_CAD)} is authorization headroom, not a spend target.`);
