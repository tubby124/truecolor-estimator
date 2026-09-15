/**
 * GET /api/cron/wave-poll
 *
 * Provider readback for linked Wave invoices. It recovers a retained
 * provisional invoice and ingests only verified Wave Payments captures.
 * Recent verified captures enqueue normal receipt and analytics effects.
 * Older recovered captures suppress customer-facing effects.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { recoverProvisionalOrderWaveInvoice } from "@/lib/payment/quote-wave";
import { createServiceClient } from "@/lib/supabase/server";
import {
  LIVE_WAVE_CUSTOMER_EFFECT_MAX_AGE_MS,
  getWaveInvoicePaymentSnapshot,
  reconcileWaveInvoicePaymentSnapshot,
} from "@/lib/wave/payments";

interface WavePollOrder {
  id: string;
  order_number: string;
  wave_invoice_id: string | null;
  wave_invoice_approved_at: string | null;
  wave_payment_recorded_at: string | null;
  quote_wave_state: string | null;
  quote_wave_reservation_id: string | null;
  status: string;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: rows, error } = await supabase
      .from("orders")
      .select("id, order_number, wave_invoice_id, wave_invoice_approved_at, wave_payment_recorded_at, quote_wave_state, quote_wave_reservation_id, status")
      .gte("created_at", cutoff)
      .not("wave_invoice_id", "is", null)
      .not("is_archived", "is", true)
      .is("voided_at", null)
      .or("wave_invoice_approved_at.is.null,wave_payment_recorded_at.is.null,status.eq.pending_payment");
    if (error) {
      await recordCronRun("wave-poll", false, error.message.slice(0, 200));
      return NextResponse.json({ ok: false, error: "Wave poll order query failed" }, { status: 500 });
    }

    const orders = (rows ?? []) as WavePollOrder[];
    let approvedRecovered = 0;
    let providerPaymentsAccepted = 0;
    let manualPaymentsIgnored = 0;
    let partialOrders = 0;
    let fullyPaidOrders = 0;
    let waveErrors = 0;

    for (const order of orders) {
      if (!order.wave_invoice_id) continue;
      try {
        const snapshot = await getWaveInvoicePaymentSnapshot(order.wave_invoice_id);

        if (
          !order.wave_invoice_approved_at &&
          order.quote_wave_state === "ambiguous" &&
          order.quote_wave_reservation_id
        ) {
          const recovered = await recoverProvisionalOrderWaveInvoice(supabase, order.id);
          if (recovered.action === "ready") approvedRecovered += 1;
        }

        const reconciliation = await reconcileWaveInvoicePaymentSnapshot(supabase, snapshot, {
          enqueueCustomerEffects: true,
          customerEffectMaxAgeMs: LIVE_WAVE_CUSTOMER_EFFECT_MAX_AGE_MS,
          enqueueStaffEffect: true,
        });
        providerPaymentsAccepted += reconciliation.verifiedPayments.length;
        manualPaymentsIgnored += reconciliation.ignoredPayments;
        const last = reconciliation.acceptances.at(-1);
        if (last?.outcome === "partial") partialOrders += 1;
        if (["transitioned", "already_processed", "overpaid"].includes(last?.outcome ?? "")) fullyPaidOrders += 1;

        if (reconciliation.verifiedPayments.length > 0) {
          void recordAuditEvent({
            actor_type: "cron",
            actor_id: "wave-poll",
            event_type: "wave.provider_payment_reconciled",
            entity_type: "order",
            entity_id: order.id,
            detail: {
              source: "wave-provider-readback",
              wave_invoice_number: snapshot.invoiceNumber,
              verified_payments: reconciliation.verifiedPayments.length,
              ignored_payments: reconciliation.ignoredPayments,
              outcome: last?.outcome ?? null,
              customer_effect_policy: "verified_capture_within_24_hours",
            },
          });
        }
      } catch (waveError) {
        waveErrors += 1;
        console.error("[wave-poll] Wave reconciliation failed", {
          order_id: order.id,
          error_type: waveError instanceof Error ? waveError.name : "UnknownError",
        });
      }
    }

    const detail =
      `scanned=${orders.length} approved+=${approvedRecovered} provider_payments=${providerPaymentsAccepted} ` +
      `manual_ignored=${manualPaymentsIgnored} partial=${partialOrders} full=${fullyPaidOrders} errors=${waveErrors}`;
    const ok = waveErrors === 0;
    await recordCronRun("wave-poll", ok, detail);
    return NextResponse.json({
      ok,
      scanned: orders.length,
      approved_recovered: approvedRecovered,
      provider_payments_accepted: providerPaymentsAccepted,
      manual_payments_ignored: manualPaymentsIgnored,
      partial_orders: partialOrders,
      fully_paid_orders: fullyPaidOrders,
      wave_errors: waveErrors,
      customer_effect_policy: "verified_capture_within_24_hours",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "wave-poll failed";
    await recordCronRun("wave-poll", false, message.slice(0, 200));
    return NextResponse.json({ ok: false, error: "Wave poll failed" }, { status: 500 });
  }
}
