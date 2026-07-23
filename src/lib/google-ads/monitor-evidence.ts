import { randomUUID } from "node:crypto";
import {
  recordAuditEventWithReceipt,
  type AuditEventReceipt,
} from "@/lib/audit/record";
import type { GoogleAdsMonitorSchedulerSource } from "./monitor-auth";

const EXPECTED_CUSTOMER_ID = "1072816342";
const EXPECTED_TIME_ZONE = "America/Regina";
const EXPECTED_CONTROLLED_CAMPAIGNS = [
  { id: "24048123058", name: "GOOG_Search_TC_CoreProducts_2026" },
  { id: "24048123061", name: "GOOG_Search_TC_CompetitorConquest_2026" },
  { id: "24048123064", name: "GOOG_Search_TC_BrandDefense_2026" },
] as const;

type CampaignState = {
  id?: string | number;
  name?: string;
  status?: string;
};

export type GoogleAdsMonitorResult = {
  ok?: boolean;
  customerId?: string;
  profile?: string;
  executionMode?: string;
  timeZone?: string;
  timestampUtc?: string;
  timestampLocal?: string;
  windowStartLocal?: string;
  windowEndLocal?: string;
  warningCad?: number;
  thresholdCad?: number;
  approvedCapCad?: number;
  spendScope?: string;
  accountVerified?: boolean;
  spendCad?: number;
  spendMicros?: string;
  outcome?: string;
  action?: string;
  pauseVerified?: boolean;
  campaignsBefore?: CampaignState[];
  campaignsAfter?: CampaignState[];
};

type EvidenceRecorder = typeof recordAuditEventWithReceipt;

function normalizedCampaigns(campaigns: CampaignState[] | undefined) {
  return (campaigns ?? []).map((campaign) => ({
    id: String(campaign.id ?? ""),
    name: campaign.name ?? "",
    status: campaign.status ?? "UNKNOWN",
  }));
}

function validateControlledResult(result: GoogleAdsMonitorResult): void {
  const exactFields: Array<[string, unknown, unknown]> = [
    ["customerId", result.customerId, EXPECTED_CUSTOMER_ID],
    ["executionMode", result.executionMode, "EXECUTE"],
    ["timeZone", result.timeZone, EXPECTED_TIME_ZONE],
    ["accountVerified", result.accountVerified, true],
    ["spendScope", result.spendScope, "EXACT_ACCOUNT_TOTAL"],
    ["warningCad", result.warningCad, 25],
    ["thresholdCad", result.thresholdCad, 25],
    ["approvedCapCad", result.approvedCapCad, 30],
  ];
  for (const [field, actual, expected] of exactFields) {
    if (actual !== expected) {
      throw new Error(
        `Controlled-test monitor ${field} must equal ${JSON.stringify(expected)}`,
      );
    }
  }
  if (
    !result.timestampUtc
    || !result.timestampLocal
    || !result.windowStartLocal
    || !result.windowEndLocal
  ) {
    throw new Error("Controlled-test monitor timing evidence is incomplete");
  }
  if (
    typeof result.spendCad !== "number"
    || !Number.isFinite(result.spendCad)
    || result.spendCad < 0
    || typeof result.spendMicros !== "string"
    || !/^\d+$/.test(result.spendMicros)
  ) {
    throw new Error("Controlled-test monitor spend evidence is invalid");
  }
  const campaigns = normalizedCampaigns(result.campaignsBefore);
  if (campaigns.length !== EXPECTED_CONTROLLED_CAMPAIGNS.length) {
    throw new Error("Controlled-test monitor campaign inventory is incomplete");
  }
  for (const expected of EXPECTED_CONTROLLED_CAMPAIGNS) {
    const actual = campaigns.find((campaign) => campaign.id === expected.id);
    if (
      !actual
      || actual.name !== expected.name
      || !["ENABLED", "PAUSED"].includes(actual.status)
    ) {
      throw new Error(
        `Controlled-test monitor campaign inventory mismatch for ${expected.id}`,
      );
    }
  }
}

export async function persistGoogleAdsMonitorEvidence<T extends GoogleAdsMonitorResult>(
  result: T,
  {
    auditRunId = `monitor_${randomUUID().replaceAll("-", "")}`,
    schedulerSource = "MANUAL",
    record = recordAuditEventWithReceipt,
  }: {
    auditRunId?: string;
    schedulerSource?: GoogleAdsMonitorSchedulerSource;
    record?: EvidenceRecorder;
  } = {},
): Promise<T & {
  auditRunId: string;
  databaseEventId: string;
  persistedAtUtc: string;
  schedulerSource: GoogleAdsMonitorSchedulerSource;
  evidencePersisted: true;
  activationEligible: boolean;
}> {
  if (!/^monitor_[a-f0-9]{32}$/.test(auditRunId)) {
    throw new Error("Google Ads monitor audit run ID is invalid");
  }
  if (result.profile === "controlled-test") validateControlledResult(result);

  const campaignsBefore = normalizedCampaigns(result.campaignsBefore);
  const activationEligible = result.profile === "controlled-test"
    && schedulerSource === "RAILWAY"
    && result.ok === true
    && result.outcome === "BELOW_STOP"
    && result.action === "NONE"
    && campaignsBefore.every((campaign) => campaign.status === "PAUSED");
  const evidence = {
    auditRunId,
    schedulerSource,
    activationEligible,
    ok: result.ok === true,
    customerId: String(result.customerId ?? ""),
    profile: result.profile ?? "unknown",
    executionMode: result.executionMode ?? "unknown",
    timeZone: result.timeZone ?? "unknown",
    accountVerified: result.accountVerified === true,
    spendScope: result.spendScope ?? "unknown",
    warningCad: result.warningCad ?? null,
    thresholdCad: result.thresholdCad ?? null,
    approvedCapCad: result.approvedCapCad ?? null,
    outcome: result.outcome ?? "unknown",
    action: result.action ?? "unknown",
    spendCad: result.spendCad ?? null,
    spendMicros: result.spendMicros ?? null,
    timestampUtc: result.timestampUtc ?? null,
    timestampLocal: result.timestampLocal ?? null,
    windowStartLocal: result.windowStartLocal ?? null,
    windowEndLocal: result.windowEndLocal ?? null,
    pauseVerified: result.pauseVerified === true,
    campaignsBefore,
    campaignsAfter: normalizedCampaigns(result.campaignsAfter),
  };

  const receipt: AuditEventReceipt | null = await record({
    actor_type: "cron",
    actor_id: "google-ads-monitor",
    event_type: "google_ads.monitor.heartbeat",
    entity_type: "google_ads_account",
    entity_id: auditRunId,
    detail: evidence,
  });

  if (!receipt?.id || !receipt.at) {
    throw new Error("Google Ads monitor evidence could not be persisted");
  }

  return {
    ...result,
    auditRunId,
    databaseEventId: receipt.id,
    persistedAtUtc: receipt.at,
    schedulerSource,
    evidencePersisted: true,
    activationEligible,
  };
}
