/**
 * GET /api/cron/wave-poll
 *
 * Polls Wave for state changes on orders whose local Wave timestamps look
 * stale. Catches the "Albert clicked Approve in Wave UI without going through
 * our staff portal" gap — the Wave webhook is configured for customer-side
 * payment events, not the Approve action, so Wave drafts manually approved
 * in the Wave dashboard never updated our local wave_invoice_approved_at.
 *
 * Looks at every paid order in the last 60 days where:
 *   - wave_invoice_id is set
 *   - AND (wave_invoice_approved_at IS NULL OR wave_payment_recorded_at IS NULL)
 *
 * For each, queries Wave for the invoice's current status + payments, then
 * backfills the missing timestamps locally. Non-destructive — only sets
 * NULL columns; never overwrites existing values.
 *
 * Schedule: every 6 hours.
 * Auth: Bearer ${CRON_SECRET}.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { waveQuery, WAVE_BUSINESS_ID } from "@/lib/wave/client";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { recordAuditEvent } from "@/lib/audit/record";

interface WaveInvoiceState {
  id: string;
  invoiceNumber: string;
  status: string;        // DRAFT | SAVED | UNPAID | PARTIAL | PAID | OVERPAID
  approvedAt: string | null;
  payments?: {
    edges: Array<{
      node: {
        id: string;
        amount: { raw: string };
        paymentMethod: string;
        memo: string | null;
        transferDate: string;
      };
    }>;
  };
}

const INVOICE_QUERY = `
  query InvoiceState($businessId: ID!, $invoiceId: ID!) {
    business(id: $businessId) {
      invoice(id: $invoiceId) {
        id
        invoiceNumber
        status
        approvedAt
        payments {
          edges {
            node {
              id
              amount { raw }
              paymentMethod
              memo
              transferDate
            }
          }
        }
      }
    }
  }
`;

interface WaveQueryResult {
  business: { invoice: WaveInvoiceState | null } | null;
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
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, order_number, total, wave_invoice_id, wave_invoice_number, wave_invoice_approved_at, wave_payment_recorded_at, status")
      .gte("created_at", cutoff)
      .not("wave_invoice_id", "is", null)
      .or("wave_invoice_approved_at.is.null,wave_payment_recorded_at.is.null");

    if (error) {
      console.error("[wave-poll] orders query failed:", error.message);
      await recordCronRun("wave-poll", false, error.message.slice(0, 200));
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const candidates = orders ?? [];
    let approvedBackfilled = 0;
    let paymentBackfilled = 0;
    let waveErrors = 0;

    for (const o of candidates) {
      if (!o.wave_invoice_id) continue;
      try {
        const res = await waveQuery<WaveQueryResult>(INVOICE_QUERY, {
          businessId: WAVE_BUSINESS_ID,
          invoiceId: o.wave_invoice_id,
        });
        const inv = res.business?.invoice;
        if (!inv) continue;

        const updates: Record<string, unknown> = {};

        // Backfill approved_at if Wave shows approved but local doesn't
        if (!o.wave_invoice_approved_at && inv.approvedAt) {
          updates.wave_invoice_approved_at = inv.approvedAt;
          approvedBackfilled++;
          void recordAuditEvent({
            actor_type: "cron",
            actor_id: "wave-poll",
            event_type: "wave.invoice_approved",
            entity_type: "order",
            entity_id: o.id,
            detail: {
              source: "wave-poll-backfill",
              wave_invoice_number: inv.invoiceNumber,
              approved_at: inv.approvedAt,
            },
          });
        }

        // Backfill payment timestamp if Wave shows paid but local doesn't.
        // Use the most recent payment's transferDate.
        if (!o.wave_payment_recorded_at && inv.status === "PAID") {
          const payments = inv.payments?.edges ?? [];
          const latest = payments
            .map((e) => e.node)
            .sort((a, b) => b.transferDate.localeCompare(a.transferDate))[0];
          if (latest) {
            updates.wave_payment_recorded_at = `${latest.transferDate}T00:00:00Z`;
            paymentBackfilled++;
            void recordAuditEvent({
              actor_type: "cron",
              actor_id: "wave-poll",
              event_type: "wave.payment_recorded",
              entity_type: "order",
              entity_id: o.id,
              detail: {
                source: "wave-poll-backfill",
                wave_invoice_number: inv.invoiceNumber,
                payment_method: latest.paymentMethod,
                amount: latest.amount.raw,
              },
            });
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error: upErr } = await supabase
            .from("orders")
            .update(updates)
            .eq("id", o.id);
          if (upErr) console.error(`[wave-poll] update failed for ${o.order_number}:`, upErr.message);
        }
      } catch (waveErr) {
        waveErrors++;
        console.error(`[wave-poll] Wave query failed for ${o.order_number}:`, waveErr instanceof Error ? waveErr.message : waveErr);
      }
    }

    const detail = `scanned=${candidates.length} approved+=${approvedBackfilled} paid+=${paymentBackfilled} errors=${waveErrors}`;
    console.log(`[wave-poll] ${detail}`);
    await recordCronRun("wave-poll", waveErrors < candidates.length / 2, detail);
    return NextResponse.json({
      ok: true,
      scanned: candidates.length,
      approved_backfilled: approvedBackfilled,
      payment_backfilled: paymentBackfilled,
      wave_errors: waveErrors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "wave-poll failed";
    console.error("[wave-poll]", msg);
    await recordCronRun("wave-poll", false, msg.slice(0, 200));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
