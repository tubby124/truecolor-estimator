/**
 * POST /api/webhooks/wave
 *
 * Receives signed Wave invoice-paid events. Payment truth, the accounting
 * ledger, and all downstream work are committed together by
 * accept_wave_paid_invoice. External effects are processed from the durable
 * queue here for low latency and by the cron worker for crash recovery.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processWavePaymentEffects } from "@/lib/payment/wave-payment-effects";
import { createServiceClient } from "@/lib/supabase/server";
import { reconcileWaveInvoicePayments } from "@/lib/wave/payments";

function safeSignatureEqual(signature: string, expected: string): boolean {
  const signatureBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return (
    signatureBytes.length === expectedBytes.length &&
    timingSafeEqual(signatureBytes, expectedBytes)
  );
}

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  const webhookSecret = process.env.WAVE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[wave-webhook] WAVE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-wave-signature") ?? "";
  const expected =
    "sha256=" +
    createHmac("sha256", webhookSecret).update(bodyText).digest("hex");
  if (!signature || !safeSignatureEqual(signature, expected)) {
    console.warn("[wave-webhook] Invalid or missing signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventData = event.data as Record<string, unknown> | undefined;
  const resource = eventData?.resource as Record<string, unknown> | undefined;
  const supabase = createServiceClient();

  async function logWebhookEvent(options: {
    eventType: string;
    resourceId: string | null;
    matchedOrderId: string | null;
    ok: boolean;
    detail: string;
  }) {
    try {
      await supabase.from("webhook_events").insert({
        event_source: "wave",
        event_type: options.eventType,
        resource_id: options.resourceId,
        matched_order_id: options.matchedOrderId,
        ok: options.ok,
        detail: options.detail,
      });
    } catch (error) {
      console.error("[wave-webhook] webhook_events log failed (non-fatal):", error);
    }
  }

  if (
    eventData?.resourceType !== "invoice" ||
    resource?.status !== "paid" ||
    typeof resource.id !== "string" ||
    !resource.id
  ) {
    const eventType = eventData?.resourceType
      ? `${eventData.resourceType}.${resource?.status ?? "unknown"}`
      : "unknown";
    await logWebhookEvent({
      eventType,
      resourceId: typeof resource?.id === "string" ? resource.id : null,
      matchedOrderId: null,
      ok: true,
      detail: "unhandled event type — no action taken",
    });
    return NextResponse.json({ ok: true, skipped: eventType });
  }

  const waveInvoiceId = resource.id;
  let reconciliation;
  try {
    // The signed event is only a prompt to read Wave. Provider payment fields,
    // amount, and identity all come from authenticated GraphQL readback.
    reconciliation = await reconcileWaveInvoicePayments(supabase, waveInvoiceId, {
      enqueueCustomerEffects: true,
      enqueueStaffEffect: true,
    });
  } catch (error) {
    console.error(
      "[wave-webhook] verified payment readback/acceptance failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    await logWebhookEvent({
      eventType: "invoice.paid",
      resourceId: waveInvoiceId,
      matchedOrderId: null,
      ok: false,
      detail: "verified payment readback or atomic acceptance failed",
    });
    return NextResponse.json(
      { ok: false, error: "Payment acceptance failed" },
      { status: 503 },
    );
  }

  if (reconciliation.verifiedPayments.length === 0) {
    await logWebhookEvent({
      eventType: "invoice.paid",
      resourceId: waveInvoiceId,
      matchedOrderId: null,
      ok: true,
      detail: `no verified Wave Payments customer capture; ignored payments=${reconciliation.ignoredPayments}`,
    });
    return NextResponse.json({ ok: true, outcome: "no_verified_provider_payment" });
  }

  const acceptance = reconciliation.acceptances.at(-1);
  if (!acceptance) return NextResponse.json({ ok: false, error: "Payment acceptance returned no result" }, { status: 503 });
  const accepted = ["transitioned", "partial", "overpaid", "already_processed"].includes(acceptance.outcome);
  await logWebhookEvent({
    eventType: "invoice.paid",
    resourceId: waveInvoiceId,
    matchedOrderId: acceptance.order_id,
    ok: acceptance.outcome !== "not_found",
    detail: accepted
      ? `order ${acceptance.order_number ?? acceptance.order_id} ${acceptance.outcome}; provider=Wave Payments; verified=${reconciliation.verifiedPayments.length}; durable effects=${acceptance.effects_pending}`
      : `invoice payment skipped: ${acceptance.outcome}`,
  });

  if (accepted && acceptance.order_id && acceptance.effects_pending > 0) {
    try {
      const effects = await processWavePaymentEffects({
        supabase,
        orderId: acceptance.order_id,
        maxJobs: 3,
      });
      console.log(
        `[wave-webhook] durable effects order=${acceptance.order_number ?? acceptance.order_id} ` +
          `claimed=${effects.claimed} sent=${effects.sent} retry=${effects.retried} dead=${effects.dead}`,
      );
    } catch (workerError) {
      // The queue is already committed. The scheduled worker will reclaim
      // unacknowledged processing rows after the lease or retry due time.
      console.error(
        "[wave-webhook] immediate effect processing failed; work remains durable:",
        workerError,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    outcome: acceptance.outcome,
    orderId: acceptance.order_id,
    effectsPending: acceptance.effects_pending,
  });
}
