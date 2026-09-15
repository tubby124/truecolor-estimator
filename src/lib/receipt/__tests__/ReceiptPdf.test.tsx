import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { ReceiptPdf, type ReceiptPdfData } from "../ReceiptPdf";

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (!isValidElement<{ children?: ReactNode }>(node)) return "";
  return textContent(node.props.children);
}

const BASE: ReceiptPdfData = {
  orderNumber: "TC-TEST",
  orderDate: "September 15, 2026",
  status: "payment_received",
  customerName: "Test Customer",
  customerEmail: "customer@example.test",
  customerCompany: null,
  paymentSources: ["recorded"],
  paymentPending: false,
  items: [],
  subtotal: 100,
  gst: 5,
  pst: 6,
  total: 111,
  isRush: false,
  rushFee: 0,
  discountCode: null,
  discountAmount: null,
};

describe("ReceiptPdf", () => {
  it("shows every actual provider on a mixed-payment receipt", () => {
    const document = ReceiptPdf({
      data: { ...BASE, paymentSources: ["wave", "clover", "etransfer"] },
    });

    expect(textContent(document)).toContain(
      "Wave Payments + Credit / debit card (Clover) + Interac e-Transfer",
    );
  });

  it("shows a truthful generic label when provider evidence is unavailable", () => {
    const document = ReceiptPdf({ data: BASE });
    expect(textContent(document)).toContain("Recorded payment");
  });

  it("shows payment pending for an unpaid summary without ledger evidence", () => {
    const document = ReceiptPdf({
      data: { ...BASE, status: "pending_payment", paymentPending: true },
    });
    expect(textContent(document)).toContain("Payment pending");
  });
});
