import { describe, expect, it } from "vitest";
import {
  getQuoteTurnstileConfig,
  parseQuoteSubmissionKey,
} from "@/lib/quote-request-guard";

describe("quote request guard", () => {
  it("accepts canonical UUID submission keys and normalizes case", () => {
    expect(
      parseQuoteSubmissionKey("A4E8C7E4-BC97-4F4F-9C05-04E3D5B85B42"),
    ).toBe("a4e8c7e4-bc97-4f4f-9c05-04e3d5b85b42");
  });

  it.each([null, "", "not-a-uuid", "00000000-0000-0000-0000-000000000000"])(
    "rejects an invalid submission key: %s",
    (value) => {
      expect(parseQuoteSubmissionKey(value)).toBeNull();
    },
  );

  it("requires the Turnstile public and secret keys as a pair", () => {
    expect(getQuoteTurnstileConfig(undefined, undefined)).toMatchObject({
      configured: false,
      valid: true,
    });
    expect(getQuoteTurnstileConfig("site", "secret")).toMatchObject({
      configured: true,
      valid: true,
    });
    expect(getQuoteTurnstileConfig("site", undefined).valid).toBe(false);
    expect(getQuoteTurnstileConfig(undefined, "secret").valid).toBe(false);
  });
});
