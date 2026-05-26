/**
 * /staff/lifecycle — Order lifecycle dashboard (Phase 2.5 harness).
 *
 * Read-only join across orders + email_log + cron_runs.
 * Last 7 days. Per-order green/red columns for every side-effect step:
 *   Wave drafted? · Wave paid? · Customer confirm email? · Pay link sent? ·
 *   Payment receipt? · Proof email? · Staff notif? · State age · Stuck flag.
 *
 * Plus a heartbeats panel showing cron freshness (silent-death detector).
 *
 * No new data writes. Pure visibility layer.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { LOGO_PATH } from "@/lib/config";
import { LifecycleTable, type LifecycleRow } from "./LifecycleTable";
import { HeartbeatsPanel, type Heartbeat } from "./HeartbeatsPanel";

export const metadata: Metadata = {
  title: "Lifecycle — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WINDOW_DAYS = 7;
const STUCK_PENDING_PAYMENT_HOURS = 24;

// Cron names we expect to see heartbeats from. Stale if older than max_age_hours.
const EXPECTED_CRONS: Array<{ name: string; maxAgeHours: number }> = [
  { name: "payment_failure_recovery", maxAgeHours: 26 },
  { name: "review_request", maxAgeHours: 26 },
  { name: "wave_reconcile", maxAgeHours: 26 },
  { name: "keepalive", maxAgeHours: 2 },
  { name: "daily_digest", maxAgeHours: 26 },
];

export default async function LifecyclePage() {
  let rows: LifecycleRow[] = [];
  let heartbeats: Heartbeat[] = [];
  let fetchError: string | null = null;

  try {
    [rows, heartbeats] = await Promise.all([fetchLifecycle(), fetchHeartbeats()]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Could not load lifecycle";
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PATH} alt="True Color Display Printing" className="h-8 w-auto object-contain flex-shrink-0" />
            <span className="text-sm font-semibold text-[#1c1712] truncate">Lifecycle</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/staff/orders"
              className="inline-flex items-center min-h-[44px] px-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/staff"
              className="inline-flex items-center min-h-[44px] px-4 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Estimator
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1c1712]">Order Lifecycle</h1>
          <p className="text-gray-500 text-sm mt-1">
            Last {WINDOW_DAYS} days · every side-effect step per order, green/red at a glance
          </p>
        </div>

        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Could not load lifecycle</p>
            <p className="text-red-500 text-sm mt-1">{fetchError}</p>
          </div>
        ) : (
          <>
            <HeartbeatsPanel heartbeats={heartbeats} />
            <LifecycleTable rows={rows} />
          </>
        )}
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        True Color Staff Portal · Lifecycle harness · Internal use only
      </footer>
    </div>
  );
}

async function fetchLifecycle(): Promise<LifecycleRow[]> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_method,
      total,
      is_rush,
      wave_invoice_id,
      wave_payment_recorded_at,
      proof_sent_at,
      created_at,
      customers ( name, email )
      `
    )
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(200);

  if (ordersErr) throw new Error(ordersErr.message);
  if (!orders || orders.length === 0) return [];

  // Collect customer emails to query email_log once
  const customerEmails = Array.from(
    new Set(
      orders
        .map((o) => {
          const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
          return customer?.email?.toLowerCase() ?? null;
        })
        .filter((e): e is string => !!e)
    )
  );

  // email_log is keyed on to_address (no order_id link), so we match by (email + time window)
  const orderIds = orders.map((o) => o.id);

  const emailLog: Array<{
    to_address: string | null;
    subject: string | null;
    sent_at: string | null;
    status: string | null;
    order_id: string | null;
  }> = [];
  if (customerEmails.length > 0) {
    // Pull by (order_id IN ours) OR (to_address IN customer emails) so we catch
    // both the backfilled/linked rows AND the legacy unlinked rows.
    const { data: byOrderId } = await supabase
      .from("email_log")
      .select("to_address, subject, sent_at, status, order_id")
      .in("order_id", orderIds)
      .limit(2000);
    const { data: byEmail } = await supabase
      .from("email_log")
      .select("to_address, subject, sent_at, status, order_id")
      .gte("sent_at", cutoff)
      .in("to_address", customerEmails)
      .limit(2000);
    const seen = new Set<string>();
    for (const row of [...(byOrderId ?? []), ...(byEmail ?? [])]) {
      const key = `${row.sent_at ?? ""}::${row.to_address ?? ""}::${row.subject ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      emailLog.push(row);
    }
  }

  // Staff notifications go to info@true-color.ca — fetch separately
  const { data: staffLog } = await supabase
    .from("email_log")
    .select("to_address, subject, sent_at, status, order_id")
    .gte("sent_at", cutoff)
    .ilike("subject", "NEW ORDER%")
    .limit(2000);

  const now = Date.now();

  return orders.map((o): LifecycleRow => {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const customerEmail = customer?.email?.toLowerCase() ?? "";
    const customerName = customer?.name ?? "—";
    const createdAt = o.created_at ? new Date(o.created_at) : new Date();
    const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);

    // Prefer order_id link when present (accurate); fall back to (email + time window).
    const orderEmails = emailLog.filter((e) => {
      if (e.order_id === o.id) return true;
      if (e.order_id) return false; // linked to a different order
      if (e.to_address?.toLowerCase() !== customerEmail) return false;
      if (!e.sent_at) return false;
      return new Date(e.sent_at).getTime() >= createdAt.getTime();
    });

    const orderNumber = o.order_number ?? "";
    const hasSubject = (patterns: RegExp[]): boolean =>
      orderEmails.some((e) => e.subject && patterns.some((p) => p.test(e.subject!)));

    // Subject patterns derived from src/lib/email/*.ts
    const customerConfirmSent = hasSubject([
      /Complete your payment/i,
      /Order .* received/i,
      /Order confirmation/i,
    ]);
    const payLinkSent = hasSubject([
      /Payment Request/i,
      /Your Quote/i,
      /Complete your payment/i,
    ]);
    const receiptSent = hasSubject([/^Receipt /i, /Payment received/i]);
    const proofEmailSent = !!o.proof_sent_at || hasSubject([/proof/i, /approve your/i]);
    const reviewSent = hasSubject([/How did your order/i, /review/i]);

    // Staff notification — look for "NEW ORDER <order_number>" in staff log
    const staffNotifSent = orderNumber
      ? (staffLog ?? []).some(
          (e) =>
            e.subject &&
            (e.subject.includes(orderNumber) || e.subject.includes(`NEW ORDER ${orderNumber}`))
        )
      : false;

    // Stuck-state detection
    const stuckPendingPayment =
      o.status === "pending_payment" && ageHours > STUCK_PENDING_PAYMENT_HOURS;

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
}

async function fetchHeartbeats(): Promise<Heartbeat[]> {
  const supabase = createServiceClient();
  const now = Date.now();

  // Most recent run per cron_name. cron_runs is small — pull last 200 rows
  // and reduce in memory; simpler than a window query.
  const { data, error } = await supabase
    .from("cron_runs")
    .select("cron_name, ran_at, ok, detail")
    .order("ran_at", { ascending: false })
    .limit(200);

  if (error) {
    // Table may not exist yet on a fresh deploy — never let this break the page
    return EXPECTED_CRONS.map((c) => ({
      name: c.name,
      last_ran_at: null,
      hours_ago: null,
      max_age_hours: c.maxAgeHours,
      ok: false,
      stale: true,
      detail: "no cron_runs data",
    }));
  }

  const latestByName = new Map<string, { ran_at: string; ok: boolean; detail: string | null }>();
  for (const row of data ?? []) {
    if (!row.cron_name || !row.ran_at) continue;
    if (!latestByName.has(row.cron_name)) {
      latestByName.set(row.cron_name, {
        ran_at: row.ran_at,
        ok: !!row.ok,
        detail: row.detail ?? null,
      });
    }
  }

  return EXPECTED_CRONS.map((c) => {
    const latest = latestByName.get(c.name);
    if (!latest) {
      return {
        name: c.name,
        last_ran_at: null,
        hours_ago: null,
        max_age_hours: c.maxAgeHours,
        ok: false,
        stale: true,
        detail: "never ran",
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
    };
  });
}
