const PAID_LIFECYCLE_STATUSES = new Set([
  "payment_received",
  "in_production",
  "ready_for_pickup",
  "complete",
]);

export function shouldTrackConfirmedPurchase(input: {
  status: string | null | undefined;
  paidAt: string | null | undefined;
}): boolean {
  if (!input.status || !PAID_LIFECYCLE_STATUSES.has(input.status)) return false;
  if (!input.paidAt?.trim()) return false;
  return Number.isFinite(Date.parse(input.paidAt));
}
