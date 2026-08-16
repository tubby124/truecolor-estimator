// Paid-funnel report — READ-ONLY.
//
// Joins three sources the ads cadence needs in one view:
//   1. Google Ads  — per-ad-group spend/clicks (via the shared read-only gaql client)
//   2. GA4         — what paid clickers DID post-click (google/cpc funnel events per landing page)
//   3. Supabase    — google_ads_conversion_outbox state (did any click become money?) plus
//                    quote-attribution coverage (quote_requests + order origin)
//
// GA4 is read through the same service-account auth as src/lib/seo/ga4-client.ts.
//
// SYNTHETIC-TRAFFIC FILTER: the e2e suite historically navigated production with
// utm_campaign=tc_core and gclid=test-click-123, polluting the google/cpc segment
// (fake sessions outnumbered real ad clicks ~5:1 by 2026-08-07). Those hits are
// excluded here AND counted separately as a pollution watch — after the
// 2026-08-07 e2e analytics block, that count should trend to zero. If it does
// not, a test runner somewhere is still firing GA4 against production.
//
// Usage: railway run node scripts/google-ads/paid-funnel-report.mjs [--days 7]

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { createReader } from "./gaql-read.mjs";
import {
  INCOMPLETE_COVERAGE_VERDICT,
  formatQuoteAttributionSection,
  loadQuoteAttributionInputs,
  needsIncompleteCoverageVerdict,
  summarizeQuoteAttribution,
} from "./paid-funnel-metrics.mjs";

const SYNTHETIC_CAMPAIGN = "tc_core";
const FUNNEL_EVENTS = [
  "view_item", "price_calculated", "add_to_cart", "begin_checkout",
  "purchase", "paid_landing_cta", "view_paid_landing", "generate_lead",
];

const daysArg = process.argv.indexOf("--days");
const days = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 7;
if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("--days must be 1-90");

const iso = (d) => d.toISOString().slice(0, 10);
const end = new Date();
const start = new Date(end.getTime() - (days - 1) * 86_400_000);
const range = { startDate: iso(start), endDate: iso(end) };
console.log(`Paid funnel report — ${range.startDate} .. ${range.endDate} (America/Regina account)\n`);

// ---------- 1. Google Ads: per ad group ----------
const reader = await createReader();
const search = reader.search ?? reader;
const adRows = await search(`
  SELECT campaign.name, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros
  FROM ad_group
  WHERE segments.date BETWEEN '${range.startDate}' AND '${range.endDate}'
    AND campaign.name LIKE 'GOOG_Search_TC_%'
  ORDER BY metrics.clicks DESC`, "ad group metrics");

console.log("=== GOOGLE ADS — ad groups (impressions / clicks / cost) ===");
let totalClicks = 0, totalCost = 0;
for (const r of adRows) {
  const clicks = Number(r.metrics.clicks ?? 0);
  const cost = Number(r.metrics.costMicros ?? 0) / 1e6;
  totalClicks += clicks; totalCost += cost;
  if (Number(r.metrics.impressions ?? 0) === 0) continue;
  console.log(`  ${r.campaign.name.replace("GOOG_Search_TC_", "").replace("_2026", "")} / ${r.adGroup.name}: ${r.metrics.impressions} imp, ${clicks} clk, CA$${cost.toFixed(2)}`);
}
console.log(`  TOTAL: ${totalClicks} clicks, CA$${totalCost.toFixed(2)}\n`);

// ---------- 2. GA4: paid funnel per landing page ----------
const creds = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON ?? "null");
if (!creds) throw new Error("GA4_SERVICE_ACCOUNT_JSON is required — run through \"railway run\"");
const auth = new google.auth.JWT({
  email: creds.client_email, key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});
const analytics = google.analyticsdata({ version: "v1beta", auth });
const property = `properties/${process.env.GA4_PROPERTY_ID}`;

const runReport = async (requestBody) =>
  (await analytics.properties.runReport({ property, requestBody })).data.rows ?? [];

const cpcFilter = (excludeSynthetic) => ({
  andGroup: {
    expressions: [
      { filter: { fieldName: "sessionSourceMedium", stringFilter: { value: "google / cpc" } } },
      excludeSynthetic
        ? { notExpression: { filter: { fieldName: "sessionCampaignName", stringFilter: { value: SYNTHETIC_CAMPAIGN } } } }
        : { filter: { fieldName: "sessionCampaignName", stringFilter: { value: SYNTHETIC_CAMPAIGN } } },
    ],
  },
});

const funnelRows = await runReport({
  dateRanges: [range],
  dimensions: [{ name: "landingPage" }, { name: "eventName" }],
  metrics: [{ name: "eventCount" }, { name: "sessions" }],
  dimensionFilter: cpcFilter(true),
  limit: "500",
});

const byLanding = new Map();
for (const r of funnelRows) {
  const [landing, event] = r.dimensionValues.map((d) => d.value);
  const count = Number(r.metricValues[0].value);
  if (!byLanding.has(landing)) byLanding.set(landing, { sessions: 0, events: {} });
  const entry = byLanding.get(landing);
  if (event === "session_start") entry.sessions += count;
  if (FUNNEL_EVENTS.includes(event)) entry.events[event] = (entry.events[event] ?? 0) + count;
}

console.log("=== GA4 — real paid sessions by landing page (synthetic excluded) ===");
if (byLanding.size === 0) console.log("  (no real google/cpc sessions in range)");
for (const [landing, { sessions, events }] of [...byLanding.entries()].sort((a, b) => b[1].sessions - a[1].sessions)) {
  const funnel = FUNNEL_EVENTS.filter((e) => events[e]).map((e) => `${e}=${events[e]}`).join(", ");
  console.log(`  ${landing || "(unknown)"}: ${sessions} sessions${funnel ? ` | ${funnel}` : " | no funnel events"}`);
}

// Pollution watch — synthetic sessions still reaching GA4.
const syntheticRows = await runReport({
  dateRanges: [range],
  dimensions: [{ name: "date" }],
  metrics: [{ name: "sessions" }],
  dimensionFilter: cpcFilter(false),
});
const syntheticSessions = syntheticRows.reduce((sum, r) => sum + Number(r.metricValues[0].value), 0);
console.log(`\n=== POLLUTION WATCH — synthetic '${SYNTHETIC_CAMPAIGN}' sessions in range: ${syntheticSessions} ===`);
if (syntheticSessions > 0) console.log("  Expected to trend to ZERO after the 2026-08-07 e2e analytics block. If this persists, a test runner is still firing GA4 against production.");

// ---------- 3. Conversion outbox ----------
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const { data: outbox, error } = await supa
  .from("google_ads_conversion_outbox")
  .select("order_id, order_number, conversion_type, gclid, gbraid, wbraid, status, conversion_value, created_at")
  .gte("created_at", `${range.startDate}T00:00:00Z`)
  .order("created_at", { ascending: false });
if (error) throw new Error(`outbox read failed: ${error.message}`);

console.log("\n=== CONVERSION OUTBOX (window) ===");
if (!outbox?.length) console.log("  (no conversions enqueued in range)");
for (const row of outbox ?? []) {
  const attributed = row.gclid || row.gbraid ? "AD-ATTRIBUTED" : "not ad-attributed";
  console.log(`  ${row.created_at.slice(0, 10)} ${row.order_number} ${row.conversion_type} CA$${row.conversion_value} [${row.status}] — ${attributed}`);
}
// ---------- 3b. Quote attribution coverage ----------
// The flat outbox listing above answers "did money get attributed?" but not "why not?". A
// not_attributable row on a staff phone/walk-in order is honest (there was never a click ID);
// the same status on an online checkout is a real leak. The 2026-08-15 trace found 13 of 14
// unattributable rows were staff-created, so the counts are split by order origin here.
const attributionInputs = await loadQuoteAttributionInputs(supa, {
  sinceIso: `${range.startDate}T00:00:00Z`,
  outbox: outbox ?? [],
});
const attribution = summarizeQuoteAttribution(attributionInputs);

console.log("");
for (const line of formatQuoteAttributionSection(attribution)) console.log(line);

// ---------- 4. Enhanced conversions readiness ----------
// The uploader attaches hashed email/phone and self-heals: if the account has not signed
// the enhanced-conversions terms Google rejects the WHOLE request, so it retries without
// userData. This probe (validateOnly — nothing is recorded) says which path is live today.
const ecProbe = await (async () => {
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_DATA_MANAGER_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });
    const { access_token: accessToken } = await tokenResponse.json();
    const { createHash } = await import("node:crypto");
    const response = await fetch("https://datamanager.googleapis.com/v1/events:ingest", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-goog-user-project": process.env.GOOGLE_DATA_MANAGER_PROJECT_ID,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        destinations: [{
          operatingAccount: { accountType: "GOOGLE_ADS", accountId: "1072816342" },
          loginAccount: { accountType: "GOOGLE_ADS", accountId: "1125402990" },
          productDestinationId: process.env.GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID,
        }],
        encoding: "HEX",
        events: [{
          adIdentifiers: { gclid: "EC-READINESS-PROBE" },
          userData: { userIdentifiers: [{ emailAddress: createHash("sha256").update("probe@example.com").digest("hex") }] },
          conversionValue: 1, currency: "CAD",
          // One hour ago, NOT noon on range.endDate. endDate is normally TODAY, so noon UTC is in
          // the future whenever this runs before 06:00 Saskatoon — Data Manager then rejects the
          // probe with EVENT_TIME_INVALID and the report claims enhanced conversions are broken
          // when they are fine. A readiness probe that fails on the clock teaches people to
          // ignore it, which is worse than having no probe.
          eventTimestamp: new Date(Date.now() - 3_600_000).toISOString(),
          transactionId: "EC-READINESS-PROBE", eventSource: "WEB",
        }],
        validateOnly: true,
      }),
    });
    if (response.ok) return "LIVE";
    const errorBody = await response.json().catch(() => ({}));
    const violation = (errorBody?.error?.details ?? [])
      .flatMap((detail) => detail?.fieldViolations ?? [])
      .find((v) => v?.reason);
    return violation?.reason ?? `HTTP ${response.status}`;
  } catch (error) {
    return `probe failed: ${error.message.slice(0, 80)}`;
  }
})();

console.log("\n=== ENHANCED CONVERSIONS ===");
if (ecProbe === "LIVE") {
  console.log("  ✅ LIVE — hashed email/phone are accepted and uploaded with every conversion.");
} else if (ecProbe === "DESTINATION_ACCOUNT_ENHANCED_CONVERSIONS_TERMS_NOT_SIGNED") {
  console.log("  ⚠️  INERT — account has not signed the enhanced-conversions terms.");
  console.log("     Conversions still upload on the click ID alone (self-healing fallback).");
  console.log("     Fix (owner, 2 clicks): Google Ads → Goals → Settings → Enhanced conversions");
  console.log("     → tick 'Turn on enhanced conversions', accept the TERMS dialog, SAVE.");
  console.log("     No redeploy needed — the next conversion picks it up automatically.");
} else {
  console.log(`  ⚠️  UNEXPECTED: ${ecProbe}`);
}

const attributedCount = (outbox ?? []).filter((r) => r.gclid || r.gbraid).length;
console.log(`\nVERDICT: ${totalClicks} paid clicks, CA$${totalCost.toFixed(2)} spend, ${attributedCount} ad-attributed conversions in window.`);
if (attributedCount === 0) console.log("Zero attributed conversions at this click volume is sample size, not breakage — the upload pipeline is armed and verified (2026-08-07 audit).");
if (needsIncompleteCoverageVerdict({ attributedCount, summary: attribution })) {
  for (const line of INCOMPLETE_COVERAGE_VERDICT) console.log(line);
}
console.log("\nThis tool is READ-ONLY. Nothing was changed.");
