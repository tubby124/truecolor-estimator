import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const migration = source(
  "supabase/migrations/20260724150000_wave_payment_effect_outbox.sql",
);
const worker = source("src/lib/payment/wave-payment-effects.ts");

describe("Wave payment atomic outbox contract", () => {
  it("commits payment truth, exactly one ledger row, and all effects in one RPC", () => {
    const accept = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.accept_wave_paid_invoice"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.claim_wave_payment_effects"),
    );

    expect(accept).toContain("FOR UPDATE OF o");
    expect(accept).toContain("v_order.payment_method <> 'wave'");
    expect(accept).toContain("UPDATE public.orders");
    expect(accept).toContain("wave_payment_recorded_at = COALESCE");
    expect(accept.match(/INSERT INTO public\.order_payments/g)).toHaveLength(1);
    expect(accept).toContain("WHERE NOT EXISTS");
    expect(accept).toContain("ON CONFLICT DO NOTHING");
    expect(accept).toContain("WAVE_PAYMENT_LEDGER_CONFLICT");
    expect(accept).toContain("INSERT INTO public.wave_payment_effect_outbox");
    expect(accept).toContain(
      "ON CONFLICT ON CONSTRAINT wave_payment_effect_outbox_order_effect_uidx",
    );
    expect(accept).toContain("'already_processed'");
    expect(accept).toContain("'legacy_already_paid'");
    expect(migration).toContain("UNIQUE (order_id, effect_type)");
    expect(migration).toContain("order_payments_wave_invoice_once_uidx");
  });

  it("leases one job at a time and recovers stale processing claims", () => {
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("processing_started_at < now() - interval '10 minutes'");
    expect(migration).toContain("e.status = 'processing'");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.retry_wave_payment_effect");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.complete_wave_payment_effect");
  });

  it("keeps purchase revenue on the existing order trigger and external effects idempotent", () => {
    expect(migration).not.toContain("INSERT INTO public.google_ads_conversion_outbox");
    expect(worker).toContain("transaction_id: order.order_number");
    expect(worker).toContain("idempotencyKey: `wave-receipt/${order.id}`");
    expect(worker).toContain("updateEnabled: true");
  });
});
