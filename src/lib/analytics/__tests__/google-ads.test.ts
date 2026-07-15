import { describe, expect, it, vi } from "vitest";
import {
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

  it.each([
    { conversionLabel: undefined, transactionId: "TC-1", value: 10 },
    { conversionLabel: "not-a-label", transactionId: "TC-1", value: 10 },
    { conversionLabel: "AW-123/label", transactionId: " ", value: 10 },
    { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 0 },
    { conversionLabel: "AW-123/label", transactionId: "TC-1", value: Number.NaN },
  ])("rejects invalid purchase input %#", (input) => {
    expect(prepareGoogleAdsPurchase(input)).toBeNull();
  });

  it("deduplicates successful browser sends by transaction", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const gtag = vi.fn();
    const input = { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 50 };

    expect(sendGoogleAdsPurchase(input, { storage, gtag })).toBe(true);
    expect(sendGoogleAdsPurchase(input, { storage, gtag })).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-123/label",
      transaction_id: "TC-1",
      value: 50,
      currency: "CAD",
    });
  });

  it("does not mark a transaction sent when gtag is unavailable", () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    expect(sendGoogleAdsPurchase(
      { conversionLabel: "AW-123/label", transactionId: "TC-1", value: 50 },
      { storage, gtag: undefined },
    )).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
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
