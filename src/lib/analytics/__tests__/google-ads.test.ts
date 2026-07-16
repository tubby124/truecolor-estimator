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

  it("deduplicates concurrent conversion sends in the same browser", async () => {
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
    };

    await expect(Promise.all([
      sendGoogleAdsPurchase(input, { localStorage, gtag }),
      sendGoogleAdsPurchase(input, { localStorage, gtag }),
    ])).resolves.toEqual([true, false]);
    expect(gtag.mock.calls.filter((call) => call[1] === "conversion")).toHaveLength(1);
  });

  it("checks the session fallback when local storage is readable but unwritable", async () => {
    const sessionValues = new Map<string, string>();
    const readableUnwritableLocal = {
      getItem: () => null,
      setItem: () => { throw new Error("quota"); },
    };
    const sessionStorage = {
      getItem: (key: string) => sessionValues.get(key) ?? null,
      setItem: (key: string, value: string) => { sessionValues.set(key, value); },
    };
    const gtag = vi.fn();
    const input = { conversionLabel: "AW-123/label", transactionId: "TC-fallback", value: 50 };

    await expect(sendGoogleAdsPurchase(input, {
      localStorage: readableUnwritableLocal,
      sessionStorage,
      gtag,
    })).resolves.toBe(true);
    await expect(sendGoogleAdsPurchase(input, {
      localStorage: readableUnwritableLocal,
      sessionStorage,
      gtag,
    })).resolves.toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("does not mark a transaction sent when gtag is unavailable", async () => {
    const localStorage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    await expect(sendGoogleAdsPurchase(
      { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 50 },
      { localStorage, gtag: undefined },
    )).resolves.toBe(false);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("never sends user_data from legacy email-marketing consent inputs", async () => {
    const gtag = vi.fn();
    const legacyInput = {
      conversionLabel: "AW-123/label",
      transactionId: "TC-3",
      value: 75,
      enhancedConversion: {
        enabled: "true",
        marketingConsent: true,
        email: " Customer@Example.com ",
      },
    } as Parameters<typeof sendGoogleAdsPurchase>[0] & {
      enhancedConversion: { enabled: string; marketingConsent: boolean; email: string };
    };
    await sendGoogleAdsPurchase(legacyInput, {
      localStorage: { getItem: () => null, setItem: vi.fn() },
      gtag,
    });

    expect(gtag.mock.calls).toEqual([
      ["event", "conversion", {
        send_to: "AW-123/label",
        transaction_id: "TC-3",
        value: 75,
        currency: "CAD",
      }],
    ]);
  });
});

describe("Enhanced Conversions preparation", () => {
  it("normalizes and hashes an email without dispatching it", async () => {
    const result = await prepareEnhancedConversionEmail("  Customer@Example.COM ");
    expect(result).toBe("e233d4a29013e9d87150c6237c6777bedf379ebf1acdc5d6126fec7e8bb74fb5");
  });

  it.each([undefined, "", "not-an-email"])("rejects invalid preparation input %#", async (email) => {
    await expect(prepareEnhancedConversionEmail(email)).resolves.toBeNull();
  });
});
