import { describe, it, expect } from "vitest";
import { isEligible } from "../build-retail-cohort.mjs";

const base = {
  industry_tags: ["retail"], email: "a@b.com", drip_status: "queued",
  suppression_reason: null, unsubscribed_at: null, validation_status: "valid",
};

describe("isEligible", () => {
  it("accepts a clean queued retail lead with an email", () => {
    expect(isEligible(base)).toBe(true);
  });
  it("rejects a lead with no email", () => {
    expect(isEligible({ ...base, email: null })).toBe(false);
  });
  it("rejects a paused/warm lead", () => {
    expect(isEligible({ ...base, drip_status: "paused", suppression_reason: "replied_warm" })).toBe(false);
  });
  it("rejects an unsubscribed lead even if drip_status looks queued", () => {
    expect(isEligible({ ...base, unsubscribed_at: "2026-05-01T00:00:00Z" })).toBe(false);
  });
  it("rejects a non-retail lead", () => {
    expect(isEligible({ ...base, industry_tags: ["healthcare"] })).toBe(false);
  });
  it("rejects an invalid-email lead", () => {
    expect(isEligible({ ...base, validation_status: "invalid" })).toBe(false);
  });
});
