import { describe, expect, it } from "vitest";
import { parsePstExemption } from "../pst-exemption";
import { computeTaxCents } from "../tax-math";

describe("staff PST resale exemption", () => {
  it("requires both a vendor licence number and resale confirmation", () => {
    expect(() => parsePstExemption({ enabled: true, resaleConfirmed: true })).toThrow(/vendor licence/i);
    expect(() => parsePstExemption({ enabled: true, vendorNumber: "SK-123" })).toThrow(/resale/i);
  });

  it("normalizes a saved vendor licence but does not apply an exemption by default", () => {
    expect(parsePstExemption({ vendorNumber: "  SK  123  " })).toEqual({
      enabled: false,
      vendorNumber: "SK 123",
      resaleConfirmed: false,
      rememberVendorNumber: true,
      clearRememberedVendorNumber: false,
    });
  });

  it("calculates exempt documents as GST-only", () => {
    expect(computeTaxCents(10_001, { gstRate: 0.05, pstRate: 0.06 }, true)).toEqual({
      gstCents: 500,
      pstCents: 0,
      totalCents: 10_501,
    });
  });
});
