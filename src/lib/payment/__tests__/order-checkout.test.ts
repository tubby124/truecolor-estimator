import { describe, expect, it, vi } from "vitest";

import {
  completeOrderCheckout,
  failOrderCheckout,
  reserveOrderCheckout,
} from "../order-checkout";

const orderId = "22222222-2222-4222-8222-222222222222";
const reservationId = "33333333-3333-4333-8333-333333333333";

function clientWith(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as never, rpc };
}

describe("catalog order checkout reservation", () => {
  it("parses create, resume, and wait without inventing a session", async () => {
    for (const [action, url] of [["create", null], ["resume", "https://checkout.clover.test/one"], ["wait", null]] as const) {
      const { client } = clientWith({
        data: [{
          checkout_action: action,
          checkout_reservation_id: reservationId,
          checkout_url: url,
        }],
        error: null,
      });
      await expect(reserveOrderCheckout(client, orderId)).resolves.toEqual({
        action,
        reservationId,
        checkoutUrl: url,
      });
    }
  });

  it("completes the exact reservation with the Clover session", async () => {
    const { client, rpc } = clientWith({ data: true, error: null });
    await completeOrderCheckout(client, {
      orderId,
      reservationId,
      checkoutUrl: "https://checkout.clover.test/one",
      sessionId: "session-1",
      expiresAt: "2026-07-21T00:00:00.000Z",
    });
    expect(rpc).toHaveBeenCalledWith("complete_order_checkout", {
      p_order_id: orderId,
      p_reservation_id: reservationId,
      p_checkout_url: "https://checkout.clover.test/one",
      p_session_id: "session-1",
      p_expires_at: "2026-07-21T00:00:00.000Z",
    });
  });

  it("persists ambiguous outcomes so callers cannot silently retry", async () => {
    const { client, rpc } = clientWith({ data: true, error: null });
    await failOrderCheckout(client, {
      orderId,
      reservationId,
      ambiguous: true,
      error: "response lost",
    });
    expect(rpc).toHaveBeenCalledWith("fail_order_checkout", expect.objectContaining({
      p_ambiguous: true,
      p_error: "response lost",
    }));
  });
});
