import { timingSafeEqual } from "node:crypto";

export type GoogleAdsMonitorSchedulerSource =
  | "RAILWAY"
  | "GITHUB_BACKUP"
  | "MANUAL";

type MonitorAuthEnvironment = {
  [key: string]: string | undefined;
  CRON_SECRET?: string;
  GOOGLE_ADS_MONITOR_RAILWAY_SECRET?: string;
  GOOGLE_ADS_MONITOR_BACKUP_SECRET?: string;
};

function equalSecret(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length
    && timingSafeEqual(providedBytes, expectedBytes);
}

export function authorizeGoogleAdsMonitorCaller(
  authorization: string | null,
  env: MonitorAuthEnvironment = process.env,
): GoogleAdsMonitorSchedulerSource | null {
  const provided = authorization?.replace(/^Bearer\s+/i, "") ?? "";
  if (!provided) return null;

  const candidates: Array<{
    secret: string | undefined;
    source: GoogleAdsMonitorSchedulerSource;
  }> = [
    {
      secret: env.GOOGLE_ADS_MONITOR_RAILWAY_SECRET,
      source: "RAILWAY",
    },
    {
      secret: env.GOOGLE_ADS_MONITOR_BACKUP_SECRET,
      source: "GITHUB_BACKUP",
    },
    { secret: env.CRON_SECRET, source: "MANUAL" },
  ];
  const matches = candidates.filter(
    ({ secret }) => secret && equalSecret(provided, secret),
  );

  if (matches.length > 1) {
    throw new Error("Google Ads monitor scheduler secrets must be distinct");
  }
  return matches[0]?.source ?? null;
}
