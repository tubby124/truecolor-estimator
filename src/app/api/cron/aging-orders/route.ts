/**
 * GET /api/cron/aging-orders
 *
 * TC-22: Daily chase digest emailed to info@true-color.ca.
 *   - pending_payment orders > 24h old (live rows only — archived zombies excluded
 *     since 2026-08-19, which previously inflated counts 4×)
 *   - rendered as a chase table: which touch they're on, pause state, resend link
 *   - separate "ladder exhausted" section: needs a human (call/archive/mark paid)
 *   - in_production orders > 5 days old
 *
 * Run daily via Railway cron:
 *   Schedule: 0 9 * * *
 *   Command:  curl -s -H "Authorization: Bearer ***" https://truecolorprinting.ca/api/cron/aging-orders
 *
 * Auth: Authorization: Bearer ***
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { escHtml } from "@/lib/email/components/escHtml";
import { buildPayLink } from "@/lib/orders/payLink";
import type { OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";

const FROM = "True Color Display Printing <hello@outreach.true-color.ca>";
const DIGEST_TO = "info@true-color.ca";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

const NOT_ARCHIVED = "is_archived.is.null,is_archived.eq.false";

interface AgingOrder {
  id: string;
  order_number: string;
  total: number | string;
  created_at: string;
  is_rush?: boolean | null;
  followup_count?: number | null;
  followup_paused_at?: string | null;
  followup_paused_reason?: string | null;
  customers: { name: string; email: string } | { name: string; email: string }[] | null;
}

async function requiredQueryFailed(query: "stale-pending" | "stale-production") {
  console.error(`[aging-orders] required ${query} query failed`);
  await recordCronRun("aging-orders", false, `required_query_failed=${query}`);
  return NextResponse.json(
    { ok: false, error: "Aging orders query failed" },
    { status: 503 },
  );
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

  // Query 1: pending_payment > 24h old, live rows only (zombie filter 2026-08-19)
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let stalePendingResult;
  try {
    stalePendingResult = await supabase
      .from("orders")
      .select(`id, order_number, total, created_at, is_rush,
        followup_count, followup_paused_at, followup_paused_reason,
        customers ( name, email )`)
      .eq("status", "pending_payment")
      .or(NOT_ARCHIVED)
      .lt("created_at", cutoff24h)
      .order("created_at", { ascending: true });
  } catch {
    return requiredQueryFailed("stale-pending");
  }
  if (stalePendingResult.error) return requiredQueryFailed("stale-pending");

  // Query 2: in_production > 5 days old, live rows only
  const cutoff5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  let staleProductionResult;
  try {
    staleProductionResult = await supabase
      .from("orders")
      .select("id, order_number, total, created_at, customers ( name, email )")
      .eq("status", "in_production")
      .or(NOT_ARCHIVED)
      .lt("created_at", cutoff5d)
      .order("created_at", { ascending: true });
  } catch {
    return requiredQueryFailed("stale-production");
  }
  if (staleProductionResult.error) return requiredQueryFailed("stale-production");

  const pending = (stalePendingResult.data ?? []) as AgingOrder[];
  const production = (staleProductionResult.data ?? []) as AgingOrder[];

  if (pending.length === 0 && production.length === 0) {
    console.log("[aging-orders] no aging orders — digest skipped");
    await recordCronRun("aging-orders", true, "no aging orders");
    return NextResponse.json({ ok: true, stalePending: 0, staleProduction: 0 });
  }

  // Split pending: still on the ladder vs ladder-exhausted (needs a human)
  const stillChasing = pending.filter((o) => (o.followup_count ?? 0) < 3 && !o.followup_paused_at);
  const exhausted = pending.filter((o) => (o.followup_count ?? 0) >= 3 && !o.followup_paused_at);
  const paused = pending.filter((o) => Boolean(o.followup_paused_at));

  const today = new Date().toISOString().split("T")[0];

  function ageInDays(createdAt: string): number {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  function payLinkFor(o: AgingOrder): string | null {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    if (!customer?.email) return null;
    try {
      return buildPayLink({
        orderId: o.id,
        orderNumber: o.order_number,
        total: Number(o.total),
        customerEmail: customer.email,
        siteUrl: SITE_URL,
        ledger: [] as OrderPaymentLedgerEntry[],
      });
    } catch {
      return null;
    }
  }

  function chaseRow(o: AgingOrder): string {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const name = customer?.name ?? "—";
    const age = ageInDays(o.created_at);
    const total = Number(o.total).toFixed(2);
    const touch = o.followup_paused_at
      ? `⏸ paused${o.followup_paused_reason ? ` (${escHtml(o.followup_paused_reason)})` : ""}`
      : `T${Math.min(o.followup_count ?? 0, 3)}/3`;
    const link = payLinkFor(o);
    const rush = o.is_rush ? " ⚡" : "";
    return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${escHtml(o.order_number)}${rush}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escHtml(name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${touch}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${age}d</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${escHtml(total)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${link ? `<a href="${escHtml(link)}" style="color:#16C2F3;">Resend link</a>` : "—"}</td>
        </tr>`;
  }

  function productionRow(o: AgingOrder): string {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const name = customer?.name ?? "—";
    const email = customer?.email ?? "—";
    const age = ageInDays(o.created_at);
    const total = Number(o.total).toFixed(2);
    return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${escHtml(o.order_number)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escHtml(name)}<br/><span style="font-size:11px;color:#6b7280;">${escHtml(email)}</span></td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${age}d</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${escHtml(total)}</td>
        </tr>`;
  }

  function exhaustedText(o: AgingOrder): string {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const name = customer?.name ?? "—";
    const email = customer?.email ?? "—";
    const age = ageInDays(o.created_at);
    const total = Number(o.total).toFixed(2);
    const link = payLinkFor(o);
    return `  ${o.order_number} | ${name} <${email}> | ${age}d | $${total}${link ? ` | pay: ${link}` : ""}`;
  }

  const chaseTextRows = (rows: AgingOrder[]) =>
    rows
      .map((o) => {
        const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        const touch = o.followup_paused_at ? `paused(${o.followup_paused_reason ?? ""})` : `T${Math.min(o.followup_count ?? 0, 3)}/3`;
        return `  ${o.order_number} | ${customer?.name ?? "—"} | ${touch} | ${ageInDays(o.created_at)}d | $${Number(o.total).toFixed(2)}`;
      })
      .join("\n");

  const exhaustedTotal = exhausted.reduce((s, o) => s + Number(o.total), 0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:760px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2dbd4;">
    <div style="background:#1c1712;padding:20px 28px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#fff;">True Color Display Printing — Aging Orders Digest</p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">${today} · live rows only (archived excluded)</p>
    </div>
    <div style="padding:28px;">
      ${exhausted.length > 0 ? `
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#b45309;">⚠ Needs a human — ladder exhausted (3 touches sent, still unpaid)</p>
      <p style="margin:0 0 16px;font-size:12px;color:#6b7280;">Check the bank / e-Transfer inbox first — these may already be paid externally. Then call or email, pause reminders if paid, or archive.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:28px;">
        <tbody>${exhausted.map(chaseRow).join("")}</tbody>
      </table>` : ""}
      ${stillChasing.length > 0 ? `
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1c1712;">Still on the reminder ladder (automated touches continuing)</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:28px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Order #</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Customer</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Touch</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Age</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Total</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Action</th>
          </tr>
        </thead>
        <tbody>${stillChasing.map(chaseRow).join("")}</tbody>
      </table>` : ""}
      ${paused.length > 0 ? `
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#6b7280;">⏸ Reminders paused (expected paid externally)</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:28px;">
        <tbody>${paused.map(chaseRow).join("")}</tbody>
      </table>` : ""}
      ${production.length > 0 ? `
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1c1712;">In production > 5 days</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Order #</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Customer</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Age</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>${production.map(productionRow).join("")}</tbody>
      </table>` : ""}
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
        ${pending.length} live pending_payment (${exhausted.length} exhausted, $${exhaustedTotal.toFixed(2)}) · ${paused.length} paused · ${production.length} stale in_production
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `True Color — Aging Orders Digest (${today}) — live rows only`,
    "",
    ...(exhausted.length > 0
      ? [
          `⚠ NEEDS A HUMAN — ladder exhausted, still unpaid ($${exhaustedTotal.toFixed(2)})`,
          "  Check bank/e-Transfer inbox first (may be paid externally), then call/email, pause if paid, or archive.",
          ...exhausted.map(exhaustedText),
          "",
        ]
      : []),
    ...(stillChasing.length > 0
      ? ["Still on the reminder ladder:", ...(stillChasing.length ? chaseTextRows(stillChasing).split("\n") : []), ""]
      : []),
    ...(paused.length > 0 ? ["Reminders paused:", ...chaseTextRows(paused).split("\n"), ""] : []),
    ...(production.length > 0
      ? [
          "In production > 5 days:",
          ...(production as AgingOrder[])
            .map((o) => {
              const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
              return `  ${o.order_number} | ${customer?.name ?? "—"} | ${ageInDays(o.created_at)}d | $${Number(o.total).toFixed(2)}`;
            }),
          "",
        ]
      : []),
    `${pending.length} live pending_payment · ${production.length} stale in_production`,
  ].join("\n");

  await sendEmail({
    from: FROM,
    to: DIGEST_TO,
    subject: `True Color — Aging Orders Digest (${today})`,
    html,
    text,
  });

  console.log(
    `[aging-orders] digest sent → ${DIGEST_TO} | livePending=${pending.length} (exhausted=${exhausted.length} paused=${paused.length}) | staleProduction=${production.length}`
  );

  await recordCronRun(
    "aging-orders",
    true,
    `pending=${pending.length} exhausted=${exhausted.length} paused=${paused.length} prod=${production.length}`,
  );

  return NextResponse.json({
    ok: true,
    stalePending: pending.length,
    exhausted: exhausted.length,
    paused: paused.length,
    staleProduction: production.length,
  });
}
