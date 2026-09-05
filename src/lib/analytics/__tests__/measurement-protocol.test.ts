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
      value: 100,
      tax: 11,
      customer_id: "customer-123",
      ga_client_id: "1234567890.1234567890",
      ga_session_id: "1234567890",
      ga_session_number: "2",
      ga_context_captured_at: new Date().toISOString(),
      payment_type: "etransfer",
      items: [{ item_id: "sign", item_name: "Coroplast Sign", price: 50, quantity: 2 }],
    })).resolves.toBe(true);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.client_id).toBe("1234567890.1234567890");
    expect(body.user_id).toBeUndefined();
    expect(body.events).toEqual([{
      name: "purchase",
      params: {
        transaction_id: "order-123",
        value: 100,
        tax: 11,
        currency: "CAD",
        payment_type: "etransfer",
        session_id: "1234567890",
        session_number: "2",
        engagement_time_msec: 1,
        items: [{ item_id: "sign", item_name: "Coroplast Sign", price: 50, quantity: 2 }],
      },
    }]);
  });

  it("intentionally omits purchases without a browser-issued GA context", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "test-secret");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(sendMeasurementProtocolPurchase({
      transaction_id: "order-legacy",
      value: 111,
      customer_id: "customer-123",
    })).resolves.toBe(true);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bounds a stalled provider request and returns failure without exposing its URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "test-secret");
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("request URL contained test-secret"));
    await expect(sendMeasurementProtocolPurchase({
      transaction_id: "order-failure", value: 100, ga_client_id: "123.456",
    })).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("test-secret");
  });
});
