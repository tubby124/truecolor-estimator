/**
 * GET /api/cron/dashboard-alerts — hourly push layer for /staff/lifecycle.
 *
 * Reads the SAME rollup the dashboard renders (src/lib/lifecycle/rollup.ts),
 * diffs against last tick's red set (stored in dashboard_alert_state), and
 * Telegrams the delta:
 *
 *   NEW red       → 🚨 "X just broke" (with link to the panel anchor)
 *   STILL red     → suppress for COOLDOWN_HOURS, then send a reminder
 *   CLEARED red   → ✅ "X resolved"
 *
 * Why this shape: there's one source of truth for what counts as a "red
 * condition" — buildRollup. Add a new silent-fail check there and BOTH the
 * dashboard tile AND this cron pick it up automatically. No more inline
 * Telegram at the failure site, no more drift between screen and alerts.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/notifications/telegram";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { fetchLifecycleData } from "@/app/staff/lifecycle/data";

const COOLDOWN_HOURS = 6;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

// Key prefix for state rows owned by this cron. Lets us identify (and clean
// up) only OUR state rows without touching anything else.
const STATE_PREFIX = "rollup:";

function dashboardLink(panel: string): string {
  return `${SITE_URL}/staff/lifecycle#${encodeURIComponent(panel)}`;
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

  try {
    const lifecycle = await fetchLifecycleData();
    const currentReds = lifecycle.rollup.reds;
    const currentKeys = new Set(currentReds.map((r) => `${STATE_PREFIX}${r.key}`));

    // Load every state row we own.
    const { data: priorStates } = await supabase
      .from("dashboard_alert_state")
      .select("category, last_fired_at, last_detail")
      .like("category", `${STATE_PREFIX}%`);
    const stateByCategory = new Map((priorStates ?? []).map((s) => [s.category, s]));

    const now = Date.now();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    const newAlerts: string[] = [];
    const repeatAlerts: string[] = [];
    const clearedAlerts: string[] = [];
    const suppressed: string[] = [];

    // 1. Fire / suppress for current reds
    for (const red of currentReds) {
      const stateKey = `${STATE_PREFIX}${red.key}`;
      const prior = stateByCategory.get(stateKey);
      const isNew = !prior;
      const cooldownExpired = prior?.last_fired_at
        ? now - new Date(prior.last_fired_at).getTime() >= cooldownMs
        : true;

      if (!isNew && !cooldownExpired) {
        suppressed.push(red.key);
        continue;
      }

      const emoji = isNew ? "🚨" : "🔁";
      const header = isNew ? "JUST BROKE" : `still red (${COOLDOWN_HOURS}h+ reminder)`;
      const msg =
        `${emoji} <b>${escapeTelegramHtml(header)}</b>\n` +
        `${escapeTelegramHtml(red.label)}\n\n` +
        `→ <a href="${dashboardLink(red.panel)}">open ${escapeTelegramHtml(red.panel)}</a>`;
      await sendTelegramNotification(msg, `rollup:${red.key}`);

      await supabase.from("dashboard_alert_state").upsert({
        category: stateKey,
        last_fired_at: new Date().toISOString(),
        last_count: null,
        last_detail: red.label.slice(0, 200),
      });

      if (isNew) newAlerts.push(red.key);
      else repeatAlerts.push(red.key);
    }

    // 2. Cleared reds: state exists but the rollup no longer flags it
    for (const [stateKey, state] of stateByCategory) {
      if (currentKeys.has(stateKey)) continue;
      const key = stateKey.slice(STATE_PREFIX.length);
      const msg =
        `✅ <b>RESOLVED</b>\n` +
        `${escapeTelegramHtml(state.last_detail ?? key)}\n\n` +
        `Dashboard is back to GREEN on this signal.`;
      await sendTelegramNotification(msg, `rollup:${key}:cleared`);
      await supabase.from("dashboard_alert_state").delete().eq("category", stateKey);
      clearedAlerts.push(key);
    }

    const detail =
      `reds=${currentReds.length} ` +
      `new=${newAlerts.length} ` +
      `repeat=${repeatAlerts.length} ` +
      `cleared=${clearedAlerts.length} ` +
      `suppressed=${suppressed.length}`;
    await recordCronRun("dashboard-alerts", true, detail);

    return NextResponse.json({
      ok: true,
      current_reds: currentReds.length,
      new_alerts: newAlerts,
      repeat_alerts: repeatAlerts,
      cleared_alerts: clearedAlerts,
      suppressed,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Dashboard alerts failed";
    console.error("[dashboard-alerts]", msg);
    await recordCronRun("dashboard-alerts", false, msg.slice(0, 200));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
