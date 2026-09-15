import { beforeEach, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("../client", () => ({ waveQuery: query, WAVE_BUSINESS_ID: "business", WAVE_GST_TAX_ID: "gst", WAVE_PST_TAX_ID: "pst", WAVE_PRINT_PRODUCT_ID: "print" }));
import { getWaveInvoiceFinancials } from "../invoice";
const invoice = () => ({ id: "invoice", currency: { code: "CAD" }, total: { minorUnitValue: "11100" }, taxTotal: { minorUnitValue: "1100" }, items: [{ subtotal: { minorUnitValue: "10000" }, taxes: [{ salesTax: { id: "gst" }, amount: { minorUnitValue: "500" } }, { salesTax: { id: "pst" }, amount: { minorUnitValue: "600" } }] }] });
beforeEach(() => query.mockReset());
it("reads exact high-value provider cents without parsing formatted Money.value", async () => {
  query.mockResolvedValue({ business: { invoice: invoice() } });
  expect(await getWaveInvoiceFinancials("invoice")).toEqual({ subtotalCents: 10000, gstCents: 500, pstCents: 600, totalCents: 11100 });
  const graphql = String(query.mock.calls[0][0]);
  expect(graphql).toContain("minorUnitValue");
  expect(graphql).not.toMatch(/\{\s*value\s*\}/);

  query.mockResolvedValue({ business: { invoice: {
    ...invoice(),
    total: { minorUnitValue: "135975" },
    taxTotal: { minorUnitValue: "13475" },
    items: [{ subtotal: { minorUnitValue: "122500" }, taxes: [
      { salesTax: { id: "gst" }, amount: { minorUnitValue: "6125" } },
      { salesTax: { id: "pst" }, amount: { minorUnitValue: "7350" } },
    ] }],
  } } });
  expect(await getWaveInvoiceFinancials("invoice")).toEqual({ subtotalCents: 122500, gstCents: 6125, pstCents: 7350, totalCents: 135975 });
});
it("rejects missing invoice, foreign currency, unknown taxes and nonreconciling totals", async () => {
  for (const value of [null, { ...invoice(), currency: { code: "USD" } }, { ...invoice(), total: { minorUnitValue: "11099" } }, { ...invoice(), items: [{ subtotal: { minorUnitValue: "10000" }, taxes: [{ salesTax: { id: "unknown" }, amount: { minorUnitValue: "1100" } }] }] }]) {
    query.mockResolvedValue({ business: { invoice: value } });
    await expect(getWaveInvoiceFinancials("invoice")).rejects.toThrow();
  }
});

it.each(["1,225.00", "122500.1", "1e3", "", "9007199254740992"])(
  "rejects malformed, fractional, or unsafe minor units: %s",
  async (minorUnitValue) => {
    query.mockResolvedValue({ business: { invoice: { ...invoice(), total: { minorUnitValue } } } });
    await expect(getWaveInvoiceFinancials("invoice")).rejects.toThrow();
  },
);
