/**
 * Resolves the order identity carried by a Clover webhook after database
 * lookups have mapped each durable identifier to one internal order id.
 *
 * A checkout session is the strongest signal because it is unique on orders.
 * Reference and historical-attempt matches may corroborate it, but must never
 * redirect a payment to another order.
 */
export interface CloverWebhookIdentityInput {
  durableSessionOrderId?: string | null;
  externalReferenceOrderId?: string | null;
  cloverOrderReferenceOrderId?: string | null;
  historicalSessionOrderId?: string | null;
}

export type CloverWebhookIdentity =
  | { kind: "matched"; orderId: string; source: "durable_session" | "reference" | "historical_session" }
  | { kind: "unmatched" }
  | { kind: "conflict"; orderIds: string[] };

function normalizedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveCloverWebhookIdentity(input: CloverWebhookIdentityInput): CloverWebhookIdentity {
  const durableSessionOrderId = normalizedId(input.durableSessionOrderId);
  const externalReferenceOrderId = normalizedId(input.externalReferenceOrderId);
  const cloverOrderReferenceOrderId = normalizedId(input.cloverOrderReferenceOrderId);
  const historicalSessionOrderId = normalizedId(input.historicalSessionOrderId);
  const orderIds = [...new Set([
    durableSessionOrderId,
    externalReferenceOrderId,
    cloverOrderReferenceOrderId,
    historicalSessionOrderId,
  ].filter((value): value is string => value !== null))];

  if (orderIds.length > 1) return { kind: "conflict", orderIds };
  if (durableSessionOrderId) {
    return { kind: "matched", orderId: durableSessionOrderId, source: "durable_session" };
  }
  if (externalReferenceOrderId || cloverOrderReferenceOrderId) {
    return { kind: "matched", orderId: externalReferenceOrderId ?? cloverOrderReferenceOrderId!, source: "reference" };
  }
  if (historicalSessionOrderId) {
    return { kind: "matched", orderId: historicalSessionOrderId, source: "historical_session" };
  }
  return { kind: "unmatched" };
}

export function hasVerifiedCloverAmount(amountCents: number): boolean {
  return Number.isSafeInteger(amountCents) && amountCents > 0;
}
