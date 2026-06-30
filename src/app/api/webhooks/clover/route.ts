/**
 * POST /api/webhooks/clover
 *
 * Receives Clover payment events and automatically confirms order status
 * when a payment is captured. This is more reliable than depending solely
 * on the redirect URL — if a customer pays and closes the Clover tab before
 * being redirected, the webhook still fires and the order gets confirmed.
 *
 * Setup: Register this URL in Clover Dashboard → Developer → App Market → Webhooks
 * URL: https://[your-domain]/api/webhooks/clover
 * Events to subscribe: PAYMENT
 *
 * Auth: shared CLOVER_WEBHOOK_SECRET query param. Clover hosted-checkout
 * webhooks do not sign request bodies.
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReceipt } from "@/lib/email/paymentReceipt";
import { approveWaveInvoice, recordWavePayment, findCustomerByEmail, getWaveInvoicePublicUrl } from "@/lib/wave/invoice";
import { syncCustomerToBrevo } from "@/lib/brevo/customerSync";
import { incrementCustomerOrderStats } from "@/lib/customers/incrementOrderStats";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { broadcastStaffNotification } from "@/lib/notifications/broadcast";
import { sendMeasurementProtocolEvent, deriveClientIdFromCustomer } from "@/lib/analytics/measurementProtocol";
import { sendMetaCapiEvent } from "@/lib/analytics/metaPixel";
import { recordAuditEvent } from "@/lib/audit/record";
import { summarizeOrderPayments, type OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";
import { sendEmail } from "@/lib/email/smtp";

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // Verify request via CLOVER_WEBHOOK_SECRET query param. Fail-CLOSED:
  // if the env var is unset we reject every webhook (security rule
  // .claude/rules/truecolor-security.md: "Webhook auth with `if (secret)`
  // (fail-open) | BLOCK"). The old fail-open path let anyone forge a paid
  // status by POSTing JSON to the public URL.
  // Register the webhook in Clover Dashboard with URL:
  //   https://truecolorprinting.ca/api/webhooks/clover?k=<CLOVER_WEBHOOK_SECRET>
  // Clover does NOT sign hosted checkout webhook bodies — HMAC approach is not applicable.
  const webhookSecret = process.env.CLOVER_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clover-webhook] CLOVER_WEBHOOK_SECRET not configured — rejecting (fail-closed)");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const provided = req.nextUrl.searchParams.get("k") ?? "";
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(webhookSecret);
  const valid =
    providedBuf.length === expectedBuf.length &&
    timingSafeEqual(providedBuf, expectedBuf);
  if (!valid) {
    console.warn("[clover-webhook] Invalid webhook secret — possible spoofing attempt");
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    // Best-effort log of unparseable bodies — use a fresh service client since
    // the main one isn't created until inside the PAYMENT branch.
    try {
      const supabaseEarly = createServiceClient();
      await supabaseEarly.from("webhook_events").insert({
        event_source: "clover",
        event_type: "unknown",
        resource_id: null,
        matched_order_id: null,
        ok: false,
        detail: "invalid JSON body",
      });
    } catch (logErr) {
      console.error("[clover-webhook] webhook_events log failed (non-fatal):", logErr);
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[clover-webhook] received event type:", event.type);

  // Supabase client + non-fatal webhook_events logger — shared across every
  // exit path below so the staff lifecycle dashboard sees every Clover hit.
  const supabase = createServiceClient();
  const eventTypeStr = typeof event.type === "string" ? event.type : "unknown";

  async function logWebhookEvent(opts: {
    eventType: string;
    resourceId: string | null;
    matchedOrderId: string | null;
    ok: boolean;
    detail: string;
  }) {
    try {
      await supabase.from("webhook_events").insert({
        event_source: "clover",
        event_type: opts.eventType,
        resource_id: opts.resourceId,
        matched_order_id: opts.matchedOrderId,
        ok: opts.ok,
        detail: opts.detail,
      });
    } catch (err) {
      console.error("[clover-webhook] webhook_events log failed (non-fatal):", err);
    }
  }

  // Handle payment capture events
  // Clover sends type=PAYMENT with object.status=captured when card is charged
  if (event.type === "PAYMENT") {
    const obj = event.object as Record<string, unknown> | undefined;
    const paymentId = (obj?.id ?? obj?.paymentId) as string | undefined;
    if (obj?.status === "captured" || obj?.status === "paid") {
      // Primary: externalReferenceId = our Supabase order UUID (set in createCloverCheckout)
      // Fallback: cloverOrderId = Clover's internal order ID (for backward compat)
      const extRef = (obj.externalReferenceId ?? obj.external_reference_id) as string | undefined;
      const cloverOrderId = (obj.orderId ?? obj.order_id) as string | undefined;
      const matchRef = extRef ?? cloverOrderId;

      console.log(`[clover-webhook] matching by ${extRef ? "externalReferenceId" : "cloverOrderId"}: ${matchRef}`);

      if (!matchRef) {
        await logWebhookEvent({
          eventType: eventTypeStr,
          resourceId: paymentId ?? null,
          matchedOrderId: null,
          ok: false,
          detail: "PAYMENT captured but no externalReferenceId or orderId on payload",
        });
      }

      if (matchRef) {
        try {
          // Verify the captured amount matches order.total BEFORE marking paid.
          // The previous version updated solely on payment_reference match, so a
          // partial capture (or a crafted event with amount=1¢) would still flip
          // the order to payment_received and trigger the receipt + Wave PAID
          // recording. Clover hosted-checkout puts amount in cents on event.object.
          const reportedAmountCents = typeof obj.amount === "number"
            ? obj.amount
            : Number(obj.amount ?? 0);

          const { data: pendingOrder, error: fetchErr } = await supabase
            .from("orders")
            .select("id, order_number, total, status, customer_id, customers ( name, email, company )")
            .eq("payment_reference", matchRef)
            .maybeSingle();

          if (fetchErr) {
            console.error("[clover-webhook] order lookup failed:", fetchErr.message);
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: null,
              ok: false,
              detail: `order lookup failed: ${fetchErr.message}`,
            });
            return NextResponse.json({ ok: true });
          }
          if (!pendingOrder) {
            console.warn(`[clover-webhook] no order found for payment_reference=${matchRef}`);
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: null,
              ok: false,
              detail: `no order found for payment_reference=${matchRef}`,
            });
            return NextResponse.json({ ok: true });
          }
          if (pendingOrder.status !== "pending_payment") {
            console.log(`[clover-webhook] order ${pendingOrder.order_number} already in status=${pendingOrder.status} — idempotent ack`);
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: pendingOrder.id,
              ok: true,
              detail: `order ${pendingOrder.order_number} already ${pendingOrder.status} — skipped`,
            });
            return NextResponse.json({ ok: true });
          }

          const expectedCents = Math.round(Number(pendingOrder.total) * 100);
          const orderTotalDollars = Number(pendingOrder.total);
          const reportedDollars = reportedAmountCents / 100;

          // Sanity: amount must be positive and not exceed the order total by
          // more than a $1 tolerance (catches crafted/replay events while still
          // allowing legitimate splits and partial payments).
          if (reportedAmountCents <= 0 || reportedAmountCents > expectedCents + 100) {
            console.error(
              `[clover-webhook] BAD AMOUNT on ${pendingOrder.order_number}: Clover reported ${reportedAmountCents}¢ (order total ${expectedCents}¢) — NOT recording`
            );
            void sendTelegramNotification(
              `⚠️ <b>Clover amount out of range</b>\n` +
              `Order <b>${escapeTelegramHtml(pendingOrder.order_number)}</b>\n` +
              `Order total: $${(expectedCents / 100).toFixed(2)}\n` +
              `Received: $${reportedDollars.toFixed(2)}\n` +
              `Order NOT marked paid — investigate in Clover dashboard.`
            ).catch(() => {});
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: pendingOrder.id,
              ok: false,
              detail: `bad_amount: $${reportedDollars.toFixed(2)} (max $${(expectedCents / 100).toFixed(2)})`,
            });
            return NextResponse.json({ ok: true });
          }

          // ── Auto-record the ledger row ───────────────────────────────────
          // Every Clover payment lands in order_payments. Idempotent via the
          // partial unique index on (method, external_reference) where status='recorded'.
          // Payer defaults to the customer on the order — staff can edit later
          // if the payer was actually someone else (split-payment workflow).
          const orderCustomer = Array.isArray(pendingOrder.customers)
            ? pendingOrder.customers[0]
            : pendingOrder.customers;
          const payerName = (orderCustomer as { name?: string | null } | null)?.name ?? null;
          const payerCompany = (orderCustomer as { company?: string | null } | null)?.company ?? null;
          const payerEmail = (orderCustomer as { email?: string | null } | null)?.email ?? null;

          const ledgerInsert = {
            order_id: pendingOrder.id,
            amount: reportedDollars,
            currency: "CAD",
            method: "clover",
            status: "recorded",
            payer_name: payerName,
            payer_company: payerCompany,
            payer_email: payerEmail,
            external_reference: paymentId ?? null,
            recorded_by: "clover-webhook",
            notes: `Auto-recorded from Clover webhook (payment ${paymentId ?? "unknown"})`,
            metadata: { clover_payment_id: paymentId ?? null, clover_order_id: cloverOrderId ?? null },
          };
          const { error: ledgerInsertErr } = await supabase
            .from("order_payments")
            .insert(ledgerInsert);

          // 23505 = unique_violation → already recorded for this Clover payment ID. Idempotent ack.
          if (ledgerInsertErr && (ledgerInsertErr as { code?: string }).code !== "23505") {
            console.error("[clover-webhook] ledger insert failed:", ledgerInsertErr.message);
            void sendTelegramNotification(
              `🚨 <b>Ledger insert failed</b>\n` +
              `Order <b>${escapeTelegramHtml(pendingOrder.order_number)}</b> · $${reportedDollars.toFixed(2)}\n` +
              `Customer was charged by Clover but the ledger row never landed.\n` +
              `Error: ${escapeTelegramHtml(ledgerInsertErr.message.slice(0, 200))}\n` +
              `Action: record the payment manually in the staff Payments tab.`
            ).catch(() => {});
            // Don't return — still try to update the order status as a best-effort fallback.
          }

          // Read the full ledger AFTER our insert so the sum includes this payment.
          const { data: ledgerRows } = await supabase
            .from("order_payments")
            .select("amount, method, status")
            .eq("order_id", pendingOrder.id);
          const ledgerEntries: OrderPaymentLedgerEntry[] = ((ledgerRows ?? []) as Array<{ amount: number | string; method: string; status: string | null }>).map((r) => ({
            amount: Number(r.amount),
            method: r.method as OrderPaymentLedgerEntry["method"],
            status: (r.status ?? "recorded") as OrderPaymentLedgerEntry["status"],
          }));
          const ledgerSummary = summarizeOrderPayments(orderTotalDollars, ledgerEntries);
          const isFullyPaid = ledgerSummary.status === "paid" || ledgerSummary.status === "overpaid";

          // If ledger sum hasn't reached order total, leave the order pending.
          // Telegram alert tells staff a partial landed and what's left.
          if (!isFullyPaid) {
            console.log(
              `[clover-webhook] partial payment recorded on ${pendingOrder.order_number}: ` +
              `$${ledgerSummary.amountPaid.toFixed(2)} of $${orderTotalDollars.toFixed(2)} ` +
              `(balance $${ledgerSummary.balanceDue.toFixed(2)})`
            );
            void sendTelegramNotification(
              `💸 <b>Partial payment received</b>\n` +
              `Order <b>${escapeTelegramHtml(pendingOrder.order_number)}</b>\n` +
              `Just received: $${reportedDollars.toFixed(2)}\n` +
              `Paid so far: $${ledgerSummary.amountPaid.toFixed(2)} of $${orderTotalDollars.toFixed(2)}\n` +
              `Balance due: $${ledgerSummary.balanceDue.toFixed(2)}\n` +
              `Order status stays pending until the balance is paid.`
            ).catch(() => {});
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: pendingOrder.id,
              ok: true,
              detail: `partial: $${reportedDollars.toFixed(2)} recorded; ledger=$${ledgerSummary.amountPaid.toFixed(2)}/$${orderTotalDollars.toFixed(2)}`,
            });

            // Wave still needs to know about the partial — invoicePaymentCreateManual
            // accepts partials and Wave tracks the running total per invoice. Fail-soft.
            try {
              const { data: pendingOrderWave } = await supabase
                .from("orders")
                .select("wave_invoice_id, wave_invoice_approved_at, customer_id")
                .eq("id", pendingOrder.id)
                .single();
              if (pendingOrderWave?.wave_invoice_id) {
                if (!pendingOrderWave.wave_invoice_approved_at) {
                  await approveWaveInvoice(pendingOrderWave.wave_invoice_id);
                  await supabase.from("orders")
                    .update({ wave_invoice_approved_at: new Date().toISOString() })
                    .eq("id", pendingOrder.id);
                }
                await recordWavePayment(
                  pendingOrderWave.wave_invoice_id,
                  reportedDollars,
                  "CREDIT_CARD",
                  `Clover card — Order ${pendingOrder.order_number} (partial)`,
                  undefined,
                  paymentId ?? pendingOrder.id,
                );
              }
            } catch (waveErr) {
              const msg = waveErr instanceof Error ? waveErr.message : String(waveErr);
              console.error("[clover-webhook] Wave partial recording failed (non-fatal):", msg);
              void sendTelegramNotification(
                `⚠️ <b>Wave partial payment NOT recorded</b>\n` +
                `Order <b>${escapeTelegramHtml(pendingOrder.order_number)}</b> · $${reportedDollars.toFixed(2)}\n` +
                `Ledger has it, but Wave is out of sync for this partial.\n` +
                `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
                `Action: open Wave, record the payment manually.`
              ).catch(() => {});
            }

            return NextResponse.json({ ok: true });
          }
          // Full payment achieved — fall through to mark paid + run side effects.

          const { data: updatedOrders, error } = await supabase
            .from("orders")
            .update({
              status: "payment_received",
              paid_at: new Date().toISOString(),
            })
            .eq("id", pendingOrder.id)
            .eq("status", "pending_payment")
            .select("id, order_number, customer_id, total, is_rush, wave_invoice_id, wave_invoice_approved_at, wave_payment_recorded_at");

          if (error) {
            console.error("[clover-webhook] order update failed:", error.message);
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: pendingOrder.id,
              ok: false,
              detail: `order update failed: ${error.message}`,
            });
          } else {
            const count = updatedOrders?.length ?? 0;
            // Audit event: payment received via Clover webhook
            if (count > 0 && updatedOrders?.[0]) {
              void recordAuditEvent({
                actor_type: "system",
                actor_id: "clover-webhook",
                event_type: "order.status_changed",
                entity_type: "order",
                entity_id: updatedOrders[0].id,
                detail: {
                  from: "pending_payment",
                  to: "payment_received",
                  order_number: updatedOrders[0].order_number,
                  amount_cents: reportedAmountCents,
                  clover_order_id: cloverOrderId,
                },
              });
            }
            console.log(
              `[clover-webhook] order confirmed via webhook | Clover order: ${cloverOrderId} | rows updated: ${count}`
            );
            await logWebhookEvent({
              eventType: eventTypeStr,
              resourceId: paymentId ?? matchRef,
              matchedOrderId: pendingOrder.id,
              ok: true,
              detail: count > 0
                ? `order ${pendingOrder.order_number} → payment_received (captured)`
                : `order ${pendingOrder.order_number} update returned 0 rows — race with another writer`,
            });

            // Send "payment confirmed" email + mark Wave invoice paid (both non-fatal)
            if (updatedOrders && updatedOrders.length > 0) {
              // Side-channel notifications — fire-and-forget.
              // updatedOrders only contains rows that transitioned from pending_payment to payment_received,
              // so webhook retries on already-paid orders won't fire these.
              for (const updated of updatedOrders ?? []) {
                const totalNum = typeof updated.total === "number" ? updated.total : Number(updated.total ?? 0);
                const orderRef = updated.order_number ?? updated.id;
                const safeOrderRef = escapeTelegramHtml(String(orderRef));
                void broadcastStaffNotification("order.paid", {
                  id: updated.id,
                  order_number: updated.order_number,
                  total: totalNum,
                }).catch(() => {});
                void sendTelegramNotification(
                  `💰 <b>Order paid</b>\n` +
                  `<b>${safeOrderRef}</b> · $${totalNum.toFixed(2)}` +
                  (updated.is_rush ? "\n⚡ RUSH" : "")
                ).catch(() => {});
                // Increment customer lifetime stats now that payment is confirmed
                // (moved from order-creation to here so abandoned orders don't inflate)
                void incrementCustomerOrderStats(supabase, updated.customer_id, totalNum);
              }

              const order = updatedOrders[0];

              // ── Wave: approve invoice + record payment ──────────────────────
              // MUST run BEFORE the receipt email so the email's "Download Tax
              // Invoice (PDF)" link points to a Wave invoice that's actually
              // marked PAID. Bug 2026-05-22: previously ran after the email,
              // AND approveWaveInvoice threw on already-approved invoices,
              // which short-circuited recordWavePayment via shared try/catch.
              // 27 production orders ended up with Wave invoices stuck APPROVED
              // but unpaid, even though Clover had captured payment. Customers
              // clicking the receipt link saw "unpaid" tax invoices.
              //
              // Fix: split approve and record into independent try/catch +
              // skip approve if already approved + Telegram alert on failure.
              let wavePaid = false;
              const waveInvoiceId = order.wave_invoice_id ?? null;
              const orderTotal = Number(order.total ?? 0);
              if (waveInvoiceId && orderTotal > 0) {
                // 1. Approve invoice if not already approved at order-creation.
                //    Wave throws on re-approval; we skip rather than swallow so
                //    the failure path is reserved for genuine API errors.
                if (!order.wave_invoice_approved_at) {
                  try {
                    await approveWaveInvoice(waveInvoiceId);
                    const { error: tsErr } = await supabase.from("orders")
                      .update({ wave_invoice_approved_at: new Date().toISOString() })
                      .eq("id", order.id);
                    if (tsErr) console.error("[clover-webhook] wave_invoice_approved_at save failed (non-fatal):", tsErr.message);
                  } catch (approveErr) {
                    const msg = approveErr instanceof Error ? approveErr.message : String(approveErr);
                    console.error("[clover-webhook] Wave invoice approve failed (non-fatal):", msg);
                    void sendTelegramNotification(
                      `⚠️ <b>Wave approve failed</b>\n` +
                      `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${orderTotal.toFixed(2)}\n` +
                      `Invoice ID: <code>${escapeTelegramHtml(waveInvoiceId.slice(0, 24))}…</code>\n` +
                      `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
                      `Action: manually approve in Wave dashboard.`
                    ).catch(() => {});
                  }
                }

                // 2. Record payment — independent of approve so a missing
                //    approval (or a re-approval throw) never blocks the cash
                //    half of the bookkeeping.
                try {
                  const { data: orderCustomer } = await supabase
                    .from("customers")
                    .select("email")
                    .eq("id", order.customer_id)
                    .single();
                  const waveCustomerId = orderCustomer?.email
                    ? await findCustomerByEmail(orderCustomer.email).catch(() => null)
                    : null;

                  // Record THIS specific payment to Wave (not the full order total)
                  // so the multi-payment flow doesn't double-record what the partial
                  // branch already wrote. For single-payment flow, reportedDollars
                  // === orderTotal so behavior is unchanged.
                  await recordWavePayment(
                    waveInvoiceId,
                    reportedDollars,
                    "CREDIT_CARD",
                    `Clover card — Order ${order.order_number}`,
                    waveCustomerId ?? undefined,
                    paymentId ?? order.id,  // unique-per-Clover-payment idempotency key
                  );

                  const { error: tsErr } = await supabase.from("orders")
                    .update({ wave_payment_recorded_at: new Date().toISOString() })
                    .eq("id", order.id);
                  if (tsErr) console.error("[clover-webhook] wave_payment_recorded_at save failed (non-fatal):", tsErr.message);

                  wavePaid = true;
                  console.log(`[clover-webhook] Wave payment recorded → ${waveInvoiceId}`);
                } catch (paymentErr) {
                  const msg = paymentErr instanceof Error ? paymentErr.message : String(paymentErr);
                  console.error("[clover-webhook] Wave payment recording failed (non-fatal):", msg);
                  void sendTelegramNotification(
                    `🚨 <b>Wave payment NOT recorded</b>\n` +
                    `Order <b>${escapeTelegramHtml(order.order_number)}</b> · $${orderTotal.toFixed(2)}\n` +
                    `Customer was charged by Clover but Wave bookkeeping is out of sync.\n` +
                    `Invoice ID: <code>${escapeTelegramHtml(waveInvoiceId.slice(0, 24))}…</code>\n` +
                    `Error: ${escapeTelegramHtml(msg.slice(0, 200))}\n` +
                    `Action: open Wave, record the payment manually against this invoice.`
                  ).catch(() => {});
                }
              }

              try {
                const { data: customer } = await supabase
                  .from("customers")
                  .select("email, name, marketing_consent")
                  .eq("id", order.customer_id)
                  .single();
                if (customer) {
                  // Fetch full order WITH items — used for the itemized receipt.
                  // Note: cut the bare "payment confirmed" status email — receipt
                  // below has everything that one had + line items + GST# + PDF.
                  // Customer-facing emails per order: 9 → 4 (2026-05-14).
                  const { data: fullOrder } = await supabase
                    .from("orders")
                    .select(`subtotal, gst, pst, total, is_rush, discount_code, discount_amount, created_at, receipt_token, order_items ( product_name, qty, width_in, height_in, sides, line_total )`)
                    .eq("id", order.id)
                    .single();
                  const receiptItems = fullOrder && Array.isArray(fullOrder.order_items) ? fullOrder.order_items : [];

                  // Itemized receipt (non-fatal)
                  try {
                    if (fullOrder) {
                      // Fetch Wave invoice viewUrl ONLY when our bookkeeping
                      // confirms the invoice is PAID in Wave. If recordWavePayment
                      // failed above, fall back to the TC branded PDF only —
                      // customers should never receive a "Download Tax Invoice"
                      // link that points to an unpaid invoice (bug 2026-05-22).
                      const waveInvoiceUrl = wavePaid && order.wave_invoice_id
                        ? await getWaveInvoicePublicUrl(order.wave_invoice_id).catch(() => null)
                        : null;
                      await sendPaymentReceipt({
                        orderNumber: order.order_number,
                        customerName: customer.name,
                        customerEmail: customer.email,
                        createdAt: fullOrder.created_at,
                        items: receiptItems.map((i) => ({
                          product_name: i.product_name,
                          qty: i.qty,
                          width_in: i.width_in,
                          height_in: i.height_in,
                          sides: i.sides,
                          line_total: Number(i.line_total),
                        })),
                        subtotal: Number(fullOrder.subtotal),
                        gst: Number(fullOrder.gst),
                        pst: Number(fullOrder.pst ?? 0),
                        total: Number(fullOrder.total),
                        isRush: Boolean(fullOrder.is_rush),
                        discountCode: fullOrder.discount_code ?? null,
                        discountAmount: fullOrder.discount_amount ? Number(fullOrder.discount_amount) : null,
                        paymentMethod: "clover_card",
                        oid: order.id,
                        receiptToken: fullOrder.receipt_token ?? null,
                        waveInvoiceUrl,
                      });
                      console.log(`[clover-webhook] receipt sent → ${customer.email}${waveInvoiceUrl ? " (with Wave PDF)" : ""}`);

                      // GA4 Measurement Protocol — server-side purchase event (non-fatal, fire-and-forget)
                      // Captures orders that client-side gtag missed (ad blockers, ITP, corp networks)
                      void sendMeasurementProtocolEvent({
                        event_name: "purchase",
                        client_id: deriveClientIdFromCustomer(order.customer_id ?? order.id),
                        user_id: order.customer_id ?? undefined,
                        params: {
                          transaction_id: order.order_number,
                          value: Number(order.total),
                          currency: "CAD",
                          tax: Number(fullOrder.gst ?? 0) + Number(fullOrder.pst ?? 0),
                          payment_type: "clover_card",
                          items: receiptItems.map((i) => ({
                            item_id: (i.product_name ?? "").slice(0, 100),
                            item_name: i.product_name ?? "Unknown",
                            price: Number(i.qty) > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
                            quantity: Number(i.qty ?? 1),
                          })),
                        },
                      }).catch((err) => console.error("[clover-webhook] GA4 MP failed (non-fatal):", err));

                      // Meta Conversions API — Purchase event (server-side, deduped via event_id=order_number)
                      void sendMetaCapiEvent({
                        event_name: "Purchase",
                        event_id: order.order_number,
                        event_source_url: "https://truecolorprinting.ca/order-confirmed",
                        user_data: {
                          email: customer.email,
                          external_id: order.customer_id ?? undefined,
                        },
                        custom_data: {
                          currency: "CAD",
                          value: Number(order.total),
                          content_type: "product",
                          content_ids: receiptItems.map((i) => (i.product_name ?? "").slice(0, 100)),
                          num_items: receiptItems.reduce((s, i) => s + Number(i.qty ?? 1), 0),
                          contents: receiptItems.map((i) => ({
                            id: (i.product_name ?? "").slice(0, 100),
                            quantity: Number(i.qty ?? 1),
                            item_price: Number(i.qty) > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
                          })),
                        },
                      }).catch((err) => console.error("[clover-webhook] Meta CAPI failed (non-fatal):", err));

                      // Insert discount_redemptions for staff-assigned discounts that bypassed checkout (non-fatal)
                      if (fullOrder.discount_code) {
                        try {
                          const { data: dc } = await supabase
                            .from("discount_codes")
                            .select("id")
                            .ilike("code", fullOrder.discount_code)
                            .maybeSingle();
                          if (dc) {
                            const { count: existing } = await supabase
                              .from("discount_redemptions")
                              .select("*", { count: "exact", head: true })
                              .eq("order_id", order.id);
                            if ((existing ?? 0) === 0) {
                              await supabase.from("discount_redemptions").insert({
                                code_id: dc.id,
                                customer_id: order.customer_id,
                                order_id: order.id,
                                redeemed_at: new Date().toISOString(),
                              });
                              console.log(
                                `[clover-webhook] discount_redemptions inserted — code ${fullOrder.discount_code} | order ${order.order_number}`
                              );
                            }
                          }
                        } catch (redemptionErr) {
                          console.error("[clover-webhook] discount_redemptions insert failed (non-fatal):", redemptionErr);
                        }
                      }
                    }

                    // Brevo sync at payment_received (shifted from order creation — TC-15)
                    // Inside fullOrder block so order_items are in scope for productSummary
                    try {
                      const nameParts = customer.name.trim().split(/\s+/);
                      const orderItemNames = (Array.isArray(fullOrder?.order_items) ? fullOrder!.order_items as { product_name: string }[] : [])
                        .map((i) => i.product_name).join(", ");
                      await syncCustomerToBrevo({
                        email: customer.email,
                        firstName: nameParts[0] || customer.name,
                        lastName: nameParts.slice(1).join(" ") || undefined,
                        orderNumber: order.order_number,
                        orderTotal: Number(order.total),
                        productSummary: orderItemNames,
                        source: "checkout",
                        accountStatus: "none",
                        marketingConsent: (customer as { marketing_consent?: boolean | null }).marketing_consent === true,
                      });
                    } catch (brevoErr) {
                      console.error("[clover-webhook] Brevo sync failed (non-fatal):", brevoErr);
                    }
                  } catch (receiptErr) {
                    console.error("[clover-webhook] receipt failed (non-fatal):", receiptErr);
                  }
                }
              } catch (emailErr) {
                console.error("[clover-webhook] payment confirmed email failed (non-fatal):", emailErr);
              }
              // Wave approve+record was already handled above, before the receipt
              // email, so the email's Wave PDF link is only included when the
              // invoice is genuinely marked PAID.
            }
          }
        } catch (err) {
          console.error("[clover-webhook] unexpected error:", err);
          await logWebhookEvent({
            eventType: eventTypeStr,
            resourceId: paymentId ?? matchRef ?? null,
            matchedOrderId: null,
            ok: false,
            detail: `unexpected error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }
    } else {
      // PAYMENT event but not captured/paid — detect voided (declined) card payments
      const objRecord = obj as Record<string, unknown> | undefined;
      const isVoided = objRecord?.result === "VOIDED" || objRecord?.status === "voided";

      if (isVoided) {
        const voidReason = objRecord?.voidReason as string | undefined;
        const voidReasonDetails = objRecord?.voidReasonDetails as Record<string, unknown> | undefined;
        const voidDetail = voidReasonDetails?.descriptionEnum as string | undefined;

        const VOID_LABELS: Record<string, string> = {
          ECOMM_VALIDATE_POSTAL_CODE_MATCH: "Postal code didn't match",
          ECOMM_VALIDATE_CVV_MATCH: "CVV didn't match",
          REJECT: "Card rejected",
          FRAUD: "Fraud prevention",
        };
        const voidLabel = voidDetail ? (VOID_LABELS[voidDetail] ?? voidDetail) : (voidReason ?? "declined");

        const extRef = (objRecord?.externalReferenceId ?? objRecord?.external_reference_id) as string | undefined;
        let matchedOrderId: string | null = null;
        let orderNumber: string | null = null;
        let orderTotal: number | null = null;
        let custEmail: string | null = null;

        if (extRef) {
          const { data: voidedOrder } = await supabase
            .from("orders")
            .select("id, order_number, total, customers ( name, email )")
            .eq("payment_reference", extRef)
            .maybeSingle();

          if (voidedOrder) {
            matchedOrderId = voidedOrder.id;
            orderNumber = voidedOrder.order_number;
            orderTotal = Number(voidedOrder.total ?? 0);
            const custRaw = Array.isArray(voidedOrder.customers) ? voidedOrder.customers[0] : voidedOrder.customers;
            custEmail = (custRaw as { email?: string | null } | null)?.email ?? null;

            void recordAuditEvent({
              actor_type: "system",
              actor_id: "clover-webhook",
              event_type: "clover.payment_voided",
              entity_type: "order",
              entity_id: matchedOrderId ?? voidedOrder.id,
              detail: {
                order_number: orderNumber,
                amount_cents: typeof obj?.amount === "number" ? obj.amount : Number(obj?.amount ?? 0),
                void_reason: voidReason ?? null,
                void_detail: voidDetail ?? null,
                void_label: voidLabel,
                payment_id: paymentId ?? null,
              },
            });
          }
        }

        void sendTelegramNotification(
          `⚠️ <b>Card declined</b>\n` +
          (orderNumber ? `Order <b>${escapeTelegramHtml(orderNumber)}</b>` : `Ref: ${escapeTelegramHtml(extRef ?? "unknown")}`) +
          (orderTotal !== null ? ` · $${orderTotal.toFixed(2)}` : "") + `\n` +
          `Reason: ${escapeTelegramHtml(voidLabel)}\n` +
          (custEmail ? `Customer: ${escapeTelegramHtml(custEmail)}\n` : "") +
          `They may e-transfer instead — watch for it.`
        ).catch(() => {});

        // Staff email — same info as Telegram but visible in the inbox alongside other order emails
        void (async () => {
          try {
            const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
            const orderLabel = orderNumber ?? extRef ?? "Unknown";
            const amountLabel = orderTotal !== null ? `$${orderTotal.toFixed(2)}` : "Unknown amount";
            await sendEmail({
              to: staffEmail,
              subject: `Card declined — ${orderLabel}`,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
                  <h2 style="margin:0 0 16px;font-size:18px;color:#b91c1c">⚠ Card Declined</h2>
                  <table style="width:100%;border-collapse:collapse;font-size:14px">
                    <tr><td style="padding:6px 0;color:#666;width:130px">Order</td><td style="padding:6px 0;font-weight:600">${orderLabel}</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Amount</td><td style="padding:6px 0">${amountLabel}</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Reason</td><td style="padding:6px 0;color:#b91c1c;font-weight:600">${voidLabel}</td></tr>
                    ${custEmail ? `<tr><td style="padding:6px 0;color:#666">Customer</td><td style="padding:6px 0">${custEmail}</td></tr>` : ""}
                  </table>
                  <p style="margin:16px 0 0;font-size:13px;color:#555">The customer may e-transfer instead — check the orders screen. If no payment arrives within the hour, consider following up.</p>
                  <p style="margin:12px 0 0;font-size:12px;color:#999">This is an automated alert from True Color Printing · truecolorprinting.ca</p>
                </div>
              `,
              text: `Card Declined — ${orderLabel}\n\nAmount: ${amountLabel}\nReason: ${voidLabel}${custEmail ? `\nCustomer: ${custEmail}` : ""}\n\nThe customer may e-transfer instead. Check the orders screen.`,
            });
          } catch (emailErr) {
            console.error("[clover-webhook] staff card-decline email failed (non-fatal):", emailErr);
          }
        })();

        await logWebhookEvent({
          eventType: eventTypeStr,
          resourceId: paymentId ?? null,
          matchedOrderId,
          ok: true,
          detail: `PAYMENT voided: ${voidLabel}${orderNumber ? ` (order ${orderNumber})` : ""}`,
        });
      } else {
        await logWebhookEvent({
          eventType: eventTypeStr,
          resourceId: paymentId ?? null,
          matchedOrderId: null,
          ok: true,
          detail: `PAYMENT status=${String(obj?.status ?? "unknown")} — no action taken`,
        });
      }
    }
  } else {
    // Non-PAYMENT event (Clover may send others if extra subscriptions are added)
    await logWebhookEvent({
      eventType: eventTypeStr,
      resourceId: null,
      matchedOrderId: null,
      ok: true,
      detail: "unhandled event type — no action taken",
    });
  }

  // Always return 200 — Clover retries on non-200
  return NextResponse.json({ ok: true });
}
