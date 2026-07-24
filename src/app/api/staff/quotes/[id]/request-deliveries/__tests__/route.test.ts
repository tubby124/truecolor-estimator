import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const harness = vi.hoisted(() => ({
  rpc: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: async () => ({
    id: "staff-1",
    email: "info@true-color.ca",
  }),
  createServiceClient: () => ({ rpc: harness.rpc }),
}));

vi.mock("@/lib/audit/record", () => ({
  recordAuditEvent: harness.audit,
}));

import { GET, PATCH } from "../route";

const QUOTE_ID = "10000000-0000-4000-8000-000000000001";
const DELIVERY_ID = "20000000-0000-4000-8000-000000000002";
const params = { params: Promise.resolve({ id: QUOTE_ID }) };

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost/api/staff/quotes/${QUOTE_ID}/request-deliveries`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
}

describe("public quote request delivery reconciliation", () => {
  beforeEach(() => {
    harness.rpc.mockReset();
    harness.audit.mockReset();
  });

  it("lists the service-only delivery ledger for staff", async () => {
    harness.rpc.mockResolvedValueOnce({
      data: [
        {
          delivery_id: DELIVERY_ID,
          channel: "customer",
          delivery_status: "pending_confirmation",
        },
      ],
      error: null,
    });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/staff/quotes/${QUOTE_ID}/request-deliveries`,
      ),
      params,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      deliveries: [
        {
          delivery_id: DELIVERY_ID,
          delivery_status: "pending_confirmation",
        },
      ],
    });
    expect(harness.rpc).toHaveBeenCalledWith(
      "list_quote_request_deliveries",
      { p_quote_id: QUOTE_ID },
    );
  });

  it("confirms a provider-correlated send and writes an audit event", async () => {
    harness.rpc.mockResolvedValueOnce({
      data: [
        {
          delivery_status: "sent",
          delivery_channel: "customer",
        },
      ],
      error: null,
    });

    const response = await PATCH(
      patchRequest({
        deliveryId: DELIVERY_ID,
        resolution: "confirm_sent",
        providerMessageId: "resend_01J.provider-id",
      }),
      params,
    );

    expect(response.status).toBe(200);
    expect(harness.rpc).toHaveBeenCalledWith(
      "resolve_stale_quote_request_delivery",
      {
        p_quote_id: QUOTE_ID,
        p_delivery_id: DELIVERY_ID,
        p_resolution: "confirm_sent",
        p_provider_message_id: "resend_01J.provider-id",
        p_actor: "info@true-color.ca",
      },
    );
    expect(harness.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "quote.request_delivery_resolved",
        entity_id: QUOTE_ID,
        detail: expect.objectContaining({
          delivery_id: DELIVERY_ID,
          resolution: "confirm_sent",
          provider_message_id: "resend_01J.provider-id",
        }),
      }),
    );
  });

  it("confirms a stale delivery was not sent without accepting a provider id", async () => {
    harness.rpc.mockResolvedValueOnce({
      data: [
        {
          delivery_status: "failed",
          delivery_channel: "staff",
        },
      ],
      error: null,
    });

    const response = await PATCH(
      patchRequest({
        deliveryId: DELIVERY_ID,
        resolution: "confirm_not_sent",
      }),
      params,
    );

    expect(response.status).toBe(200);
    expect(harness.rpc).toHaveBeenCalledWith(
      "resolve_stale_quote_request_delivery",
      expect.objectContaining({
        p_resolution: "confirm_not_sent",
        p_provider_message_id: null,
      }),
    );
  });

  it.each([
    "provider id with spaces",
    "bad\nprovider",
    "x".repeat(301),
  ])("rejects an invalid provider message id: %j", async (providerMessageId) => {
    const response = await PATCH(
      patchRequest({
        deliveryId: DELIVERY_ID,
        resolution: "confirm_sent",
        providerMessageId,
      }),
      params,
    );

    expect(response.status).toBe(400);
    expect(harness.rpc).not.toHaveBeenCalled();
  });

  it("maps an early confirm_not_sent attempt to conflict", async () => {
    harness.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        message: "QUOTE_REQUEST_DELIVERY_RESOLUTION_NOT_STALE",
      },
    });

    const response = await PATCH(
      patchRequest({
        deliveryId: DELIVERY_ID,
        resolution: "confirm_not_sent",
      }),
      params,
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This delivery is still inside its provider retry window.",
    });
    expect(harness.audit).not.toHaveBeenCalled();
  });
});
