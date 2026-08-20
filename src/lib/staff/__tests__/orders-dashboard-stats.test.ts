import { describe, expect, it } from "vitest";
import {
  calculateOrdersDashboardStats,
  type OrdersDashboardStatsOrder,
} from "../orders-dashboard-stats";

const NOW = new Date("2026-08-18T18:00:00.000Z"); // Tuesday noon in America/Regina
const TIME_ZONE = "America/Regina";

function order(overrides: Partial<OrdersDashboardStatsOrder> = {}): OrdersDashboardStatsOrder {
  return {
    status: "payment_received",
    total: 100,
    is_archived: false,
    created_at: "2026-01-01T00:00:00.000Z",
    paid_at: "2026-08-18T16:00:00.000Z",
    ...overrides,
  };
}

describe("calculateOrdersDashboardStats", () => {
  it("returns zero stats for empty input", () => {
    expect(calculateOrdersDashboardStats([], { now: NOW, timeZone: TIME_ZONE })).toEqual({
      active: 0,
      pendingPayment: 0,
      inProduction: 0,
      readyForPickup: 0,
      paidToday: 0,
      paidWeek: 0,
      paidMonth: 0,
    });
  });

  it("counts only non-archived operational statuses", () => {
    const stats = calculateOrdersDashboardStats(
      [
        order({ status: "pending_payment", paid_at: null }),
        order({ status: "payment_received" }),
        order({ status: "in_production" }),
        order({ status: "ready_for_pickup" }),
        order({ status: "complete" }),
        order({ status: "cancelled" }),
        order({ status: "in_production", is_archived: true }),
      ],
      { now: NOW, timeZone: TIME_ZONE },
    );

    expect(stats.active).toBe(4);
    expect(stats.pendingPayment).toBe(1);
    expect(stats.inProduction).toBe(1);
    expect(stats.readyForPickup).toBe(1);
  });

  it("uses paid_at and America/Regina calendar boundaries for paid revenue", () => {
    const stats = calculateOrdersDashboardStats(
      [
        order({ status: "payment_received", total: "10.50", paid_at: "2026-08-18T06:00:00.000Z" }), // today local
        order({ status: "in_production", total: 20, paid_at: "2026-08-18T05:59:59.000Z" }), // Monday local
        order({ status: "ready_for_pickup", total: 30, paid_at: "2026-08-17T05:59:59.000Z" }), // Sunday local: month only
        order({ status: "complete", total: 40, paid_at: "2026-08-01T06:00:00.000Z" }), // month start local
        order({ status: "payment_received", total: 50, paid_at: "2026-08-01T05:59:59.000Z" }), // July local
        order({ status: "payment_received", total: 999, created_at: "2026-08-18T16:00:00.000Z", paid_at: null }),
      ],
      { now: NOW, timeZone: TIME_ZONE },
    );

    expect(stats.paidToday).toBe(10.5);
    expect(stats.paidWeek).toBe(30.5);
    expect(stats.paidMonth).toBe(100.5);
  });

  it("counts paid revenue by paid_at regardless of status while preserving pending-payment count", () => {
    const stats = calculateOrdersDashboardStats(
      [
        order({ status: "payment_received", total: "12.25" }),
        order({ status: "pending_payment", total: 100, paid_at: "2026-08-18T16:00:00.000Z" }),
        order({ status: "legacy_status", total: 25, paid_at: "2026-08-18T16:00:00.000Z" }),
        order({ status: null, total: 5, paid_at: "2026-08-18T16:00:00.000Z" }),
        order({ status: "payment_received", total: 100, paid_at: null }),
        order({ status: "payment_received", total: "not-a-number" }),
        order({ status: "in_production", total: null }),
        order({ status: "ready_for_pickup", total: 100, is_archived: true }),
      ],
      { now: NOW, timeZone: TIME_ZONE },
    );

    expect(stats.pendingPayment).toBe(1);
    expect(stats.paidToday).toBe(142.25);
    expect(stats.paidWeek).toBe(142.25);
    expect(stats.paidMonth).toBe(142.25);
  });
});
