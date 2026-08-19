/**
 * Pure Clover capture↔order match selection, extracted from
 * reconcile-payments check 3 so the ambiguity rules are unit-testable.
 *
 * Safety rules (unchanged from the inline original):
 * - Exact cents match only.
 * - Payment must postdate order creation (−5 min clock skew).
 * - A "strong" match (order number or UUID appears in the Clover order
 *   payload) wins when exactly one strong match exists.
 * - Otherwise a single amount match is acceptable ONLY if the pending
 *   queue contains no other order with the same total.
 * - Anything else → ambiguous → staff, never auto-flip.
 */

export interface MatchCandidate {
  id: string;
  amountCents: number;
  paidMs: number;
  strong: boolean;
}

export interface MatchOrder {
  orderNumber: string;
  orderId: string;
  totalCents: number;
  createdMs: number;
}

export interface MatchSelection {
  paymentId: string;
  reason: "order_number_or_uuid" | "unique_amount_after_checkout";
}

const CLOCK_SKEW_MS = 5 * 60 * 1000;

export function selectCloverMatch(
  order: MatchOrder,
  candidates: MatchCandidate[],
  sameAmountPendingCount: number,
): MatchSelection | null {
  const amountMatches = candidates.filter(
    (p) =>
      p.amountCents === order.totalCents &&
      p.paidMs >= order.createdMs - CLOCK_SKEW_MS,
  );

  const strongMatches = amountMatches.filter((p) => p.strong);
  if (strongMatches.length === 1) {
    return { paymentId: strongMatches[0].id, reason: "order_number_or_uuid" };
  }
  if (amountMatches.length === 1 && sameAmountPendingCount === 1) {
    return { paymentId: amountMatches[0].id, reason: "unique_amount_after_checkout" };
  }
  return null;
}

/** Human-readable match detail for attempt rows / digest lines. */
export function describeMatchPool(amountMatchCount: number): string {
  return amountMatchCount === 0
    ? "no successful matching Clover payment found"
    : `ambiguous Clover payment match (${amountMatchCount} amount match${amountMatchCount === 1 ? "" : "es"})`;
}
