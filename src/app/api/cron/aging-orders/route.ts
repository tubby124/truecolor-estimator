/**
 * GET /api/cron/aging-orders
 *
 * TC-22: Daily digest of aging orders emailed to info@true-color.ca.
 *   - pending_payment orders > 24h old that already received a follow-up nudge (still unpaid)
 *   - in_production orders > 5 days old
 *
 * Run daily via Railway cron:
 *   Schedule: 0 9 * * *
 *   Command:  curl -s -H "Authorization: Bearer $CRON_SECRET" https://truecolorprinting.ca/api/cron/aging-orders
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { recordCronRun } from "@/lib/cron/heartbeat";

const FROM = "True Color Display Printing <hello@outreach.true-color.ca>";
const DIGEST_TO = "info@true-color.ca";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Query 1: pending_payment > 24h old, follow-up already sent (still unpaid)
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stalePending, error: err1 } = await supabase
    .from("orders")
    .select("id, order_number, total, created_at, customers ( name, email )")
    .eq("status", "pending_payment")
    .lt("created_at", cutoff24h)
    .not("followup_sent_at", "is", null)
    .order("created_at", { ascending: true });

  if (err1) {
    console.error("[aging-orders] stalePending query failed:", err1.message);
  }

  // Query 2: in_production > 5 days old
  const cutoff5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const { data: staleProduction, error: err2 } = await supabase
    .from("orders")
    .select("id, order_number, total, created_at, customers ( name, email )")
    .eq("status", "in_production")
    .lt("created_at", cutoff5d)
    .order("created_at", { ascending: true });

  if (err2) {
    console.error("[aging-orders] staleProduction query failed:", err2.message);
  }

  const pending = stalePending ?? [];
  const production = staleProduction ?? [];

  if (pending.length === 0 && production.length === 0) {
    console.log("[aging-orders] no aging orders — digest skipped");
    await recordCronRun("aging-orders", true, "no aging orders");
    return NextResponse.json({ ok: true, stalePending: 0, staleProduction: 0 });
  }

  const today = new Date().toISOString().split("T")[0];

  function ageInDays(createdAt: string): number {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  function buildRows(
    orders: Array<{ order_number: string; total: number | string; created_at: string; customers: { name: string; email: string } | { name: string; email: string }[] | null }>,
    status: string
  ): string {
    return orders
      .map((o) => {
        const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        const name = customer?.name ?? "—";
        const email = customer?.email ?? "—";
        const age = ageInDays(o.created_at);
        const total = Number(o.total).toFixed(2);
        return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${o.order_number}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${name}<br/><span style="font-size:11px;color:#6b7280;">${email}</span></td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${status}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${age}d</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${total}</td>
        </tr>`;
      })
      .join("");
  }

  function buildTextRows(
    orders: Array<{ order_number: string; total: number | string; created_at: string; customers: { name: string; email: string } | { name: string; email: string }[] | null }>,
    status: string
  ): string {
    return orders
      .map((o) => {
        const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        const name = customer?.name ?? "—";
        const age = ageInDays(o.created_at);
        const total = Number(o.total).toFixed(2);
        return `  ${o.order_number} | ${name} | ${status} | ${age}d | $${total}`;
      })
      .join("\n");
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2dbd4;">
    <div style="background:#1c1712;padding:20px 28px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#fff;">True Color Display Printing — Aging Orders Digest</p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">${today}</p>
    </div>
    <div style="padding:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Order #</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Customer</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Status</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Age</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${buildRows(pending, "pending_payment")}
          ${buildRows(production, "in_production")}
        </tbody>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
        ${pending.length} stale pending_payment · ${production.length} stale in_production
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `True Color — Aging Orders Digest (${today})`,
    "",
    "Order # | Customer | Status | Age | Total",
    "---",
    buildTextRows(pending, "pending_payment"),
    buildTextRows(production, "in_production"),
    "",
    `${pending.length} stale pending_payment · ${production.length} stale in_production`,
  ].join("\n");

  await sendEmail({
    from: FROM,
    to: DIGEST_TO,
    subject: `True Color — Aging Orders Digest (${today})`,
    html,
    text,
  });

  console.log(
    `[aging-orders] digest sent → ${DIGEST_TO} | stalePending=${pending.length} | staleProduction=${production.length}`
  );

  await recordCronRun("aging-orders", true, `pending=${pending.length} prod=${production.length}`);

  return NextResponse.json({
    ok: true,
    stalePending: pending.length,
    staleProduction: production.length,
  });
}
