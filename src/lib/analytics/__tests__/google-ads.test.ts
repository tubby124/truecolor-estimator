import { describe, expect, it, vi } from "vitest";
import {
  deriveGoogleAdsTagId,
  prepareEnhancedConversionEmail,
  prepareGoogleAdsPurchase,
  sendGoogleAdsPurchase,
} from "../google-ads";

describe("Google Ads purchase conversion", () => {
  it("prepares a valid CAD conversion payload", () => {
    expect(prepareGoogleAdsPurchase({
      conversionLabel: "AW-123456789/AbCd_ef-12",
      transactionId: "TC-2026-0042",
      value: 123.45,
    })).toEqual({
      send_to: "AW-123456789/AbCd_ef-12",
      transaction_id: "TC-2026-0042",
      value: 123.45,
      currency: "CAD",
    });
  });

  it("derives a safe Google Ads tag ID only from a valid full destination", () => {
    expect(deriveGoogleAdsTagId(" AW-123456789/AbCd_ef-12 ")).toBe("AW-123456789");
    expect(deriveGoogleAdsTagId("AW-123456789")).toBeNull();
    expect(deriveGoogleAdsTagId("AW-123/label');alert(1)//")).toBeNull();
    expect(deriveGoogleAdsTagId(undefined)).toBeNull();
  });

  it.each([
    { conversionLabel: undefined, transactionId: "TC-1", value: 10 },
    { conversionLabel: "not-a-label", transactionId: "TC-1", value: 10 },
    { conversionLabel: "AW-123/label", transactionId: " ", value: 10 },
    { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 0 },
    { conversionLabel: "AW-123/label", transactionId: "TC-1", value: Number.NaN },
  ])("rejects invalid purchase input %#", (input) => {
    expect(prepareGoogleAdsPurchase(input)).toBeNull();
  });

  it("deduplicates successful browser sends across sessions using shared local storage", async () => {
    const localValues = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => localValues.get(key) ?? null,
      setItem: (key: string, value: string) => { localValues.set(key, value); },
    };
    const gtag = vi.fn();
    const input = { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 50 };

    await expect(sendGoogleAdsPurchase(input, {
      localStorage,
      sessionStorage: { getItem: () => null, setItem: vi.fn() },
      gtag,
    })).resolves.toBe(true);
    await expect(sendGoogleAdsPurchase(input, {
      localStorage,
      sessionStorage: { getItem: () => null, setItem: vi.fn() },
      gtag,
    })).resolves.toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-123/label",
      transaction_id: "TC-1",
      value: 50,
      currency: "CAD",
    });
  });

  it("falls back to session storage when local storage is unavailable", async () => {
    const sessionValues = new Map<string, string>();
    const brokenLocal = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    const sessionStorage = {
      getItem: (key: string) => sessionValues.get(key) ?? null,
      setItem: (key: string, value: string) => { sessionValues.set(key, value); },
    };
    const gtag = vi.fn();
    const input = { conversionLabel: "AW-123/label", transactionId: "TC-2", value: 50 };

    await expect(sendGoogleAdsPurchase(input, { localStorage: brokenLocal, sessionStorage, gtag })).resolves.toBe(true);
    await expect(sendGoogleAdsPurchase(input, { localStorage: brokenLocal, sessionStorage, gtag })).resolves.toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent enhanced-conversion sends in the same browser", async () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const gtag = vi.fn();
    const input = {
      conversionLabel: "AW-123/label",
      transactionId: "TC-concurrent",
      value: 75,
      enhancedConversion: { enabled: "true", marketingConsent: true, email: "a@example.com" },
    };

    await expect(Promise.all([
      sendGoogleAdsPurchase(input, { localStorage, gtag }),
      sendGoogleAdsPurchase(input, { localStorage, gtag }),
    ])).resolves.toEqual([true, false]);
    expect(gtag.mock.calls.filter((call) => call[1] === "conversion")).toHaveLength(1);
  });

  it("does not mark a transaction sent when gtag is unavailable", async () => {
    const localStorage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    await expect(sendGoogleAdsPurchase(
      { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 50 },
      { localStorage, gtag: undefined },
    )).resolves.toBe(false);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("sets consent-gated hashed user data before the conversion", async () => {
    const gtag = vi.fn();
    await sendGoogleAdsPurchase({
      conversionLabel: "AW-123/label",
      transactionId: "TC-3",
      value: 75,
      enhancedConversion: {
        enabled: "true",
        marketingConsent: true,
        email: " Customer@Example.com ",
      },
    }, { localStorage: { getItem: () => null, setItem: vi.fn() }, gtag });

    expect(gtag.mock.calls).toEqual([
      ["set", "user_data", {
        sha256_email_address: "e233d4a29013e9d87150c6237c6777bedf379ebf1acdc5d6126fec7e8bb74fb5",
      }],
      ["event", "conversion", {
        send_to: "AW-123/label",
        transaction_id: "TC-3",
        value: 75,
        currency: "CAD",
      }],
    ]);
  });

  it.each([
    { enabled: undefined, marketingConsent: true, email: "a@example.com" },
    { enabled: "false", marketingConsent: true, email: "a@example.com" },
    { enabled: "TRUE", marketingConsent: true, email: "a@example.com" },
    { enabled: "true", marketingConsent: false, email: "a@example.com" },
    { enabled: "true", marketingConsent: true, email: undefined },
  ])("sends no user_data when an enhanced-conversion gate is absent %#", async (enhancedConversion) => {
    const gtag = vi.fn();
    await sendGoogleAdsPurchase({
      conversionLabel: "AW-123/label",
      transactionId: "TC-no-user-data",
      value: 75,
      enhancedConversion,
    }, { localStorage: { getItem: () => null, setItem: vi.fn() }, gtag });
    expect(gtag.mock.calls.map((call) => call[1])).toEqual(["conversion"]);
  });
});

describe("Enhanced Conversions preparation", () => {
  it("normalizes and hashes email only with both feature flag and consent", async () => {
    const result = await prepareEnhancedConversionEmail({
      enabled: "true",
      marketingConsent: true,
      email: "  Customer@Example.COM ",
    });
    expect(result).toBe("e233d4a29013e9d87150c6237c6777bedf379ebf1acdc5d6126fec7e8bb74fb5");
  });

  it.each([
    { enabled: undefined, marketingConsent: true, email: "a@example.com" },
    { enabled: "false", marketingConsent: true, email: "a@example.com" },
    { enabled: "TRUE", marketingConsent: true, email: "a@example.com" },
    { enabled: "true", marketingConsent: false, email: "a@example.com" },
    { enabled: "true", marketingConsent: true, email: "not-an-email" },
  ])("does not prepare user data without every gate %#", async (input) => {
    await expect(prepareEnhancedConversionEmail(input)).resolves.toBeNull();
  });
});
