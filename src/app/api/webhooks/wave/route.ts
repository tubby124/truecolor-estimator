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

interface WavePaymentAcceptance {
  outcome:
    | "transitioned"
    | "already_processed"
    | "not_found"
    | "not_wave_order"
    | "legacy_already_paid"
    | "not_payable";
  order_id: string | null;
  order_number: string | null;
  payment_transitioned: boolean;
  effects_pending: number;
}

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
  const { data, error } = await supabase.rpc("accept_wave_paid_invoice", {
    p_wave_invoice_id: waveInvoiceId,
  });
  if (error) {
    console.error("[wave-webhook] atomic payment acceptance failed:", error.message);
    await logWebhookEvent({
      eventType: "invoice.paid",
      resourceId: waveInvoiceId,
      matchedOrderId: null,
      ok: false,
      detail: "atomic payment acceptance failed",
    });
    // The transition, ledger, and work rows share one transaction. A non-200
    // safely asks Wave to retry because no partial payment state committed.
    return NextResponse.json(
      { ok: false, error: "Payment acceptance failed" },
      { status: 503 },
    );
  }

  const acceptance = (Array.isArray(data) ? data[0] : data) as
    | WavePaymentAcceptance
    | null;
  if (!acceptance?.outcome) {
    console.error("[wave-webhook] atomic payment acceptance returned no result");
    return NextResponse.json(
      { ok: false, error: "Payment acceptance returned no result" },
      { status: 503 },
    );
  }

  const accepted =
    acceptance.outcome === "transitioned" ||
    acceptance.outcome === "already_processed";
  await logWebhookEvent({
    eventType: "invoice.paid",
    resourceId: waveInvoiceId,
    matchedOrderId: acceptance.order_id,
    ok: acceptance.outcome !== "not_found",
    detail: accepted
      ? `order ${acceptance.order_number ?? acceptance.order_id} ${acceptance.outcome}; durable effects=${acceptance.effects_pending}`
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
