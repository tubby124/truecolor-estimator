export function paymentFollowupOutcome(failureCount: number): {
  ok: boolean;
  status: 200 | 503;
} {
  if (!Number.isInteger(failureCount) || failureCount < 0) {
    throw new Error("payment-followup failure count must be a non-negative integer");
  }
  return failureCount === 0
    ? { ok: true, status: 200 }
    : { ok: false, status: 503 };
}
