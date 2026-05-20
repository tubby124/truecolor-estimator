/**
 * GET /api/cron/daily-payment-digest
 *
 * Daily Telegram digest. Always fires — even on quiet days — so Hasan
 * sees the state of the books each morning instead of having to ask.
 *
 * Differs from /api/cron/reconcile-payments (silent unless broken).
 *
 * Reports:
 *   • Collected yesterday — total + breakdown by payment_method
 *   • Pending payment > 7 days — chase list
 *   • Health flags — status=complete without paid_at (Gil-shape bug)
 *                  — Wave-method orders > 24h pending (possible silent Wave Payment)
 *
 * Schedule: 13:00 UTC daily (= 7 AM MDT / 6 AM MST) — first thing in the morning.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";

const MT_OFFSET_HOURS = 6; // MDT = UTC-6 (May-Nov). MST = UTC-7. Off by 1h Nov-Mar.

interface OrderRow {
  order_number: string;
  total: number | string;
  paid_at: string | null;
  created_at: string;
  status: string;
  payment_method: string | null;
  wave_invoice_id: string | null;
  customer_id: string | null;
  customers?: { name: string | null } | { name: string | null }[] | null;
}

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

function customerName(o: OrderRow): string {
  const raw = Array.isArray(o.customers) ? o.customers[0] : o.customers;
  return raw?.name ?? "—";
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

  // "Yesterday in MT" = window ending at today MT 00:00 = UTC NOW shifted -MT_OFFSET hours, then floor to date.
  const nowUtc = new Date();
  const nowMt = new Date(nowUtc.getTime() - MT_OFFSET_HOURS * 3600_000);
  const todayMtDateStr = nowMt.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const yesterdayMt = new Date(nowMt.getTime() - 86_400_000);
  const yesterdayMtDateStr = yesterdayMt.toISOString().slice(0, 10);

  // Window in UTC: [yesterdayMt 00:00 → todayMt 00:00] = [UTC midnight + offset hours backwards]
  const windowStartUtc = new Date(`${yesterdayMtDateStr}T00:00:00.000Z`).getTime() + MT_OFFSET_HOURS * 3600_000;
  const windowEndUtc = new Date(`${todayMtDateStr}T00:00:00.000Z`).getTime() + MT_OFFSET_HOURS * 3600_000;
  const windowStartIso = new Date(windowStartUtc).toISOString();
  const windowEndIso = new Date(windowEndUtc).toISOString();

  // ── Section 1: collected yesterday (paid_at in window) ────────────────────
  const { data: paidYesterday, error: paidErr } = await supabase
    .from("orders")
    .select("order_number, total, paid_at, payment_method, status, customer_id, customers(name)")
    .gte("paid_at", windowStartIso)
    .lt("paid_at", windowEndIso)
    .order("paid_at", { ascending: true });

  if (paidErr) {
    console.error("[daily-digest] paid-yesterday query failed:", paidErr.message);
  }

  const paidRows: OrderRow[] = (paidYesterday as OrderRow[] | null) ?? [];
  const collectedTotal = paidRows.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const byMethod: Record<string, { count: number; total: number }> = {};
  for (const o of paidRows) {
    const key = (o.payment_method as string | null) ?? "unknown";
    if (!byMethod[key]) byMethod[key] = { count: 0, total: 0 };
    byMethod[key].count++;
    byMethod[key].total += Number(o.total ?? 0);
  }

  // ── Section 2: pending payment > 7 days ───────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: stalePending } = await supabase
    .from("orders")
    .select("order_number, total, created_at, payment_method, status, wave_invoice_id, customer_id, customers(name)")
    .eq("status", "pending_payment")
    .lt("created_at", sevenDaysAgo)
    .eq("is_archived", false)
    .order("created_at", { ascending: true })
    .limit(20);

  const pendingRows: OrderRow[] = (stalePending as OrderRow[] | null) ?? [];

  // ── Section 3: health flags ───────────────────────────────────────────────
  // 3a. status IN (complete, ready_for_pickup, in_production) with NULL paid_at
  //     This should be 0 with the status-route guard shipped 7f73108.
  const { data: ghostComplete } = await supabase
    .from("orders")
    .select("order_number, total, status, customers(name)")
    .in("status", ["complete", "ready_for_pickup", "in_production"])
    .is("paid_at", null)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const ghostRows: OrderRow[] = (ghostComplete as OrderRow[] | null) ?? [];

  // 3b. Wave-method orders > 24h pending with wave_invoice_id set
  //     Could be a customer who paid via Wave Payments (legacy path before fix).
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { data: waveStuck } = await supabase
    .from("orders")
    .select("order_number, total, created_at, wave_invoice_id, customers(name)")
    .eq("payment_method", "wave")
    .eq("status", "pending_payment")
    .not("wave_invoice_id", "is", null)
    .lt("created_at", oneDayAgo)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const waveStuckRows: OrderRow[] = (waveStuck as OrderRow[] | null) ?? [];

  // ── Build Telegram message ────────────────────────────────────────────────
  const lines: string[] = [];
  const dateLabel = yesterdayMt.toLocaleDateString("en-CA", { month: "long", day: "numeric" });

  const hasAnyActivity = paidRows.length > 0 || pendingRows.length > 0 || ghostRows.length > 0 || waveStuckRows.length > 0;

  if (!hasAnyActivity) {
    lines.push(`<b>✅ True Color · ${escapeTelegramHtml(dateLabel)}</b>`);
    lines.push(`Quiet day. $0 collected. No outstanding flags.`);
  } else {
    lines.push(`<b>📊 True Color · Daily Digest · ${escapeTelegramHtml(dateLabel)}</b>`);
    lines.push("");

    // Section 1: collected
    if (paidRows.length > 0) {
      const avg = collectedTotal / paidRows.length;
      lines.push(`💰 <b>Collected:</b> ${escapeTelegramHtml(fmtMoney(collectedTotal))} · ${paidRows.length} order${paidRows.length === 1 ? "" : "s"} · avg ${escapeTelegramHtml(fmtMoney(avg))}`);
      const methodLabels: Record<string, string> = {
        clover_card: "Clover card",
        etransfer: "e-Transfer",
        wave: "Wave invoice",
        unknown: "Unknown",
      };
      const keys = Object.keys(byMethod).sort((a, b) => byMethod[b].total - byMethod[a].total);
      for (const k of keys) {
        const label = methodLabels[k] ?? k;
        const m = byMethod[k];
        lines.push(`   • ${escapeTelegramHtml(label)}: ${escapeTelegramHtml(fmtMoney(m.total))} (${m.count})`);
      }
    } else {
      lines.push(`💰 <b>Collected:</b> $0.00 yesterday`);
    }

    // Section 2: pending > 7 days
    if (pendingRows.length > 0) {
      const pendingTotal = pendingRows.reduce((s, o) => s + Number(o.total ?? 0), 0);
      lines.push("");
      lines.push(`⏳ <b>Pending payment ≥ 7 days:</b> ${pendingRows.length} · ${escapeTelegramHtml(fmtMoney(pendingTotal))} total`);
      for (const o of pendingRows.slice(0, 8)) {
        const ageDays = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86_400_000);
        const method = (o.payment_method as string | null) ?? "unknown";
        const name = customerName(o);
        lines.push(`   • ${escapeTelegramHtml(o.order_number)} ${escapeTelegramHtml(name)} ${escapeTelegramHtml(fmtMoney(Number(o.total)))} (${ageDays}d, ${escapeTelegramHtml(method)})`);
      }
      if (pendingRows.length > 8) {
        lines.push(`   <i>… ${pendingRows.length - 8} more (truncated)</i>`);
      }
    }

    // Section 3: health flags
    const flagLines: string[] = [];
    if (ghostRows.length > 0) {
      flagLines.push(`   • status=${ghostRows[0].status} without paid_at: ${ghostRows.length} order${ghostRows.length === 1 ? "" : "s"}`);
      for (const o of ghostRows.slice(0, 5)) {
        const name = customerName(o);
        flagLines.push(`     — ${escapeTelegramHtml(o.order_number)} ${escapeTelegramHtml(name)} ${escapeTelegramHtml(fmtMoney(Number(o.total)))}`);
      }
    }
    if (waveStuckRows.length > 0) {
      flagLines.push(`   • Wave-method pending ≥ 24h with invoice attached: ${waveStuckRows.length} (possible Wave Payments path)`);
      for (const o of waveStuckRows.slice(0, 3)) {
        const ageHours = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600_000);
        const name = customerName(o);
        flagLines.push(`     — ${escapeTelegramHtml(o.order_number)} ${escapeTelegramHtml(name)} ${escapeTelegramHtml(fmtMoney(Number(o.total)))} (${ageHours}h)`);
      }
    }
    if (flagLines.length > 0) {
      lines.push("");
      lines.push(`⚠ <b>Health flags:</b>`);
      lines.push(...flagLines);
    }
  }

  const message = lines.join("\n");
  await sendTelegramNotification(message).catch((err) => {
    console.error("[daily-digest] telegram send failed:", err);
  });

  console.log(`[daily-digest] ${dateLabel} · collected=${fmtMoney(collectedTotal)} pending7d=${pendingRows.length} ghost=${ghostRows.length} waveStuck=${waveStuckRows.length}`);

  return NextResponse.json({
    ok: true,
    date_mt: yesterdayMtDateStr,
    collected_total: collectedTotal,
    collected_count: paidRows.length,
    by_method: byMethod,
    pending_over_7d: pendingRows.length,
    health_flags: {
      ghost_complete: ghostRows.length,
      wave_stuck_24h: waveStuckRows.length,
    },
  });
}
