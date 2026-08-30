/**
 * GET /api/cron/payment-followup
 *
 * TC-9:  Finds checkout sessions >2h old with no completed order → "you left something behind".
 * TC-10: 3-touch follow-up ladder for pending_payment orders:
 *          T1 at 2h (recovery copy, branches on latest attempt status)
 *          T2 at 24h (service check-in: changes? already paid?)
 *          T3 at 120h (final reminder, releases the slot)
 *
 * Safety invariants:
 * - Never chase paid / paused / archived / non-pending orders (nextFollowupTier guards).
 * - Never chase ambiguous Clover matches (possible captured money → staff only).
 * - Chase links charge the BALANCE DUE, never the raw order total (partial payments!).
 * - A human touch in the last 24h (staff resend/reply) defers the automated touch.
 * - followup_count = tier (idempotent under cron double-fire); backdated orders
 *   jump straight to their current tier.
 *
 * Run every hour via Railway cron:
 *   Schedule: 0 * * * *
 *   Command:  curl -s -H "Authorization: Bearer ***" https://truecolorprinting.ca/api/cron/payment-followup
 *
 * Auth: Authorization: Bearer ***
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { escHtml } from "@/lib/email/components/escHtml";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { paymentFollowupOutcome } from "@/lib/cron/paymentFollowupOutcome";
import { paymentFollowupOrderKey, paymentFollowupSessionKey } from "@/lib/cron/paymentFollowupIdempotency";
import { nextFollowupTier, type FollowupTier } from "@/lib/orders/followupLadder";
import { followupCopy, type LatestAttemptLite } from "@/lib/orders/followupCopy";
import { buildPayLink } from "@/lib/orders/payLink";
import { summarizeOrderPayments, type OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";
import { sendTelegramNotification } from "@/lib/notifications/telegram";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
const FROM = "True Color Display Printing <hello@outreach.true-color.ca>";
const REPLY_TO = "True Color Display Printing <info@true-color.ca>";

/** Staff activity types that mean "a human is on it" — defer the robot. */
const HUMAN_TOUCH_EVENTS = [
  "payment_link_resent",
  "order.reply_sent",
  "order.reply",
  "proof_sent",
] as const;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  let tc9Sent = 0;
  const byTier: Record<string, number> = { t1: 0, t2: 0, t3: 0 };
  const skipped: Record<string, number> = { paused: 0, ambiguous: 0, notDue: 0, humanTouch: 0 };
  let chaseSignaled = false;
  let failureCount = 0;

  // ── TC-10: pending_payment orders on the follow-up ladder ──────────────────

  try {
    const { data: staleOrders, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, total, payment_method, created_at, is_rush,
        followup_count, followup_paused_at, paid_at, wave_payment_recorded_at, is_archived,
        order_items ( product_name, qty ),
        customers ( name, email )
      `)
      .eq("status", "pending_payment")
      .or("is_archived.is.null,is_archived.eq.false")
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      failureCount++;
      console.error("[payment-followup] TC-10 query failed:", error.message);
    } else {
      const orderIds = (staleOrders ?? []).map((o) => o.id).filter(Boolean);
      const latestAttemptByOrder = new Map<string, LatestAttemptLite>();
      let ledgerByOrder: Map<string, OrderPaymentLedgerEntry[]> = new Map();
      let humanTouchOrderIds = new Set<string>();
      let supportDataReady = true;

      if (orderIds.length > 0) {
        const [{ data: attempts, error: attemptsErr }, ledgerRes, auditRes] = await Promise.all([
          supabase
            .from("payment_attempts")
            .select("order_id, status, failure_label, customer_message, created_at")
            .in("order_id", orderIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("order_payments")
            .select("order_id, amount, method, status, recorded_at")
            .in("order_id", orderIds)
            .eq("status", "recorded"),
          supabase
            .from("audit_events")
            .select("entity_id, event_type, at")
            .in("entity_id", orderIds)
            .in("event_type", [...HUMAN_TOUCH_EVENTS])
            .gte("at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        ]);

        if (attemptsErr) {
          failureCount++;
          supportDataReady = false;
          console.error("[payment-followup] payment_attempts query failed:", attemptsErr.message);
        } else {
          for (const attempt of attempts ?? []) {
            const orderId = (attempt as LatestAttemptLite).order_id;
            if (orderId && !latestAttemptByOrder.has(orderId)) {
              latestAttemptByOrder.set(orderId, attempt as LatestAttemptLite);
            }
          }
        }

        if (ledgerRes.error) {
          failureCount++;
          supportDataReady = false;
          console.error("[payment-followup] order_payments query failed:", ledgerRes.error.message);
        }

        const ledgerRows = (ledgerRes.data ?? []) as {
          order_id: string | null;
          amount: number;
          method: string;
          status: string | null;
          recorded_at: string | null;
        }[];
        ledgerByOrder = new Map(
          ledgerRows
            .filter((r) => r.order_id)
            .map((r) => [
              r.order_id as string,
              ledgerRows
                .filter((x) => x.order_id === r.order_id)
                .map((x) => ({
                  amount: Number(x.amount),
                  method: x.method as OrderPaymentLedgerEntry["method"],
                  status: (x.status ?? "recorded") as OrderPaymentLedgerEntry["status"],
                  recordedAt: x.recorded_at,
                })),
            ]),
        );

        if (auditRes.error) {
          failureCount++;
          supportDataReady = false;
          console.error("[payment-followup] audit_events query failed:", auditRes.error.message);
        } else {
          humanTouchOrderIds = new Set((auditRes.data ?? []).map((e) => e.entity_id).filter(Boolean));
        }
      }

      for (const order of supportDataReady ? (staleOrders ?? []) : []) {
        const customerRaw = Array.isArray(order.customers) ? order.customers[0] : order.customers;
        const customer = customerRaw as { name: string; email: string } | null;
        if (!customer?.email) continue;
        const latestAttempt = latestAttemptByOrder.get(order.id) ?? null;

        // Ambiguous Clover matches may be real captured money. Do not ask the
        // customer to retry and risk a double payment; route it to staff only.
        if (latestAttempt?.status === "ambiguous") {
          const { error: ambiguousUpdateError } = await supabase
            .from("orders")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", order.id);
          if (ambiguousUpdateError) {
            failureCount++;
            console.error("[payment-followup] ambiguous-order update failed:", ambiguousUpdateError.message);
          }
          skipped.ambiguous++;
          console.warn(`[payment-followup] skipped customer retry for ambiguous Clover match | ${order.order_number}`);
          continue;
        }

        if (order.followup_paused_at) {
          skipped.paused++;
          continue;
        }

        const tier: FollowupTier = nextFollowupTier({
          id: order.id,
          status: "pending_payment",
          is_archived: order.is_archived ?? false,
          paid_at: order.paid_at ?? null,
          wave_payment_recorded_at: order.wave_payment_recorded_at ?? null,
          followup_count: order.followup_count ?? 0,
          followup_paused_at: null,
          created_at: order.created_at,
        });
        if (tier === null) {
          skipped.notDue++;
          continue;
        }

        // A human touched this order in the last 24h — defer this tier to the
        // next run instead of stacking an automated email on top.
        if (humanTouchOrderIds.has(order.id)) {
          skipped.humanTouch++;
          console.log(`[payment-followup] deferred tier ${tier} (human touch <24h) | ${order.order_number}`);
          continue;
        }

        const items = Array.isArray(order.order_items) ? order.order_items : [];
        const productList = (items as { product_name: string; qty: number }[])
          .map((i) => `${i.qty}× ${i.product_name}`)
          .join(", ") || "your print order";

        const ledger = ledgerByOrder.get(order.id) ?? [];
        const summary = summarizeOrderPayments(Number(order.total), ledger);
        let payUrl: string;
        try {
          payUrl = buildPayLink({
            orderId: order.id,
            orderNumber: order.order_number,
            total: Number(order.total),
            customerEmail: customer.email,
            siteUrl: SITE_URL,
            ledger,
          });
        } catch {
          // PAYMENT_TOKEN_SECRET not set — skip this order
          failureCount++;
          console.warn("[payment-followup] buildPayLink failed — PAYMENT_TOKEN_SECRET missing?");
          continue;
        }

        const firstName = customer.name.split(" ")[0] || customer.name;
        const total = Number(order.total).toFixed(2);
        const copy = followupCopy(tier, {
          orderNumber: order.order_number,
          firstName,
          paymentMethod: order.payment_method,
          latestAttempt,
          paidSoFar: summary.countedPayments > 0 ? summary.amountPaid.toFixed(2) : null,
          balanceDue: summary.balanceDue.toFixed(2),
        });
        if (!copy) continue;

        const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2dbd4;">
    <div style="background:#1c1712;padding:24px 32px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#16C2F3;letter-spacing:.08em;text-transform:uppercase;">True Color Display Printing</p>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1712;">${escHtml(copy.headline)}, ${escHtml(firstName)}</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Order <strong>${escHtml(order.order_number)}</strong> · $${escHtml(total)} CAD${order.is_rush ? ' · <strong style="color:#b45309;">RUSH</strong>' : ""}</p>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${escHtml(copy.body)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>What you ordered:</strong></p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;">${escHtml(productList)}</p>
      <a href="${escHtml(payUrl)}" style="display:inline-block;background:#16C2F3;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">${escHtml(copy.cta)} →</a>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
        ${escHtml(copy.foot)}
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0ebe4;font-size:11px;color:#9ca3af;">
      Questions? Reply to this email or call us. · True Color Display Printing · Saskatoon, SK
    </div>
  </div>
</body></html>`;

        const text = `Hi ${firstName},\n\n${copy.headline}.\n\n${copy.body}\n\nOrder ${order.order_number}: ${productList} ($${total} CAD)\n\n${copy.cta}:\n${payUrl}\n\n${copy.foot}\n\nTrue Color Display Printing`;

        try {
          await sendEmail({
            from: FROM,
            replyTo: REPLY_TO,
            to: customer.email,
            subject: copy.subject,
            html,
            text,
            idempotencyKey: paymentFollowupOrderKey(tier, order.id),
          });

          const { error: followupUpdateError } = await supabase
            .from("orders")
            .update({ followup_sent_at: new Date().toISOString(), followup_count: tier })
            .eq("id", order.id);
          if (followupUpdateError) {
            failureCount++;
            console.error("[payment-followup] follow-up state update failed:", followupUpdateError.message);
          }

          byTier[`t${tier}`]++;
          console.log(`[payment-followup] TC-10 T${tier} sent → ${customer.email} | ${order.order_number}`);
        } catch (emailErr) {
          failureCount++;
          console.error(`[payment-followup] TC-10 email failed for ${order.order_number}:`, emailErr);
        }
      }
    }
  } catch (err) {
    failureCount++;
    console.error("[payment-followup] TC-10 block failed:", err);
  }

  // ── TC-9: abandoned checkout sessions ───────────────────────────────────────

  try {
    const { data: sessions, error } = await supabase
      .from("checkout_sessions")
      .select("id, email, name, created_at")
      .lt("created_at", cutoff)
      .is("followup_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      failureCount++;
      console.error("[payment-followup] TC-9 query failed:", error.message);
    } else {
      for (const session of sessions ?? []) {
        // Skip if they actually placed an order after the session was captured
        const { data: matchingCustomer, error: customerLookupError } = await supabase
          .from("customers")
          .select("id")
          .eq("email", session.email.toLowerCase())
          .maybeSingle();
        if (customerLookupError) {
          failureCount++;
          console.error("[payment-followup] TC-9 customer lookup failed:", customerLookupError.message);
          continue;
        }

        if (matchingCustomer) {
          const { count: existingOrders, error: existingOrdersError } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", matchingCustomer.id)
            .gt("created_at", session.created_at);
          if (existingOrdersError) {
            failureCount++;
            console.error("[payment-followup] TC-9 order lookup failed:", existingOrdersError.message);
            continue;
          }

          if ((existingOrders ?? 0) > 0) {
            // They ordered — mark session as handled without emailing
            const { error: handledUpdateError } = await supabase
              .from("checkout_sessions")
              .update({ followup_sent_at: new Date().toISOString() })
              .eq("id", session.id);
            if (handledUpdateError) {
              failureCount++;
              console.error("[payment-followup] TC-9 handled-session update failed:", handledUpdateError.message);
            }
            continue;
          }
        }

        const firstName = session.name?.split(" ")[0] || "there";

        const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2dbd4;">
    <div style="background:#1c1712;padding:24px 32px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#16C2F3;letter-spacing:.08em;text-transform:uppercase;">True Color Display Printing</p>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1c1712;">You left something behind, ${escHtml(firstName)}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
        Looks like you started an order with us but didn't finish. No worries — come back whenever you're ready. It only takes 2 minutes to place a print order.
      </p>
      <a href="${SITE_URL}/checkout" style="display:inline-block;background:#16C2F3;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Return to checkout →</a>
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
        Need a quote first? <a href="${SITE_URL}" style="color:#16C2F3;text-decoration:none;">Use our instant price calculator →</a>
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0ebe4;font-size:11px;color:#9ca3af;">
      True Color Display Printing · Saskatoon, SK · <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(session.email)}" style="color:#9ca3af;">Unsubscribe</a>
    </div>
  </div>
</body></html>`;

        const text = `Hi ${firstName},\n\nYou started an order at True Color Display Printing but didn't finish. Come back whenever you're ready — it takes 2 minutes.\n\n${SITE_URL}/checkout\n\nNeed a quote first? ${SITE_URL}\n\nTrue Color Display Printing · Saskatoon, SK`;

        try {
          await sendEmail({
            from: FROM,
            to: session.email,
            subject: "You left something at True Color Printing",
            html,
            text,
            idempotencyKey: paymentFollowupSessionKey(session.id),
          });

          const { error: sessionUpdateError } = await supabase
            .from("checkout_sessions")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", session.id);
          if (sessionUpdateError) {
            failureCount++;
            console.error("[payment-followup] TC-9 session update failed:", sessionUpdateError.message);
          }

          tc9Sent++;
          console.log(`[payment-followup] TC-9 sent → ${session.email}`);
        } catch (emailErr) {
          failureCount++;
          console.error(`[payment-followup] TC-9 email failed for ${session.email}:`, emailErr);
        }
      }
    }
  } catch (err) {
    failureCount++;
    console.error("[payment-followup] TC-9 block failed:", err);
  }

  // ── Stale-money Telegram signal (business-signal mode, max 1/day) ──────────
  // Consolidated: one message for all stuck money, never per-order spam.
  try {
    const { data: stuck, error: stuckErr } = await supabase
      .from("orders")
      .select("id, order_number, total, created_at, is_rush, followup_count, followup_paused_at")
      .eq("status", "pending_payment")
      .or("is_archived.is.null,is_archived.eq.false")
      .lt("created_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true })
      .limit(20);

    if (!stuckErr && stuck && stuck.length > 0) {
      const live = stuck.filter((o) => !o.followup_paused_at);
      const rushFlagged = live.filter((o) => o.is_rush);
      const eligible = live.filter(
        (o) => (o.followup_count ?? 0) >= 3 || rushFlagged.includes(o),
      );
      if (eligible.length > 0) {
        const totalStuck = eligible.reduce((s, o) => s + Number(o.total), 0);
        const oldestDays = Math.max(
          ...eligible.map((o) => Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86_400_000)),
        );
        // Dedupe: skip if we already signaled in the last 20h
        const { data: recentRuns } = await supabase
          .from("cron_runs")
          .select("id, detail, created_at")
          .eq("cron_name", "payment-followup")
          .like("detail", "%chase_signal=1%")
          .gte("created_at", new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString())
          .limit(1);
        if (!recentRuns || recentRuns.length === 0) {
          const lines = eligible
            .slice(0, 6)
            .map(
              (o) =>
                `• ${o.order_number} — $${Number(o.total).toFixed(2)} · ${Math.floor(
                  (Date.now() - new Date(o.created_at).getTime()) / 86_400_000,
                )}d${o.is_rush ? " · ⚡RUSH" : ""}`,
            )
            .join("\n");
          await sendTelegramNotification(
            `⚠️ <b>Money waiting</b> — ${eligible.length} order${eligible.length === 1 ? "" : "s"} unpaid &gt;72h, $${totalStuck.toFixed(
              2,
            )} total (oldest ${oldestDays}d)\n${lines}\nChase list in today's digest — check bank/e-Transfer inbox first.`,
            "payment:chase_needed",
          );
          chaseSignaled = true;
        }
      }
    }
  } catch (sigErr) {
    console.error("[payment-followup] chase signal failed (non-fatal):", sigErr);
  }

  // The existing hourly Railway service is the only scheduler we need. Keep the
  // review worker disabled until its internal delivery proof passes; once the
  // explicit flag is enabled it gets the same authenticated cron boundary.
  if (process.env.REVIEW_REQUESTS_ENABLED === "true") {
    try {
      const reviewResponse = await fetch(`${SITE_URL}/api/cron/review-requests`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
        signal: AbortSignal.timeout(45_000),
      });
      if (!reviewResponse.ok) {
        console.error(`[payment-followup] review worker failed: HTTP ${reviewResponse.status}`);
      }
    } catch (reviewWorkerError) {
      console.error("[payment-followup] review worker request failed:", reviewWorkerError);
    }
  }

  const { ok, status } = paymentFollowupOutcome(failureCount);
  await recordCronRun(
    "payment-followup",
    ok,
    `tc9=${tc9Sent} t1=${byTier.t1} t2=${byTier.t2} t3=${byTier.t3} pause=${skipped.paused} amb=${skipped.ambiguous} human=${skipped.humanTouch} notdue=${skipped.notDue} errors=${failureCount}${chaseSignaled ? " chase_signal=1" : ""}`,
  );
  return NextResponse.json({
    ok,
    tc9: tc9Sent,
    tc10: byTier.t1 + byTier.t2 + byTier.t3,
    byTier,
    skipped,
    errors: failureCount,
  }, { status });
}
