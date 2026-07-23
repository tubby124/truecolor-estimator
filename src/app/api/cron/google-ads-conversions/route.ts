import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordCronRun } from "@/lib/cron/heartbeat";
import {
  retrievePaidConversionDiagnostics,
  uploadPaidConversion,
  type PaidConversionJob,
} from "@/lib/google-ads/conversion-upload";
import { createServiceClient } from "@/lib/supabase/server";
import { deriveClientIdFromCustomer, sendMeasurementProtocolEvent } from "@/lib/analytics/measurementProtocol";

interface PaidConversionDiagnosticJob extends PaidConversionJob {
  data_manager_request_id: string | null;
  submitted_at: string | null;
  diagnostic_attempt_count: number;
}

interface PaidConversionDiagnostics {
  requestStatus: string;
  recordCount: number;
  warnings: string[];
  errors: string[];
  delivered: boolean;
  processing: boolean;
  duplicateTransactionOnly: boolean;
}

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
const FIRST_DIAGNOSTIC_DELAY_MINUTES = 30;
const MAX_DIAGNOSTIC_DELAY_MINUTES = 60;
const DIAGNOSTIC_BACKOFF_FACTOR = 1.3;
const DIAGNOSTIC_TERMINAL_MS = 24 * 60 * 60 * 1000;
const MAX_UPLOAD_ATTEMPTS = 8;

export type DiagnosticDisposition =
  | { status: "sent"; detail: string }
  | { status: "submitted"; delayMinutes: number; detail: string }
  | { status: "retry" | "dead"; detail: string };

export function nextDiagnosticDelayMinutes(diagnosticAttemptCount: number): number {
  const exponent = Math.max(diagnosticAttemptCount, 0);
  return Math.min(
    FIRST_DIAGNOSTIC_DELAY_MINUTES * DIAGNOSTIC_BACKOFF_FACTOR ** exponent,
    MAX_DIAGNOSTIC_DELAY_MINUTES,
  );
}

export function nextDiagnosticAt(
  submittedAt: string,
  nowMs: number,
  delayMinutes: number,
): string {
  const terminalAtMs = new Date(submittedAt).getTime() + DIAGNOSTIC_TERMINAL_MS;
  return new Date(Math.min(nowMs + delayMinutes * 60_000, terminalAtMs)).toISOString();
}

export function classifyPaidConversionDiagnostics(
  job: Pick<PaidConversionDiagnosticJob, "attempt_count" | "diagnostic_attempt_count" | "submitted_at">,
  diagnostics: PaidConversionDiagnostics,
  nowMs = Date.now(),
): DiagnosticDisposition {
  if (
    diagnostics.duplicateTransactionOnly ||
    (
      diagnostics.requestStatus === "SUCCESS" &&
      diagnostics.delivered &&
      diagnostics.recordCount === 1
    )
  ) {
    return {
      status: "sent",
      detail: diagnostics.duplicateTransactionOnly
        ? "transaction ID already delivered"
        : "SUCCESS recordCount=1",
    };
  }

  const submittedAtMs = job.submitted_at ? new Date(job.submitted_at).getTime() : Number.NaN;
  const terminalWindowElapsed = !Number.isFinite(submittedAtMs)
    || nowMs - submittedAtMs >= DIAGNOSTIC_TERMINAL_MS;
  const detail = diagnostics.errors.length > 0
    ? diagnostics.errors.join("; ")
    : `${diagnostics.requestStatus || "UNKNOWN"} recordCount=${diagnostics.recordCount}`;

  const terminalRequestStatus = new Set(["SUCCESS", "FAILED", "PARTIAL_SUCCESS"])
    .has(diagnostics.requestStatus);
  if (diagnostics.processing || !terminalRequestStatus) {
    if (terminalWindowElapsed) {
      return { status: "dead", detail: `diagnostics exceeded 24h: ${detail}` };
    }
    return {
      status: "submitted",
      delayMinutes: nextDiagnosticDelayMinutes(job.diagnostic_attempt_count),
      detail,
    };
  }

  return {
    status: terminalWindowElapsed || job.attempt_count >= MAX_UPLOAD_ATTEMPTS
      ? "dead"
      : "retry",
    detail,
  };
}

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
  let submitted = 0;
  let sent = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      const result = await uploadPaidConversion(job);
      if (!result.requestId) throw new Error("Data Manager ingest returned no request ID");
      const now = new Date();
      const { data: updated, error: updateError } = await supabase
        .from("google_ads_conversion_outbox")
        .update({
          status: "submitted",
          data_manager_request_id: result.requestId,
          submitted_at: now.toISOString(),
          next_diagnostic_at: new Date(
            now.getTime() + FIRST_DIAGNOSTIC_DELAY_MINUTES * 60_000,
          ).toISOString(),
          diagnostic_attempt_count: 0,
          diagnostic_claimed_at: null,
          diagnostics_checked_at: null,
          diagnostic_status: "INGEST_ACCEPTED",
          diagnostic_warning: null,
          // Keep the legacy field populated while downstream reporting migrates.
          google_job_id: result.requestId,
          uploaded_at: null,
          processing_started_at: null,
          last_error: null,
          updated_at: now.toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();
      if (updateError || !updated) {
        throw new Error(`submitted-state update failed: ${updateError?.message ?? "row was not processing"}`);
      }
      submitted += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown upload error";
      const terminal = job.attempt_count >= MAX_UPLOAD_ATTEMPTS;
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

  const { data: diagnosticData, error: diagnosticClaimError } = await supabase
    .rpc("claim_google_ads_conversion_diagnostics", { p_limit: CLAIM_LIMIT });
  const diagnosticJobs = (diagnosticData ?? []) as PaidConversionDiagnosticJob[];
  let diagnosticProcessing = 0;
  let diagnosticRetry = 0;
  let diagnosticDead = 0;
  if (diagnosticClaimError) {
    failed += 1;
  } else {
    for (const job of diagnosticJobs) {
      try {
        if (!job.data_manager_request_id || !job.submitted_at) {
          throw new Error("Claimed diagnostic row is missing request ID or submitted_at");
        }
        const diagnostics = await retrievePaidConversionDiagnostics(
          job.data_manager_request_id,
          job.conversion_type,
        );
        const disposition = classifyPaidConversionDiagnostics(job, diagnostics);
        const now = new Date();
        const warning = diagnostics.warnings.length > 0
          ? diagnostics.warnings.join("; ").slice(0, 1000)
          : null;

        if (disposition.status === "sent") {
          const { data: updated, error: updateError } = await supabase
            .from("google_ads_conversion_outbox")
            .update({
              status: "sent",
              uploaded_at: now.toISOString(),
              next_diagnostic_at: null,
              diagnostics_checked_at: now.toISOString(),
              diagnostic_status: diagnostics.requestStatus,
              diagnostic_warning: warning,
              last_error: null,
              updated_at: now.toISOString(),
            })
            .eq("id", job.id)
            .eq("status", "submitted")
            .eq("data_manager_request_id", job.data_manager_request_id)
            .select("id")
            .maybeSingle();
          if (updateError || !updated) {
            throw new Error(`sent-state update failed: ${updateError?.message ?? "submitted request changed"}`);
          }
          sent += 1;
          continue;
        }

        if (disposition.status === "submitted") {
          const { data: updated, error: updateError } = await supabase
            .from("google_ads_conversion_outbox")
            .update({
              status: "submitted",
              next_diagnostic_at: nextDiagnosticAt(
                job.submitted_at,
                now.getTime(),
                disposition.delayMinutes,
              ),
              diagnostics_checked_at: now.toISOString(),
              diagnostic_status: diagnostics.requestStatus,
              diagnostic_warning: warning,
              last_error: null,
              updated_at: now.toISOString(),
            })
            .eq("id", job.id)
            .eq("status", "submitted")
            .eq("data_manager_request_id", job.data_manager_request_id)
            .select("id")
            .maybeSingle();
          if (updateError || !updated) {
            throw new Error(`diagnostic-state update failed: ${updateError?.message ?? "submitted request changed"}`);
          }
          diagnosticProcessing += 1;
          continue;
        }

        const retryDelayMinutes = Math.min(
          5 * 2 ** Math.max(job.attempt_count - 1, 0),
          360,
        );
        const { data: updated, error: updateError } = await supabase
          .from("google_ads_conversion_outbox")
          .update({
            status: disposition.status,
            next_attempt_at: new Date(now.getTime() + retryDelayMinutes * 60_000).toISOString(),
            next_diagnostic_at: null,
            diagnostics_checked_at: now.toISOString(),
            diagnostic_status: diagnostics.requestStatus,
            diagnostic_warning: warning,
            last_error: disposition.detail.slice(0, 1000),
            updated_at: now.toISOString(),
          })
          .eq("id", job.id)
          .eq("status", "submitted")
          .eq("data_manager_request_id", job.data_manager_request_id)
          .select("id")
          .maybeSingle();
        if (updateError || !updated) {
          throw new Error(`diagnostic-failure update failed: ${updateError?.message ?? "submitted request changed"}`);
        }
        if (disposition.status === "dead") diagnosticDead += 1;
        else diagnosticRetry += 1;
        failed += 1;
      } catch (error) {
        failed += 1;
        const now = new Date();
        const submittedAtMs = job.submitted_at
          ? new Date(job.submitted_at).getTime()
          : Number.NaN;
        const terminal = !Number.isFinite(submittedAtMs)
          || now.getTime() - submittedAtMs >= DIAGNOSTIC_TERMINAL_MS;
        await supabase
          .from("google_ads_conversion_outbox")
          .update({
            status: terminal ? "dead" : "submitted",
            next_diagnostic_at: terminal
              ? null
              : nextDiagnosticAt(
                job.submitted_at ?? now.toISOString(),
                now.getTime(),
                nextDiagnosticDelayMinutes(job.diagnostic_attempt_count),
              ),
            last_error: (error instanceof Error ? error.message : "Unknown diagnostic error").slice(0, 1000),
            updated_at: now.toISOString(),
          })
          .eq("id", job.id)
          .eq("status", "submitted")
          .eq("data_manager_request_id", job.data_manager_request_id);
        if (terminal) diagnosticDead += 1;
        else diagnosticProcessing += 1;
      }
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
        const terminal = event.attempt_count >= MAX_UPLOAD_ATTEMPTS;
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
    `revenue_claimed=${jobs.length} revenue_submitted=${submitted} diagnostics_claimed=${diagnosticJobs.length} diagnostics_sent=${sent} diagnostics_processing=${diagnosticProcessing} diagnostics_retry=${diagnosticRetry} diagnostics_dead=${diagnosticDead} quote_claimed=${quoteEvents.length} quote_sent=${quoteSent} failed=${failed}`,
  );

  return NextResponse.json({
    ok,
    revenue: {
      claimed: jobs.length,
      submitted,
      diagnostics: {
        claimed: diagnosticJobs.length,
        sent,
        processing: diagnosticProcessing,
        retry: diagnosticRetry,
        dead: diagnosticDead,
      },
    },
    quotes: { claimed: quoteEvents.length, sent: quoteSent },
    failed,
  }, { status: ok ? 200 : 503 });
}
