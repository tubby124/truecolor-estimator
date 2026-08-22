// Quote-attribution metrics for the paid-funnel report.
//
// WHY THIS EXISTS: the report used to print one flat "not_attributable" count off the
// conversion outbox, which read as "online checkout is losing Google attribution". The
// 2026-08-15 trace (docs/paid-search/COPY-LEARNING-LOG.md) showed most of those rows were
// staff-created phone/walk-in orders that never had a click ID to lose. Counting those as lost
// attribution makes staff distrust the whole report. The rest were online checkouts from
// ORGANIC sessions (no click ID at all) — also honest. A real leak is an online checkout that
// arrived on a google-tagged session and still lost the ID, which is counted separately.
//
// Everything above the LOADER divider is pure — plain rows in, numbers/strings out, no
// network and no imports — so scripts/google-ads/node-tests/paid-funnel-metrics.node.mjs can
// exercise it against fixtures. The loader below takes an already-constructed Supabase client
// so the report and any read-only probe share one definition of the queries.

export const FIRST_TOUCH_CLICK_ID_FIELDS = ["gclid", "gbraid", "wbraid"];
export const LATEST_PAID_CLICK_ID_FIELDS = ["latest_paid_gclid", "latest_paid_gbraid", "latest_paid_wbraid"];
export const ALL_CLICK_ID_FIELDS = [...FIRST_TOUCH_CLICK_ID_FIELDS, ...LATEST_PAID_CLICK_ID_FIELDS];

export const OUTBOX_STATUSES = ["pending", "processing", "retry", "sent", "not_attributable", "dead"];
export const ORDER_ORIGINS = ["online_checkout", "staff_manual", "staff_quote", "unknown"];

// staff_notes prefixes written by src/app/api/staff/manual-order/route.ts (~L428-431).
const STAFF_QUOTE_PREFIX = "[QUOTE] Manual quote";
const STAFF_MANUAL_PREFIX = "Manual order";

const isFilled = (value) => typeof value === "string" && value.trim().length > 0;

/** True when any of the given attribution fields holds a non-empty click identifier. */
export function hasClickId(row, fields = ALL_CLICK_ID_FIELDS) {
  if (!row) return false;
  return fields.some((field) => isFilled(row[field]));
}

/** True when the row's source (first-touch or latest paid touch) looks like Google. */
export function hasGoogleUtmSource(row) {
  if (!row) return false;
  return [row.utm_source, row.latest_paid_utm_source]
    .some((value) => isFilled(value) && value.toLowerCase().includes("google"));
}

/**
 * First-party commercial evidence by captured landing pathname. This deliberately
 * does not merge GA4 sessions or GSC clicks: their attribution models differ.
 */
export function summarizePaidLandingPaths({ quoteRequests = [], orders = [] } = {}) {
  const byPath = new Map();
  const add = (row, kind) => {
    if (!hasClickId(row) && !hasGoogleUtmSource(row)) return;
    const path = isFilled(row?.latest_paid_landing_path)
      ? row.latest_paid_landing_path
      : (isFilled(row?.landing_path) ? row.landing_path : "(path unknown)");
    const bucket = byPath.get(path) ?? { path, quotes: 0, orders: 0 };
    bucket[kind] += 1;
    byPath.set(path, bucket);
  };
  for (const quote of quoteRequests) add(quote, "quotes");
  for (const order of orders) add(order, "orders");
  return [...byPath.values()].sort((a, b) =>
    (b.orders - a.orders) || (b.quotes - a.quotes) || a.path.localeCompare(b.path),
  );
}

export function summarizePaidLandingPathCoverage(rows = []) {
  const totalOutcomes = rows.reduce((total, row) => total + Number(row?.quotes ?? 0) + Number(row?.orders ?? 0), 0);
  const unknownRouteOutcomes = rows
    .filter((row) => row?.path === "(path unknown)")
    .reduce((total, row) => total + Number(row?.quotes ?? 0) + Number(row?.orders ?? 0), 0);
  const knownRouteOutcomes = totalOutcomes - unknownRouteOutcomes;
  return {
    totalOutcomes,
    knownRouteOutcomes,
    unknownRouteOutcomes,
    knownRouteCoveragePct: totalOutcomes === 0 ? null : Math.round((knownRouteOutcomes / totalOutcomes) * 100),
  };
}

export function formatPaidLandingPathSection(rows) {
  const coverage = summarizePaidLandingPathCoverage(rows);
  const lines = [
    "=== FIRST-PARTY PAID LANDING-PATH SIGNAL (window) ===",
    "  Paid quotes and paid orders are counted separately; a converted quote can appear in both.",
    "  Compare this with GA4 paid sessions and GSC organic page data—do not add the systems together.",
    coverage.totalOutcomes === 0
      ? "  Route coverage: no attributable paid quote/order outcomes in this window."
      : `  Route coverage: ${coverage.knownRouteOutcomes} known-route | ${coverage.unknownRouteOutcomes} unknown-route | ${coverage.knownRouteCoveragePct}% known.`,
  ];
  if (rows.length === 0) lines.push("  (no paid quote/order rows with captured attribution in range)");
  for (const row of rows) lines.push(`  ${row.path}: ${row.quotes} paid quote(s) | ${row.orders} paid order(s)`);
  return lines;
}

/**
 * Where did this order come from?
 *
 * HEURISTIC — `orders` has no explicit origin column, so this reads two existing signals in
 * priority order:
 *   1. staff_notes prefix — stamped by src/app/api/staff/manual-order/route.ts (~L428-431) and
 *      nothing else. Later appends (reprice / refund stamps) go after the prefix, so startsWith
 *      still holds. The same prefix check already backs the staff UI badge in
 *      src/components/staff/orders/StaffOrderCard.tsx:188.
 *   2. checkout_submission_id — set ONLY by the browser checkout (src/app/checkout/page.tsx →
 *      src/app/api/orders/route.ts). A positive online-checkout proof, so it also rescues an
 *      online order that staff later free-typed a note on.
 * Fallback: no notes at all → online_checkout, because the column only exists from migration
 * 20260720120000 and older online orders have it null. Unrecognised notes with no checkout id
 * stay `unknown` instead of being guessed either way.
 *
 * Verified against production 2026-08-15: staff orders carry category "MANUAL" order_items and
 * no checkout_submission_id; the null-staff_notes unattributable orders all had a checkout id,
 * real product categories, and organic referrers.
 */
export function classifyOrderOrigin(order) {
  if (!order) return "unknown";
  const notes = typeof order.staff_notes === "string" ? order.staff_notes.trim() : "";
  if (notes.startsWith(STAFF_QUOTE_PREFIX)) return "staff_quote";
  if (notes.startsWith(STAFF_MANUAL_PREFIX)) return "staff_manual";
  if (isFilled(order.checkout_submission_id)) return "online_checkout";
  if (notes.length === 0) return "online_checkout";
  return "unknown";
}

const emptyStatusCounts = () => ({
  total: 0,
  ...Object.fromEntries(OUTBOX_STATUSES.map((status) => [status, 0])),
  unknown_status: 0,
});

const countStatus = (bucket, status) => {
  bucket.total += 1;
  if (OUTBOX_STATUSES.includes(status)) bucket[status] += 1;
  else bucket.unknown_status += 1;
};

const newest = (a, b) => (String(b?.created_at ?? "") > String(a?.created_at ?? "") ? b : a);

/**
 * Aggregate the window's rows into the counts the report prints.
 *
 * @param {object} input
 * @param {Array} input.outbox         outbox rows created inside the window (counted)
 * @param {Array} input.orders         orders referenced by those rows plus converted quote orders (lookup only)
 * @param {Array} input.quoteRequests  quote_requests created inside the window (counted)
 * @param {Array} input.linkedOutbox   extra outbox rows for converted quote orders outside the
 *                                     window — used for click-ID survival lookups, never counted
 */
export function summarizeQuoteAttribution({
  outbox = [], orders = [], quoteRequests = [], linkedOutbox = [], quoteLeadOutbox = [],
} = {}) {
  const ordersById = new Map();
  for (const order of orders) if (order?.id) ordersById.set(order.id, order);

  const outboxByOrderId = new Map();
  for (const row of [...outbox, ...linkedOutbox]) {
    if (!row?.order_id) continue;
    outboxByOrderId.set(row.order_id, newest(outboxByOrderId.get(row.order_id), row));
  }

  const byConversionType = { quote_won: emptyStatusCounts(), purchase_online: emptyStatusCounts(), other: emptyStatusCounts() };
  const unattributable = {
    total: 0,
    byOrigin: Object.fromEntries(ORDER_ORIGINS.map((origin) => [origin, 0])),
    byOriginConversionType: Object.fromEntries(
      ORDER_ORIGINS.map((origin) => [origin, { quote_won: 0, purchase_online: 0, other: 0 }]),
    ),
    // Online checkout + a google-tagged session + still no click ID = the only shape here that
    // is actually lost paid attribution rather than an honestly unpaid sale.
    onlineCheckoutGoogleTagged: 0,
  };

  for (const row of outbox) {
    const type = row?.conversion_type === "quote_won" || row?.conversion_type === "purchase_online"
      ? row.conversion_type
      : "other";
    countStatus(byConversionType[type], row?.status);
    if (row?.status !== "not_attributable") continue;
    const order = ordersById.get(row.order_id);
    const origin = classifyOrderOrigin(order);
    unattributable.total += 1;
    unattributable.byOrigin[origin] += 1;
    unattributable.byOriginConversionType[origin][type] += 1;
    if (origin === "online_checkout" && hasGoogleUtmSource(order)) unattributable.onlineCheckoutGoogleTagged += 1;
  }

  const quotes = {
    total: quoteRequests.length,
    withClickId: 0,
    withGoogleUtmSource: 0,
    converted: 0,
  };
  const survivalRows = [];
  for (const quote of quoteRequests) {
    const clickId = hasClickId(quote);
    if (clickId) quotes.withClickId += 1;
    if (hasGoogleUtmSource(quote)) quotes.withGoogleUtmSource += 1;
    if (isFilled(quote?.converted_order_id)) quotes.converted += 1;
    if (!clickId || !isFilled(quote?.converted_order_id)) continue;

    const order = ordersById.get(quote.converted_order_id);
    const outboxRow = outboxByOrderId.get(quote.converted_order_id);
    survivalRows.push({
      quoteRef: String(quote.id).slice(0, 8),
      quoteDate: String(quote.created_at ?? "").slice(0, 10),
      orderNumber: order?.order_number ?? "(order row not found)",
      orderOrigin: classifyOrderOrigin(order),
      orderHasClickId: hasClickId(order),
      outboxStatus: outboxRow?.status ?? "(no outbox row)",
    });
  }

  const survival = {
    quotesWithClickId: quotes.withClickId,
    convertedWithClickId: survivalRows.length,
    carried: survivalRows.filter((row) => row.orderHasClickId).length,
    dropped: survivalRows.filter((row) => !row.orderHasClickId).length,
    rows: survivalRows,
  };

  const qualifiedLead = emptyStatusCounts();
  for (const row of quoteLeadOutbox) countStatus(qualifiedLead, row?.status);

  return { quotes, byConversionType, qualifiedLead, unattributable, survival };
}

const statusLine = (counts) =>
  `${counts.sent} sent | ${counts.pending + counts.retry + counts.processing} pending/retry | ` +
  `${counts.not_attributable} not_attributable | ${counts.dead} dead`;

const label = (text) => `  ${text.padEnd(46)}`;

/** Render the section body as lines. Pure — the report just prints what comes back. */
export function formatQuoteAttributionSection(summary, { qualifiedLeadConfigured = false } = {}) {
  const { quotes, byConversionType, qualifiedLead, unattributable, survival } = summary;
  const lines = [
    "=== QUOTE ATTRIBUTION COVERAGE (window) ===",
    "  How to read this: 1-2 = paid demand, 3-4 = signal actually sent to Google, 5 = honest non-attribution",
    "  split by WHERE the order was created, 6 = does a paid click ID survive quote -> order -> outbox.",
    "",
    `${label("1. Website quote requests")}${quotes.total}`,
    `${label("2. Google-paid quote requests")}${quotes.withClickId}` +
      `   (any click ID, first-touch or latest_paid; utm_source~google: ${quotes.withGoogleUtmSource})`,
    `${label("3. Qualified-lead conversions uploaded")}${qualifiedLeadConfigured
      ? statusLine(qualifiedLead)
      : "n/a — conversion action `quote_submit_qualified` not created yet (plan Task 2)"}`,
    `${label("4. Paid quote_won conversions uploaded")}${statusLine(byConversionType.quote_won)}`,
    `${label("5. Unattributable paid sales by origin")}${unattributable.total} total — ` +
      ORDER_ORIGINS.map((origin) => `${origin} ${unattributable.byOrigin[origin]}`).join(" | "),
    "       Staff-created orders (staff_manual / staff_quote) are honestly unattributable — a phone or",
    "       walk-in sale carries no click ID unless it is linked to a web quote that had one.",
    `       Of the ${unattributable.byOrigin.online_checkout} online_checkout rows, ${unattributable.onlineCheckoutGoogleTagged} arrived on a google-tagged session and still lost the` +
      " click ID —",
    "       that subset is the only real leak; the rest are organic/direct sales with no click ID to keep.",
    "       Origin is a staff_notes + checkout_submission_id heuristic (orders has no explicit origin column).",
    `${label("   purchase_online outbox (all origins)")}${statusLine(byConversionType.purchase_online)}`,
    `${label("6. Click-ID survival (quote -> order)")}${survival.quotesWithClickId} quotes with a click ID | ` +
      `${survival.convertedWithClickId} converted | ${survival.carried} carried the ID | ${survival.dropped} dropped it`,
  ];

  if (byConversionType.other.total > 0) {
    lines.push(`${label("   other conversion_type rows")}${statusLine(byConversionType.other)}`);
  }

  if (survival.rows.length === 0) {
    lines.push("       (no click-ID quote has converted to an order yet — nothing proves or disproves the copy path)");
  }
  for (const row of survival.rows) {
    lines.push(
      `       quote ${row.quoteRef} (${row.quoteDate}) -> ${row.orderNumber} [${row.orderOrigin}]: ` +
      `click ID ${row.orderHasClickId ? "CARRIED" : "DROPPED (COPY_FAILURE)"}, outbox=${row.outboxStatus}`,
    );
  }
  return lines;
}

/**
 * True when the window shows commercial activity but zero attributed revenue — the report must
 * then say so out loud instead of letting a 0 be read as "the ads produced nothing".
 */
export function needsIncompleteCoverageVerdict({ attributedCount, summary }) {
  return attributedCount === 0 && (summary.quotes.withClickId > 0 || summary.unattributable.total > 0);
}

export const INCOMPLETE_COVERAGE_VERDICT = [
  "Commercial signal exists; revenue attribution coverage is incomplete.",
  "Do not use reported ROAS to pause or scale this campaign.",
];

// ---------------------------------------------------------------- LOADER ----
// READ-ONLY. Takes an already-constructed Supabase client (service key) so nothing here owns
// credentials; the pure functions above never touch it.

const uniq = (values) => [...new Set(values.filter(Boolean))];

export async function loadQuoteAttributionInputs(supa, { sinceIso, outbox = [] }) {
  const read = async (table, select, apply) => {
    const { data, error } = await apply(supa.from(table).select(select));
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    return data ?? [];
  };

  const quoteRequests = await read(
    "quote_requests",
    "id, created_at, gclid, gbraid, wbraid, latest_paid_gclid, latest_paid_gbraid, latest_paid_wbraid, utm_source, latest_paid_utm_source, landing_path, latest_paid_landing_path, converted_order_id, lifecycle_status",
    (q) => q.gte("created_at", sinceIso).order("created_at", { ascending: false }),
  );

  const orderSelect = "id, order_number, quote_request_id, conversion_type, staff_notes, checkout_submission_id, created_at, gclid, gbraid, wbraid, latest_paid_gclid, latest_paid_gbraid, latest_paid_wbraid, utm_source, latest_paid_utm_source, landing_path, latest_paid_landing_path";
  const recentOrders = await read(
    "orders",
    orderSelect,
    (q) => q.gte("created_at", sinceIso).order("created_at", { ascending: false }),
  );

  const convertedOrderIds = uniq(quoteRequests.map((quote) => quote.converted_order_id));
  const orderIds = uniq([...outbox.map((row) => row.order_id), ...convertedOrderIds]);

  const linkedOrders = orderIds.length
    ? await read(
        "orders",
        orderSelect,
        (q) => q.in("id", orderIds),
      )
    : [];
  const ordersById = new Map();
  for (const order of [...recentOrders, ...linkedOrders]) if (order?.id) ordersById.set(order.id, order);
  const orders = [...ordersById.values()];

  // Outbox rows for quote-converted orders can predate the window; fetched separately so they
  // never inflate the window counts.
  const outboxOrderIds = new Set(outbox.map((row) => row.order_id));
  const missingIds = convertedOrderIds.filter((id) => !outboxOrderIds.has(id));
  const linkedOutbox = missingIds.length
    ? await read(
        "google_ads_conversion_outbox",
        "order_id, order_number, conversion_type, status, created_at",
        (q) => q.in("order_id", missingIds),
      )
    : [];

  return { outbox, orders, quoteRequests, linkedOutbox };
}
