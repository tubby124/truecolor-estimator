// Every ad destination must actually exist. Fails on any non-200.
//
// WHY: on 2026-08-06 the owner saw URLs in the Google Ads "Landing pages" report that looked
// broken. They were not — that column renders the UNEXPANDED tracking template, so
// ".../printing-prices-saskatoon{ignore}?utm_term={keyword}" 404s while the expanded URL the
// customer actually receives returns 200. Diagnosing that took a manual pass over 11 URLs.
// This script makes it a one-command check, and more importantly turns "did we retire a page
// an ad still points at?" from a thing someone has to remember into a gate.
//
// No credentials needed — it only talks to the public site.
// Run: npm run verify:google-ads-destinations

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";

const TIMEOUT_MS = 20_000;

const targets = new Map();
const add = (url, label) => {
  const existing = targets.get(url);
  if (existing) existing.add(label);
  else targets.set(url, new Set([label]));
};

for (const campaign of paidSearchConfig.campaigns) {
  for (const group of campaign.adGroups ?? []) {
    add(group.finalUrl, `${campaign.name} / ${group.name}`);
  }
}
for (const sitelink of paidSearchConfig.adAssets?.sitelinks ?? []) {
  add(sitelink.finalUrl, `sitelink "${sitelink.text}"`);
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // GET, not HEAD: Next.js route handlers and middleware can answer HEAD differently, and we
    // care about what a real click gets.
    const response = await fetch(url, { redirect: "follow", signal: controller.signal });
    return { status: response.status, finalUrl: response.url };
  } catch (error) {
    return { status: 0, error: error.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : error.message };
  } finally {
    clearTimeout(timer);
  }
}

console.log(`Checking ${targets.size} ad destinations...\n`);

const failures = [];
const redirects = [];
for (const [url, labels] of targets) {
  const { status, finalUrl, error } = await probe(url);
  const ok = status === 200;
  if (!ok) failures.push({ url, status, error, labels: [...labels] });
  // A redirect still serves the customer, but paid traffic landing on a redirect chain wastes
  // the click's first paint and usually means the contract is pointing at a stale slug.
  else if (finalUrl && finalUrl.split("?")[0] !== url.split("?")[0]) redirects.push({ url, finalUrl });
  console.log(`${ok ? "200 " : String(status || "ERR").padEnd(4)} ${url}${error ? `  (${error})` : ""}`);
}

if (redirects.length) {
  console.log(`\nWARN — ${redirects.length} destination(s) redirect before landing:`);
  for (const item of redirects) console.log(`  ${item.url}\n    -> ${item.finalUrl}`);
}

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} ad destination(s) are not returning 200:`);
  for (const item of failures) {
    console.error(`  [${item.status || "ERR"}] ${item.url}${item.error ? ` (${item.error})` : ""}`);
    for (const label of item.labels) console.error(`      used by ${label}`);
  }
  console.error("\nDo NOT apply ad changes until every destination resolves. A live ad pointing at a dead page burns spend and trust.");
  process.exit(1);
}

console.log(`\nOK — all ${targets.size} ad destinations return 200.`);
