/**
 * GET /api/cron/dashboard-alerts
 *
 * Push layer for /staff/lifecycle. Runs hourly. Scans for red conditions
 * (orphans, Wave half-recorded, stale crons, no_wave_invoice on paid) and
 * fires ONE Telegram message per category if any rows match.
 *
 * Idempotency: dashboard_alert_state tracks last-fired per category, plus
 * the last count. Only re-fires when the count changes OR after a 6h cooldown.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { recordCronRun } from "@/lib/cron/heartbeat";

const COOLDOWN_HOURS = 6;
const STUCK_PENDING_HOURS = 24;

interface AlertCategory {
  category: string;
  count: number;
  message: string;
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
  const alerts: AlertCategory[] = [];
  const now = Date.now();

  try {
    // ── Orphans: pending_payment > 24h, no pay-link email logged ─────────
    const cutoff24h = new Date(now - STUCK_PENDING_HOURS * 60 * 60 * 1000).toISOString();
    const { data: stuck } = await supabase
      .from("orders")
      .select("id, order_number, total, created_at, customers(email)")
      .eq("status", "pending_payment")
      .lt("created_at", cutoff24h)
      .order("created_at", { ascending: true })
      .limit(50);
    const stuckArr = stuck ?? [];
    if (stuckArr.length > 0) {
      const lines = stuckArr.slice(0, 5).map((o) => {
        const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
        return `• <b>${escapeTelegramHtml(o.order_number ?? "?")}</b> · ${escapeTelegramHtml(c?.email ?? "")} · $${Number(o.total ?? 0).toFixed(2)}`;
      });
      const more = stuckArr.length > 5 ? `\n…and ${stuckArr.length - 5} more` : "";
      alerts.push({
        category: "orphans_stuck_pending",
        count: stuckArr.length,
        message:
          `🚨 <b>${stuckArr.length} orphan order(s) — pending_payment > 24h</b>\n\n` +
          lines.join("\n") + more +
          `\n\nOpen <a href="https://truecolorprinting.ca/staff/lifecycle">/staff/lifecycle</a> Orphans panel for one-click recovery URLs.`,
      });
    }

    // ── Wave half-recorded: paid order, Wave approved, payment not recorded ──
    const { data: halfRecorded } = await supabase
      .from("orders")
      .select("id, order_number, total, wave_invoice_number")
      .in("status", ["paid", "in_production", "ready_for_pickup", "completed"])
      .not("wave_invoice_approved_at", "is", null)
      .is("wave_payment_recorded_at", null)
      .limit(50);
    const halfArr = halfRecorded ?? [];
    if (halfArr.length > 0) {
      alerts.push({
        category: "wave_half_recorded",
        count: halfArr.length,
        message:
          `⚠️ <b>${halfArr.length} paid order(s) with Wave invoice APPROVED but payment NOT recorded</b>\n\n` +
          halfArr.slice(0, 5).map((o) => `• <b>${escapeTelegramHtml(o.order_number ?? "?")}</b> · Wave #${o.wave_invoice_number ?? "?"} · $${Number(o.total ?? 0).toFixed(2)}`).join("\n") +
          (halfArr.length > 5 ? `\n…and ${halfArr.length - 5} more` : "") +
          `\n\nCustomer's tax invoice shows UNPAID — open Wave invoice → record payment manually.`,
      });
    }

    // ── No Wave invoice on paid order ────────────────────────────────────
    const { data: noWave } = await supabase
      .from("orders")
      .select("id, order_number, total")
      .in("status", ["paid", "in_production", "ready_for_pickup", "completed"])
      .is("wave_invoice_id", null)
      .limit(50);
    const noWaveArr = noWave ?? [];
    if (noWaveArr.length > 0) {
      alerts.push({
        category: "no_wave_invoice",
        count: noWaveArr.length,
        message:
          `⚠️ <b>${noWaveArr.length} paid order(s) with NO Wave invoice</b>\n\n` +
          noWaveArr.slice(0, 5).map((o) => `• <b>${escapeTelegramHtml(o.order_number ?? "?")}</b> · $${Number(o.total ?? 0).toFixed(2)}`).join("\n") +
          (noWaveArr.length > 5 ? `\n…and ${noWaveArr.length - 5} more` : "") +
          `\n\nMoney captured in Clover, nothing in Wave books. Create Wave invoice manually.`,
      });
    }

    // ── Stale crons ──────────────────────────────────────────────────────
    const EXPECTED = [
      { name: "payment-followup",       maxAgeHours: 2  },
      { name: "stale-quotes",           maxAgeHours: 2  },
      { name: "daily-payment-digest",   maxAgeHours: 26 },
      { name: "reconcile-payments",     maxAgeHours: 26 },
      { name: "aging-orders",           maxAgeHours: 26 },
      { name: "keepalive",              maxAgeHours: 26 },
      { name: "gsc-sync",               maxAgeHours: 26 },
    ];
    const { data: heartbeats } = await supabase
      .from("cron_runs")
      .select("cron_name, ran_at")
      .order("ran_at", { ascending: false })
      .limit(200);
    const latestByName = new Map<string, string>();
    for (const h of heartbeats ?? []) {
      if (!h.cron_name || !h.ran_at) continue;
      if (!latestByName.has(h.cron_name)) latestByName.set(h.cron_name, h.ran_at);
    }
    const stale: Array<{ name: string; hoursAgo: number | null }> = [];
    for (const exp of EXPECTED) {
      const ran = latestByName.get(exp.name);
      if (!ran) {
        stale.push({ name: exp.name, hoursAgo: null });
        continue;
      }
      const hoursAgo = (now - new Date(ran).getTime()) / (1000 * 60 * 60);
      if (hoursAgo > exp.maxAgeHours) {
        stale.push({ name: exp.name, hoursAgo });
      }
    }
    if (stale.length > 0) {
      alerts.push({
        category: "stale_crons",
        count: stale.length,
        message:
          `⚠️ <b>${stale.length} cron(s) silently stopped</b>\n\n` +
          stale.map((s) => `• ${escapeTelegramHtml(s.name)} — ${s.hoursAgo === null ? "never ran" : `${Math.round(s.hoursAgo)}h ago`}`).join("\n") +
          `\n\nLikely CRON_SECRET drift or Railway/pg_cron issue. Investigate <a href="https://truecolorprinting.ca/staff/lifecycle">/staff/lifecycle</a> heartbeats panel.`,
      });
    }

    // ── Idempotency check + fire ─────────────────────────────────────────
    const { data: priorStates } = await supabase
      .from("dashboard_alert_state")
      .select("category, last_fired_at, last_count");
    const stateByCategory = new Map((priorStates ?? []).map((s) => [s.category, s]));

    const fired: string[] = [];
    const skipped: string[] = [];
    for (const a of alerts) {
      const prior = stateByCategory.get(a.category);
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const recentlyFired = prior?.last_fired_at && (now - new Date(prior.last_fired_at).getTime()) < cooldownMs;
      const countUnchanged = prior?.last_count === a.count;
      if (recentlyFired && countUnchanged) {
        skipped.push(a.category);
        continue;
      }
      await sendTelegramNotification(a.message, `dashboard:${a.category}`);
      await supabase.from("dashboard_alert_state").upsert({
        category: a.category,
        last_fired_at: new Date().toISOString(),
        last_count: a.count,
        last_detail: `${a.count} rows`,
      });
      fired.push(a.category);
    }

    await recordCronRun("dashboard-alerts", true, `fired=${fired.length} skipped=${skipped.length} alerts=${alerts.length}`);
    return NextResponse.json({
      ok: true,
      categories_evaluated: alerts.length,
      fired,
      skipped,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Dashboard alerts failed";
    console.error("[dashboard-alerts]", msg);
    await recordCronRun("dashboard-alerts", false, msg.slice(0, 200));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
