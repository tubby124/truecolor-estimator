import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

describe("staff order message timeline contract", () => {
  const panel = source("src/components/staff/orders/OrderMessagesPanel.tsx");
  const listRoute = source("src/app/api/staff/orders/[id]/messages/route.ts");
  const card = source("src/components/staff/orders/StaffOrderCard.tsx");

  it("uses a stable client request UUID for safe retries", () => {
    expect(panel).toContain("crypto.randomUUID()");
    expect(panel).toContain("pendingRequestId");
    expect(panel).toContain("clientRequestId");
    expect(panel).toContain("Retry message safely");
  });

  it("renders stored message content as text rather than injected HTML", () => {
    expect(panel).toContain("whitespace-pre-wrap");
    expect(panel).not.toContain("dangerouslySetInnerHTML");
  });

  it("distinguishes provider acceptance, delivery, failures, and replies", () => {
    for (const status of [
      "pending_confirmation",
      "sent",
      "delivered",
      "delivery_delayed",
      "bounced",
      "failed",
      "received",
    ]) {
      expect(panel).toContain(status);
    }
    expect(panel).toContain("not guaranteed");
    expect(panel).toContain("sender_matches_customer");
  });

  it("loads messages through a staff-authenticated, order-scoped API", () => {
    expect(listRoute).toContain("requireStaffUser()");
    expect(listRoute).toContain('.eq("order_id", orderId)');
    expect(listRoute).toContain("rateLimit(");
    expect(card).toContain("<OrderMessagesPanel");
  });
});
