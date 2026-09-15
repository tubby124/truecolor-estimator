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

  it("routes /pay through the shared Wave resolver without Clover fallback", () => {
    const route = source("src/app/pay/[token]/page.tsx");
    expect(route).toContain("resolveWaveOnlineCheckout(");
    expect(route).toContain('checkout.action === "already_paid"');
    expect(route).toContain('checkout.action === "updated_link"');
    expect(route).not.toContain("createCloverCheckout(");
    expect(route).not.toContain("reserveOrderCheckout(");
  });

  it("releases only a fresh unused quote reservation and then resolves Wave", () => {
    const route = source("src/app/api/pay/quote/route.ts");
    const release = route.indexOf("releaseUnusedQuoteCheckoutReservation(");
    const resolve = route.indexOf("resolveWaveOnlineCheckout(");
    expect(release).toBeGreaterThan(0);
    expect(resolve).toBeGreaterThan(release);
    expect(route).toContain("failQuoteCheckoutReservation(");
    expect(route).not.toContain("createCloverCheckout(");
  });

  it("resolves every online /api/orders checkout through the same Wave path", () => {
    const route = source("src/app/api/orders/route.ts");
    const provision = route.indexOf("provisionOrderWaveInvoice(");
    const resolve = route.indexOf("resolveWaveOnlineCheckout(", provision);
    expect(provision).toBeGreaterThan(0);
    expect(resolve).toBeGreaterThan(provision);
    expect(route.slice(provision, resolve)).toContain('wave.action !== "ready"');
    expect(route).not.toContain("preflightWaveBeforeCloverCheckout(");
    expect(route).not.toContain("reserveOrderCheckout(");
    expect(route).not.toContain("createCloverCheckout(");
  });
});
