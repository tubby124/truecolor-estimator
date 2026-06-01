#!/usr/bin/env node
/**
 * SEO opportunity analyzer — reads seo_gsc_snapshots from Supabase and
 * categorizes each (query, page) pair into one of:
 *
 *   - PAGE2_OPPORTUNITY     pos 11-20, push to page 1 with content + FAQ
 *   - TITLE_REWRITE         pos 1-10 with CTR << expected curve
 *   - NEW_PAGE_CANDIDATE    high-imp query with no matching site page
 *   - DECAY_ALERT           recent 14d position dropped vs prior 14d
 *
 * Cross-references seo-protected-pages.md to flag FROZEN pages
 * (those should never get title/meta touched).
 *
 * Output: JSON object to stdout. Skill /tc-seo-opportunities reads + formats it.
 *
 * Usage:
 *   source ~/.secrets && node scripts/seo-opportunities.mjs [--days=28] [--json|--text]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.join(__dirname, "..");

const args = process.argv.slice(2);
const DAYS = parseInt(args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "28", 10);
const FORMAT = args.includes("--text") ? "text" : "json";

const SUPABASE_PROJECT_REF = "dczbgraekmzirxknjvwe";
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN not set. Run: source ~/.secrets && node scripts/seo-opportunities.mjs");
  process.exit(1);
}

async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!res.ok) throw new Error(`Supabase SQL failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// === Load existing pages (so we know what to PAA vs create new) ===
function loadExistingPageSlugs() {
  const sitemapPath = path.join(REPO_ROOT, "src/app/sitemap.ts");
  const src = fs.readFileSync(sitemapPath, "utf8");
  const slugs = new Set();
  // Matches both bare quoted paths ('/foo') and template-literal paths
  // (`${BASE_URL}/foo`) — captures the slug segment after the first slash.
  const re = /\/([a-z][a-z0-9-]+)(?=[`'"\/])/gi;
  let m;
  while ((m = re.exec(src))) slugs.add(m[1]);
  // Always include the homepage marker.
  slugs.add("/");
  return slugs;
}

// === Load FROZEN page list (do NOT recommend title rewrites here) ===
function loadFrozenSlugs() {
  const protectedPath = path.join(REPO_ROOT, ".claude/rules/seo-protected-pages.md");
  if (!fs.existsSync(protectedPath)) return new Set();
  const src = fs.readFileSync(protectedPath, "utf8");
  const frozen = new Set();
  // Lock-level cells often include markdown emphasis and qualifiers, e.g.
  // "**DEFEND (PROMOTED)**". Parse table cells instead of relying on a
  // brittle whole-line regex so protected pages are not routed to title edits.
  for (const line of src.split("\n")) {
    if (!line.startsWith("|") || /^\|\s*-+/.test(line)) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    const slug = cells[1];
    if (!slug || !/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(slug)) continue;

    const normalizedCells = cells.map((cell) =>
      cell
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim()
        .toLowerCase(),
    );
    const isLocked = normalizedCells.some(
      (cell) =>
        cell.includes("defend") ||
        cell.includes("meta desc only") ||
        cell.includes("faq price fix only") ||
        cell.includes("frozen"),
    );
    if (isLocked) frozen.add(slug);
  }
  return frozen;
}

const existingSlugs = loadExistingPageSlugs();
const frozenSlugs = loadFrozenSlugs();

// === Pull aggregated data from Supabase ===
const recentWindow = `CURRENT_DATE - INTERVAL '${DAYS} days'`;

const aggregated = await runSql(`
  SELECT
    query,
    page,
    SUM(impressions)::int AS impressions,
    SUM(clicks)::int AS clicks,
    ROUND((SUM(position * impressions) / NULLIF(SUM(impressions), 0))::numeric, 2)::float AS position,
    ROUND((SUM(clicks)::numeric / NULLIF(SUM(impressions), 0))::numeric, 4)::float AS ctr
  FROM seo_gsc_snapshots
  WHERE snapshot_date >= ${recentWindow}
  GROUP BY query, page
  HAVING SUM(impressions) >= 10
`);

// === Pull recent vs prior split for decay detection ===
const splitDays = Math.floor(DAYS / 2);
const decay = await runSql(`
  WITH recent AS (
    SELECT query, page,
           SUM(impressions)::int AS imp_recent,
           SUM(clicks)::int AS clk_recent,
           (SUM(position * impressions) / NULLIF(SUM(impressions), 0))::float AS pos_recent
    FROM seo_gsc_snapshots
    WHERE snapshot_date >= CURRENT_DATE - INTERVAL '${splitDays} days'
    GROUP BY query, page
  ),
  prior AS (
    SELECT query, page,
           SUM(impressions)::int AS imp_prior,
           SUM(clicks)::int AS clk_prior,
           (SUM(position * impressions) / NULLIF(SUM(impressions), 0))::float AS pos_prior
    FROM seo_gsc_snapshots
    WHERE snapshot_date >= CURRENT_DATE - INTERVAL '${DAYS} days'
      AND snapshot_date < CURRENT_DATE - INTERVAL '${splitDays} days'
    GROUP BY query, page
  )
  SELECT
    r.query,
    r.page,
    ROUND(p.pos_prior::numeric, 1)::float AS pos_prior,
    ROUND(r.pos_recent::numeric, 1)::float AS pos_recent,
    r.imp_recent,
    r.clk_recent
  FROM recent r
  JOIN prior p ON r.query = p.query AND r.page = p.page
  WHERE r.imp_recent >= 20
    AND p.imp_prior >= 20
    AND r.pos_recent - p.pos_prior >= 2
    AND r.clk_recent <= p.clk_prior * 0.8
  ORDER BY (r.pos_recent - p.pos_prior) DESC
  LIMIT 15
`);

// === Helpers ===
function slugFromUrl(url) {
  const u = url.replace(/^https?:\/\/[^/]+/, "");
  return u.replace(/^\//, "").split("/")[0] || "/";
}
function isExistingPage(url) {
  return existingSlugs.has(slugFromUrl(url));
}
function isFrozen(url) {
  return frozenSlugs.has(slugFromUrl(url));
}
// Industry-average CTR curve by position
function expectedCtr(pos) {
  if (pos <= 1) return 0.28;
  if (pos <= 2) return 0.15;
  if (pos <= 3) return 0.11;
  if (pos <= 4) return 0.08;
  if (pos <= 5) return 0.07;
  if (pos <= 6) return 0.05;
  if (pos <= 7) return 0.04;
  if (pos <= 8) return 0.03;
  if (pos <= 9) return 0.025;
  return 0.02;
}

// === Categorize ===
const page2 = [];
const titleRewrite = [];
const newPageCandidates = [];

for (const r of aggregated) {
  if (!r.position || !r.impressions) continue;

  if (r.position >= 11 && r.position <= 20 && r.impressions >= 30) {
    page2.push({
      query: r.query,
      page: r.page,
      slug: slugFromUrl(r.page),
      position: r.position,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      action: "paa-faq",
      command: `/paa-faq ${slugFromUrl(r.page)}`,
      reason: `Page-2 (pos ${r.position.toFixed(1)}). Add FAQ + body copy targeting "${r.query}" to push to page 1.`,
    });
  } else if (
    r.position <= 10 &&
    r.position >= 1 &&
    r.impressions >= 50 &&
    r.ctr < expectedCtr(r.position) * 0.6
  ) {
    titleRewrite.push({
      query: r.query,
      page: r.page,
      slug: slugFromUrl(r.page),
      position: r.position,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      expected_ctr: expectedCtr(r.position),
      frozen: isFrozen(r.page),
      action: isFrozen(r.page) ? "skip-frozen" : "title-rewrite",
      command: isFrozen(r.page)
        ? `# FROZEN: do not touch ${r.page} title (per seo-protected-pages.md)`
        : `/seo-page ${r.page}`,
      reason: isFrozen(r.page)
        ? `CTR ${(r.ctr * 100).toFixed(1)}% << expected ${(expectedCtr(r.position) * 100).toFixed(1)}% — but page is FROZEN. Investigate body copy instead of title.`
        : `Pos ${r.position.toFixed(1)} but CTR ${(r.ctr * 100).toFixed(1)}% << expected ${(expectedCtr(r.position) * 100).toFixed(1)}%. Title/meta rewrite candidate.`,
    });
  }
}

// New-page candidates: queries with high impressions but URL doesn't match any existing slug
const queryAggregate = new Map();
for (const r of aggregated) {
  const cur = queryAggregate.get(r.query) ?? { impressions: 0, clicks: 0, pages: new Set() };
  cur.impressions += r.impressions;
  cur.clicks += r.clicks;
  cur.pages.add(slugFromUrl(r.page));
  queryAggregate.set(r.query, cur);
}
for (const [query, agg] of queryAggregate) {
  if (agg.impressions < 50) continue;
  // If at least one matching page exists, NOT a new-page candidate
  const hasMatching = [...agg.pages].some((slug) => existingSlugs.has(slug));
  if (hasMatching) continue;
  // Skip brand/navigation queries
  if (/^true ?color/i.test(query)) continue;
  newPageCandidates.push({
    query,
    impressions: agg.impressions,
    clicks: agg.clicks,
    serving_pages: [...agg.pages].slice(0, 3),
    action: "truecolor-page",
    command: `/truecolor-page ${query}`,
    reason: `${agg.impressions} impressions over ${DAYS}d but no targeted landing page exists. Currently served by: ${[...agg.pages].slice(0, 2).join(", ")}.`,
  });
}
newPageCandidates.sort((a, b) => b.impressions - a.impressions);

// Decay alerts with recommended action
const decayAlerts = decay.map((d) => ({
  query: d.query,
  page: d.page,
  slug: slugFromUrl(d.page),
  position_prior: d.pos_prior,
  position_recent: d.pos_recent,
  position_delta: +(d.pos_recent - d.pos_prior).toFixed(1),
  impressions_recent: d.imp_recent,
  clicks_recent: d.clk_recent,
  frozen: isFrozen(d.page),
  action: "investigate",
  command: isFrozen(d.page)
    ? `# FROZEN: investigate manually, do not auto-rewrite`
    : `/seo-page ${d.page}`,
  reason: `Dropped from pos ${d.pos_prior.toFixed(1)} → ${d.pos_recent.toFixed(1)} in last ${splitDays}d. Diagnose before further changes.`,
}));

const summary = {
  generated_at: new Date().toISOString(),
  window_days: DAYS,
  totals: {
    page2_opportunities: page2.length,
    title_rewrite_candidates: titleRewrite.length,
    new_page_candidates: newPageCandidates.length,
    decay_alerts: decayAlerts.length,
  },
  page2_opportunities: page2.sort((a, b) => b.impressions - a.impressions).slice(0, 25),
  title_rewrite_candidates: titleRewrite.sort((a, b) => b.impressions - a.impressions).slice(0, 15),
  new_page_candidates: newPageCandidates.slice(0, 15),
  decay_alerts: decayAlerts.slice(0, 10),
};

if (FORMAT === "text") {
  console.log(`\nSEO Opportunities — last ${DAYS} days\n`);
  console.log(`Page-2 keywords (push to page 1):     ${summary.totals.page2_opportunities}`);
  console.log(`Title-rewrite candidates:             ${summary.totals.title_rewrite_candidates}`);
  console.log(`New page candidates:                  ${summary.totals.new_page_candidates}`);
  console.log(`Decay alerts:                         ${summary.totals.decay_alerts}`);
} else {
  console.log(JSON.stringify(summary, null, 2));
}
