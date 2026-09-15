import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
vi.mock("../client", () => ({
  waveQuery: query,
  WAVE_BUSINESS_ID: "business",
  WAVE_GST_TAX_ID: "gst",
  WAVE_PST_TAX_ID: "pst",
  WAVE_PRINT_PRODUCT_ID: "print",
}));

import { getWaveOnlineInvoiceSnapshot } from "../invoice";

function invoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "invoice",
    invoiceNumber: "123",
    status: "SAVED",
    viewUrl: "https://invoice.waveapps.com/customer/token",
    customer: { email: "buyer@example.test" },
    currency: { code: "CAD" },
    total: { minorUnitValue: "11100" },
    amountDue: { minorUnitValue: "11100" },
    amountPaid: { minorUnitValue: "0" },
    taxTotal: { minorUnitValue: "1100" },
    disableCreditCardPayments: false,
    disableBankPayments: false,
    items: [{
      subtotal: { minorUnitValue: "10000" },
      taxes: [
        { salesTax: { id: "gst" }, amount: { minorUnitValue: "500" } },
        { salesTax: { id: "pst" }, amount: { minorUnitValue: "600" } },
      ],
    }],
    ...overrides,
  };
}

describe("Wave online invoice readback", () => {
  beforeEach(() => query.mockReset());

  it("reads exact financials, customer, URL and payment flags in one provider snapshot", async () => {
    query.mockResolvedValue({ business: { invoice: invoice() } });
    await expect(getWaveOnlineInvoiceSnapshot("invoice")).resolves.toMatchObject({
      id: "invoice",
      invoiceNumber: "123",
      viewUrl: "https://invoice.waveapps.com/customer/token",
      customerEmail: "buyer@example.test",
      subtotalCents: 10_000,
      gstCents: 500,
      pstCents: 600,
      totalCents: 11_100,
      amountDueCents: 11_100,
      amountPaidCents: 0,
      disableCreditCardPayments: false,
      disableBankPayments: false,
    });
    const graphql = String(query.mock.calls[0][0]);
    expect(graphql).toContain("viewUrl");
    expect(graphql).toContain("disableCreditCardPayments");
    expect(graphql).toContain("disableBankPayments");
    expect(graphql).toContain("minorUnitValue");
  });

  it.each([
    invoice({ currency: { code: "USD" } }),
    invoice({ customer: null }),
    invoice({ viewUrl: null }),
    invoice({ amountDue: { minorUnitValue: "11099" } }),
    invoice({ total: { minorUnitValue: "1,110.00" } }),
  ])("rejects incomplete, foreign, malformed or nonreconciling provider data", async (value) => {
    query.mockResolvedValue({ business: { invoice: value } });
    await expect(getWaveOnlineInvoiceSnapshot("invoice")).rejects.toThrow();
  });
});
