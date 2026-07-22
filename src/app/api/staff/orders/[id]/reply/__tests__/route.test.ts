import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  ledger: null as Record<string, unknown> | null,
  sendEmail: vi.fn(),
  audit: vi.fn(),
}));

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const REQUEST_ID = "33333333-3333-4333-8333-333333333333";
const REPLY_TOKEN = "0123456789abcdef0123456789abcdef";

vi.mock("@/lib/email/smtp", () => ({ sendEmail: harness.sendEmail }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: harness.audit }));
vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: async () => ({ id: "staff-1", email: "info@true-color.ca" }),
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: ORDER_ID,
                  order_number: "TC-1001",
                  customer_id: CUSTOMER_ID,
                  customers: { name: "Jamie", email: "jamie@example.com" },
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "order_reply_tokens") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { reply_token: REPLY_TOKEN }, error: null }),
            }),
          }),
        };
      }

      return {
        insert: (claim: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (harness.ledger) {
                return { data: null, error: { code: "23505", message: "duplicate" } };
              }
              harness.ledger = {
                id: "message-1",
                provider_message_id: null,
                created_at: new Date().toISOString(),
                ...claim,
              };
              return { data: harness.ledger, error: null };
            },
          }),
        }),
        select: () => ({
          eq: () => ({
            single: async () => ({ data: harness.ledger, error: null }),
          }),
        }),
        update: (updates: Record<string, unknown>) => {
          let allowedStatuses: string[] | undefined;
          const builder = {
            in: (_column: string, statuses: string[]) => {
              allowedStatuses = statuses;
              return builder;
            },
            eq: async () => {
              const currentStatus = String(harness.ledger?.status);
              if (
                harness.ledger &&
                (!allowedStatuses || allowedStatuses.includes(currentStatus))
              ) {
                Object.assign(harness.ledger, updates);
              }
              return { error: null };
            },
          };
          return builder;
        },
      };
    },
  }),
}));

import { POST } from "../route";

function request(overrides: Record<string, unknown> = {}): NextRequest {
  return new NextRequest(`http://localhost/api/staff/orders/${ORDER_ID}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: "Proof update",
      message: "Your proof is ready.",
      clientRequestId: REQUEST_ID,
      ...overrides,
    }),
  });
}

function post(req: NextRequest) {
  return POST(req, { params: Promise.resolve({ id: ORDER_ID }) });
}

describe("staff order reply exact-once tracking", () => {
  beforeEach(() => {
    harness.ledger = null;
    harness.sendEmail.mockReset();
    harness.audit.mockReset();
    harness.sendEmail.mockResolvedValue({ providerMessageId: "provider-1" });
    vi.stubEnv("ORDER_REPLY_TOKEN_ENABLED", "false");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stores explicit linkage and the provider id on success", async () => {
    vi.stubEnv("ORDER_REPLY_TOKEN_ENABLED", "true");
    const response = await post(request());

    expect(response.status).toBe(200);
    expect(harness.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        customerId: CUSTOMER_ID,
        replyTo: `info+o_${REPLY_TOKEN}@true-color.ca`,
        idempotencyKey: `order-message/${REQUEST_ID}`,
        tags: [{ name: "order_message_id", value: "message-1" }],
      })
    );
    expect(harness.ledger).toEqual(
      expect.objectContaining({
        order_id: ORDER_ID,
        customer_id: CUSTOMER_ID,
        status: "sent",
        provider_message_id: "provider-1",
      })
    );
    expect(harness.audit).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expect.objectContaining({ message_id: "message-1" }) })
    );
  });

  it("does not regress a webhook outcome that arrives before the provider response", async () => {
    harness.sendEmail.mockImplementationOnce(async () => {
      if (harness.ledger) harness.ledger.status = "delivered";
      return { providerMessageId: "provider-1" };
    });

    expect((await post(request())).status).toBe(200);
    expect(harness.ledger).toEqual(
      expect.objectContaining({
        status: "delivered",
        provider_message_id: "provider-1",
      })
    );
  });

  it("stores a safe failure and does not expose a provider rejection", async () => {
    harness.sendEmail.mockRejectedValueOnce(
      Object.assign(new Error("Resend API error: secret detail"), { outcome: "rejected" })
    );
    const response = await post(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).not.toContain("secret detail");
    expect(harness.ledger?.status).toBe("failed");
    expect(String(harness.ledger?.last_event_detail)).not.toContain("secret detail");
  });

  it("reuses the same provider idempotency key after an ambiguous timeout", async () => {
    harness.sendEmail
      .mockRejectedValueOnce(new Error("request timed out"))
      .mockResolvedValueOnce({ providerMessageId: "provider-1" });

    expect((await post(request())).status).toBe(502);
    expect(harness.ledger?.status).toBe("pending_confirmation");
    expect((await post(request())).status).toBe(200);
    expect(harness.sendEmail).toHaveBeenCalledTimes(2);
    expect(harness.sendEmail.mock.calls[0][0].idempotencyKey).toBe(
      harness.sendEmail.mock.calls[1][0].idempotencyKey
    );
    expect(harness.sendEmail.mock.calls[1][0].replyTo).toBe("info@true-color.ca");
  });

  it("blocks an ambiguous retry after the provider idempotency window", async () => {
    harness.sendEmail.mockRejectedValueOnce(new Error("request timed out"));

    expect((await post(request())).status).toBe(502);
    if (harness.ledger) {
      harness.ledger.created_at = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    const response = await post(request());
    expect(response.status).toBe(409);
    expect(harness.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("returns the existing success for a duplicate request without sending again", async () => {
    expect((await post(request())).status).toBe(200);
    const duplicate = await post(request());
    const body = await duplicate.json();

    expect(duplicate.status).toBe(200);
    expect(body.reused).toBe(true);
    expect(harness.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects a reused request id with a different payload", async () => {
    expect((await post(request())).status).toBe(200);
    const mismatch = await post(request({ subject: "Different subject" }));

    expect(mismatch.status).toBe(409);
    expect(harness.sendEmail).toHaveBeenCalledTimes(1);
  });
});
