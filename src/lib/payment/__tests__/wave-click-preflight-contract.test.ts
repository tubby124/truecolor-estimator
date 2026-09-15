import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("existing-order Wave click-time checkout contract", () => {
  it("reconciles authenticated Wave payment evidence atomically and ignores manual copies", () => {
    const preflight = source("src/lib/payment/wave-click-preflight.ts");

    expect(preflight).toContain("reconcileWaveInvoicePayments(");
    expect(preflight).toContain("customerEffectMaxAgeMs: LIVE_WAVE_CUSTOMER_EFFECT_MAX_AGE_MS");
    expect(preflight).toContain("enqueueStaffEffect: true");
    expect(preflight).toContain("await fetchOrderLedger");
    expect(preflight).toContain("Wave provider payment acceptance did not complete");
  });

  it("gates both /pay resume/create paths before Clover reservation", () => {
    const route = source("src/app/pay/[token]/page.tsx");
    const preflight = route.indexOf("preflightWaveBeforeCloverCheckout(");
    const reserve = route.indexOf("reserveOrderCheckout(");
    const clover = route.indexOf("createCloverCheckout(");

    expect(preflight).toBeGreaterThan(0);
    expect(reserve).toBeGreaterThan(preflight);
    expect(clover).toBeGreaterThan(preflight);
    expect(route.slice(preflight, reserve)).toContain("return <AlreadyPaidPage />");
    expect(route.slice(preflight, reserve)).toContain("return <UpdatedLinkPage />");
    expect(route.slice(preflight, reserve)).toContain("return <ErrorPage />");
  });

  it("gates quote resume/create and releases a created reservation when Wave blocks checkout", () => {
    const route = source("src/app/api/pay/quote/route.ts");
    const preflight = route.indexOf("preflightWaveBeforeCloverCheckout(");
    const resume = route.indexOf("quoteOrder.checkoutAction === \"resume\"");
    const clover = route.indexOf("createCloverCheckout(");

    expect(preflight).toBeGreaterThan(0);
    expect(resume).toBeGreaterThan(preflight);
    expect(clover).toBeGreaterThan(preflight);
    expect(route.slice(preflight, resume)).toContain("releaseQuoteCheckoutForWavePreflight(");
    expect(route).toContain("failQuoteCheckoutReservation(");
  });

  it("gates only resumed /api/orders checkout before Clover reservation", () => {
    const route = source("src/app/api/orders/route.ts");
    const resumed = route.indexOf("if (resumedOrder && payment_method === \"clover_card\")");
    const preflight = route.indexOf("preflightWaveBeforeCloverCheckout(", resumed);
    const reserve = route.indexOf("reserveOrderCheckout(", preflight);
    const clover = route.indexOf("createCloverCheckout(", preflight);

    expect(resumed).toBeGreaterThan(0);
    expect(preflight).toBeGreaterThan(resumed);
    expect(reserve).toBeGreaterThan(preflight);
    expect(clover).toBeGreaterThan(preflight);
    expect(route.slice(preflight, reserve)).toContain("No payment was started.");
    expect(route).toContain("createCloverCheckout(totalCents, description, contact.email, redirectUrl, order.id)");
    expect(route.match(/preflightWaveBeforeCloverCheckout\(/g)).toHaveLength(1);
  });
});
