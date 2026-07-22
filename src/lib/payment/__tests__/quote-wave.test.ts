import { beforeEach, describe, expect, it, vi } from "vitest";

const wave = vi.hoisted(() => ({
  approveWaveInvoice: vi.fn(),
  createOrFindWaveCustomer: vi.fn(),
  createWaveInvoice: vi.fn(),
}));

vi.mock("@/lib/wave/invoice", () => wave);

import {
  provisionOrderWaveInvoice,
  provisionQuoteWaveInvoice,
  QuoteWaveProvisioningError,
  storedOrderItemToWaveLine,
} from "../quote-wave";

const orderId = "22222222-2222-4222-8222-222222222222";
const reservationId = "33333333-3333-4333-8333-333333333333";

function clientFor(input: {
  action: "ready" | "create" | "wait";
  invoiceId?: string | null;
  order?: Record<string, unknown> | null;
  orderError?: { message: string } | null;
}) {
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    if (name === "reserve_quote_wave_provisioning") {
      return {
        data: [{
          wave_action: input.action,
          wave_reservation_id: input.action === "create" ? reservationId : null,
          linked_wave_invoice_id: input.invoiceId ?? null,
        }],
        error: null,
      };
    }
    if (name === "complete_quote_wave_provisioning") return { data: true, error: null };
    if (name === "fail_quote_wave_provisioning") return { data: true, error: null };
    throw new Error(`Unexpected RPC ${name}: ${JSON.stringify(args)}`);
  });
  const single = vi.fn().mockResolvedValue({
    data: input.order ?? null,
    error: input.orderError ?? null,
  });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { rpc, from } as never, rpc, from };
}

const storedOrder = {
  id: orderId,
  order_number: "TC-2026-0123",
  subtotal: 100,
  quote_request_id: "11111111-1111-4111-8111-111111111111",
  customers: { name: "Test Customer", email: "TEST@example.com" },
  order_items: [{
    product_name: "Design and printed banner",
    qty: 2,
    unit_price: 50,
    line_total: 100,
    category: "SERVICE",
    line_items_json: { taxClass: "design_service" },
  }],
};

describe("quote Wave provisioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wave.createOrFindWaveCustomer.mockResolvedValue("wave-customer");
    wave.createWaveInvoice.mockResolvedValue({
      invoiceId: "wave-invoice",
      invoiceNumber: "1234",
      pdfUrl: null,
      viewUrl: null,
    });
    wave.approveWaveInvoice.mockResolvedValue(undefined);
  });

  it("returns an existing linked invoice as ready without another Wave call", async () => {
    const { client, from } = clientFor({ action: "ready", invoiceId: "existing-invoice" });

    await expect(provisionQuoteWaveInvoice(client, orderId)).resolves.toEqual({
      action: "ready",
      invoiceId: "existing-invoice",
    });
    expect(from).not.toHaveBeenCalled();
    expect(wave.createWaveInvoice).not.toHaveBeenCalled();
  });

  it("returns wait without touching Wave when another creator owns the reservation", async () => {
    const { client, from } = clientFor({ action: "wait" });

    await expect(provisionQuoteWaveInvoice(client, orderId)).resolves.toEqual({
      action: "wait",
      invoiceId: null,
    });
    expect(from).not.toHaveBeenCalled();
    expect(wave.createOrFindWaveCustomer).not.toHaveBeenCalled();
  });

  it("creates, approves, then durably links the invoice for the reservation owner", async () => {
    const { client, rpc } = clientFor({ action: "create", order: storedOrder });

    await expect(provisionQuoteWaveInvoice(client, orderId)).resolves.toEqual({
      action: "ready",
      invoiceId: "wave-invoice",
    });
    expect(wave.createOrFindWaveCustomer).toHaveBeenCalledWith("test@example.com", "Test Customer");
    expect(wave.createWaveInvoice).toHaveBeenCalledWith("wave-customer", [{
      description: "Design and printed banner",
      qty: 2,
      unitPrice: 50,
      applyGst: true,
      applyPst: true,
    }], { orderNumber: "TC-2026-0123", isRush: false });
    expect(wave.approveWaveInvoice).toHaveBeenCalledWith("wave-invoice");
    expect(rpc).toHaveBeenCalledWith("complete_quote_wave_provisioning", {
      p_order_id: orderId,
      p_reservation_id: reservationId,
      p_wave_invoice_id: "wave-invoice",
      p_wave_invoice_number: "1234",
    });
    expect(wave.createWaveInvoice.mock.invocationCallOrder[0])
      .toBeLessThan(wave.approveWaveInvoice.mock.invocationCallOrder[0]);
    expect(wave.approveWaveInvoice.mock.invocationCallOrder[0])
      .toBeLessThan(rpc.mock.invocationCallOrder.at(-1) ?? 0);
  });

  it("marks failures after a Wave call starts ambiguous so they cannot auto-retry", async () => {
    const { client, rpc } = clientFor({ action: "create", order: storedOrder });
    wave.createWaveInvoice.mockRejectedValueOnce(new Error("Wave response was lost"));

    await expect(provisionQuoteWaveInvoice(client, orderId)).rejects.toMatchObject({
      name: "QuoteWaveProvisioningError",
      ambiguous: true,
    } satisfies Partial<QuoteWaveProvisioningError>);
    expect(rpc).toHaveBeenCalledWith("fail_quote_wave_provisioning", expect.objectContaining({
      p_order_id: orderId,
      p_reservation_id: reservationId,
      p_ambiguous: true,
    }));
  });

  it("marks stored-data failures retryable because no Wave call occurred", async () => {
    const { client, rpc } = clientFor({
      action: "create",
      orderError: { message: "database unavailable" },
    });

    await expect(provisionQuoteWaveInvoice(client, orderId)).rejects.toMatchObject({
      name: "QuoteWaveProvisioningError",
      ambiguous: false,
    } satisfies Partial<QuoteWaveProvisioningError>);
    expect(wave.createOrFindWaveCustomer).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("fail_quote_wave_provisioning", expect.objectContaining({
      p_ambiguous: false,
    }));
  });

  it("provisions a normal catalog order from the server-authoritative plan", async () => {
    const { client, from } = clientFor({ action: "create" });

    await expect(provisionOrderWaveInvoice(client, orderId, {
      orderNumber: "TC-2026-0200",
      customerEmail: "buyer@example.com",
      customerName: "Buyer",
      waveItems: [{
        description: "Coroplast signs",
        qty: 2,
        unitPrice: 25,
        applyGst: true,
        applyPst: true,
      }],
      isRush: true,
    })).resolves.toEqual({ action: "ready", invoiceId: "wave-invoice" });

    expect(from).not.toHaveBeenCalled();
    expect(wave.createWaveInvoice).toHaveBeenCalledWith("wave-customer", [{
      description: "Coroplast signs",
      qty: 2,
      unitPrice: 25,
      applyGst: true,
      applyPst: true,
    }], { orderNumber: "TC-2026-0200", isRush: true });
  });

  it("reconstructs discount and rush lines when a catalog order resumes provisioning", async () => {
    const { client } = clientFor({
      action: "create",
      order: {
        id: orderId,
        order_number: "TC-2026-0201",
        subtotal: 45,
        quote_request_id: null,
        is_rush: true,
        discount_code: "SAVE5",
        discount_amount: 5,
        customers: { name: "Buyer", email: "buyer@example.com" },
        order_items: [{
          product_name: "Coroplast signs",
          qty: 2,
          unit_price: 25,
          line_total: 50,
          category: "COROPLAST",
          line_items_json: null,
        }],
      },
    });

    await provisionOrderWaveInvoice(client, orderId);

    expect(wave.createWaveInvoice).toHaveBeenCalledWith("wave-customer", [
      expect.objectContaining({ description: "Coroplast signs", unitPrice: 25, qty: 2 }),
      expect.objectContaining({ description: "Discount (SAVE5)", unitPrice: -5, qty: 1 }),
    ], { orderNumber: "TC-2026-0201", isRush: true });
  });

  it("uses all-line PST for every persisted structured quote tax class", () => {
    for (const taxClass of ["printed_good", "design_service", "rush_service", "installation_service"]) {
      expect(storedOrderItemToWaveLine({
        product_name: taxClass,
        qty: 1,
        unit_price: 10,
        line_total: 10,
        category: "SERVICE",
        line_items_json: [{ taxClass }],
      })).toMatchObject({ applyGst: true, applyPst: true });
    }
  });
});
