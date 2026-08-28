import { describe, expect, it } from "vitest";
import { paymentFollowupOrderKey, paymentFollowupSessionKey } from "../paymentFollowupIdempotency";

describe("payment follow-up idempotency keys", () => {
  it("keys each TC-10 tier to the order", () => {
    expect(paymentFollowupOrderKey(1, "order-123")).toBe("payment-followup/t1/order-123");
    expect(paymentFollowupOrderKey(3, "order-123")).toBe("payment-followup/t3/order-123");
  });

  it("keys each TC-9 reminder to the abandoned checkout session", () => {
    expect(paymentFollowupSessionKey("session-456")).toBe("payment-followup/tc9/session-456");
  });
});
