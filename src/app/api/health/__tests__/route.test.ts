import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

const HEALTHY_ENV = {
  PAYMENT_TOKEN_SECRET: "a".repeat(64),
  NEXT_PUBLIC_SITE_URL: "https://truecolorprinting.ca",
  CLOVER_WEBHOOK_SECRET: "legacy-webhook-secret",
  WAVE_WEBHOOK_SECRET: "wave-webhook-secret",
  BREVO_WEBHOOK_SECRET: "brevo-webhook-secret",
  RESEND_WEBHOOK_SECRET: "resend-webhook-secret",
  CRON_SECRET: "cron-secret",
  WAVE_API_TOKEN: "wave-token",
  CLOVER_ECOMM_PRIVATE_KEY: "clover-private-key",
  CLOVER_MERCHANT_ID: "merchant-id",
  BREVO_API_KEY: "brevo-key",
  RESEND_API_KEY: "resend-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "supabase-secret",
};

function stubHealthyEnvironment() {
  for (const [key, value] of Object.entries(HEALTHY_ENV)) {
    vi.stubEnv(key, value);
  }
  vi.stubEnv("NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY", "");
  vi.stubEnv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("deployment health", () => {
  it("returns 200 for a healthy hard configuration", async () => {
    stubHealthyEnvironment();
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns 503 so Railway rejects a hard configuration failure", async () => {
    stubHealthyEnvironment();
    vi.stubEnv("CLOVER_WEBHOOK_SECRET", "");
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it.each(["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"])(
    "rejects a deployment missing %s",
    async (key) => {
      stubHealthyEnvironment();
      vi.stubEnv(key, "");
      const response = await GET();
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ ok: false });
    },
  );

  it("rejects a partially configured Turnstile pair", async () => {
    stubHealthyEnvironment();
    vi.stubEnv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "secret-only");
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("rejects an active key rotation without a validated legacy cutoff", async () => {
    stubHealthyEnvironment();
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", "b".repeat(64));
    vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", "invalid");
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("accepts a completed rotation with only the next signing key", async () => {
    stubHealthyEnvironment();
    vi.stubEnv("PAYMENT_TOKEN_SECRET", "");
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", "b".repeat(64));
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
