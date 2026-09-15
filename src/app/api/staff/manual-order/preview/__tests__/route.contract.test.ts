import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  path.join(process.cwd(), "src/app/api/staff/manual-order/preview/route.ts"),
  "utf8",
);

describe("manual payment email preview contract", () => {
  it("is staff-gated and has no order, Wave, token, or email side effect", () => {
    expect(route).toContain("requireStaffUser()");
    expect(route).toContain("buildPaymentRequestEmail");
    expect(route).toContain('paymentUrl: "#preview-payment-link"');
    expect(route).not.toContain("sendEmail(");
    expect(route).not.toContain("provisionOrderWaveInvoice");
    expect(route).not.toContain("encodePaymentToken");
    expect(route).not.toContain('.from("orders")');
  });
});
