import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMeasurementProtocolPurchase } from "@/lib/analytics/measurementProtocol";

describe("GA4 Measurement Protocol purchase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends an order-id transaction in CAD with available item data", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "test-secret");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(sendMeasurementProtocolPurchase({
      transaction_id: "order-123",
      value: 111,
      customer_id: "customer-123",
      payment_type: "etransfer",
      items: [{ item_id: "sign", item_name: "Coroplast Sign", price: 50, quantity: 2 }],
    })).resolves.toBe(true);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.events).toEqual([{
      name: "purchase",
      params: {
        transaction_id: "order-123",
        value: 111,
        currency: "CAD",
        payment_type: "etransfer",
        items: [{ item_id: "sign", item_name: "Coroplast Sign", price: 50, quantity: 2 }],
      },
    }]);
    expect(body.user_id).toBe("customer-123");
  });
});
