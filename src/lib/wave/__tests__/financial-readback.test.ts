import { beforeEach, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("../client", () => ({ waveQuery: query, WAVE_BUSINESS_ID: "business", WAVE_GST_TAX_ID: "gst", WAVE_PST_TAX_ID: "pst", WAVE_PRINT_PRODUCT_ID: "print" }));
import { getWaveInvoiceFinancials } from "../invoice";
const invoice = () => ({ id: "invoice", currency: { code: "CAD" }, total: { value: "111.00" }, taxTotal: { value: "11.00" }, items: [{ subtotal: { value: "100.0000" }, taxes: [{ salesTax: { id: "gst" }, amount: { value: "5.00" } }, { salesTax: { id: "pst" }, amount: { value: "6.00" } }] }] });
beforeEach(() => query.mockReset());
it("reads actual provider subtotal and both named taxes, permitting trailing decimal zeros", async () => {
  query.mockResolvedValue({ business: { invoice: invoice() } });
  expect(await getWaveInvoiceFinancials("invoice")).toEqual({ subtotalCents: 10000, gstCents: 500, pstCents: 600, totalCents: 11100 });
});
it("rejects missing invoice, foreign currency, unknown taxes and nonreconciling totals", async () => {
  for (const value of [null, { ...invoice(), currency: { code: "USD" } }, { ...invoice(), total: { value: "110.99" } }, { ...invoice(), items: [{ subtotal: { value: "100" }, taxes: [{ salesTax: { id: "unknown" }, amount: { value: "11" } }] }] }]) {
    query.mockResolvedValue({ business: { invoice: value } });
    await expect(getWaveInvoiceFinancials("invoice")).rejects.toThrow();
  }
});
