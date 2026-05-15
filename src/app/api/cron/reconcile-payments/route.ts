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
 * Three checks:
 *   1. Wave-method orders > 1 hour old with NULL wave_invoice_id
 *      → "Wave invoice creation may have failed silently"
 *   2. Wave invoices that exist on Wave's side but no matching Supabase order
 *      → "orphan Wave invoice — unlinked"
 *   3. Clover-card orders > 24h old still at pending_payment
 *      → "Clover webhook may have missed the order — verify in Clover dashboard"
 *
 * Telegram alert fires only if at least 1 issue is found. Silent otherwise.
 *
 * Schedule: daily 9 AM MT (15 UTC during MST, 16 UTC during MDT).
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const WAVE_BIZ = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";

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

interface ReconcileIssue {
  kind: "wave_invoice_missing" | "wave_orphan" | "clover_stuck";
  order_number?: string;
  wave_invoice_number?: string;
  detail: string;
  age_hours?: number;
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

    const TITLE_RE = /^True Color Order (TC-\d{4}-\d{4})$/;
    const recentTcInvoices = (waveResp.business?.invoices?.edges ?? [])
      .map((e) => e.node)
      .map((n) => ({ ...n, orderNumber: n.title.match(TITLE_RE)?.[1] }))
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

  // ── Check 3: Clover-card orders > 24h old still pending_payment ──────────
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stuckClover, error: err3 } = await supabase
    .from("orders")
    .select("order_number, total, created_at, payment_reference")
    .eq("payment_method", "clover_card")
    .eq("status", "pending_payment")
    .lt("created_at", cutoff24h)
    .order("created_at", { ascending: false })
    .limit(20);

  if (err3) {
    console.error("[reconcile] check 3 query failed:", err3.message);
  } else {
    for (const o of stuckClover ?? []) {
      const ageHours = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600_000);
      const ageDays = Math.floor(ageHours / 24);
      issues.push({
        kind: "clover_stuck",
        order_number: o.order_number,
        detail: `$${Number(o.total).toFixed(2)} · ${ageDays}d old · payment_reference=${o.payment_reference ?? "NULL"} · check Clover dashboard for matching payment`,
        age_hours: ageHours,
      });
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
      lines.push(`\n<b>Clover stuck pending_payment ≥24h</b> (${groupedByKind.clover_stuck.length})`);
      for (const i of groupedByKind.clover_stuck.slice(0, 5)) {
        lines.push(`  • ${escapeTelegramHtml(i.order_number ?? "?")} — ${escapeTelegramHtml(i.detail)}`);
      }
    }

    lines.push(`\n<i>Run scripts/backfill-wave-invoice-ids.mjs --apply for Wave gaps.</i>`);
    lines.push(`<i>Cross-check via Clover MCP for stuck Clover orders.</i>`);

    await sendTelegramNotification(lines.join("\n")).catch((err) => {
      console.error("[reconcile] telegram alert failed:", err);
    });
  }

  console.log(`[reconcile-payments] ${issues.length} issues found`);
  return NextResponse.json({
    ok: true,
    issues_total: issues.length,
    by_kind: {
      wave_invoice_missing: issues.filter((i) => i.kind === "wave_invoice_missing").length,
      wave_orphan: issues.filter((i) => i.kind === "wave_orphan").length,
      clover_stuck: issues.filter((i) => i.kind === "clover_stuck").length,
    },
  });
}
