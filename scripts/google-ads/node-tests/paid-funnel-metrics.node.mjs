import assert from "node:assert/strict";
import test from "node:test";
import {
  INCOMPLETE_COVERAGE_VERDICT,
  classifyOrderOrigin,
  formatQuoteAttributionSection,
  formatPaidLandingPathSection,
  hasClickId,
  hasGoogleUtmSource,
  needsIncompleteCoverageVerdict,
  summarizePaidLandingPaths,
  summarizeQuoteAttribution,
} from "../paid-funnel-metrics.mjs";

// staff_notes exactly as src/app/api/staff/manual-order/route.ts writes them (~L428-431).
const STAFF_MANUAL_NOTE = "Manual order — 1 item(s) created by staff via payment request";
const STAFF_QUOTE_NOTE =
  "[QUOTE] Manual quote — 1 item(s) — Pay Now link sent; customer can pay to confirm or reply for changes.";

function order(id, overrides = {}) {
  return {
    id,
    order_number: `TC-2026-${id}`,
    staff_notes: null,
    checkout_submission_id: null,
    created_at: "2026-08-10T12:00:00Z",
    ...overrides,
  };
}

const staffOrder = (id, note) => order(id, { staff_notes: note });
const onlineOrder = (id, overrides = {}) => order(id, { checkout_submission_id: `csid-${id}`, ...overrides });

function outboxRow(orderId, overrides = {}) {
  return {
    order_id: orderId,
    order_number: `TC-2026-${orderId}`,
    conversion_type: "purchase_online",
    status: "not_attributable",
    created_at: "2026-08-10T12:00:00Z",
    ...overrides,
  };
}

/**
 * Mirrors the verified production window read read-only on 2026-08-15 (45 days):
 * 15 outbox rows — 14 not_attributable (13 purchase_online + 1 quote_won) and 1 sent.
 * Origin truth: 6 staff_manual, 4 staff_quote, 4 online checkouts that arrived on ORGANIC
 * sessions with no click ID (checkout_submission_id present, no google utm_source).
 * 35 quote requests, 2 carrying a click ID (both 2026-08-13, neither converted), 3 utm~google.
 */
function productionWindowFixture() {
  const staffManual = ["0309", "0321", "0323", "0325", "0326"];
  const staffQuote = ["0316", "0324", "0327", "0328"];
  const organicOnline = ["0299", "0308", "0310", "0320"];

  const orders = [
    ...staffManual.map((id) => staffOrder(id, STAFF_MANUAL_NOTE)),
    ...staffQuote.map((id) => staffOrder(id, STAFF_QUOTE_NOTE)),
    ...organicOnline.map((id) => onlineOrder(id, { utm_source: null, latest_paid_utm_source: null })),
    staffOrder("0314", STAFF_MANUAL_NOTE),
    onlineOrder("0330", { utm_source: "google", gclid: "Cj0-online-real" }),
  ];
  const outbox = [
    ...[...staffManual, ...staffQuote, ...organicOnline].map((id) => outboxRow(id)),
    outboxRow("0314", { conversion_type: "quote_won" }),
    outboxRow("0330", { status: "sent", gclid: "Cj0-online-real" }),
  ];

  const quoteRequests = Array.from({ length: 35 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    created_at: "2026-08-01T10:00:00Z",
    gclid: null,
    gbraid: null,
    wbraid: null,
    latest_paid_gclid: null,
    latest_paid_gbraid: null,
    latest_paid_wbraid: null,
    utm_source: null,
    latest_paid_utm_source: null,
    converted_order_id: null,
    lifecycle_status: "requested",
  }));
  quoteRequests[0] = { ...quoteRequests[0], created_at: "2026-08-13T15:00:00Z", gclid: "Cj0-quote-a", utm_source: "google" };
  quoteRequests[1] = { ...quoteRequests[1], created_at: "2026-08-13T16:00:00Z", latest_paid_gbraid: "gb-quote-b", latest_paid_utm_source: "google" };
  quoteRequests[2] = { ...quoteRequests[2], utm_source: "google" };
  return { outbox, orders, quoteRequests };
}

test("order origin reads the staff_notes prefixes first, then the checkout submission id", () => {
  assert.equal(classifyOrderOrigin(staffOrder("A", STAFF_MANUAL_NOTE)), "staff_manual");
  assert.equal(classifyOrderOrigin(staffOrder("B", STAFF_QUOTE_NOTE)), "staff_quote");
  assert.equal(classifyOrderOrigin(order("C", { staff_notes: null })), "online_checkout");
  assert.equal(classifyOrderOrigin(order("D", { staff_notes: "   " })), "online_checkout");
  assert.equal(classifyOrderOrigin(undefined), "unknown");
  // Reprice/refund stamps append after the prefix, so the origin survives.
  assert.equal(
    classifyOrderOrigin(staffOrder("E", `${STAFF_MANUAL_NOTE}\n[REPRICE 2026-08-12] total 120.00 -> 145.00`)),
    "staff_manual",
  );
  // A staff-typed note on a browser checkout must not turn it into a staff-created order.
  assert.equal(classifyOrderOrigin(onlineOrder("F", { staff_notes: "Customer called about proof colours" })), "online_checkout");
  // Free-typed note, no checkout id: honestly unknown rather than guessed either way.
  assert.equal(classifyOrderOrigin(order("G", { staff_notes: "Customer called about proof colours" })), "unknown");
});

test("click ID and Google source detection cover first-touch and latest_paid fields", () => {
  assert.equal(hasClickId({ gclid: "Cj0abc" }), true);
  assert.equal(hasClickId({ latest_paid_wbraid: "wb1" }), true);
  assert.equal(hasClickId({ gclid: "", gbraid: null, latest_paid_gclid: "   " }), false);
  assert.equal(hasClickId(null), false);
  assert.equal(hasGoogleUtmSource({ utm_source: "Google" }), true);
  assert.equal(hasGoogleUtmSource({ latest_paid_utm_source: "google" }), true);
  assert.equal(hasGoogleUtmSource({ utm_source: "brevo" }), false);
});

test("production window fixture splits unattributable paid sales by order origin", () => {
  const summary = summarizeQuoteAttribution(productionWindowFixture());

  assert.equal(summary.unattributable.total, 14);
  assert.deepEqual(summary.unattributable.byOrigin, {
    online_checkout: 4,
    staff_manual: 6,
    staff_quote: 4,
    unknown: 0,
  });
  // The headline fix: 10 of the 14 were never online checkouts, and the 4 that were arrived on
  // organic sessions — no paid attribution was actually lost in this window.
  assert.equal(summary.unattributable.onlineCheckoutGoogleTagged, 0);
  assert.equal(summary.unattributable.byOriginConversionType.staff_manual.quote_won, 1);
  assert.equal(summary.unattributable.byOriginConversionType.staff_manual.purchase_online, 5);
  assert.equal(summary.unattributable.byOriginConversionType.staff_quote.purchase_online, 4);
  assert.equal(summary.unattributable.byOriginConversionType.online_checkout.purchase_online, 4);

  assert.equal(summary.byConversionType.purchase_online.not_attributable, 13);
  assert.equal(summary.byConversionType.purchase_online.sent, 1);
  assert.equal(summary.byConversionType.quote_won.not_attributable, 1);
  assert.equal(summary.byConversionType.quote_won.sent, 0);
  assert.equal(summary.byConversionType.other.total, 0);

  assert.equal(summary.quotes.total, 35);
  assert.equal(summary.quotes.withClickId, 2);
  assert.equal(summary.quotes.withGoogleUtmSource, 3);
  assert.equal(summary.quotes.converted, 0);
  assert.equal(summary.survival.convertedWithClickId, 0);
});

test("an unattributable online checkout on a google-tagged session is flagged as the real leak", () => {
  const summary = summarizeQuoteAttribution({
    outbox: [outboxRow("leak"), outboxRow("organic")],
    orders: [
      onlineOrder("leak", { utm_source: "google" }),
      onlineOrder("organic", { utm_source: null }),
    ],
  });
  assert.equal(summary.unattributable.byOrigin.online_checkout, 2);
  assert.equal(summary.unattributable.onlineCheckoutGoogleTagged, 1);
  assert.match(
    formatQuoteAttributionSection(summary).join("\n"),
    /Of the 2 online_checkout rows, 1 arrived on a google-tagged session and still lost the click ID/,
  );
});

test("click-ID survival separates a carried ID from a COPY_FAILURE drop", () => {
  const carriedQuote = {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    created_at: "2026-08-13T15:00:00Z",
    gclid: "Cj0-quote-a",
    converted_order_id: "order-carried",
  };
  const droppedQuote = {
    id: "bbbbbbbb-0000-4000-8000-000000000002",
    created_at: "2026-08-13T16:00:00Z",
    latest_paid_gclid: "Cj0-quote-b",
    converted_order_id: "order-dropped",
  };
  const summary = summarizeQuoteAttribution({
    outbox: [outboxRow("order-carried", { conversion_type: "quote_won", status: "sent", order_number: "TC-2026-0331" })],
    // The dropped order's outbox row predates the window, so it arrives via linkedOutbox and
    // must NOT be counted in the window's status totals.
    linkedOutbox: [
      outboxRow("order-dropped", { conversion_type: "quote_won", status: "not_attributable", order_number: "TC-2026-0332" }),
    ],
    orders: [
      onlineOrder("order-carried", { order_number: "TC-2026-0331", gclid: "Cj0-quote-a", quote_request_id: carriedQuote.id }),
      staffOrder("order-dropped", STAFF_MANUAL_NOTE),
    ],
    quoteRequests: [carriedQuote, droppedQuote],
  });

  assert.equal(summary.survival.quotesWithClickId, 2);
  assert.equal(summary.survival.convertedWithClickId, 2);
  assert.equal(summary.survival.carried, 1);
  assert.equal(summary.survival.dropped, 1);
  assert.deepEqual(
    summary.survival.rows.map((row) => [row.orderNumber, row.orderHasClickId, row.outboxStatus, row.orderOrigin]),
    [
      ["TC-2026-0331", true, "sent", "online_checkout"],
      ["TC-2026-order-dropped", false, "not_attributable", "staff_manual"],
    ],
  );
  // Only the in-window row counts toward uploads.
  assert.equal(summary.byConversionType.quote_won.sent, 1);
  assert.equal(summary.byConversionType.quote_won.not_attributable, 0);
  assert.equal(summary.unattributable.total, 0);

  // Quote references are truncated; no email, phone, or raw click ID reaches the printed rows.
  const rendered = formatQuoteAttributionSection(summary).join("\n");
  assert.match(rendered, /quote aaaaaaaa \(2026-08-13\) -> TC-2026-0331 \[online_checkout\]: click ID CARRIED, outbox=sent/);
  assert.match(rendered, /click ID DROPPED \(COPY_FAILURE\), outbox=not_attributable/);
  assert.equal(rendered.includes("Cj0-quote-a"), false);
});

test("rendered section states the six counters and refuses to invent a qualified-lead number", () => {
  const lines = formatQuoteAttributionSection(summarizeQuoteAttribution(productionWindowFixture()));
  const rendered = lines.join("\n");

  assert.equal(lines[0], "=== QUOTE ATTRIBUTION COVERAGE (window) ===");
  assert.match(rendered, /How to read this:/);
  assert.match(rendered, /1\. Website quote requests\s+35/);
  assert.match(rendered, /2\. Google-paid quote requests\s+2/);
  assert.match(
    rendered,
    /3\. Qualified-lead conversions uploaded\s+n\/a — conversion action `quote_submit_qualified` not created yet \(plan Task 2\)/,
  );
  assert.match(rendered, /4\. Paid quote_won conversions uploaded\s+0 sent \| 0 pending\/retry \| 1 not_attributable \| 0 dead/);
  assert.match(rendered, /5\. Unattributable paid sales by origin\s+14 total — online_checkout 4 \| staff_manual 6 \| staff_quote 4 \| unknown 0/);
  assert.match(rendered, /purchase_online outbox \(all origins\)\s+1 sent \| 0 pending\/retry \| 13 not_attributable \| 0 dead/);
  assert.match(rendered, /6\. Click-ID survival \(quote -> order\)\s+2 quotes with a click ID \| 0 converted/);
  assert.match(rendered, /no click-ID quote has converted to an order yet/);
  assert.match(rendered, /honestly unattributable/);
});

test("renders qualified-lead outbox status counts only after the action is configured", () => {
  const summary = summarizeQuoteAttribution({
    ...productionWindowFixture(),
    quoteLeadOutbox: [
      { status: "sent" },
      { status: "retry" },
      { status: "not_attributable" },
    ],
  });
  const rendered = formatQuoteAttributionSection(summary, { qualifiedLeadConfigured: true }).join("\n");
  assert.match(rendered, /3\. Qualified-lead conversions uploaded\s+1 sent \| 1 pending\/retry \| 1 not_attributable \| 0 dead/);
});

test("paid landing-path report uses first-party rows without mixing GA4 or GSC counts", () => {
  const rows = summarizePaidLandingPaths({
    quoteRequests: [
      { gclid: "a", landing_path: "/yard-signs", latest_paid_landing_path: "/coroplast-signs" },
      { latest_paid_gbraid: "b", landing_path: "/labels" },
      { utm_source: "google", landing_path: "/banners" },
      { utm_source: "organic", landing_path: "/ignore" },
    ],
    orders: [
      { latest_paid_gclid: "c", latest_paid_landing_path: "/coroplast-signs" },
      { gclid: "d" },
    ],
  });
  assert.deepEqual(rows, [
    { path: "/coroplast-signs", quotes: 1, orders: 1 },
    { path: "(path unknown)", quotes: 0, orders: 1 },
    { path: "/banners", quotes: 1, orders: 0 },
    { path: "/labels", quotes: 1, orders: 0 },
  ]);
  const rendered = formatPaidLandingPathSection(rows).join("\n");
  assert.match(rendered, /do not add the systems together/);
  assert.equal(rendered.includes("gclid"), false);
});

test("zero attributed revenue alongside real commercial signal triggers the honest verdict", () => {
  const summary = summarizeQuoteAttribution(productionWindowFixture());
  assert.equal(needsIncompleteCoverageVerdict({ attributedCount: 0, summary }), true);
  assert.equal(needsIncompleteCoverageVerdict({ attributedCount: 1, summary }), false);
  assert.equal(
    needsIncompleteCoverageVerdict({ attributedCount: 0, summary: summarizeQuoteAttribution({}) }),
    false,
  );
  assert.deepEqual(INCOMPLETE_COVERAGE_VERDICT, [
    "Commercial signal exists; revenue attribution coverage is incomplete.",
    "Do not use reported ROAS to pause or scale this campaign.",
  ]);
});
