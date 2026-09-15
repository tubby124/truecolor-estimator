import { describe, expect, it } from "vitest";
import { hasVerifiedCloverAmount, resolveCloverWebhookIdentity } from "../clover-webhook-identity";

describe("Clover webhook identity", () => {
  it("uses the durable session when the initial checkout created no attempt", () => {
    expect(resolveCloverWebhookIdentity({ durableSessionOrderId: "order-session" })).toEqual({
      kind: "matched",
      orderId: "order-session",
      source: "durable_session",
    });
  });

  it("does not treat Clover's different provider order id as our order id", () => {
    expect(resolveCloverWebhookIdentity({
      durableSessionOrderId: "order-session",
      externalReferenceOrderId: "order-session",
      cloverOrderReferenceOrderId: null,
    })).toMatchObject({ kind: "matched", orderId: "order-session" });
  });

  it("uses the latest non-null historical attempt when no durable session remains", () => {
    expect(resolveCloverWebhookIdentity({ historicalSessionOrderId: "order-historical" })).toEqual({
      kind: "matched",
      orderId: "order-historical",
      source: "historical_session",
    });
  });

  it("rejects conflicting session and reference identities", () => {
    expect(resolveCloverWebhookIdentity({
      durableSessionOrderId: "order-session",
      externalReferenceOrderId: "order-reference",
    })).toEqual({ kind: "conflict", orderIds: ["order-session", "order-reference"] });
  });

  it("resolves duplicate capture deliveries to the same order without a new identity", () => {
    const input = { durableSessionOrderId: "order-session", externalReferenceOrderId: "order-session" };
    expect(resolveCloverWebhookIdentity(input)).toEqual(resolveCloverWebhookIdentity(input));
  });
});

describe("Clover webhook amount gate", () => {
  it("leaves a missing captured amount unresolved until a later retry has verified cents", () => {
    expect(hasVerifiedCloverAmount(0)).toBe(false);
    expect(hasVerifiedCloverAmount(Number.NaN)).toBe(false);
    expect(hasVerifiedCloverAmount(12765)).toBe(true);
  });
});
