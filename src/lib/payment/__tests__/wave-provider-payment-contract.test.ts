import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260915141000_wave_provider_payment_recovery.sql"),
  "utf8",
);

describe("verified Wave provider payment SQL contract", () => {
  it("retains provider invoice identity before approval and permits only same-identity completion", () => {
    const provisional = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.record_quote_wave_provisional"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.complete_quote_wave_provisioning"),
    );
    const completion = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.complete_quote_wave_provisioning"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.accept_wave_provider_payment"),
    );
    expect(provisional).toContain("wave_invoice_id = p_wave_invoice_id");
    expect(provisional).toContain("quote_wave_state = 'ambiguous'");
    expect(provisional).toContain("quote_wave_reservation_id = p_reservation_id");
    expect(completion).toContain("v_order.wave_invoice_id <> p_wave_invoice_id");
    expect(completion).toContain("v_order.quote_wave_state NOT IN ('creating', 'ambiguous')");
  });

  it("requires exact customer Wave Payments evidence while preserving source method", () => {
    const accept = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.accept_wave_provider_payment"),
      migration.indexOf("REVOKE ALL ON FUNCTION public.record_quote_wave_provisional"),
    );
    expect(accept).toContain("p_origin IS DISTINCT FROM 'CUSTOMER'");
    expect(accept).toContain("p_state IS DISTINCT FROM 'PAID'");
    expect(accept).toContain("p_payment_provider IS DISTINCT FROM 'WPP'");
    expect(accept).toContain("p_transaction_type IS DISTINCT FROM 'SALE'");
    expect(accept).not.toContain("v_order.payment_method <> 'wave'");
    expect(accept).toContain("'source_payment_method', v_order.payment_method");
    expect(accept).toContain("'wave_payments'::text");
  });

  it("keys the ledger globally by provider payment and handles partial/full/overpayment atomically", () => {
    expect(migration).toContain("order_payments_wave_provider_reference_uidx");
    expect(migration).toContain("FOR UPDATE OF o");
    expect(migration).toContain("FOR UPDATE;");
    expect(migration).toContain("round(sum(p.amount::numeric) * 100)::bigint");
    expect(migration).toContain("v_amount_paid_cents < v_order_total_cents THEN 'partial'");
    expect(migration).toContain("v_amount_paid_cents > v_order_total_cents THEN 'overpaid'");
    expect(migration).toContain("WHEN v_transitioned THEN 'transitioned'");
    expect(migration).toContain("'ledger_conflict'::text");
    expect(migration).toContain("p.metadata ->> 'source' = 'invoice.paid'");
    const fullStamp = migration.indexOf("wave_payment_recorded_at = COALESCE");
    const fullGuard = migration.indexOf("IF v_amount_paid_cents >= v_order_total_cents");
    expect(fullStamp).toBeGreaterThan(fullGuard);
    expect(migration).toContain("v_order.voided_at IS NOT NULL");
    expect(migration).toContain("COALESCE(v_order.is_archived, false)");
  });

  it("suppresses customer effects by default and adds a provider-labelled staff effect", () => {
    expect(migration).toContain("p_enqueue_customer_effects boolean DEFAULT false");
    expect(migration).toContain("p_enqueue_staff_effect boolean DEFAULT false");
    expect(migration).toContain("VALUES (v_order.id, 'staff_paid')");
    expect(migration).toContain("VALUES ('receipt'::text), ('ga4_purchase'::text), ('brevo_payment_date'::text)");
    expect(migration).toContain("wave_payment_effect_outbox_order_effect_uidx");
  });
});
