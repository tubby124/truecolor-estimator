import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processWavePaymentEffects: vi.fn(),
  recordCronRun: vi.fn(),
}));

vi.mock("@/lib/payment/wave-payment-effects", () => ({
  processWavePaymentEffects: mocks.processWavePaymentEffects,
}));

vi.mock("@/lib/cron/heartbeat", () => ({
  recordCronRun: mocks.recordCronRun,
}));

import { POST } from "../route";

function request(secret = "cron-test-secret") {
  return new NextRequest(
    "https://truecolorprinting.ca/api/cron/wave-payment-effects",
    {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    },
  );
}

describe("Wave payment effect cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    mocks.processWavePaymentEffects.mockResolvedValue({
      claimed: 2,
      sent: 2,
      retried: 0,
      dead: 0,
    });
    mocks.recordCronRun.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects an invalid bearer before running the worker", async () => {
    const response = await POST(request("wrong-secret"));

    expect(response.status).toBe(401);
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
  });

  it("processes bounded work and records a healthy heartbeat", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      claimed: 2,
      sent: 2,
      retried: 0,
      dead: 0,
    });
    expect(mocks.processWavePaymentEffects).toHaveBeenCalledWith({ maxJobs: 10 });
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "wave-payment-effects",
      true,
      "claimed=2 sent=2 retry=0 dead=0",
    );
  });

  it("records an unhealthy heartbeat while preserving retryable work", async () => {
    mocks.processWavePaymentEffects.mockResolvedValue({
      claimed: 1,
      sent: 0,
      retried: 1,
      dead: 0,
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: false,
      claimed: 1,
      sent: 0,
      retried: 1,
      dead: 0,
    });
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "wave-payment-effects",
      false,
      "claimed=1 sent=0 retry=1 dead=0",
    );
  });
});
