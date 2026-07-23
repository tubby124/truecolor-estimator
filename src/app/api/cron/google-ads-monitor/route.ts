import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit/record";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { authorizeGoogleAdsMonitorCaller } from "@/lib/google-ads/monitor-auth";
import { persistGoogleAdsMonitorEvidence } from "@/lib/google-ads/monitor-evidence";
import {
  createGoogleAdsApi,
  runHardStopMonitor,
} from "../../../../../scripts/google-ads/hard-stop-monitor.mjs";
import { parseHardStopOptions } from "../../../../../scripts/google-ads/hard-stop-contract.mjs";

export const dynamic = "force-dynamic";

function monitorOptions() {
  const profile = process.env.GOOGLE_ADS_MONITOR_PROFILE ?? "public-pilot";
  const args = [`--profile=${profile}`, "--execute"];
  if (profile === "controlled-test") {
    const start = process.env.GOOGLE_ADS_CONTROLLED_TEST_WINDOW_START;
    const end = process.env.GOOGLE_ADS_CONTROLLED_TEST_WINDOW_END;
    if (!start || !end) {
      throw new Error("Controlled-test monitor window is not configured");
    }
    args.push(`--window-start=${start}`, `--window-end=${end}`);
  }
  return parseHardStopOptions(args);
}

export async function POST(req: NextRequest) {
  let schedulerSource;
  try {
    schedulerSource = authorizeGoogleAdsMonitorCaller(
      req.headers.get("authorization"),
    );
  } catch {
    return NextResponse.json(
      { error: "Google Ads monitor authentication is misconfigured" },
      { status: 503 },
    );
  }
  if (!schedulerSource) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const monitorResult = await runHardStopMonitor({
      api: createGoogleAdsApi(),
      options: monitorOptions(),
    });
    const result = await persistGoogleAdsMonitorEvidence(monitorResult, {
      schedulerSource,
    });
    const spend = typeof result.spendCad === "number" ? result.spendCad.toFixed(2) : "unknown";
    const errors = result.ok ? 0 : 1;
    const detail = [
      `profile=${result.profile ?? "unknown"}`,
      `source=${result.schedulerSource}`,
      `outcome=${result.outcome}`,
      `action=${result.action}`,
      `spend=${spend}`,
      `pause_verified=${result.pauseVerified === true ? 1 : 0}`,
      `errors=${errors}`,
    ].join(" ");
    await recordCronRun("google-ads-monitor", result.ok, detail);

    if (result.outcome !== "BELOW_STOP") {
      await recordAuditEvent({
        actor_type: "cron",
        actor_id: "google-ads-monitor",
        event_type: `google_ads.monitor.${String(result.outcome).toLowerCase()}`,
        entity_type: "google_ads_account",
        entity_id: String(result.customerId ?? "1072816342"),
        detail: {
          profile: result.profile,
          outcome: result.outcome,
          action: result.action,
          spend_cad: result.spendCad,
          warning_cad: result.warningCad,
          protective_pause_cad: result.thresholdCad,
          absolute_cap_cad: result.approvedCapCad,
          pause_verified: result.pauseVerified ?? false,
        },
      });
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown monitor error";
    await recordCronRun("google-ads-monitor", false, `outcome=ERROR action=NONE spend=unknown pause_verified=0 errors=1 detail=${message.slice(0, 100)}`);
    await recordAuditEvent({
      actor_type: "cron",
      actor_id: "google-ads-monitor",
      event_type: "google_ads.monitor.error",
      entity_type: "google_ads_account",
      entity_id: "1072816342",
      detail: { outcome: "ERROR", action: "NONE" },
    });
    return NextResponse.json({ error: "Google Ads monitor failed closed" }, { status: 503 });
  }
}
