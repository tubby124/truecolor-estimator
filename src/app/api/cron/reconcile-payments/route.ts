/**
 * GET /api/cron/reconcile-payments
 *
 * Defense-in-depth detector for silent payment-bookkeeping drift between
 * Supabase (our state) and Wave/Clover (the money source-of-truth).
 *
 * Built 2026-05-15 after the `void supabase` bug caused 30+ days of
 * undetected desync between Wave invoices and Supabase order rows. The
 * ESLint rule prevents the bug at write time; this cron is the safety net
 * that catches any new variant within 24h.
 *
 * Four checks:
 *   1. Wave-method orders > 1 hour old with NULL wave_invoice_id
 *      → "Wave invoice creation may have failed silently"
 *   2. Wave invoices that exist on Wave's side but no matching Supabase order
 *      → "orphan Wave invoice — unlinked"
 *   3. Clover-card orders still pending after checkout opened
 *      → verify against Clover; auto-recover exact, unique successful captures
 *   4. Paid orders (paid_at set) with wave_invoice_id but wave_payment_recorded_at NULL
 *      → SELF-HEALING: auto-runs approve + recordWavePayment to fix the drift.
 *        For payment_method=wave (Wave already knows), just heals our timestamp.
 *        For clover_card/etransfer, calls Wave API. If recovery fails, alerts.
 *        Added 2026-05-22 after 27-order desync incident.
 *
 * Telegram alert fires only if at least 1 unrecovered issue is found. Silent
 * otherwise (auto-recoveries logged to Railway but not Telegram-spammed).
 *
 * Schedule: daily 9 AM MT (15 UTC during MST, 16 UTC during MDT).
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail, type WavePaymentMethod } from "@/lib/wave/invoice";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { recordAuditEvent } from "@/lib/audit/record";
import { incrementCustomerOrderStats } from "@/lib/customers/incrementOrderStats";

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const WAVE_BIZ = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const CLOVER_BASE =
  process.env.CLOVER_ENVIRONMENT === "sandbox"
    ? "https://apisandbox.dev.clover.com"
    : "https://api.clover.com";

interface PendingCloverOrder {
  id: string;
  order_number: string;
  total: number | string;
  created_at: string;
  payment_reference: string | null;
  wave_invoice_id: string | null;
  wave_invoice_approved_at: string | null;
  customer_id: string | null;
  customers?: { email?: string | null; name?: string | null; company?: string | null } | { email?: string | null; name?: string | null; company?: string | null }[] | null;
}

interface CloverPayment {
  id: string;
  amount?: number;
  result?: string;
  createdTime?: number;
  clientCreatedTime?: number;
  order?: { id?: string; total?: number; paymentState?: string; lineItems?: { elements?: { name?: string | null }[] } };
}

async function waveQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.WAVE_API_TOKEN;
  if (!token) throw new Error("WAVE_API_TOKEN not configured");
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Wave API HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`Wave: ${json.errors[0].message}`);
  return json.data as T;
}

async function cloverGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const token = process.env.CLOVER_API_KEY;
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  if (!token || !merchantId) throw new Error("CLOVER_API_KEY / CLOVER_MERCHANT_ID not configured");

  const url = new URL(`${CLOVER_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clover API HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  return (await res.json()) as T;
}

function cents(amount: number | string): number {
  return Math.round(Number(amount ?? 0) * 100);
}

function cloverPaymentTime(payment: CloverPayment): number {
  return Number(payment.createdTime ?? payment.clientCreatedTime ?? 0);
}

async function fetchCloverPaymentsSince(afterMs: number): Promise<CloverPayment[]> {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  if (!merchantId) throw new Error("CLOVER_MERCHANT_ID not configured");

  const data = await cloverGet<{ elements?: CloverPayment[] }>(
    `/v3/merchants/${merchantId}/payments`,
    {
      limit: 200,
      expand: "order,cardTransaction",
      filter: `createdTime>=${afterMs}`,
    }
  );
  return (data.elements ?? []).filter((p) => p.result === "SUCCESS" && Number(p.amount ?? 0) > 0);
}

async function fetchCloverOrderText(orderId: string | undefined): Promise<string> {
  if (!orderId) return "";
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  if (!merchantId) return "";

  try {
    const order = await cloverGet<Record<string, unknown>>(
      `/v3/merchants/${merchantId}/orders/${orderId}`,
      { expand: "lineItems,payments,customers" }
    );
    return JSON.stringify(order);
  } catch (err) {
    console.warn("[reconcile] Clover order detail fetch failed:", err instanceof Error ? err.message : err);
    return "";
  }
}

async function recoverCloverCapture(
  supabase: ReturnType<typeof createServiceClient>,
  order: PendingCloverOrder,
  payment: CloverPayment,
  matchReason: string
): Promise<{ recovered: boolean; waveError?: string }> {
  const paidAt = cloverPaymentTime(payment) > 0
    ? new Date(cloverPaymentTime(payment)).toISOString()
    : new Date().toISOString();
  const amountDollars = Number(payment.amount ?? 0) / 100;
  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;

  const ledgerRow = {
    order_id: order.id,
    amount: amountDollars,
    currency: "CAD",
    method: "clover",
    status: "recorded",
    payer_name: customer?.name ?? null,
    payer_company: customer?.company ?? null,
    payer_email: customer?.email ?? null,
    external_reference: payment.id,
    recorded_by: "reconcile-payments",
    recorded_at: paidAt,
    notes: `Auto-recovered from Clover payment ${payment.id} (${matchReason})`,
    metadata: {
      clover_payment_id: payment.id,
      clover_order_id: payment.order?.id ?? null,
      match_reason: matchReason,
    },
  };
  const { error: ledgerErr } = await supabase.from("order_payments").insert(ledgerRow);
  if (ledgerErr && (ledgerErr as { code?: string }).code !== "23505") {
    throw new Error(`order_payments insert failed: ${ledgerErr.message}`);
  }

  const { data: updated, error: updateErr } = await supabase
    .from("orders")
    .update({ status: "payment_received", paid_at: paidAt })
    .eq("id", order.id)
    .eq("status", "pending_payment")
    .select("id, order_number, customer_id, total");

  if (updateErr) throw new Error(`order update failed: ${updateErr.message}`);
  const transitioned = (updated?.length ?? 0) > 0;
  if (!transitioned) return { recovered: false };

  await incrementCustomerOrderStats(supabase, order.customer_id, Number(order.total)).catch((err) => {
    console.error("[reconcile] customer stats increment failed (non-fatal):", err);
  });
  void recordAuditEvent({
    actor_type: "system",
    actor_id: "reconcile-payments",
    event_type: "order.status_changed",
    entity_type: "order",
    entity_id: order.id,
    detail: {
      from: "pending_payment",
      to: "payment_received",
      order_number: order.order_number,
      amount_cents: Number(payment.amount ?? 0),
      clover_payment_id: payment.id,
      clover_order_id: payment.order?.id ?? null,
      match_reason: matchReason,
    },
  });

  if (!order.wave_invoice_id) return { recovered: true };

  try {
    if (!order.wave_invoice_approved_at) {
      try {
        await approveWaveInvoice(order.wave_invoice_id);
        await supabase.from("orders")
          .update({ wave_invoice_approved_at: new Date().toISOString() })
          .eq("id", order.id);
      } catch (approveErr) {
        const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
        if (!/already|approved|not.+draft/i.test(msg)) throw approveErr;
      }
    }

    const waveCustomerId = customer?.email
      ? await findCustomerByEmail(customer.email).catch(() => null)
      : null;
    await recordWavePayment(
      order.wave_invoice_id,
      amountDollars,
      "CREDIT_CARD",
      `Clover card — Order ${order.order_number} (reconcile)`,
      waveCustomerId ?? undefined,
      payment.id
    );
    await supabase.from("orders")
      .update({ wave_payment_recorded_at: new Date().toISOString() })
      .eq("id", order.id);
  } catch (waveErr) {
    const waveError = waveErr instanceof Error ? waveErr.message : String(waveErr);
    console.error(`[reconcile] Clover recovery marked paid but Wave failed for ${order.order_number}:`, waveError);
    return { recovered: true, waveError };
  }

  return { recovered: true };
}

interface ReconcileIssue {
  kind:
    | "wave_invoice_missing"
    | "wave_orphan"
    | "clover_stuck"
    | "wave_payment_missing"
    | "wave_recovery_failed"
    | "wave_payment_zombie"
    | "wave_total_mismatch"
    | "wave_approve_failed"
    | "wave_recovery_unverified";
  order_number?: string;
  wave_invoice_number?: string;
  detail: string;
  age_hours?: number;
}

// Re-query a Wave invoice's amountPaid + total for verification / zombie detection.
// Returns null on any failure so callers can skip rather than crash the cron.
// Pre-2026-05-31 this only returned amountPaid — adding `total` lets Check 5 also
// detect wave_total_mismatch (DB total ≠ Wave invoice total) which would otherwise
// look like a permanent zombie even after the correct charged amount is recorded.
async function fetchWaveInvoiceAmountPaid(invoiceId: string): Promise<{ amountPaid: number; total: number; invoiceNumber: string | null } | null> {
  try {
    const data = await waveQuery<{
      business: { invoice: { id: string; invoiceNumber: string | null; amountPaid: { value: string } | null; total: { value: string } | null } | null } | null;
    }>(
      `query($bizId: ID!, $invId: ID!) {
        business(id: $bizId) {
          invoice(id: $invId) { id invoiceNumber amountPaid { value } total { value } }
        }
      }`,
      { bizId: WAVE_BIZ, invId: invoiceId }
    );
    const inv = data.business?.invoice;
    if (!inv) return null;
    return {
      amountPaid: inv.amountPaid?.value ? Number(inv.amountPaid.value) : 0,
      total: inv.total?.value ? Number(inv.total.value) : 0,
      invoiceNumber: inv.invoiceNumber ?? null,
    };
  } catch (err) {
    console.error("[reconcile] fetchWaveInvoiceAmountPaid failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const issues: ReconcileIssue[] = [];

  // ── Check 1: Wave-method orders > 1h old without a wave_invoice_id ────────
  const cutoff1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: missingWave, error: err1 } = await supabase
    .from("orders")
    .select("order_number, total, created_at")
    .eq("payment_method", "wave")
    .is("wave_invoice_id", null)
    .lt("created_at", cutoff1h)
    .order("created_at", { ascending: false })
    .limit(50);

  if (err1) {
    console.error("[reconcile] check 1 query failed:", err1.message);
  } else {
    for (const o of missingWave ?? []) {
      const ageHours = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600_000);
      issues.push({
        kind: "wave_invoice_missing",
        order_number: o.order_number,
        detail: `$${Number(o.total).toFixed(2)} · ${ageHours}h old · Wave invoice never linked`,
        age_hours: ageHours,
      });
    }
  }

  // ── Check 2: Orphan Wave invoices (exist in Wave but not linked) ──────────
  // Pull last 30 Wave invoices titled "True Color Order TC-..." and check if
  // each one is referenced by an orders row.
  try {
    const waveResp = await waveQuery<{
      business: { invoices: { edges: { node: { invoiceNumber: string; title: string; status: string; createdAt: string } }[] } };
    }>(
      `query($bizId: ID!) {
        business(id: $bizId) {
          invoices(page: 1, pageSize: 30, sort: [CREATED_AT_DESC]) {
            edges { node { invoiceNumber title status createdAt } }
          }
        }
      }`,
      { bizId: WAVE_BIZ }
    );

    // Loosened 2026-05-22 from `^True Color Order (TC-XXXX-XXXX)$` (strict)
    // to a substring match. The strict form silently broke whenever an
    // invoice title got renamed (which staff occasionally does in the Wave
    // UI). Quote drafts titled "QUOTE DRAFT — Customer Name" are skipped
    // intentionally — they're not linked to a TC order and not bills.
    const ORDER_NUM_RE = /(TC-\d{4}-\d{4})/;
    const recentTcInvoices = (waveResp.business?.invoices?.edges ?? [])
      .map((e) => e.node)
      .map((n) => ({ ...n, orderNumber: n.title.match(ORDER_NUM_RE)?.[1] }))
      .filter((n) => n.orderNumber);

    if (recentTcInvoices.length > 0) {
      const orderNumbers = recentTcInvoices.map((n) => n.orderNumber!);
      const { data: linkedOrders } = await supabase
        .from("orders")
        .select("order_number, wave_invoice_id")
        .in("order_number", orderNumbers);

      const linkedSet = new Set((linkedOrders ?? [])
        .filter((o) => o.wave_invoice_id)
        .map((o) => o.order_number)
      );

      for (const inv of recentTcInvoices) {
        if (!linkedSet.has(inv.orderNumber!)) {
          const ageHours = Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / 3600_000);
          if (ageHours < 1) continue; // grace period for in-flight orders
          issues.push({
            kind: "wave_orphan",
            order_number: inv.orderNumber,
            wave_invoice_number: inv.invoiceNumber,
            detail: `Wave invoice #${inv.invoiceNumber} (${inv.status}) exists for ${inv.orderNumber} but Supabase order has NULL wave_invoice_id`,
            age_hours: ageHours,
          });
        }
      }
    }
  } catch (waveErr) {
    console.error("[reconcile] Wave check 2 failed:", waveErr instanceof Error ? waveErr.message : waveErr);
  }

  let recoveredCount = 0;
  let unverifiedCount = 0;

  // ── Check 3: Clover-card orders still pending after checkout opened ──────
  // Webhooks should flip these within seconds. If Clover webhooks are
  // misconfigured or delayed, verify against Clover's payment ledger and
  // recover exact, unique captures automatically.
  const cutoff10minClover = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: stuckClover, error: err3 } = await supabase
    .from("orders")
    .select("id, order_number, total, created_at, payment_reference, wave_invoice_id, wave_invoice_approved_at, customer_id, customers ( email, name, company )")
    .eq("payment_method", "clover_card")
    .eq("status", "pending_payment")
    .not("payment_reference", "is", null)
    .lt("created_at", cutoff10minClover)
    .order("created_at", { ascending: false })
    .limit(50);

  if (err3) {
    console.error("[reconcile] check 3 query failed:", err3.message);
  } else {
    const pendingClover = (stuckClover ?? []) as PendingCloverOrder[];
    if (pendingClover.length > 0) {
      try {
        const earliestCreated = Math.min(...pendingClover.map((o) => new Date(o.created_at).getTime()));
        const cloverPayments = await fetchCloverPaymentsSince(earliestCreated - 30 * 60 * 1000);
        const orderTextByPayment = new Map<string, string>();
        const usedPaymentIds = new Set<string>();

        for (const order of pendingClover) {
          const orderTotalCents = cents(order.total);
          const orderCreatedMs = new Date(order.created_at).getTime();
          const amountMatches = cloverPayments.filter((payment) => {
            const paidMs = cloverPaymentTime(payment);
            return (
              !usedPaymentIds.has(payment.id) &&
              Number(payment.amount ?? 0) === orderTotalCents &&
              paidMs >= orderCreatedMs - 5 * 60 * 1000
            );
          });

          const enrichedMatches: { payment: CloverPayment; text: string; strong: boolean }[] = [];
          for (const payment of amountMatches) {
            let text = JSON.stringify(payment);
            if (payment.order?.id && !orderTextByPayment.has(payment.id)) {
              orderTextByPayment.set(payment.id, await fetchCloverOrderText(payment.order.id));
            }
            text += orderTextByPayment.get(payment.id) ?? "";
            const strong = text.includes(order.order_number) || text.includes(order.id);
            enrichedMatches.push({ payment, text, strong });
          }

          const strongMatches = enrichedMatches.filter((m) => m.strong);
          const sameAmountPendingCount = pendingClover.filter((candidate) => cents(candidate.total) === orderTotalCents).length;
          const selected =
            strongMatches.length === 1
              ? { ...strongMatches[0], reason: "order_number_or_uuid" }
              : enrichedMatches.length === 1 && sameAmountPendingCount === 1
                ? { ...enrichedMatches[0], reason: "unique_amount_after_checkout" }
                : null;

          if (selected) {
            try {
              const result = await recoverCloverCapture(supabase, order, selected.payment, selected.reason);
              if (result.recovered) {
                recoveredCount++;
                usedPaymentIds.add(selected.payment.id);
                console.log(
                  `[reconcile] check 3 recovered Clover capture → ${order.order_number} ` +
                  `payment=${selected.payment.id} match=${selected.reason}`
                );
                if (result.waveError) {
                  issues.push({
                    kind: "wave_recovery_failed",
                    order_number: order.order_number,
                    detail: `$${Number(order.total).toFixed(2)} Clover payment recovered, but Wave recording failed: ${result.waveError.slice(0, 120)}`,
                    age_hours: Math.floor((Date.now() - orderCreatedMs) / 3600_000),
                  });
                }
                continue;
              }
            } catch (recoverErr) {
              const msg = recoverErr instanceof Error ? recoverErr.message : String(recoverErr);
              console.error(`[reconcile] check 3 Clover recovery failed for ${order.order_number}:`, msg);
              issues.push({
                kind: "clover_stuck",
                order_number: order.order_number,
                detail: `$${Number(order.total).toFixed(2)} · matching Clover payment found but auto-recovery failed: ${msg.slice(0, 120)}`,
                age_hours: Math.floor((Date.now() - orderCreatedMs) / 3600_000),
              });
              continue;
            }
          }

          const ageHours = Math.floor((Date.now() - orderCreatedMs) / 3600_000);
          const matchDetail = enrichedMatches.length === 0
            ? "no successful matching Clover payment found"
            : `ambiguous Clover payment match (${enrichedMatches.length} amount match${enrichedMatches.length === 1 ? "" : "es"})`;
          issues.push({
            kind: "clover_stuck",
            order_number: order.order_number,
            detail: `$${Number(order.total).toFixed(2)} · ${ageHours}h old · payment_reference=${order.payment_reference ?? "NULL"} · ${matchDetail}`,
            age_hours: ageHours,
          });
        }
      } catch (cloverErr) {
        const msg = cloverErr instanceof Error ? cloverErr.message : String(cloverErr);
        console.error("[reconcile] check 3 Clover API verification failed:", msg);
        for (const o of pendingClover) {
          const ageHours = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600_000);
          issues.push({
            kind: "clover_stuck",
            order_number: o.order_number,
            detail: `$${Number(o.total).toFixed(2)} · ${ageHours}h old · Clover verification failed: ${msg.slice(0, 120)}`,
            age_hours: ageHours,
          });
        }
      }
    }
  }

  // ── Check 4: paid orders with Wave payment NOT recorded (self-healing) ────
  // The exact failure mode behind bug 2026-05-22: order is paid (paid_at set,
  // Clover/Wave/eTransfer confirmed) but recordWavePayment never landed, so
  // Wave still shows the invoice as unpaid. Customer clicks the "Download
  // Tax Invoice" link → sees an unpaid invoice → loses trust in us.
  //
  // The webhook-level Telegram alerts (shipped 2026-05-22) catch new failures
  // immediately. THIS check is the safety net for any that still slip through
  // (Wave API outage, transient errors, "Quick Card Link" flow gaps).
  //
  // Tries to AUTO-RECOVER each one by calling approve + recordWavePayment.
  // Recovery successes are logged silently. Recovery failures fire a Telegram
  // alert with a manual action prompt — never silent on real bookkeeping drift.
  const cutoff10min = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: stuckPayments, error: err4 } = await supabase
    .from("orders")
    .select(`order_number, total, payment_method, paid_at, created_at,
             wave_invoice_id, wave_invoice_approved_at, customer_id,
             customers ( email )`)
    .not("wave_invoice_id", "is", null)
    .not("paid_at", "is", null)
    .is("wave_payment_recorded_at", null)
    .lt("paid_at", cutoff10min)  // 10min grace for in-flight retries
    .order("paid_at", { ascending: false })
    .limit(20);

  if (err4) {
    console.error("[reconcile] check 4 query failed:", err4.message);
  } else {
    for (const o of stuckPayments ?? []) {
      const total = Number(o.total ?? 0);
      const ageHours = Math.floor((Date.now() - new Date(o.paid_at).getTime()) / 3600_000);
      const orderNum = o.order_number ?? "?";
      const invoiceId = o.wave_invoice_id;
      if (!invoiceId || total <= 0) continue;

      // Skip wave-method orders — Wave itself recorded the payment when the
      // customer paid in Wave's portal. wave_payment_recorded_at being null
      // means OUR timestamp was never written; Wave's books are already right.
      if (o.payment_method === "wave") {
        // Just heal the timestamp — no Wave API call needed.
        const { error: tsErr } = await supabase.from("orders")
          .update({ wave_payment_recorded_at: new Date().toISOString() })
          .eq("order_number", orderNum);
        if (!tsErr) {
          recoveredCount++;
          console.log(`[reconcile] check 4 ts-only recovery → ${orderNum}`);
        }
        continue;
      }

      // Try to approve if not yet approved (rare but possible).
      if (!o.wave_invoice_approved_at) {
        try {
          await approveWaveInvoice(invoiceId);
          await supabase.from("orders")
            .update({ wave_invoice_approved_at: new Date().toISOString() })
            .eq("order_number", orderNum);
        } catch (approveErr) {
          const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
          // Common case: already approved — proceed to recordPayment.
          // Log but don't bail — recordWavePayment is what actually matters.
          if (!/already|approved|not.+draft/i.test(msg)) {
            console.warn(`[reconcile] check 4 approve failed for ${orderNum} (continuing):`, msg);
          }
        }
      }

      // Look up Wave customer ID for auto-reconciliation against invoice.
      const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
      const custEmail = (cust as { email?: string } | null)?.email ?? null;
      const waveCustomerId = custEmail
        ? await findCustomerByEmail(custEmail).catch(() => null)
        : null;

      const method: WavePaymentMethod = o.payment_method === "clover_card" ? "CREDIT_CARD" : "BANK_TRANSFER";
      const note = o.payment_method === "clover_card"
        ? `Clover card — Order ${orderNum} (reconcile)`
        : `eTransfer — Order ${orderNum} (reconcile)`;

      try {
        await recordWavePayment(
          invoiceId,
          total,
          method,
          note,
          waveCustomerId ?? undefined,
          orderNum,  // externalId — idempotency key
        );
        const { error: tsErr } = await supabase.from("orders")
          .update({ wave_payment_recorded_at: new Date().toISOString() })
          .eq("order_number", orderNum);
        if (tsErr) {
          console.error(`[reconcile] check 4 ts save failed for ${orderNum}:`, tsErr.message);
        }

        // Defense-in-depth verification: re-query Wave to confirm amountPaid
        // actually landed. The new recordWavePayment (post-2026-05-26 fix)
        // already verifies internally — this catches partial/network failures
        // that could still leave drift between our timestamp and Wave's books.
        const verify = await fetchWaveInvoiceAmountPaid(invoiceId);
        if (verify && verify.amountPaid < total - 0.01) {
          // Back out the timestamp we just set — Wave still shows underpaid.
          if (!tsErr) {
            await supabase.from("orders")
              .update({ wave_payment_recorded_at: null })
              .eq("order_number", orderNum);
          }
          unverifiedCount++;
          console.error(
            `[reconcile] check 4 unverified → ${orderNum}: recordWavePayment success but Wave shows $${verify.amountPaid.toFixed(2)} of $${total.toFixed(2)}`
          );
          issues.push({
            kind: "wave_recovery_unverified",
            order_number: orderNum,
            wave_invoice_number: verify.invoiceNumber ?? undefined,
            detail: `recordWavePayment returned success but Wave still shows $${verify.amountPaid.toFixed(2)} paid of $${total.toFixed(2)} expected · timestamp rolled back · manual: open Wave invoice → record payment via invoicePaymentCreateManual`,
            age_hours: ageHours,
          });
          continue;
        }

        recoveredCount++;
        console.log(`[reconcile] check 4 recovered → ${orderNum} ($${total.toFixed(2)} ${o.payment_method})`);
      } catch (recoverErr) {
        const msg = recoverErr instanceof Error ? recoverErr.message : String(recoverErr);
        console.error(`[reconcile] check 4 recovery failed for ${orderNum}:`, msg);
        issues.push({
          kind: "wave_recovery_failed",
          order_number: orderNum,
          detail: `$${total.toFixed(2)} · ${ageHours}h since paid · ${o.payment_method} · auto-recovery failed: ${msg.slice(0, 120)}`,
          age_hours: ageHours,
        });
      }
    }
  }

  if (recoveredCount > 0) {
    console.log(`[reconcile] check 4 healed ${recoveredCount} stuck Wave payment record(s)`);
  }

  // ── Check 5: Wave-payment ZOMBIES (alert only — no auto-heal) ─────────────
  // Order says we recorded the Wave payment (wave_payment_recorded_at IS NOT
  // NULL) but Wave's books still show the invoice underpaid. This is the
  // exact failure mode TC-2026-0111 hit — Check 4 cannot see it because its
  // predicate requires wave_payment_recorded_at IS NULL.
  //
  // Scope is bounded to the last 90 days to keep Wave API calls bounded; the
  // older backlog gets cleared by a separate one-shot backfill, not this cron.
  // No auto-heal — re-running recordWavePayment on a "we think it's paid"
  // order is too risky (could double-charge). Surface for manual action only.
  const zombieCutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: maybeZombies, error: err5 } = await supabase
    .from("orders")
    .select("order_number, total, wave_invoice_id, wave_payment_recorded_at")
    .not("wave_invoice_id", "is", null)
    .not("wave_payment_recorded_at", "is", null)
    .not("paid_at", "is", null)
    .gt("wave_payment_recorded_at", zombieCutoff90d)
    .order("wave_payment_recorded_at", { ascending: false })
    .limit(100);

  if (err5) {
    console.error("[reconcile] check 5 query failed:", err5.message);
  } else {
    for (const o of maybeZombies ?? []) {
      const total = Number(o.total ?? 0);
      const orderNum = o.order_number ?? "?";
      const invoiceId = o.wave_invoice_id;
      if (!invoiceId || total <= 0) continue;

      const verify = await fetchWaveInvoiceAmountPaid(invoiceId);
      if (!verify) continue; // API hiccup — skip rather than false-alert

      // Check 7 (inline with Check 5): Wave invoice total ≠ DB total.
      // Catches invoice-build drift (discount-drop, rush-GST, phantom-line) that
      // would otherwise look like permanent zombies even after the correct
      // charged amount is recorded against the wrong-total Wave invoice. Surfaces
      // separately so it's clear the fix is "edit the Wave invoice", not "record
      // another payment". Pre-2026-05-31 these accumulated invisibly behind the
      // zombie alert. NEVER auto-heal — invoice edits are irreversible from API.
      if (Math.abs(total - verify.total) > 0.01) {
        console.warn(
          `[reconcile] check 7 total mismatch → ${orderNum}: DB $${total.toFixed(2)}, Wave invoice $${verify.total.toFixed(2)}`
        );
        issues.push({
          kind: "wave_total_mismatch",
          order_number: orderNum,
          wave_invoice_number: verify.invoiceNumber ?? undefined,
          detail: `DB $${total.toFixed(2)} ≠ Wave $${verify.total.toFixed(2)} (Δ $${Math.abs(total - verify.total).toFixed(2)}) · inv #${verify.invoiceNumber ?? "?"} · manual: open Wave invoice → adjust lines to match DB total before recording payment`,
        });
        continue; // skip zombie check — total mismatch supersedes
      }

      if (verify.amountPaid < total - 0.01) {
        console.warn(
          `[reconcile] check 5 zombie → ${orderNum}: ts says paid, Wave shows $${verify.amountPaid.toFixed(2)} of $${total.toFixed(2)}`
        );
        issues.push({
          kind: "wave_payment_zombie",
          order_number: orderNum,
          wave_invoice_number: verify.invoiceNumber ?? undefined,
          detail: `$${total.toFixed(2)} expected · Wave shows $${verify.amountPaid.toFixed(2)} paid · inv #${verify.invoiceNumber ?? "?"} · manual action: open Wave invoice → record payment via invoicePaymentCreateManual`,
        });
      }
    }
  }

  // ── Check 6: Unapproved-pending (auto-heal) ───────────────────────────────
  // Orders with a Wave invoice but no approved timestamp — Wave invoice stays
  // DRAFT forever, customer never sees a clean tax invoice. TC-2026-0113/0114
  // hit this today.
  //
  // Skip the first hour after creation (matches Check 1's grace window) so
  // we're not racing the normal createInvoice → approve sequence.
  const cutoff1hCheck6 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: unapprovedPending, error: err6 } = await supabase
    .from("orders")
    .select("order_number, wave_invoice_id, created_at, status")
    .not("wave_invoice_id", "is", null)
    .is("wave_invoice_approved_at", null)
    .eq("status", "pending_payment")
    .lt("created_at", cutoff1hCheck6)
    .order("created_at", { ascending: false })
    .limit(20);

  if (err6) {
    console.error("[reconcile] check 6 query failed:", err6.message);
  } else {
    for (const o of unapprovedPending ?? []) {
      const orderNum = o.order_number ?? "?";
      const invoiceId = o.wave_invoice_id;
      if (!invoiceId) continue;
      const ageHours = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600_000);

      try {
        await approveWaveInvoice(invoiceId);
        const { error: tsErr } = await supabase.from("orders")
          .update({ wave_invoice_approved_at: new Date().toISOString() })
          .eq("order_number", orderNum);
        if (tsErr) {
          console.error(`[reconcile] check 6 ts save failed for ${orderNum}:`, tsErr.message);
        } else {
          recoveredCount++;
          console.log(`[reconcile] check 6 approved → ${orderNum}`);
        }
      } catch (approveErr) {
        const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
        // Same idempotency pattern as Check 4 — Wave returns inputErrors
        // when re-approving an already-approved invoice. Treat as success
        // and still write our timestamp (vault note 2026-05-22).
        if (/already|approved|not.+draft/i.test(msg)) {
          const { error: tsErr } = await supabase.from("orders")
            .update({ wave_invoice_approved_at: new Date().toISOString() })
            .eq("order_number", orderNum);
          if (!tsErr) {
            recoveredCount++;
            console.log(`[reconcile] check 6 already_approved → ${orderNum} (ts healed)`);
          }
        } else {
          console.error(`[reconcile] check 6 approve genuinely failed for ${orderNum}:`, msg);
          issues.push({
            kind: "wave_approve_failed",
            order_number: orderNum,
            detail: `Wave invoice still DRAFT after ${ageHours}h · approve failed: ${msg.slice(0, 120)} · manual: open Wave → Approve invoice`,
            age_hours: ageHours,
          });
        }
      }
    }
  }

  // ── Alert via Telegram if any issues ──────────────────────────────────────
  if (issues.length > 0) {
    const groupedByKind: Record<string, ReconcileIssue[]> = {};
    for (const issue of issues) {
      (groupedByKind[issue.kind] ??= []).push(issue);
    }

    const lines = [`<b>⚠ Payment reconciliation — ${issues.length} issue${issues.length === 1 ? "" : "s"}</b>`];

    if (groupedByKind.wave_invoice_missing?.length) {
      lines.push(`\n<b>Wave invoice missing</b> (${groupedByKind.wave_invoice_missing.length})`);
      for (const i of groupedByKind.wave_invoice_missing.slice(0, 5)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }
    if (groupedByKind.wave_orphan?.length) {
      lines.push(`\n<b>Orphan Wave invoice</b> (${groupedByKind.wave_orphan.length})`);
      for (const i of groupedByKind.wave_orphan.slice(0, 5)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} ← inv #${escapeTelegramHtml(i.wave_invoice_number ?? "?")}`);
      }
    }
    if (groupedByKind.clover_stuck?.length) {
      lines.push(`\n<b>Clover pending after checkout opened</b> (${groupedByKind.clover_stuck.length})`);
      for (const i of groupedByKind.clover_stuck.slice(0, 5)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }
    if (groupedByKind.wave_recovery_failed?.length) {
      lines.push(`\n<b>🚨 Wave payment NOT recorded — auto-recovery failed</b> (${groupedByKind.wave_recovery_failed.length})`);
      lines.push(`<i>Customer was charged but Wave bookkeeping is desynced. Open Wave and record the payment manually.</i>`);
      for (const i of groupedByKind.wave_recovery_failed.slice(0, 8)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }
    if (groupedByKind.wave_payment_zombie?.length) {
      lines.push(`\n<b>🧟 Wave payment zombies</b> (${groupedByKind.wave_payment_zombie.length})`);
      lines.push(`<i>Our DB says paid but Wave shows underpaid. Manual action required — do NOT re-run recordWavePayment automatically.</i>`);
      for (const i of groupedByKind.wave_payment_zombie.slice(0, 8)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }
    if (groupedByKind.wave_total_mismatch?.length) {
      lines.push(`\n<b>🧮 Wave invoice total ≠ DB total</b> (${groupedByKind.wave_total_mismatch.length})`);
      lines.push(`<i>Invoice was built at a different amount than what was charged — recording the payment will NOT close it. Edit the Wave invoice lines first.</i>`);
      for (const i of groupedByKind.wave_total_mismatch.slice(0, 8)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }
    if (groupedByKind.wave_recovery_unverified?.length) {
      lines.push(`\n<b>⚠ Wave recovery UNVERIFIED — auto-rolled back timestamp</b> (${groupedByKind.wave_recovery_unverified.length})`);
      lines.push(`<i>recordWavePayment returned success but Wave still shows underpaid. Timestamp was reverted so next run re-attempts.</i>`);
      for (const i of groupedByKind.wave_recovery_unverified.slice(0, 8)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }
    if (groupedByKind.wave_approve_failed?.length) {
      lines.push(`\n<b>📝 Wave invoice approve failed</b> (${groupedByKind.wave_approve_failed.length})`);
      for (const i of groupedByKind.wave_approve_failed.slice(0, 8)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }

    if (recoveredCount > 0) {
      lines.push(`\n<i>✓ Auto-recovered ${recoveredCount} stuck record${recoveredCount === 1 ? "" : "s"} this run (payments + approvals).</i>`);
    }
    if (unverifiedCount > 0) {
      lines.push(`<i>⚠ ${unverifiedCount} recovery attempt${unverifiedCount === 1 ? "" : "s"} unverified — timestamps rolled back.</i>`);
    }
    lines.push(`\n<i>Run scripts/backfill-wave-invoice-ids.mjs --apply for Wave gaps.</i>`);
    lines.push(`<i>Cross-check via Clover MCP for stuck Clover orders.</i>`);

    await sendTelegramNotification(lines.join("\n")).catch((err) => {
      console.error("[reconcile] telegram alert failed:", err);
    });
  }

  console.log(
    `[reconcile-payments] ${issues.length} issues found, ${recoveredCount} auto-recovered, ${unverifiedCount} unverified`
  );
  await recordCronRun(
    "reconcile-payments",
    true,
    `${issues.length} issues, ${recoveredCount} recovered, ${unverifiedCount} unverified`
  );
  return NextResponse.json({
    ok: true,
    issues_total: issues.length,
    auto_recovered: recoveredCount,
    unverified: unverifiedCount,
    by_kind: {
      wave_invoice_missing: issues.filter((i) => i.kind === "wave_invoice_missing").length,
      wave_orphan: issues.filter((i) => i.kind === "wave_orphan").length,
      clover_stuck: issues.filter((i) => i.kind === "clover_stuck").length,
      wave_recovery_failed: issues.filter((i) => i.kind === "wave_recovery_failed").length,
      wave_payment_zombie: issues.filter((i) => i.kind === "wave_payment_zombie").length,
      wave_recovery_unverified: issues.filter((i) => i.kind === "wave_recovery_unverified").length,
      wave_approve_failed: issues.filter((i) => i.kind === "wave_approve_failed").length,
    },
  });
}
