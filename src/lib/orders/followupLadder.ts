/**
 * Payment follow-up ladder — pure tier decision logic.
 *
 * Decides which follow-up touch (if any) an order is due for:
 *   T1 at 2h, T2 at 24h, T3 at 120h (5d) after order creation.
 *
 * Invariants:
 * - Backdated orders jump straight to their current tier (never queue 3 emails).
 * - Paid / paused / archived / non-pending orders are never chased.
 * - Ladder caps at 3 touches; beyond that is a human (staff) problem.
 */

export type FollowupTier = 1 | 2 | 3 | null;

export interface FollowupOrderLike {
  id: string;
  status: string;
  is_archived: boolean | null;
  paid_at: string | null;
  wave_payment_recorded_at: string | null;
  followup_count: number | null;
  followup_paused_at: string | null;
  created_at: string;
}

/** Hours after order creation at which each touch becomes due. */
export const TOUCH_SCHEDULE_HOURS = [2, 24, 120] as const; // T1 2h, T2 24h, T3 5d

export function nextFollowupTier(
  order: FollowupOrderLike,
  now: Date = new Date(),
): FollowupTier {
  if (order.status !== "pending_payment") return null;
  if (order.is_archived) return null;
  if (order.paid_at || order.wave_payment_recorded_at) return null;
  if (order.followup_paused_at) return null;

  const ageHours = (now.getTime() - new Date(order.created_at).getTime()) / 3_600_000;
  const sent = order.followup_count ?? 0;

  for (let i = TOUCH_SCHEDULE_HOURS.length - 1; i >= 0; i--) {
    const tier = (i + 1) as 1 | 2 | 3;
    if (sent < tier && ageHours >= TOUCH_SCHEDULE_HOURS[i]) return tier;
  }
  return null; // not due, or ladder complete (staff escalation handles those)
}
