import { describe, expect, it } from "vitest";
import { followupCopy, type FollowupCopyContext } from "../followupCopy";

const baseCtx: FollowupCopyContext = {
  orderNumber: "TC-2026-0319",
  firstName: "Steve",
  paymentMethod: "card",
  latestAttempt: null,
};

describe("followupCopy", () => {
  it("returns null for no tier", () => {
    expect(followupCopy(null, baseCtx)).toBeNull();
  });

  it("T1 default branch keeps legacy subject", () => {
    const c = followupCopy(1, baseCtx)!;
    expect(c.subject).toBe("Your True Color order TC-2026-0319 is waiting");
    expect(c.cta).toBe("Complete payment");
  });

  it("T1 card_declined branch keeps legacy copy", () => {
    const c = followupCopy(1, {
      ...baseCtx,
      latestAttempt: { order_id: "x", status: "card_declined", failure_label: "Card was declined", customer_message: null },
    })!;
    expect(c.subject).toBe("Card payment did not complete — TC-2026-0319");
    expect(c.headline).toBe("Your card payment did not complete");
  });

  it("T1 etransfer branch keeps legacy copy", () => {
    const c = followupCopy(1, { ...baseCtx, paymentMethod: "etransfer" })!;
    expect(c.subject).toBe("e-Transfer reminder — TC-2026-0319");
  });

  it("T2 subject/headline mapping", () => {
    const c = followupCopy(2, baseCtx)!;
    expect(c.subject).toBe("Quick check on your order TC-2026-0319");
    expect(c.headline).toBe("Any changes needed");
    expect(c.cta).toBe("Complete payment");
  });

  it("T2 opens the changes door and the already-paid door", () => {
    const c = followupCopy(2, baseCtx)!;
    expect(c.body).toContain("reply to this email");
    expect(c.foot).toContain("Already sent payment");
    expect(c.foot).toContain("info@true-color.ca");
  });

  it("T3 subject/headline mapping", () => {
    const c = followupCopy(3, baseCtx)!;
    expect(c.subject).toBe("Your order TC-2026-0319 is on hold — payment needed");
    expect(c.headline).toBe("Last reminder before we release your slot");
    expect(c.cta).toBe("Pay now");
  });

  it("T3 mentions 7-day close and already-paid path", () => {
    const c = followupCopy(3, baseCtx)!;
    expect(c.body).toContain("7 days");
    expect(c.body).toContain("reply with the confirmation");
  });

  it("partial payment shown in T2/T3 when paidSoFar set", () => {
    const c2 = followupCopy(2, { ...baseCtx, paidSoFar: "50.00", balanceDue: "604.90" })!;
    expect(c2.body).toContain("paid $50.00 so far");
    expect(c2.body).toContain("remaining $604.90");
    const c3 = followupCopy(3, { ...baseCtx, paidSoFar: "50.00", balanceDue: "604.90" })!;
    expect(c3.body).toContain("remaining $604.90");
  });

  it("no partial line when fully unpaid", () => {
    const c = followupCopy(2, baseCtx)!;
    expect(c.body).not.toContain("so far");
  });
});
