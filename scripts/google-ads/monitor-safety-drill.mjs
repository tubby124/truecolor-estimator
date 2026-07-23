import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  HARD_STOP_CAMPAIGNS,
  parseHardStopOptions,
} from "./hard-stop-contract.mjs";
import { runHardStopMonitor } from "./hard-stop-monitor.mjs";

const ACCOUNT = {
  id: "1072816342",
  currencyCode: "CAD",
  timeZone: "America/Regina",
};

function createDrillApi({ spendMicros = "0", spendFailure = false } = {}) {
  let campaigns = HARD_STOP_CAMPAIGNS.map((campaign) => ({
    ...campaign,
    status: "ENABLED",
  }));
  return {
    async readAccount() {
      return ACCOUNT;
    },
    async readCampaigns() {
      return structuredClone(campaigns);
    },
    async readSpend() {
      if (spendFailure) throw new Error("intentional safety drill spend failure");
      return [{
        customerId: ACCOUNT.id,
        date: "2026-07-23",
        hour: 12,
        costMicros: spendMicros,
      }];
    },
    async pauseEnabledCampaigns() {
      const enabled = campaigns.filter((campaign) => campaign.status === "ENABLED");
      campaigns = campaigns.map((campaign) => ({
        ...campaign,
        status: "PAUSED",
      }));
      return enabled;
    },
  };
}

function digest(value) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function proofEvent({ kind, eventType, result, checkedAtUtc, extra = {} }) {
  const evidenceId = `drill_${kind}_${randomUUID().replaceAll("-", "")}`;
  const summary = {
    kind,
    ok: result.ok,
    outcome: result.outcome,
    action: result.action,
    pauseVerified: result.pauseVerified ?? false,
    campaignIds: (result.campaignsAfter ?? result.campaignsBefore ?? [])
      .map((campaign) => String(campaign.id))
      .sort(),
    ...extra,
  };
  return {
    actor_type: "system",
    actor_id: "google-ads-monitor-safety-drill",
    event_type: eventType,
    entity_type: "google_ads_monitor_drill",
    entity_id: evidenceId,
    detail: {
      evidenceId,
      verified: true,
      source: "MONITOR_SAFETY_DRILL",
      drillVersion: 1,
      checkedAtUtc,
      artifactDigest: digest(summary),
      summary,
    },
  };
}

export async function runMonitorSafetyDrill({
  now = new Date(),
  notify,
  record,
}) {
  const options = {
    ...parseHardStopOptions(["--profile=public-pilot"]),
    execute: true,
  };
  const warningResult = await runHardStopMonitor({
    api: createDrillApi({ spendMicros: "500000000" }),
    options,
    now,
  });
  if (
    warningResult.ok !== true
    || warningResult.outcome !== "WARNING"
    || warningResult.action !== "NONE"
  ) {
    throw new Error("Warning-path safety drill failed");
  }
  const telegramMessageId = await notify(
    "DRILL — True Color Google Ads spend warning path verified. No live campaign or spend was changed.",
  );
  if (!telegramMessageId) throw new Error("Telegram warning drill returned no message ID");

  const pauseResult = await runHardStopMonitor({
    api: createDrillApi({ spendMicros: "625000000" }),
    options,
    now,
  });
  if (
    pauseResult.ok !== true
    || pauseResult.outcome !== "STOPPED"
    || pauseResult.pauseVerified !== true
    || pauseResult.action !== "PAUSED"
    || pauseResult.campaignsAfter?.some((campaign) => campaign.status !== "PAUSED")
  ) {
    throw new Error("Protective-pause safety drill failed");
  }

  const failClosedResult = await runHardStopMonitor({
    api: createDrillApi({ spendFailure: true }),
    options,
    now,
  });
  if (
    failClosedResult.ok !== false
    || failClosedResult.outcome !== "ERROR_FAIL_CLOSED_PAUSED"
    || failClosedResult.pauseVerified !== true
    || failClosedResult.action !== "PAUSED"
    || failClosedResult.campaignsAfter?.some((campaign) => campaign.status !== "PAUSED")
  ) {
    throw new Error("Fail-closed safety drill failed");
  }

  const checkedAtUtc = now.toISOString();
  const events = [
    proofEvent({
      kind: "warning",
      eventType: "google_ads.monitor.drill.warning_alert_verified",
      result: warningResult,
      checkedAtUtc,
      extra: { telegramMessageId: String(telegramMessageId) },
    }),
    proofEvent({
      kind: "pause",
      eventType: "google_ads.monitor.drill.protective_pause_verified",
      result: pauseResult,
      checkedAtUtc,
    }),
    proofEvent({
      kind: "failclosed",
      eventType: "google_ads.monitor.drill.fail_closed_verified",
      result: failClosedResult,
      checkedAtUtc,
    }),
  ];
  const receipts = await record(events);
  if (!Array.isArray(receipts) || receipts.length !== events.length) {
    throw new Error("Safety drill evidence was not durably persisted");
  }
  return {
    ok: true,
    telegramMessageId: String(telegramMessageId),
    evidence: events.map((event, index) => ({
      eventType: event.event_type,
      evidenceId: event.entity_id,
      databaseEventId: receipts[index]?.id,
      checkedAtUtc,
    })),
  };
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram drill credentials are required");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  const body = await response.json();
  if (!response.ok || body.ok !== true || !body.result?.message_id) {
    throw new Error(`Telegram safety drill failed with HTTP ${response.status}`);
  }
  return body.result.message_id;
}

async function recordAuditEvents(events) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service credentials are required");
  }
  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/audit_events?select=id,at,entity_id`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(events),
    },
  );
  if (!response.ok) {
    throw new Error(`Safety drill audit write failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function main() {
  if (!process.argv.slice(2).includes("--execute")) {
    throw new Error("Safety drill requires explicit --execute");
  }
  const result = await runMonitorSafetyDrill({
    notify: sendTelegram,
    record: recordAuditEvents,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
