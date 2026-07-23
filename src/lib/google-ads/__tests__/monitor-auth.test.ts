import { describe, expect, it } from "vitest";
import { authorizeGoogleAdsMonitorCaller } from "../monitor-auth";

const env = {
  CRON_SECRET: "manual-secret-value",
  GOOGLE_ADS_MONITOR_RAILWAY_SECRET: "railway-secret-value",
  GOOGLE_ADS_MONITOR_BACKUP_SECRET: "backup-secret-value",
};

describe("Google Ads monitor caller authentication", () => {
  it("derives scheduler provenance from distinct bearer credentials", () => {
    expect(authorizeGoogleAdsMonitorCaller("Bearer railway-secret-value", env))
      .toBe("RAILWAY");
    expect(authorizeGoogleAdsMonitorCaller("Bearer backup-secret-value", env))
      .toBe("GITHUB_BACKUP");
    expect(authorizeGoogleAdsMonitorCaller("Bearer manual-secret-value", env))
      .toBe("MANUAL");
  });

  it("rejects missing and incorrect bearer credentials", () => {
    expect(authorizeGoogleAdsMonitorCaller(null, env)).toBeNull();
    expect(authorizeGoogleAdsMonitorCaller("Bearer wrong", env)).toBeNull();
  });

  it("fails closed when two configured sources share one secret", () => {
    expect(() => authorizeGoogleAdsMonitorCaller(
      "Bearer duplicate-secret",
      {
        ...env,
        CRON_SECRET: "duplicate-secret",
        GOOGLE_ADS_MONITOR_RAILWAY_SECRET: "duplicate-secret",
      },
    )).toThrow("must be distinct");
  });
});
