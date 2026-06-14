import { describe, it, expect } from "vitest";
import { isEligible, isValidEmail } from "../build-retail-cohort.mjs";

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
  it("rejects scrape-junk in the email field (maps URL)", () => {
    expect(isEligible({ ...base, email: "//www.google.com/maps/@51.474499" })).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("shop@store.ca")).toBe(true);
  });
  it("rejects scrape junk with slashes / numeric TLD", () => {
    expect(isValidEmail("//www.google.com/maps/@51.474499")).toBe(false);
  });
  it("rejects empty / null / spaces", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
  });
});
