import type { FollowupTier } from "@/lib/orders/followupLadder";

export function paymentFollowupOrderKey(tier: FollowupTier, orderId: string): string {
  return `payment-followup/t${tier}/${orderId}`;
}

export function paymentFollowupSessionKey(sessionId: string): string {
  return `payment-followup/tc9/${sessionId}`;
}
