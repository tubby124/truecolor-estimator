import { describe, expect, it } from "vitest";
import { paymentFollowupOutcome } from "../paymentFollowupOutcome";

describe("paymentFollowupOutcome", () => {
  it("keeps a clean run green", () => {
    expect(paymentFollowupOutcome(0)).toEqual({ ok: true, status: 200 });
  });

  it("makes any internal query, email, or state-update failure observable", () => {
    expect(paymentFollowupOutcome(1)).toEqual({ ok: false, status: 503 });
    expect(paymentFollowupOutcome(3)).toEqual({ ok: false, status: 503 });
  });

  it("rejects invalid counters", () => {
    expect(() => paymentFollowupOutcome(-1)).toThrow();
    expect(() => paymentFollowupOutcome(0.5)).toThrow();
  });
});
