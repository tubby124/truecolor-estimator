import { describe, expect, it } from "vitest";
import { nextFollowupTier } from "@/lib/orders/followupLadder";

/**
 * Integration contract for the pause/resume staff control:
 * a paused order must never receive an automated follow-up tier,
 * and resuming (null pause) restores ladder eligibility.
 */
describe("followup-pause ↔ ladder integration", () => {
  const NOW = new Date("2026-08-19T18:00:00.000Z");
  const base = {
    id: "ord-1",
    status: "pending_payment",
    is_archived: false,
    paid_at: null,
    wave_payment_recorded_at: null,
    followup_count: 1,
    created_at: new Date(NOW.getTime() - 30 * 3_600_000).toISOString(), // 30h → T2 due
  };

  it("unpaused 30h order is due for T2", () => {
    expect(nextFollowupTier({ ...base, followup_paused_at: null }, NOW)).toBe(2);
  });

  it("paused order returns null (cron skips it, counts skipped.paused)", () => {
    expect(
      nextFollowupTier(
        { ...base, followup_paused_at: "2026-08-19T10:00:00Z" },
        NOW,
      ),
    ).toBeNull();
  });

  it("resume (pause cleared) restores T2 eligibility", () => {
    expect(nextFollowupTier({ ...base, followup_paused_at: null }, NOW)).toBe(2);
  });

  it("etransfer auto-pause keeps counting age but never fires while paused", () => {
    const aged = { ...base, created_at: new Date(NOW.getTime() - 13 * 86_400_000).toISOString() };
    expect(nextFollowupTier({ ...aged, followup_paused_at: "2026-08-19T10:00:00Z" }, NOW)).toBeNull();
    expect(nextFollowupTier({ ...aged, followup_paused_at: null }, NOW)).toBe(3); // jumps to T3, not spam
  });
});
