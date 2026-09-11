import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * A partial Clover payment leaves orders.total untouched and the order in
 * pending_payment, so "what this link charges" has to be the remaining balance
 * everywhere — the gateway that accepts the link and every path that mints one.
 */
describe("pay link charges the remaining balance", () => {
  it("gates the gateway on the ledger balance instead of the raw order total", () => {
    const gateway = source("src/app/pay/[token]/page.tsx");

    expect(gateway).toContain("remainingBalanceCents(");
    expect(gateway).toContain("fetchOrderLedger(");
    expect(gateway).not.toContain("const dbAmountCents = Math.round(Number(orderCheck.total) * 100)");
  });

  it("keeps the gateway closed when the ledger read fails", () => {
    const gateway = source("src/app/pay/[token]/page.tsx");
    const guard = gateway.slice(
      gateway.indexOf("remainingBalanceCents("),
      gateway.indexOf("let createdSessionId"),
    );

    // An unreadable ledger must never fall through to a Clover session.
    expect(guard).toContain("return <ErrorPage />");
    expect(guard).toContain("catch (ledgerError)");
    expect(guard).toContain("return <UpdatedLinkPage />");
  });

  it("mints through the ledger-aware resolver on every staff and customer path", () => {
    for (const file of [
      "src/app/api/staff/orders/[id]/resend-payment/route.ts",
      "src/app/api/staff/orders/[id]/payment-link/route.ts",
      "src/app/api/staff/customers/[id]/assign-discount/route.ts",
      "src/app/order-confirmed/page.tsx",
      "src/app/payment/PaymentResult.tsx",
      "src/app/api/account/orders/route.ts",
      "src/app/staff/lifecycle/data.ts",
    ]) {
      const code = source(file);
      expect(code, `${file} must not mint a raw-total token`).not.toContain("encodePaymentToken(");
    }
  });

  it("keeps the staff copy endpoint read-only with respect to email", () => {
    const route = source("src/app/api/staff/orders/[id]/payment-link/route.ts");
    expect(route).not.toContain("sendPaymentRequestEmail");
    expect(route).not.toContain("sendEmail");
    expect(route).toContain("resolveOrderPayLink(");
  });
});
