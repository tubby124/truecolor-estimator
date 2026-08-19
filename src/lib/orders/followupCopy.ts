/**
 * Payment follow-up copy variants — one per ladder tier.
 *
 * T1 keeps the legacy recovery copy verbatim (branches on latest payment
 * attempt status). T2 opens the "need changes?" and "already paid?" doors.
 * T3 is the final reminder before the order is released.
 *
 * All strings are escaped by the caller (route) via escHtml at render.
 */

import type { PaymentAttemptStatus } from "@/lib/payments/attempts";
import type { FollowupTier } from "./followupLadder";

export interface LatestAttemptLite {
  order_id: string | null;
  status: PaymentAttemptStatus;
  failure_label: string | null;
  customer_message: string | null;
}

export interface FollowupCopyContext {
  orderNumber: string;
  firstName: string;
  paymentMethod: string | null;
  latestAttempt: LatestAttemptLite | null;
  /** Total order amount formatted "123.45" — shown when partially paid. */
  paidSoFar?: string | null;
  /** Remaining balance formatted "123.45" — required when paidSoFar is set. */
  balanceDue?: string | null;
}

export interface FollowupCopyResult {
  subject: string;
  headline: string;
  body: string;
  cta: string;
  foot: string;
}

const ETRANSFER_LINE =
  "Paying by e-Transfer? Send it to info@true-color.ca with your order number in the message.";

/** T1 — legacy recovery copy, unchanged behavior. */
function tier1Copy(ctx: FollowupCopyContext): FollowupCopyResult {
  const { orderNumber, paymentMethod, latestAttempt } = ctx;
  if (latestAttempt?.status === "card_declined") {
    const reason = latestAttempt.failure_label ?? "Payment did not complete";
    return {
      subject: `Card payment did not complete — ${orderNumber}`,
      headline: "Your card payment did not complete",
      body: `${reason}. You can try the card payment again, or send an e-Transfer instead.`,
      cta: "Try card again",
      foot: "If you prefer e-Transfer, send it to info@true-color.ca and include your order number in the message.",
    };
  }
  if (latestAttempt?.status === "abandoned" || latestAttempt?.status === "checkout_opened") {
    return {
      subject: `Finish payment for ${orderNumber}`,
      headline: "Your checkout did not finish",
      body: "Your order is saved, but payment has not been confirmed yet. Your card was not charged by the unfinished attempt.",
      cta: "Resume card payment",
      foot: "You can also pay by e-Transfer to info@true-color.ca. Please include your order number in the message.",
    };
  }
  if (paymentMethod === "etransfer") {
    return {
      subject: `e-Transfer reminder — ${orderNumber}`,
      headline: "Your order is waiting for e-Transfer",
      body: "Your order is saved. Send an e-Transfer when you are ready and we will confirm receipt before production.",
      cta: "Switch to card payment",
      foot: "Send e-Transfer to info@true-color.ca and include your order number in the message.",
    };
  }
  return {
    subject: `Your True Color order ${orderNumber} is waiting`,
    headline: "Your order is waiting",
    body: "Your order is saved and waiting for payment.",
    cta: "Complete payment",
    foot: "Paying by card? Click the button above — it only takes 30 seconds. Prefer e-Transfer? Send it to info@true-color.ca.",
  };
}

function partialLine(ctx: FollowupCopyContext): string {
  if (ctx.paidSoFar && ctx.balanceDue) {
    return ` You have paid $${ctx.paidSoFar} so far — the button below covers only the remaining $${ctx.balanceDue}.`;
  }
  return "";
}

/** T2 — 24h check-in: service frame, opens changes + already-paid doors. */
function tier2Copy(ctx: FollowupCopyContext): FollowupCopyResult {
  const partial = partialLine(ctx);
  return {
    subject: `Quick check on your order ${ctx.orderNumber}`,
    headline: `Any changes needed`,
    body: `Your order is saved and ready for production as soon as payment comes through. If the price, specs, or files need a change — reply to this email and we'll revise it. If everything looks right, the button below takes under a minute.${partial}`,
    cta: "Complete payment",
    foot: `${ETRANSFER_LINE} (${ctx.orderNumber}) Already sent payment? Reply "paid" and we'll confirm receipt the same day.`,
  };
}

/** T3 — final reminder, releases the slot. */
function tier3Copy(ctx: FollowupCopyContext): FollowupCopyResult {
  const partial = partialLine(ctx);
  return {
    subject: `Your order ${ctx.orderNumber} is on hold — payment needed`,
    headline: "Last reminder before we release your slot",
    body: `We're holding your order but haven't received payment yet. If you've already paid by e-Transfer or another way, reply with the confirmation and we'll mark it received immediately — no action needed. Otherwise, use the button below or send an e-Transfer to info@true-color.ca.${partial} If we don't hear from you in 7 days we'll close the order and you can re-order anytime.`,
    cta: "Pay now",
    foot: ETRANSFER_LINE,
  };
}

export function followupCopy(tier: FollowupTier, ctx: FollowupCopyContext): FollowupCopyResult | null {
  if (tier === 1) return tier1Copy(ctx);
  if (tier === 2) return tier2Copy(ctx);
  if (tier === 3) return tier3Copy(ctx);
  return null;
}
