import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ client: {} as unknown, mutation: vi.fn(), provider: vi.fn(), rates: { gstRate: .05, pstRate: .06 } }));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => mocks.client }));
vi.mock("@/lib/rateLimit", () => ({ rateLimit: () => true, getClientIp: () => "synthetic" }));
vi.mock("@/lib/pricing/canonical-rates", () => ({ getCanonicalTaxRates: () => mocks.rates }));
vi.mock("@/lib/payment/clover", () => ({ createCloverCheckout: mocks.provider, CloverCheckoutError: class extends Error {} }));
vi.mock("@/lib/payment/quote-wave", () => ({ provisionOrderWaveInvoice: mocks.provider, QuoteWaveProvisioningError: class extends Error {} }));
vi.mock("@/lib/email/orderConfirmation", () => ({ sendOrderConfirmationEmail: mocks.provider }));
vi.mock("@/lib/email/staffNotification", () => ({ sendStaffOrderNotification: mocks.provider }));
vi.mock("@/lib/analytics/metaCapi", () => ({ getMetaCapiRequestContext: () => ({}) }));
import { POST } from "../route";
const cartItem = { id: "cart", product_name: "Coroplast sign", product_slug: "coroplast-signs", category: "SIGN", label: "24x36", qty: 1, config: { category: "SIGN", material_code: "MPHCC020", width_in: 24, height_in: 36, sides: 1 }, sell_price: 48, gst_rate: .05 };
const base = { checkout_submission_id: "00000000-0000-4000-8000-000000000001", items: [cartItem], contact: { name: "Synthetic customer", email: "customer@example.test", address: "Synthetic", company: "Synthetic" }, marketing_consent: true, is_rush: false, payment_method: "clover_card", expectedTotalCents: 5328 };
let discount: { code: string; discount_amount: number; is_active: boolean; per_account_limit: number; max_uses: number | null; expires_at: string | null; id: string } | null;
function database() {
  const from = (table: string) => {
    const finish = async () => ({ data: table === "discount_codes" ? discount : null, error: null, count: 0 });
    const chain = {
      select: () => chain, eq: () => chain, ilike: () => chain,
      maybeSingle: finish, single: finish,
      insert: (...args: unknown[]) => { mocks.mutation(table, "insert", ...args); throw new Error("TEST_STOP_AFTER_PRICE_REVIEW"); },
      update: (...args: unknown[]) => { mocks.mutation(table, "update", ...args); throw new Error("TEST_STOP_AFTER_PRICE_REVIEW"); },
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => finish().then(resolve, reject),
    };
    return chain;
  };
  mocks.client = { from };
}
const post = (patch: Record<string, unknown> = {}) => POST(new NextRequest("https://example.test/orders", { method: "POST", body: JSON.stringify({ ...base, ...patch }) }));
beforeEach(() => { vi.clearAllMocks(); mocks.rates = { gstRate: .05, pstRate: .06 }; discount = null; database(); });
describe("checkout reviewed final charge", () => {
  it.each([5327, 5329, 100])("rejects changed final charge %s cents before ANY customer/order/provider writes", async (expectedTotalCents) => {
    const response = await post({ expectedTotalCents });
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ code: "STALE_CHECKOUT_PRICE" });
    expect(mocks.mutation).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
  });
  it.each([undefined, null, "5328", 5328.1, -1])("requires a valid reviewed cents snapshot %j", async (expectedTotalCents) => {
    expect((await post({ expectedTotalCents })).status).toBe(400); expect(mocks.mutation).not.toHaveBeenCalled();
  });
  it("rejects a stale catalogue item before creating even a customer profile", async () => {
    expect((await post({ items: [{ ...cartItem, sell_price: 40 }], expectedTotalCents: 4440 })).status).toBe(409);
    expect(mocks.mutation).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("rejects changed tax rates even if the item subtotal stayed the same", async () => {
    mocks.rates = { gstRate: .05, pstRate: .07 };
    expect((await post()).status).toBe(409); expect(mocks.mutation).not.toHaveBeenCalled();
  });
  it("rejects an expired/rejected coupon instead of silently charging the undiscounted amount", async () => {
    expect((await post({ discount_code: "EXPIRED", discount_amount: 10, expectedTotalCents: 4218 })).status).toBe(409);
    expect(mocks.mutation).not.toHaveBeenCalled();
  });
  it("compares after a validated discount, then the whole-order minimum and tax", async () => {
    discount = { id: "discount", code: "SYNTHETIC", discount_amount: 30, is_active: true, per_account_limit: 1, max_uses: null, expires_at: null };
    // 48 - 30 = 18, floor => 25, GST/PST => 27.75. Proceed only to
    // the intentionally stopped first customer write after a matching review.
    expect((await post({ discount_code: "SYNTHETIC", expectedTotalCents: 2775 })).status).toBe(500);
    expect(mocks.mutation).toHaveBeenCalledWith("customers", "insert", expect.anything());
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("allows an item difference absorbed by the minimum when the reviewed final amount is unchanged", async () => {
    const smallSign = { ...cartItem, config: { ...cartItem.config, width_in: 18, height_in: 24 }, sell_price: 20 };
    // Current item is 24, both old20 and new24 top up to25 =>27.75.
    expect((await post({ items: [smallSign], expectedTotalCents: 2775 })).status).toBe(500);
    expect(mocks.mutation).toHaveBeenCalledWith("customers", "insert", expect.anything());
  });
  it("retains the public rush confirmation block before any database writes", async () => {
    expect((await post({ is_rush: true })).status).toBe(409); expect(mocks.mutation).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
  });
});
