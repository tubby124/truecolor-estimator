/**
 * Lifecycle data layer — all Supabase queries + derivations for /staff/lifecycle.
 *
 * Keeps page.tsx focused on rendering. One Promise.all fans out the queries;
 * the derivation functions then build the panel-shaped objects.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { encodePaymentToken } from "@/lib/payment/token";
import type { LifecycleRow } from "./LifecycleTable";
import type { Heartbeat } from "./HeartbeatsPanel";
import type { Orphan } from "./OrphanPanel";
import type { QuoteRow } from "./QuotesPanel";
import type { SignupRow } from "./SignupsPanel";
import type { EmailEvent } from "./EmailFeedPanel";
import { classifyEmail } from "./EmailFeedPanel";
import type { CouponRedemption } from "./CouponsPanel";
import type { WaveDraftRow } from "./WaveDraftPanel";
import type { ActivityEvent } from "./ActivityFeedPanel";
import type { BookkeepingRiskRow } from "./BookkeepingRiskPanel";
import type { HealthSnapshot } from "./HealthTiles";
import type { PendingCouponRow } from "./PendingCouponsPanel";
import type { CartAbandonRow } from "./CartAbandonPanel";
import type { FailedEmailRow } from "./FailedEmailsPanel";
import type { TelegramHealth } from "./TelegramHealthPanel";
import type { BlitzSnapshot } from "./IndustryBlitzPanel";
import type { SeoRankMovers, SeoMover } from "./SeoRankMoversPanel";
import type { PriceConsistencyRow } from "./PriceConsistencyPanel";
import { checkPriceConsistency } from "@/lib/data/price-consistency";
import type { RefundPendingRow } from "./RefundsPendingPanel";
import type { WebhookEvent, WebhookSourceGroup } from "./WebhookHealthPanel";
import type { EmailDeliveryHealth } from "./EmailDeliveryHealthPanel";
import { buildEmailVolumeSnapshot, type EmailVolumeSnapshot } from "./EmailVolumePanel";
import type { StaffAction } from "./StaffActionsPanel";
import { buildRollup, type StatusRollup } from "@/lib/lifecycle/rollup";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

const WINDOW_DAYS = 7;
const STUCK_PENDING_PAYMENT_HOURS = 24;

// Every cron expected to call recordCronRun() at the end of a successful run.
// Window = max acceptable age between runs. Stale = alert.
// 2026-05-26 audit findings:
//   - Original list used underscore names (payment_failure_recovery, wave_reconcile,
//     daily_digest, keepalive) — but the crons actually record kebab-case names
//     (payment-followup, reconcile-payments, daily-payment-digest, keepalive).
//     Heartbeat panel was silently showing every row as stale because no row in
//     cron_runs matched the expected names. Fixed to use actual recorded names.
//   - aging-orders, stale-quotes, gsc-sync, keepalive previously had no heartbeat
//     call at all → now instrumented (this commit) and added here.
//   - keepalive window 2h → 26h (was flagging false positives — runs daily).
// gsc-backfill and process-blitz-replies are manual-trigger only, not scheduled,
// so they're intentionally excluded from this list (no expected cadence).
const EXPECTED_CRONS: Array<{ name: string; maxAgeHours: number }> = [
  { name: "payment-followup",       maxAgeHours: 2  },  // hourly
  { name: "stale-quotes",           maxAgeHours: 2  },  // hourly
  { name: "daily-payment-digest",   maxAgeHours: 26 },  // daily 13:00 UTC
  { name: "reconcile-payments",     maxAgeHours: 26 },  // daily 15:00 UTC
  { name: "aging-orders",           maxAgeHours: 26 },  // daily 09:00 MT
  { name: "keepalive",              maxAgeHours: 26 },  // daily 12:00 UTC
  { name: "gsc-sync",               maxAgeHours: 26 },  // daily
  { name: "ga4-sync",               maxAgeHours: 26 },  // daily — Phase 9d defense-in-depth alongside gsc-sync
  { name: "dashboard-alerts",       maxAgeHours: 2  },  // hourly Telegram push layer
  { name: "wave-poll",              maxAgeHours: 7  },  // every 6h — backfills Wave state changes the webhook missed
];

export interface LifecycleData {
  rows: LifecycleRow[];
  heartbeats: Heartbeat[];
  orphans: Orphan[];
  quotes: QuoteRow[];
  signups: SignupRow[];
  emailFeed: EmailEvent[];
  redemptions: CouponRedemption[];
  waveDrafts: WaveDraftRow[];
  activity: ActivityEvent[];
  bookkeepingRisks: BookkeepingRiskRow[];
  health: HealthSnapshot;
  pendingCoupons: PendingCouponRow[];
  cartAbandons: CartAbandonRow[];
  failedEmails: FailedEmailRow[];
  telegramHealth: TelegramHealth;
  blitz: BlitzSnapshot;
  seoMovers: SeoRankMovers;
  priceConsistency: PriceConsistencyRow[];
  refundsPending: RefundPendingRow[];
  webhookGroups: WebhookSourceGroup[];
  emailDeliveryHealth: EmailDeliveryHealth;
  emailVolume: EmailVolumeSnapshot;
  staffActions: StaffAction[];
  rollup: StatusRollup;
  fetched_at: string;
}

export async function fetchLifecycleData(): Promise<LifecycleData> {
  const supabase = createServiceClient();
  const now = Date.now();
  const cutoffMs = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = new Date(cutoffMs).toISOString();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

  // ── fan-out queries ──────────────────────────────────────────────────────
  const [
    ordersRes,
    emailLogRes,
    quoteRes,
    customerRes,
    redemptionRes,
    couponRes,
    heartbeatRes,
    paidWaveRes,
    auditRes,
    webhookEventsRes,
    emailDeliveryRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, payment_method, total, is_rush, wave_invoice_id, wave_invoice_number, wave_invoice_approved_at, wave_payment_recorded_at, proof_sent_at, created_at, notes, customer_id, utm_source, utm_campaign, referrer_source, referrer_medium, raw_referrer, customers (name, email)")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("email_log")
      .select("id, to_address, subject, sent_at, status, order_id")
      .gte("sent_at", cutoff)
      .order("sent_at", { ascending: false })
      .limit(2000),
    supabase
      .from("quote_requests")
      .select("id, name, email, items, created_at, replied_at, is_archived, quote_total_cents")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("customers")
      .select("id, email, name, created_at, order_count, total_spent, pending_discount_code")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("discount_redemptions")
      .select("id, code_id, customer_id, order_id, amount_saved, redeemed_at")
      .gte("redeemed_at", cutoff)
      .order("redeemed_at", { ascending: false })
      .limit(200),
    supabase
      .from("discount_codes")
      .select("id, code, type")
      .limit(200),
    supabase
      .from("cron_runs")
      .select("cron_name, ran_at, ok, detail")
      .order("ran_at", { ascending: false })
      .limit(200),
    // Paid-but-Wave-not-reconciled (no time window — bookkeeping doesn't expire)
    supabase
      .from("orders")
      .select("id, order_number, total, status, wave_invoice_id, wave_invoice_number, wave_payment_recorded_at, wave_invoice_approved_at, updated_at, created_at, customers (name)")
      .in("status", ["paid", "in_production", "ready_for_pickup", "completed"])
      .or("wave_invoice_id.is.null,wave_payment_recorded_at.is.null")
      .order("created_at", { ascending: false })
      .limit(100),
    // audit_events (Round 2 — ground-truth event log; supersedes inferred-from-timestamps for newly-recorded events)
    supabase
      .from("audit_events")
      .select("id, at, actor_type, actor_id, event_type, entity_type, entity_id, detail")
      .gte("at", cutoff)
      .order("at", { ascending: false })
      .limit(500),
    // Webhook event log — last N per source (wave + clover). We pull a larger
    // pool then split client-side; this keeps the round-trip count flat.
    supabase
      .from("webhook_events")
      .select("id, received_at, event_source, event_type, resource_id, matched_order_id, ok, detail")
      .in("event_source", ["wave", "clover"])
      .order("received_at", { ascending: false })
      .limit(120),
    // Email delivery health — aggregate counts for last 7 days
    // to_address pulled here so we can derive the per-recipient volume panel
    // off the same query (no extra round-trip).
    supabase
      .from("email_log")
      .select("id, sent_at, delivered_at, opened_at, bounced_at, to_address")
      .gte("sent_at", cutoff)
      .limit(5000),
  ]);

  const orders = ordersRes.data ?? [];
  const emailLog = emailLogRes.data ?? [];
  const quotes = quoteRes.data ?? [];
  const customers = customerRes.data ?? [];
  const redemptions = redemptionRes.data ?? [];
  const couponCodes = couponRes.data ?? [];
  const heartbeatRaw = heartbeatRes.data ?? [];
  const paidWave = paidWaveRes.data ?? [];
  const auditRaw = auditRes.data ?? [];
  const webhookEventsRaw = webhookEventsRes.data ?? [];
  const emailDeliveryRaw = emailDeliveryRes.data ?? [];

  // ── derive lifecycle rows (existing logic, plus pay_link pip) ─────────────
  const customerEmails = new Set<string>();
  const orderIdSet = new Set<string>();
  for (const o of orders) {
    orderIdSet.add(o.id);
    const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    if (c?.email) customerEmails.add(c.email.toLowerCase());
  }

  const rows: LifecycleRow[] = orders.map((o) => {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const customerEmail = customer?.email?.toLowerCase() ?? "";
    const customerName = customer?.name ?? "—";
    const createdAt = o.created_at ? new Date(o.created_at) : new Date();
    const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);

    const orderEmails = emailLog.filter((e) => {
      if (e.order_id === o.id) return true;
      if (e.order_id) return false;
      if (e.to_address?.toLowerCase() !== customerEmail) return false;
      if (!e.sent_at) return false;
      return new Date(e.sent_at).getTime() >= createdAt.getTime();
    });

    const hasSubject = (re: RegExp): boolean => orderEmails.some((e) => e.subject && re.test(e.subject));

    const customerConfirmSent = hasSubject(/Complete your payment|Order .* received|Order confirmation/i);
    const payLinkSent = hasSubject(/^(Payment Request|Your Quote|Complete your payment|.*is waiting)/i);
    const receiptSent = hasSubject(/^Receipt |Payment received/i);
    const proofEmailSent = !!o.proof_sent_at || hasSubject(/proofs? ready|approve your/i);
    const reviewSent = hasSubject(/How did your order|review request/i);

    const orderNumber = o.order_number ?? "";
    const staffNotifSent = orderNumber
      ? emailLog.some((e) => e.subject?.includes(`NEW ORDER ${orderNumber}`))
      : false;

    const stuckPendingPayment = o.status === "pending_payment" && ageHours > STUCK_PENDING_PAYMENT_HOURS;

    return {
      id: o.id,
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      status: o.status ?? "unknown",
      payment_method: o.payment_method ?? "—",
      total: typeof o.total === "number" ? o.total : Number(o.total ?? 0),
      is_rush: !!o.is_rush,
      wave_invoice_id: o.wave_invoice_id,
      wave_paid: !!o.wave_payment_recorded_at,
      created_at: o.created_at ?? new Date().toISOString(),
      age_hours: ageHours,
      stuck_pending_payment: stuckPendingPayment,
      emails: {
        customer_confirm: customerConfirmSent,
        pay_link: payLinkSent,
        receipt: receiptSent,
        proof: proofEmailSent,
        review: reviewSent,
        staff_notif: staffNotifSent,
      },
    };
  });

  // ── derive orphans (pending_payment > 1h, no pay link delivered) ─────────
  const orphans: Orphan[] = [];
  for (const row of rows) {
    if (row.status !== "pending_payment") continue;
    if (row.age_hours < 1) continue;
    if (row.emails.pay_link) continue;
    // Generate recovery URL
    let payLinkUrl = "";
    try {
      const redirectUrl = `${siteUrl}/order-confirmed?oid=${row.id}`;
      const token = encodePaymentToken(row.total, `Order ${row.order_number}`, row.customer_email || undefined, redirectUrl);
      payLinkUrl = `${siteUrl}/pay/${token}`;
    } catch {
      payLinkUrl = "";
    }
    const order = orders.find((o) => o.id === row.id);
    orphans.push({
      id: row.id,
      order_number: row.order_number,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      total: row.total,
      status: row.status,
      age_hours: row.age_hours,
      is_rush: row.is_rush,
      payment_method: row.payment_method,
      pay_link_url: payLinkUrl,
      wave_invoice_number: order?.wave_invoice_number ?? null,
      notes: (order as { notes?: string | null } | undefined)?.notes ?? null,
    });
  }
  orphans.sort((a, b) => b.age_hours - a.age_hours);

  // ── derive quotes ────────────────────────────────────────────────────────
  const quoteRows: QuoteRow[] = quotes.map((q) => {
    const createdAt = q.created_at ? new Date(q.created_at) : new Date();
    const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
    const itemsArr: Array<Record<string, unknown>> = Array.isArray(q.items) ? q.items : [];
    const itemsSummary = itemsArr
      .slice(0, 3)
      .map((it) => {
        const product = typeof it.product === "string" ? it.product : "";
        const qty = typeof it.qty === "number" ? it.qty : 0;
        return qty > 1 ? `${qty}x ${product}` : product;
      })
      .filter(Boolean)
      .join(", ");
    return {
      id: q.id,
      name: q.name ?? "—",
      email: q.email ?? "",
      created_at: q.created_at ?? new Date().toISOString(),
      replied_at: q.replied_at,
      is_archived: !!q.is_archived,
      quote_total_cents: q.quote_total_cents ?? null,
      age_hours: ageHours,
      items_summary: itemsSummary || `${itemsArr.length} item(s)`,
    };
  });

  // ── derive signups (customers in last 7d + their email/order state) ──────
  // Build first-order-per-customer map for source attribution.
  // `orders` is already sorted DESC by created_at; iterate from newest to oldest
  // so the LAST write wins (= earliest order).
  const firstOrderByCustomer = new Map<string, (typeof orders)[number]>();
  for (const o of orders) {
    if (o.customer_id) firstOrderByCustomer.set(o.customer_id, o);
  }
  const signups: SignupRow[] = customers.map((c) => {
    const createdAt = c.created_at ? new Date(c.created_at) : new Date();
    const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
    const emailLower = c.email?.toLowerCase() ?? "";
    const theirEmails = emailLog.filter((e) => e.to_address?.toLowerCase() === emailLower);
    const welcomeSent = theirEmails.some((e) => /Welcome to True Color/i.test(e.subject ?? ""));
    const accountReadySent = theirEmails.some((e) => /account is ready/i.test(e.subject ?? ""));
    const couponIssued = !!c.pending_discount_code;
    const couponRedeemed = redemptions.some((r) => r.customer_id === c.id);
    const firstOrder = firstOrderByCustomer.get(c.id);
    return {
      id: c.id,
      email: c.email ?? "—",
      name: c.name ?? "—",
      created_at: c.created_at ?? new Date().toISOString(),
      age_hours: ageHours,
      order_count: Number(c.order_count ?? 0),
      total_spent: Number(c.total_spent ?? 0),
      welcome_email_sent: welcomeSent,
      account_ready_email_sent: accountReadySent,
      coupon_issued: couponIssued,
      coupon_redeemed: couponRedeemed,
      first_order_source: firstOrder?.referrer_source ?? null,
      first_order_medium: firstOrder?.referrer_medium ?? null,
      first_order_utm_source: firstOrder?.utm_source ?? null,
      first_order_utm_campaign: firstOrder?.utm_campaign ?? null,
      first_order_raw_referrer: firstOrder?.raw_referrer ?? null,
    };
  });

  // ── derive email feed (every email, classified) ──────────────────────────
  const orderById = new Map<string, { order_number: string }>(
    orders.map((o) => [o.id, { order_number: o.order_number ?? "" }])
  );
  // Also pull order_numbers for any order_id referenced in email_log but outside the 7d window
  const extraOrderIds = Array.from(
    new Set(
      emailLog
        .map((e) => e.order_id)
        .filter((id): id is string => !!id && !orderById.has(id))
    )
  );
  if (extraOrderIds.length > 0) {
    const { data: extraOrders } = await supabase
      .from("orders")
      .select("id, order_number")
      .in("id", extraOrderIds);
    for (const o of extraOrders ?? []) {
      orderById.set(o.id, { order_number: o.order_number ?? "" });
    }
  }
  const emailFeed: EmailEvent[] = emailLog.map((e) => ({
    id: e.id,
    sent_at: e.sent_at ?? new Date().toISOString(),
    to_address: e.to_address ?? "",
    subject: e.subject ?? "",
    status: e.status ?? "sent",
    order_id: e.order_id,
    order_number: e.order_id ? orderById.get(e.order_id)?.order_number ?? null : null,
    type: classifyEmail(e.subject ?? ""),
  }));

  // ── derive coupon redemptions (joined with code + customer + order) ──────
  const codeById = new Map(couponCodes.map((c) => [c.id, c]));
  const customerById = new Map<string, { email: string | null }>(
    customers.map((c) => [c.id, { email: c.email ?? null }])
  );
  const redemptionOrderIds = Array.from(
    new Set(redemptions.map((r) => r.order_id).filter((id): id is string => !!id))
  );
  let redemptionOrders: Array<{ id: string; order_number: string | null }> = [];
  if (redemptionOrderIds.length > 0) {
    const { data: ro } = await supabase
      .from("orders")
      .select("id, order_number")
      .in("id", redemptionOrderIds);
    redemptionOrders = ro ?? [];
  }
  const redemptionOrderMap = new Map(redemptionOrders.map((o) => [o.id, o.order_number ?? null]));

  const redemptionRows: CouponRedemption[] = redemptions.map((r) => {
    const code = codeById.get(r.code_id);
    const customer = customerById.get(r.customer_id);
    return {
      id: r.id,
      redeemed_at: r.redeemed_at ?? new Date().toISOString(),
      code: code?.code ?? "—",
      code_type: code?.type ?? null,
      customer_email: customer?.email ?? "—",
      order_id: r.order_id,
      order_number: r.order_id ? redemptionOrderMap.get(r.order_id) ?? null : null,
      amount_saved: Number(r.amount_saved ?? 0),
    };
  });

  // ── derive Wave bookkeeping issues ───────────────────────────────────────
  const waveDrafts: WaveDraftRow[] = paidWave.map((o) => {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const updatedAt = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at ?? Date.now());
    const ageHours = (now - updatedAt.getTime()) / (1000 * 60 * 60);
    const reason: WaveDraftRow["reason"] = !o.wave_invoice_id ? "missing_invoice" : "draft_unapproved";
    return {
      id: o.id,
      order_number: o.order_number ?? "",
      customer_name: customer?.name ?? "—",
      total: Number(o.total ?? 0),
      status: o.status ?? "—",
      paid_age_hours: ageHours,
      wave_invoice_id: o.wave_invoice_id,
      wave_invoice_number: o.wave_invoice_number,
      reason,
    };
  });

  // ── derive heartbeats ────────────────────────────────────────────────────
  const latestByName = new Map<string, { ran_at: string; ok: boolean; detail: string | null }>();
  // Per-cron 24h windows: total runs + errored runs (ok=false OR detail "errors=N>0").
  // Captures the wave-poll silent-fail pattern: ok=true was returned because
  // wave_errors < candidates.length / 2, yet "errors=5" appears in detail.
  const cron24hStats = new Map<string, { total: number; errored: number }>();
  const cutoff24Ms24 = now - 24 * 60 * 60 * 1000;
  const errorsTokenRe = /\berrors?=(\d+)/i;
  for (const row of heartbeatRaw) {
    if (!row.cron_name || !row.ran_at) continue;
    if (!latestByName.has(row.cron_name)) {
      latestByName.set(row.cron_name, {
        ran_at: row.ran_at,
        ok: !!row.ok,
        detail: row.detail ?? null,
      });
    }
    if (new Date(row.ran_at).getTime() < cutoff24Ms24) continue;
    const stat = cron24hStats.get(row.cron_name) ?? { total: 0, errored: 0 };
    stat.total += 1;
    const match = row.detail ? errorsTokenRe.exec(row.detail) : null;
    const detailErrors = match ? Number(match[1]) : 0;
    if (!row.ok || detailErrors > 0) stat.errored += 1;
    cron24hStats.set(row.cron_name, stat);
  }
  const heartbeats: Heartbeat[] = EXPECTED_CRONS.map((c) => {
    const latest = latestByName.get(c.name);
    const stat = cron24hStats.get(c.name) ?? { total: 0, errored: 0 };
    const errRate = stat.total > 0 ? stat.errored / stat.total : null;
    if (!latest) {
      return {
        name: c.name,
        last_ran_at: null,
        hours_ago: null,
        max_age_hours: c.maxAgeHours,
        ok: false,
        stale: true,
        detail: "never ran",
        runs_24h: stat.total,
        errored_runs_24h: stat.errored,
        error_rate_24h: errRate,
      };
    }
    const hoursAgo = (now - new Date(latest.ran_at).getTime()) / (1000 * 60 * 60);
    return {
      name: c.name,
      last_ran_at: latest.ran_at,
      hours_ago: hoursAgo,
      max_age_hours: c.maxAgeHours,
      ok: latest.ok,
      stale: hoursAgo > c.maxAgeHours,
      detail: latest.detail,
      runs_24h: stat.total,
      errored_runs_24h: stat.errored,
      error_rate_24h: errRate,
    };
  });

  // ── derive unified activity feed (events from timestamps) ───────────────
  const activity: ActivityEvent[] = [];

  // Signups
  for (const c of customers) {
    if (!c.created_at) continue;
    activity.push({
      id: `signup:${c.id}`,
      at: c.created_at,
      type: "signup",
      actor: "customer",
      who_name: c.name ?? null,
      who_email: c.email ?? null,
      detail: c.pending_discount_code ? `coupon issued: ${c.pending_discount_code}` : "new account",
      order_id: null,
      order_number: null,
    });
  }

  // Order events (multiple per order)
  for (const o of orders) {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const who_name = customer?.name ?? null;
    const who_email = customer?.email ?? null;
    const totalStr = `$${Number(o.total ?? 0).toFixed(2)}`;

    if (o.created_at) {
      activity.push({
        id: `order_placed:${o.id}`,
        at: o.created_at,
        type: "order_placed",
        actor: "customer",
        who_name, who_email,
        detail: `${totalStr} · ${o.payment_method ?? "—"} · ${o.is_rush ? "RUSH" : "standard"}`,
        order_id: o.id,
        order_number: o.order_number ?? null,
      });
    }
    if (o.wave_invoice_approved_at) {
      activity.push({
        id: `wave_approved:${o.id}`,
        at: o.wave_invoice_approved_at,
        type: "wave_approved",
        actor: "staff",
        who_name, who_email,
        detail: `Wave #${o.wave_invoice_number ?? "?"} approved · ${totalStr}`,
        order_id: o.id,
        order_number: o.order_number ?? null,
      });
    }
    if (o.wave_payment_recorded_at) {
      activity.push({
        id: `payment_recorded:${o.id}`,
        at: o.wave_payment_recorded_at,
        type: "payment_recorded",
        actor: "system",
        who_name, who_email,
        detail: `payment captured + Wave updated · ${totalStr}`,
        order_id: o.id,
        order_number: o.order_number ?? null,
      });
    }
    if (o.proof_sent_at) {
      activity.push({
        id: `proof_sent:${o.id}`,
        at: o.proof_sent_at,
        type: "proof_sent",
        actor: "staff",
        who_name, who_email,
        detail: "proof emailed to customer",
        order_id: o.id,
        order_number: o.order_number ?? null,
      });
    }
  }

  // Quote requests + replies
  for (const q of quotes) {
    if (q.created_at) {
      const itemsArr: Array<Record<string, unknown>> = Array.isArray(q.items) ? q.items : [];
      activity.push({
        id: `quote_received:${q.id}`,
        at: q.created_at,
        type: "quote_received",
        actor: "customer",
        who_name: q.name ?? null,
        who_email: q.email ?? null,
        detail: `${itemsArr.length} item(s)${q.quote_total_cents ? ` · $${(q.quote_total_cents / 100).toFixed(2)}` : ""}`,
        order_id: null,
        order_number: null,
      });
    }
    if (q.replied_at) {
      activity.push({
        id: `quote_replied:${q.id}`,
        at: q.replied_at,
        type: "quote_replied",
        actor: "staff",
        who_name: q.name ?? null,
        who_email: q.email ?? null,
        detail: q.quote_total_cents ? `replied with quote $${(q.quote_total_cents / 100).toFixed(2)}` : "staff replied",
        order_id: null,
        order_number: null,
      });
    }
  }

  // Coupon redemptions
  for (const r of redemptionRows) {
    activity.push({
      id: `coupon_redeemed:${r.id}`,
      at: r.redeemed_at,
      type: "coupon_redeemed",
      actor: "customer",
      who_name: null,
      who_email: r.customer_email,
      detail: `${r.code} · -$${r.amount_saved.toFixed(2)}`,
      order_id: r.order_id,
      order_number: r.order_number,
    });
  }

  // Merge in audit_events (ground-truth event log — supersedes inferred events
  // for the same entity+event_type pair where both exist). For now both render;
  // the audit-sourced row is distinguishable by its id prefix "audit:".
  const auditTypeMap: Record<string, { type: ActivityEvent["type"]; label: (d: Record<string, unknown> | null) => string }> = {
    "order.created": {
      type: "order_placed",
      label: (d) => `$${Number(d?.total ?? 0).toFixed(2)} · ${d?.payment_method ?? "—"} · ${d?.is_rush ? "RUSH" : "standard"}`,
    },
    "order.status_changed": {
      type: "payment_recorded",
      label: (d) => `${d?.from ?? "?"} → ${d?.to ?? "?"}${d?.manual ? " · manual" : ""}`,
    },
    "coupon.issued": {
      type: "coupon_redeemed", // closest match in current type enum; could split later
      label: (d) => `code: ${d?.code ?? "?"}`,
    },
    "wave.approve_failed": {
      type: "wave_approve_failed",
      label: (d) => {
        const inv = d?.wave_invoice_number ?? d?.wave_invoice_id ?? "?";
        const err = typeof d?.error === "string" ? (d.error as string).slice(0, 80) : "no message";
        return `Wave inv ${inv} stuck DRAFT · ${err}`;
      },
    },
  };
  for (const ae of auditRaw) {
    const mapped = auditTypeMap[ae.event_type];
    if (!mapped) continue;
    const detail = (ae.detail ?? null) as Record<string, unknown> | null;
    const orderNumber = detail?.order_number as string | undefined ?? null;
    const customerEmail = detail?.customer_email as string | undefined ?? (ae.actor_type === "customer" ? (ae.actor_id ?? null) : null);
    const actorMapped: ActivityEvent["actor"] = ae.actor_type === "cron" ? "system" : (ae.actor_type as ActivityEvent["actor"]);
    activity.push({
      id: `audit:${ae.id}`,
      at: ae.at,
      type: mapped.type,
      actor: actorMapped,
      who_name: null,
      who_email: customerEmail,
      detail: mapped.label(detail),
      order_id: ae.entity_type === "order" ? ae.entity_id : null,
      order_number: orderNumber,
    });
  }

  // Newest first
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // ── derive Bookkeeping risks (audit-surfaced silent-fail surfaces) ───────
  const bookkeepingRisks: BookkeepingRiskRow[] = [];
  const PAID_STATES = new Set(["paid", "in_production", "ready_for_pickup", "completed"]);
  // We need ALL orders (not just 7d) to catch historical silent desyncs — we already
  // fetched paidWave for this purpose; pull the broader silent-fail conditions from it.
  for (const o of paidWave) {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const customerName = customer?.name ?? "—";
    const createdAt = o.created_at ? new Date(o.created_at) : new Date();
    const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
    const totalNum = Number(o.total ?? 0);
    const isPaid = PAID_STATES.has(o.status ?? "");
    if (!o.wave_invoice_id && isPaid) {
      bookkeepingRisks.push({
        id: o.id, order_number: o.order_number ?? "", customer_name: customerName,
        status: o.status ?? "—", payment_method: "—", total: totalNum, age_hours: ageHours,
        category: "no_wave_invoice",
        diagnosis: "Order is paid but has no bookkeeping invoice — accounting API likely failed at order creation.",
        remediation: "Open accounting dashboard → create invoice manually for this customer + amount. Then link the invoice ID to this order in staff portal.",
      });
    }
    if (o.wave_invoice_id && o.wave_invoice_approved_at && !o.wave_payment_recorded_at && isPaid) {
      bookkeepingRisks.push({
        id: o.id, order_number: o.order_number ?? "", customer_name: customerName,
        status: o.status ?? "—", payment_method: "—", total: totalNum, age_hours: ageHours,
        category: "half_recorded",
        diagnosis: "Invoice approved but payment never recorded. Customer's tax invoice shows UNPAID (2026-05-22 bug class).",
        remediation: "Open invoice in accounting dashboard → record payment manually for the captured amount. Then re-check the payment is reconciled.",
      });
    }
    // Inconsistent invoice id vs number
    if ((o.wave_invoice_id && !o.wave_invoice_number) || (!o.wave_invoice_id && o.wave_invoice_number)) {
      bookkeepingRisks.push({
        id: o.id, order_number: o.order_number ?? "", customer_name: customerName,
        status: o.status ?? "—", payment_method: "—", total: totalNum, age_hours: ageHours,
        category: "invoice_number_hole",
        diagnosis: "Bookkeeping invoice ID / number mismatch — one is set without the other.",
        remediation: "Verify invoice exists in the accounting dashboard; backfill the missing column from the accounting API.",
      });
    }
  }
  // Also surface SLA violations + NULL payment_reference from in-window orders
  for (const o of orders) {
    if (o.status === "pending_payment") {
      const createdAt = o.created_at ? new Date(o.created_at) : new Date();
      const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > 72) {
        const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        bookkeepingRisks.push({
          id: o.id, order_number: o.order_number ?? "", customer_name: customer?.name ?? "—",
          status: o.status, payment_method: o.payment_method ?? "—", total: Number(o.total ?? 0), age_hours: ageHours,
          category: "sla_violation",
          diagnosis: "Order has been pending_payment for over 72h — payment-followup cron should have recovered or staff should have voided.",
          remediation: "Either resend a fresh Pay Now link via the Orphans panel OR void/archive the order.",
        });
      }
    }
  }

  // ── derive Health tiles ─────────────────────────────────────────────────
  const cutoff24Ms = now - 24 * 60 * 60 * 1000;
  const ordersIn24h = orders.filter((o) => o.created_at && new Date(o.created_at).getTime() >= cutoff24Ms);
  const emails24h = emailLog.filter((e) => e.sent_at && new Date(e.sent_at).getTime() >= cutoff24Ms);
  const payLinks7d = emailLog.filter((e) => /^(Payment Request|Your Quote|Your Custom Print Quote|Complete your payment)/i.test(e.subject ?? ""));
  const payLinks24h = payLinks7d.filter((e) => e.sent_at && new Date(e.sent_at).getTime() >= cutoff24Ms);
  const signups24h = customers.filter((c) => c.created_at && new Date(c.created_at).getTime() >= cutoff24Ms);
  const redemptions24h = redemptions.filter((r) => r.redeemed_at && new Date(r.redeemed_at).getTime() >= cutoff24Ms);
  const revenue7d = orders
    .filter((o) => o.wave_payment_recorded_at)
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const revenue24h = orders
    .filter((o) => o.wave_payment_recorded_at && new Date(o.wave_payment_recorded_at).getTime() >= cutoff24Ms)
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const paymentsCaptured7d = orders.filter((o) => o.wave_payment_recorded_at).length;
  const paymentsCaptured24h = orders.filter((o) => o.wave_payment_recorded_at && new Date(o.wave_payment_recorded_at).getTime() >= cutoff24Ms).length;
  const health: HealthSnapshot = {
    orders_24h: ordersIn24h.length,
    orders_7d: orders.length,
    revenue_24h: revenue24h,
    revenue_7d: revenue7d,
    emails_24h: emails24h.length,
    emails_7d: emailLog.length,
    pay_links_24h: payLinks24h.length,
    pay_links_7d: payLinks7d.length,
    signups_24h: signups24h.length,
    signups_7d: customers.length,
    coupons_redeemed_24h: redemptions24h.length,
    coupons_redeemed_7d: redemptions.length,
    payments_captured_24h: paymentsCaptured24h,
    payments_captured_7d: paymentsCaptured7d,
  };

  // ── derive Pending coupons (issued but not redeemed) ────────────────────
  const { data: pendingCouponsRaw } = await supabase
    .from("customers")
    .select("id, email, name, pending_discount_code, updated_at, order_count")
    .not("pending_discount_code", "is", null);
  const pendingCoupons: PendingCouponRow[] = (pendingCouponsRaw ?? []).map((c) => {
    const updatedAt = c.updated_at ? new Date(c.updated_at) : new Date();
    return {
      customer_id: c.id,
      customer_name: c.name ?? "",
      customer_email: c.email ?? "",
      code: c.pending_discount_code ?? "",
      issued_age_hours: (now - updatedAt.getTime()) / (1000 * 60 * 60),
      customer_order_count: Number(c.order_count ?? 0),
    };
  });
  pendingCoupons.sort((a, b) => b.issued_age_hours - a.issued_age_hours);

  // ── Round 3: cart abandons ───────────────────────────────────────────────
  const orderEmailSet = new Set(
    orders
      .map((o) => {
        const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        return c?.email?.toLowerCase() ?? null;
      })
      .filter((e): e is string => !!e)
  );
  const { data: checkoutSessionsRaw } = await supabase
    .from("checkout_sessions")
    .select("id, email, name, created_at, followup_sent_at")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(100);
  const cartAbandons: CartAbandonRow[] = (checkoutSessionsRaw ?? [])
    .filter((cs) => cs.email && !orderEmailSet.has(cs.email.toLowerCase()))
    .map((cs) => {
      const createdAt = cs.created_at ? new Date(cs.created_at) : new Date();
      return {
        id: cs.id,
        email: cs.email,
        name: cs.name ?? "",
        created_at: cs.created_at,
        age_hours: (now - createdAt.getTime()) / (1000 * 60 * 60),
        followup_sent: !!cs.followup_sent_at,
      };
    });

  // ── Round 3: failed emails ──────────────────────────────────────────────
  const { data: failedRaw } = await supabase
    .from("email_log")
    .select("id, sent_at, to_address, subject, status, bounced_at, complained_at, delivery_delayed_at, last_event_detail")
    .or("bounced_at.not.is.null,complained_at.not.is.null,delivery_delayed_at.not.is.null")
    .gte("sent_at", cutoff)
    .order("sent_at", { ascending: false })
    .limit(100);
  const failedEmails: FailedEmailRow[] = (failedRaw ?? []).map((e) => {
    let failure_type: FailedEmailRow["failure_type"] = "bounced";
    let failure_at = e.sent_at ?? new Date().toISOString();
    if (e.complained_at) { failure_type = "complained"; failure_at = e.complained_at; }
    else if (e.bounced_at) { failure_type = "bounced"; failure_at = e.bounced_at; }
    else if (e.delivery_delayed_at) { failure_type = "delivery_delayed"; failure_at = e.delivery_delayed_at; }
    return {
      id: e.id,
      sent_at: e.sent_at ?? new Date().toISOString(),
      to_address: e.to_address ?? "",
      subject: e.subject ?? "",
      status: e.status ?? "",
      failure_type,
      failure_at,
      detail: e.last_event_detail,
    };
  });

  // ── Round 3: Telegram health ────────────────────────────────────────────
  const { data: telegramRaw } = await supabase
    .from("telegram_log")
    .select("sent_at, ok, error, category")
    .gte("sent_at", new Date(cutoff24Ms).toISOString())
    .order("sent_at", { ascending: false })
    .limit(500);
  const tgRows = telegramRaw ?? [];
  const tgOk = tgRows.filter((r) => r.ok).length;
  const tgFail = tgRows.filter((r) => !r.ok);
  const telegramHealth: TelegramHealth = {
    total_24h: tgRows.length,
    ok_24h: tgOk,
    fail_24h: tgFail.length,
    last_failure_at: tgFail[0]?.sent_at ?? null,
    last_failure_error: tgFail[0]?.error ?? null,
    last_failure_category: tgFail[0]?.category ?? null,
  };

  // ── Round 3: Industry blitz snapshot ────────────────────────────────────
  const { count: totalLeadsCount } = await supabase
    .from("tc_leads")
    .select("*", { count: "exact", head: true });
  const { data: blitzSendsRaw } = await supabase
    .from("tc_email_sends")
    .select("sent_at, opened_at, clicked_at")
    .gte("sent_at", new Date(cutoff24Ms).toISOString());
  const blitzSends = blitzSendsRaw ?? [];
  const { data: campaignsRaw } = await supabase
    .from("tc_campaigns")
    .select("campaign_slug, campaign_name, status, total_sent, emails_sent, opens, clicks, orders_generated")
    .neq("status", "draft")
    .order("launched_at", { ascending: false, nullsFirst: false })
    .limit(8);
  // Pull the most recent send across ALL time so we can flag silent-death when
  // an active campaign exists but the drip stopped firing (>48h since last send).
  const { data: lastSendRow } = await supabase
    .from("tc_email_sends")
    .select("sent_at")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastSendAt = (lastSendRow?.sent_at as string | undefined) ?? blitzSends[0]?.sent_at ?? null;
  const activeCampaigns = (campaignsRaw ?? []).filter((c) => c.status === "active");
  const lastSendAgeH = lastSendAt ? (now - new Date(lastSendAt).getTime()) / 3_600_000 : Infinity;
  const blitzStale = activeCampaigns.length > 0 && lastSendAgeH > 48;
  const blitz: BlitzSnapshot = {
    total_leads: Number(totalLeadsCount ?? 0),
    emails_sent_24h: blitzSends.length,
    emails_opened_24h: blitzSends.filter((s) => s.opened_at).length,
    emails_clicked_24h: blitzSends.filter((s) => s.clicked_at).length,
    last_send_at: lastSendAt,
    is_stale: blitzStale,
    active_campaigns: (campaignsRaw ?? []).map((c) => ({
      slug: c.campaign_slug ?? "",
      name: c.campaign_name ?? "",
      status: c.status ?? "—",
      sent: Number(c.total_sent ?? c.emails_sent ?? 0),
      opens: Number(c.opens ?? 0),
      clicks: Number(c.clicks ?? 0),
      orders_generated: Number(c.orders_generated ?? 0),
    })),
  };

  // ── Round 3: SEO rank movers (vs 7d ago) ────────────────────────────────
  const seoToday = new Date(now);
  const seoPrior = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const seoTodayCutoff = new Date(now - 36 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const seoPriorCutoff = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // Filter at DB level: only rows with meaningful impressions count toward movers.
  // Was pulling up to 10k rows; the post-fetch impressions<5 filter discarded most.
  // Tightened query reduces both row transfer and memory pressure.
  const { data: seoRows } = await supabase
    .from("seo_gsc_snapshots")
    .select("snapshot_date, query, page, clicks, impressions, position")
    .gte("snapshot_date", seoPriorCutoff)
    .gte("impressions", 5)
    .order("snapshot_date", { ascending: false })
    .limit(5000);
  // Build per-(query, page) most-recent vs ~7d-prior pairs
  const seoLatest = new Map<string, { date: string; clicks: number; impressions: number; position: number }>();
  const seoPriorMap = new Map<string, { date: string; position: number }>();
  for (const r of seoRows ?? []) {
    if (!r.query || !r.page || r.position == null) continue;
    const key = `${r.query}|${r.page}`;
    const isRecent = r.snapshot_date >= seoTodayCutoff;
    const isPrior = r.snapshot_date <= seoPriorCutoff;
    if (isRecent) {
      const cur = seoLatest.get(key);
      if (!cur || r.snapshot_date > cur.date) {
        seoLatest.set(key, { date: r.snapshot_date, clicks: Number(r.clicks ?? 0), impressions: Number(r.impressions ?? 0), position: Number(r.position) });
      }
    } else if (isPrior) {
      const cur = seoPriorMap.get(key);
      if (!cur || r.snapshot_date > cur.date) {
        seoPriorMap.set(key, { date: r.snapshot_date, position: Number(r.position) });
      }
    }
  }
  const moves: SeoMover[] = [];
  for (const [key, latest] of seoLatest) {
    const prior = seoPriorMap.get(key);
    if (!prior) continue;
    if (latest.impressions < 5) continue; // ignore noise
    const delta = prior.position - latest.position;
    if (Math.abs(delta) < 1) continue;
    const [query, page] = key.split("|");
    moves.push({
      query, page,
      current_pos: latest.position,
      prior_pos: prior.position,
      delta,
      current_clicks: latest.clicks,
      current_impressions: latest.impressions,
    });
  }
  moves.sort((a, b) => b.delta - a.delta);
  const seoMovers: SeoRankMovers = {
    winners: moves.filter((m) => m.delta > 0).slice(0, 8),
    losers: moves.filter((m) => m.delta < 0).slice(-8).reverse(),
  };
  // Suppress unused locals (used for type inference but variables themselves not referenced after)
  void seoToday; void seoPrior;

  // ── derive webhook event groups (wave + clover) ───────────────────────────
  // We already fetched all orders in the 7-day window; build a quick id→number map.
  // Webhook events for orders outside the 7-day window won't get a number resolved
  // (they'll show matched_order_number: null), which is fine — the UUID is still shown.
  const orderNumberById = new Map<string, string>();
  for (const o of orders) {
    if (o.id && o.order_number) orderNumberById.set(o.id, o.order_number);
  }
  const cutoff24Iso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const allWebhookEvents: WebhookEvent[] = webhookEventsRaw.map((e) => ({
    id: String(e.id),
    received_at: e.received_at,
    event_source: e.event_source ?? "unknown",
    event_type: e.event_type,
    resource_id: e.resource_id ?? null,
    matched_order_id: e.matched_order_id ?? null,
    matched_order_number: e.matched_order_id ? (orderNumberById.get(e.matched_order_id) ?? null) : null,
    ok: e.ok,
    detail: e.detail ?? null,
  }));
  const buildGroup = (source: string, label: string): WebhookSourceGroup => {
    const all = allWebhookEvents.filter((e) => e.event_source === source);
    const in24h = all.filter((e) => e.received_at >= cutoff24Iso);
    return {
      source,
      label,
      events: all.slice(0, 30),
      last_event_at: all[0]?.received_at ?? null,
      total_24h: in24h.length,
      failed_24h: in24h.filter((e) => !e.ok).length,
    };
  };
  const webhookGroups: WebhookSourceGroup[] = [
    buildGroup("wave", "Bookkeeping"),
    buildGroup("clover", "Clover"),
  ];

  // ── derive staff actions + customer pay-link clicks ────────────────────────
  // Every staff button press recorded via recordAuditEvent, plus customer
  // clicks on /pay/[token] links (actor_type='customer', event_type contains
  // 'pay_link_clicked'). The ActivityFeed below shows inferred events from
  // timestamp columns; this panel is the ground-truth button-press log.
  const staffActions: StaffAction[] = auditRaw
    .filter((ae) =>
      ae.actor_type === "staff" ||
      (ae.actor_type === "customer" && ae.event_type === "order.pay_link_clicked")
    )
    .map((ae) => ({
      id: String(ae.id),
      at: ae.at,
      actor: ae.actor_id ?? "staff",
      event_type: ae.event_type,
      entity_type: ae.entity_type,
      entity_id: ae.entity_id,
      order_number: ae.entity_type === "order" ? (orderNumberById.get(ae.entity_id) ?? null) : null,
      detail: (ae.detail ?? null) as Record<string, unknown> | null,
    }));

  // ── derive email delivery health ──────────────────────────────────────────
  const sentCount = emailDeliveryRaw.length;
  const deliveredCount = emailDeliveryRaw.filter((r) => r.delivered_at).length;
  const openedCount = emailDeliveryRaw.filter((r) => r.opened_at).length;
  const bouncedCount = emailDeliveryRaw.filter((r) => r.bounced_at).length;
  const emailDeliveryHealth: EmailDeliveryHealth = {
    sent: sentCount,
    delivered: deliveredCount,
    opened: openedCount,
    bounced: bouncedCount,
    delivery_rate_pct: sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : null,
    open_rate_pct: deliveredCount > 0 ? Math.round((openedCount / deliveredCount) * 100) : null,
  };

  // ── per-recipient volume snapshot ────────────────────────────────────────
  // Same email_log rows, grouped by to_address. Surfaces noisy staff inboxes
  // so we can trim CC/BCC config before customers start hitting spam folders.
  const emailVolume = buildEmailVolumeSnapshot(
    emailDeliveryRaw
      .filter((r): r is typeof r & { to_address: string; sent_at: string } =>
        typeof r.to_address === "string" && typeof r.sent_at === "string"
      )
      .map((r) => ({ to_address: r.to_address, sent_at: r.sent_at }))
  );

  // ── GSC vs GA4 organic-traffic divergence (Phase 9d) ─────────────────────
  // Compare summed clicks/sessions over a stable 7-day window. The window
  // ends 2 days back to dodge GSC's 2-3 day ingestion lag and GA4's <48h lag.
  // Wrapped in try/catch so a missing analytics_ga4_snapshots table (migration
  // not yet applied) doesn't break the whole rollup.
  const divEnd = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const divStart = new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: gscClicksRaw } = await supabase
    .from("seo_gsc_snapshots")
    .select("clicks")
    .gte("snapshot_date", divStart)
    .lte("snapshot_date", divEnd);
  const gscClicks7d = (gscClicksRaw ?? []).reduce(
    (s, r) => s + (Number((r as { clicks: number | null }).clicks) || 0),
    0,
  );
  let ga4Sessions7d = 0;
  let ga4HasData = false;
  try {
    const { data: ga4Raw, error: ga4Err } = await supabase
      .from("analytics_ga4_snapshots")
      .select("sessions")
      .gte("snapshot_date", divStart)
      .lte("snapshot_date", divEnd);
    if (!ga4Err && ga4Raw && ga4Raw.length > 0) {
      ga4Sessions7d = ga4Raw.reduce(
        (s, r) => s + (Number((r as { sessions: number | null }).sessions) || 0),
        0,
      );
      ga4HasData = true;
    }
  } catch {
    // Table not yet migrated — leave divergence null so the rollup signal
    // stays silent until both pipes are live.
  }
  let gscVsGa4DivergencePct: number | null = null;
  if (gscClicks7d > 0 && ga4HasData && ga4Sessions7d > 0) {
    const max = Math.max(gscClicks7d, ga4Sessions7d);
    const diff = Math.abs(gscClicks7d - ga4Sessions7d);
    gscVsGa4DivergencePct = Math.round((diff / max) * 100);
  }

  // ── derive status rollup ─────────────────────────────────────────────────
  // Pure function — single source of truth shared with /api/cron/dashboard-alerts.
  // Adding a new silent-fail surface = ONE registration in buildRollup; both
  // the dashboard tile AND the Telegram alert layer pick it up automatically.
  const rollup: StatusRollup = buildRollup({
    bookkeepingRisks,
    webhookGroups,
    heartbeats,
    waveDrafts,
    orphans,
    reconcileDetail: latestByName.get("reconcile-payments")?.detail ?? null,
    seoProtectedPagesStaleDays: getSeoProtectedPagesStaleDays(),
    gscVsGa4DivergencePct,
  });

  return {
    rows,
    heartbeats,
    orphans,
    quotes: quoteRows,
    signups,
    emailFeed,
    redemptions: redemptionRows,
    waveDrafts,
    activity,
    bookkeepingRisks,
    health,
    pendingCoupons,
    cartAbandons,
    failedEmails,
    telegramHealth,
    blitz,
    seoMovers,
    priceConsistency: checkPriceConsistency(),
    refundsPending: await fetchRefundsPending(supabase, now),
    webhookGroups,
    emailDeliveryHealth,
    emailVolume,
    staffActions,
    rollup,
    fetched_at: new Date(now).toISOString(),
  };
}

function getSeoProtectedPagesStaleDays(): number | null {
  const docPath = join(process.cwd(), ".claude/rules/seo-protected-pages.md");
  if (!existsSync(docPath)) return null;
  try {
    const content = readFileSync(docPath, "utf8");
    const m = content.match(/Last refreshed:\s*(\d{4}-\d{2}-\d{2})/);
    if (m) {
      const refDate = new Date(`${m[1]}T00:00:00Z`);
      return Math.floor((Date.now() - refDate.getTime()) / 86_400_000);
    }
    const mtime = statSync(docPath).mtime.getTime();
    return Math.floor((Date.now() - mtime) / 86_400_000);
  } catch {
    return null;
  }
}

async function fetchRefundsPending(
  supabase: ReturnType<typeof createServiceClient>,
  now: number,
): Promise<RefundPendingRow[]> {
  // Pull every order.repriced event with a negative delta + every later
  // order.refund_processed event. A reprice is "pending" iff there's no
  // matching refund_processed entry on the same order_id AFTER its audit_at.
  const { data: repriced } = await supabase
    .from("audit_events")
    .select("id, at, entity_id, detail")
    .eq("event_type", "order.repriced")
    .order("at", { ascending: false })
    .limit(200);
  const repricedRows = (repriced ?? []).filter((r) => {
    const detail = (r.detail ?? {}) as Record<string, unknown>;
    return typeof detail.delta === "number" && (detail.delta as number) < -0.01;
  });
  if (repricedRows.length === 0) return [];

  const orderIds = Array.from(new Set(repricedRows.map((r) => r.entity_id).filter(Boolean) as string[]));
  const { data: processed } = await supabase
    .from("audit_events")
    .select("entity_id, at")
    .eq("event_type", "order.refund_processed")
    .in("entity_id", orderIds);
  const processedByOrder = new Map<string, string>();
  for (const r of processed ?? []) {
    const existing = processedByOrder.get(r.entity_id);
    if (!existing || r.at > existing) processedByOrder.set(r.entity_id, r.at);
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customers(name, email)")
    .in("id", orderIds);
  const orderById = new Map((orders ?? []).map((o) => [o.id, o]));

  const rows: RefundPendingRow[] = [];
  for (const r of repricedRows) {
    const o = orderById.get(r.entity_id);
    if (!o) continue;
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const detail = (r.detail ?? {}) as Record<string, unknown>;
    const processedAt = processedByOrder.get(r.entity_id);
    // Refund is "already processed" iff a refund_processed event came AFTER this reprice
    const alreadyProcessed = processedAt ? processedAt > r.at : false;
    rows.push({
      audit_id: r.id,
      audit_at: r.at,
      order_id: r.entity_id,
      order_number: o.order_number ?? "",
      customer_email: customer?.email ?? "",
      customer_name: customer?.name ?? "—",
      refund_amount: Math.abs(Number(detail.delta ?? 0)),
      new_total: Number(detail.new_total ?? 0),
      original_total: Number(detail.original_total ?? 0),
      reason: String(detail.reason ?? "—"),
      age_hours: (now - new Date(r.at).getTime()) / (1000 * 60 * 60),
      already_processed: alreadyProcessed,
    });
  }
  return rows;
}
