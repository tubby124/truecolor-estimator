import { describe, expect, it } from "vitest";
import { nextFollowupTier, type FollowupOrderLike } from "../followupLadder";

const NOW = new Date("2026-08-19T18:00:00.000Z");

function order(overrides: Partial<FollowupOrderLike> = {}): FollowupOrderLike {
  return {
    id: "ord-1",
    status: "pending_payment",
    is_archived: false,
    paid_at: null,
    wave_payment_recorded_at: null,
    followup_count: 0,
    followup_paused_at: null,
    created_at: "2026-08-19T16:00:00.000Z", // 2h old by default
    ...overrides,
  };
}

function aged(hours: number): string {
  return new Date(NOW.getTime() - hours * 3_600_000).toISOString();
}

describe("nextFollowupTier", () => {
  it("fresh order under 2h → not due", () => {
    expect(nextFollowupTier(order({ created_at: aged(1) }), NOW)).toBeNull();
  });

  it("3h old, 0 sent → tier 1", () => {
    expect(nextFollowupTier(order({ created_at: aged(3) }), NOW)).toBe(1);
  });

  it("3h old, 1 sent → not due for tier 2 yet", () => {
    expect(nextFollowupTier(order({ created_at: aged(3), followup_count: 1 }), NOW)).toBeNull();
  });

  it("30h old, 1 sent → tier 2", () => {
    expect(nextFollowupTier(order({ created_at: aged(30), followup_count: 1 }), NOW)).toBe(2);
  });

  it("30h old, 2 sent → not due", () => {
    expect(nextFollowupTier(order({ created_at: aged(30), followup_count: 2 }), NOW)).toBeNull();
  });

  it("6d old, 2 sent → tier 3", () => {
    expect(nextFollowupTier(order({ created_at: aged(24 * 6), followup_count: 2 }), NOW)).toBe(3);
  });

  it("6d old, 3 sent → ladder exhausted", () => {
    expect(nextFollowupTier(order({ created_at: aged(24 * 6), followup_count: 3 }), NOW)).toBeNull();
  });

  it("paused → null regardless of age", () => {
    expect(
      nextFollowupTier(
        order({ created_at: aged(24 * 8), followup_count: 0, followup_paused_at: "2026-08-18T00:00:00Z" }),
        NOW,
      ),
    ).toBeNull();
  });

  it("archived → null", () => {
    expect(nextFollowupTier(order({ created_at: aged(30), is_archived: true }), NOW)).toBeNull();
  });

  it("paid → null", () => {
    expect(nextFollowupTier(order({ created_at: aged(30), paid_at: "2026-08-19T10:00:00Z" }), NOW)).toBeNull();
  });

  it("wave-recorded → null", () => {
    expect(
      nextFollowupTier(order({ created_at: aged(30), wave_payment_recorded_at: "2026-08-19T10:00:00Z" }), NOW),
    ).toBeNull();
  });

  it("wrong status → null", () => {
    expect(nextFollowupTier(order({ created_at: aged(30), status: "in_production" }), NOW)).toBeNull();
  });

  it("backdated catch-up: 6d old, 0 sent → jumps straight to tier 3 (no email spam)", () => {
    expect(nextFollowupTier(order({ created_at: aged(24 * 6), followup_count: 0 }), NOW)).toBe(3);
  });

  it("13d old with only legacy touch (count=1) → tier 3", () => {
    expect(nextFollowupTier(order({ created_at: aged(24 * 13), followup_count: 1 }), NOW)).toBe(3);
  });

  it("null followup_count treated as 0", () => {
    expect(nextFollowupTier(order({ created_at: aged(3), followup_count: null }), NOW)).toBe(1);
  });
});
