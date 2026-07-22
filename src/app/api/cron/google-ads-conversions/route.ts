import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { uploadPaidConversion, type PaidConversionJob } from "@/lib/google-ads/conversion-upload";
import { createServiceClient } from "@/lib/supabase/server";
import { deriveClientIdFromCustomer, sendMeasurementProtocolEvent } from "@/lib/analytics/measurementProtocol";

interface QuoteMeasurementJob {
  id: string;
  quote_id: string;
  event_name: "quote_submit" | "quote_qualified";
  attempt_count: number;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Claim exactly the row this sequential worker is about to process. A network
// hang can then strand at most the active row, never a tail of unprocessed rows
// whose attempts were already consumed before the five-minute job deadline.
const CLAIM_LIMIT = 1;

function authorized(req: NextRequest, secret: string): boolean {
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (!authorized(req, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("claim_google_ads_conversions", { p_limit: CLAIM_LIMIT });
  if (error) {
    await recordCronRun("google-ads-conversions", false, `claim_failed=${error.message.slice(0, 120)}`);
    return NextResponse.json({ error: "Conversion queue claim failed" }, { status: 503 });
  }

  const jobs = (data ?? []) as PaidConversionJob[];
  let sent = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      const result = await uploadPaidConversion(job);
      const { data: updated, error: updateError } = await supabase
        .from("google_ads_conversion_outbox")
        .update({
          status: "sent",
          google_job_id: result.jobId,
          uploaded_at: new Date().toISOString(),
          processing_started_at: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();
      if (updateError || !updated) throw new Error(`sent-state update failed: ${updateError?.message ?? "row was not processing"}`);
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown upload error";
      const terminal = job.attempt_count >= 8;
      const delayMinutes = Math.min(5 * 2 ** Math.max(job.attempt_count - 1, 0), 360);
      await supabase
        .from("google_ads_conversion_outbox")
        .update({
          status: terminal ? "dead" : "retry",
          next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
          processing_started_at: null,
          last_error: message.slice(0, 1000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "processing");
    }
  }

  const { data: quoteEventData, error: quoteEventClaimError } = await supabase
    .rpc("claim_quote_measurement_events", { p_limit: CLAIM_LIMIT });
  const quoteEvents = (quoteEventData ?? []) as QuoteMeasurementJob[];
  let quoteSent = 0;
  if (quoteEventClaimError) {
    failed += 1;
  } else {
    for (const event of quoteEvents) {
      try {
        const delivered = await sendMeasurementProtocolEvent({
          event_name: event.event_name,
          client_id: deriveClientIdFromCustomer(event.quote_id),
          user_id: event.quote_id,
          params: {
            quote_id: event.quote_id,
            event_id: `${event.event_name}:${event.quote_id}`,
            form_id: event.event_name === "quote_qualified" ? "staff_structured_quote" : "quote-request",
            engagement_time_msec: 1,
          },
        });
        if (!delivered) throw new Error(`GA4 Measurement Protocol did not accept ${event.event_name}`);
        const { data: updated, error: updateError } = await supabase
          .from("quote_measurement_event_outbox")
          .update({ status: "sent", sent_at: new Date().toISOString(), processing_started_at: null, last_error: null, updated_at: new Date().toISOString() })
          .eq("id", event.id)
          .eq("status", "processing")
          .select("id")
          .maybeSingle();
        if (updateError || !updated) throw new Error(updateError?.message ?? "quote measurement row was not processing");
        quoteSent += 1;
      } catch (error) {
        failed += 1;
        const terminal = event.attempt_count >= 8;
        const delayMinutes = Math.min(5 * 2 ** Math.max(event.attempt_count - 1, 0), 360);
        await supabase.from("quote_measurement_event_outbox").update({
          status: terminal ? "dead" : "retry",
          next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
          processing_started_at: null,
          last_error: (error instanceof Error ? error.message : "Unknown GA4 error").slice(0, 1000),
          updated_at: new Date().toISOString(),
        }).eq("id", event.id).eq("status", "processing");
      }
    }
  }

  const ok = failed === 0;
  await recordCronRun(
    "google-ads-conversions",
    ok,
    `revenue_claimed=${jobs.length} revenue_sent=${sent} quote_claimed=${quoteEvents.length} quote_sent=${quoteSent} failed=${failed}`,
  );

  return NextResponse.json({
    ok,
    revenue: { claimed: jobs.length, sent },
    quotes: { claimed: quoteEvents.length, sent: quoteSent },
    failed,
  }, { status: ok ? 200 : 503 });
}
