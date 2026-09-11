/**
 * Ready-to-send copy for a staff member pasting a payment link into a text
 * message, Messenger, or a phone conversation follow-up.
 *
 * Built on the server so the exact text staff send is unit-testable, and so the
 * amount always states what the /pay link actually charges.
 */

import { BUSINESS_INFO } from "@/lib/business-info";

export interface PayLinkMessageInput {
  customerName: string;
  orderNumber: string;
  amountDue: number;
  orderTotal: number;
  paymentUrl: string;
}

export function buildPayLinkMessage(input: PayLinkMessageInput): string {
  const firstName = input.customerName.trim().split(/\s+/)[0] || "there";
  const amount = `$${input.amountDue.toFixed(2)} CAD`;
  const isPartial = input.amountDue < input.orderTotal;

  const amountPhrase = isPartial
    ? `${amount} remaining balance (of $${input.orderTotal.toFixed(2)})`
    : amount;

  return [
    `Hi ${firstName}, here's your secure payment link for order ${input.orderNumber} (${amountPhrase}):`,
    input.paymentUrl,
    ``,
    `True Color Display Printing`,
    BUSINESS_INFO.phone.display,
  ].join("\n");
}
