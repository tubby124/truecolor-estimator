import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodePaymentToken } from "@/lib/payment/token";
import { remainingBalanceCents, type OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";
import { buildPayLink, resolveOrderPayLink } from "../payLink";

const SECRET = "test-payment-secret-that-is-long-enough";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const SITE = "https://truecolorprinting.ca";

type LedgerRow = { amount: number | string; method: string; status: string | null };

function clientFor(rows: LedgerRow[], error: { message: string } | null = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: error ? null : rows, error }),
      }),
    }),
  } as never;
}

function tokenFrom(url: string): string {
  return url.replace(`${SITE}/pay/`, "");
}

describe("ledger-aware pay links", () => {
  beforeEach(() => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET", SECRET);
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", "");
    vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", "");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("mints the remaining balance, not the order total, for a partially-paid order", async () => {
    // Postgres numerics can arrive as strings through supabase-js — the
    // resolver must coerce them, or a paid deposit would be ignored.
    const ledger: LedgerRow[] = [
      { amount: 100, method: "clover", status: "recorded" },
      { amount: "45.55", method: "etransfer", status: "recorded" },
    ];
    const resolved = await resolveOrderPayLink(clientFor(ledger), {
      orderId: ORDER_ID,
      orderNumber: "TC-1042",
      total: 245.55,
      customerEmail: "buyer@example.com",
      siteUrl: SITE,
    });

    const decoded = decodePaymentToken(tokenFrom(resolved.paymentUrl));
    // This is the exact comparison the /pay gateway makes.
    expect(decoded.amountCents).toBe(
      remainingBalanceCents(245.55, [
        { amount: 100, method: "clover", status: "recorded" },
        { amount: 45.55, method: "etransfer", status: "recorded" },
      ])
    );
    expect(decoded.amountCents).toBe(10000);
    expect(decoded.amountCents).not.toBe(Math.round(245.55 * 100));
    expect(decoded.orderId).toBe(ORDER_ID);
    expect(resolved.amountDue).toBe(100);
    expect(resolved.amountPaid).toBe(145.55);
  });

  it("mints the full total when nothing has been paid", async () => {
    const resolved = await resolveOrderPayLink(clientFor([]), {
      orderId: ORDER_ID,
      orderNumber: "TC-1043",
      total: 245.55,
      customerEmail: "buyer@example.com",
      siteUrl: SITE,
    });

    expect(decodePaymentToken(tokenFrom(resolved.paymentUrl)).amountCents).toBe(24555);
    expect(resolved.amountPaid).toBe(0);
  });

  it("throws instead of falling back to a full-total link when the ledger is unreadable", async () => {
    await expect(
      resolveOrderPayLink(clientFor([], { message: "ledger unavailable" }), {
        orderId: ORDER_ID,
        orderNumber: "TC-1044",
        total: 245.55,
        customerEmail: "buyer@example.com",
        siteUrl: SITE,
      })
    ).rejects.toThrow(/ledger/i);
  });

  it("keeps buildPayLink on the balance when callers pass a ledger", () => {
    const ledger: OrderPaymentLedgerEntry[] = [
      { amount: 200, method: "cash", status: "recorded" },
    ];
    const url = buildPayLink({
      orderId: ORDER_ID,
      orderNumber: "TC-1045",
      total: 245.55,
      customerEmail: "buyer@example.com",
      siteUrl: SITE,
      ledger,
    });
    expect(decodePaymentToken(tokenFrom(url)).amountCents).toBe(4555);
  });
});
