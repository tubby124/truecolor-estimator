import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("quote Wave provisioning contract", () => {
  it("uses locked, service-role-only RPCs for every reservation transition", () => {
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");
    expect(migration.match(/FOR UPDATE;/g)).toHaveLength(4);
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.reserve_quote_wave_provisioning");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.complete_quote_wave_provisioning");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.fail_quote_wave_provisioning");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });

  it("treats only durably approved linkage as ready and concurrent or ambiguous creation as wait", () => {
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");
    const reserve = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.reserve_quote_wave_provisioning"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.reserve_order_checkout"),
    );
    expect(reserve).toContain("NULLIF(btrim(v_order.wave_invoice_id), '') IS NOT NULL");
    expect(reserve).toContain("v_order.wave_invoice_approved_at IS NOT NULL");
    expect(reserve).toContain("RETURN QUERY SELECT 'ready'::text");
    expect(reserve).toContain("Linked Wave invoice approval is not durably confirmed");
    expect(reserve).toContain("v_order.quote_wave_state IN ('creating', 'ambiguous')");
    expect(reserve).toContain("RETURN QUERY SELECT 'wait'::text");
    expect(reserve).not.toContain("v_order.quote_request_id IS NULL");
    expect(reserve).not.toContain("interval");
  });

  it("never downgrades an ambiguous external outcome to retryable failure", () => {
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");
    const failure = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.fail_quote_wave_provisioning"),
      migration.indexOf("ALTER TABLE public.orders VALIDATE CONSTRAINT"),
    );
    expect(failure).toContain("o.quote_wave_state = 'ambiguous' OR p_ambiguous");
    expect(failure).toContain("THEN 'ambiguous'");
  });

  it("gates both fresh and resumed Clover checkout on durable Wave readiness", () => {
    const route = source("src/app/api/pay/quote/route.ts");
    const materialize = route.indexOf("materializeQuoteOrder(");
    const provision = route.indexOf("provisionQuoteWaveInvoice(");
    const resume = route.indexOf('quoteOrder.checkoutAction === "resume"');
    const clover = route.indexOf("createCloverCheckout(");
    expect(materialize).toBeGreaterThan(0);
    expect(provision).toBeGreaterThan(materialize);
    expect(resume).toBeGreaterThan(provision);
    expect(clover).toBeGreaterThan(provision);
    expect(route.slice(provision, clover)).toContain('wave.action === "wait"');
    expect(route.slice(provision, clover)).toContain("failQuoteCheckoutReservation");
  });

  it("gates catalog checkout and retry links on the same durable Wave state", () => {
    const ordersRoute = source("src/app/api/orders/route.ts");
    const provision = ordersRoute.indexOf("provisionOrderWaveInvoice(");
    const clover = ordersRoute.indexOf("createCloverCheckout(");
    expect(provision).toBeGreaterThan(0);
    expect(clover).toBeGreaterThan(provision);
    expect(ordersRoute.slice(provision, clover)).toContain('wave.action !== "ready"');
    expect(ordersRoute.slice(provision, clover)).toContain("return NextResponse.json(");
    expect(ordersRoute).not.toContain("createWaveInvoice(");
    expect(ordersRoute).not.toContain("approveWaveInvoice(");

    const retryGateway = source("src/app/pay/[token]/page.tsx");
    const readiness = retryGateway.indexOf("hasDurablyApprovedWaveInvoice(orderCheck)");
    const retryClover = retryGateway.indexOf("createCloverCheckout(");
    expect(readiness).toBeGreaterThan(0);
    expect(retryClover).toBeGreaterThan(readiness);
    expect(retryGateway.slice(readiness, retryClover)).toContain("return <ErrorPage />");
    expect(retryGateway).toContain("if (!hasDurablyApprovedWaveInvoice(orderCheck))");
    expect(retryGateway).toContain("reserveOrderCheckout(supabase, orderId)");
    expect(retryGateway).not.toContain("redirectOrderId");
  });

  it("enforces ready-state linkage and approval with a validated database constraint", () => {
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");
    expect(migration).toContain("orders_quote_wave_ready_link_check");
    expect(migration).toContain("wave_invoice_approved_at IS NOT NULL");
    expect(migration).toContain("VALIDATE CONSTRAINT orders_quote_wave_ready_link_check");
  });

  it("also gates quote checkout completion in the database", () => {
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");
    const completion = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.complete_quote_checkout_reservation"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.complete_quote_wave_provisioning"),
    );
    expect(completion).toContain("o.quote_request_id IS NOT NULL");
    expect(completion).toContain("o.quote_wave_state = 'ready'");
    expect(completion).toContain("NULLIF(btrim(o.wave_invoice_id), '') IS NOT NULL");
    expect(completion).toContain("o.wave_invoice_approved_at IS NOT NULL");
  });

  it("routes manual-order payment emails through durable Wave provisioning", () => {
    const route = source("src/app/api/staff/manual-order/route.ts");
    expect(route).toContain("provisionOrderWaveInvoice(supabase, order.id");
    expect(route).toContain('wave.action !== "ready"');
    expect(route).toContain("No customer payment email was sent");
    expect(route).not.toContain("createWaveInvoice(");
  });
});
