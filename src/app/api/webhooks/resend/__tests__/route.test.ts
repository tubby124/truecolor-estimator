import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  states: {
    email_log: { status: "sent" } as Record<string, unknown>,
    order_messages: { status: "sent" } as Record<string, unknown>,
  },
  eqCalls: [] as Array<{ table: string; column: string; value: string }>,
  rpcCalls: [] as Array<{ name: string; args: Record<string, unknown> }>,
  rpcErrors: {} as Record<string, string>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: "email_log" | "order_messages") => ({
      update: (updates: Record<string, unknown>) => {
        let allowedStatuses: string[] | undefined;
        const builder: Record<string, unknown> & PromiseLike<{ error: null }> = {
          eq: (column: string, value: string) => {
            harness.eqCalls.push({ table, column, value });
            return builder;
          },
          in: (_column: string, statuses: string[]) => {
            allowedStatuses = statuses;
            return builder;
          },
          then: (resolve, reject) => {
            const currentStatus = String(harness.states[table].status);
            if (!allowedStatuses || allowedStatuses.includes(currentStatus)) {
              Object.assign(harness.states[table], updates);
            }
            return Promise.resolve({ error: null }).then(resolve, reject);
          },
        };
        return builder;
      },
    }),
    rpc: async (name: string, args: Record<string, unknown>) => {
      harness.rpcCalls.push({ name, args });
      return {
        data: null,
        error: harness.rpcErrors[name]
          ? { message: harness.rpcErrors[name] }
          : null,
      };
    },
  }),
}));

import { mapEventUpdates, POST } from "../route";

const RAW_SECRET = "webhook-test-secret";
const WEBHOOK_SECRET = `whsec_${Buffer.from(RAW_SECRET).toString("base64")}`;

function signedRequest(event: Record<string, unknown>, svixId: string): NextRequest {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", Buffer.from(RAW_SECRET))
    .update(`${svixId}.${timestamp}.${body}`)
    .digest("base64");

  return new NextRequest("http://localhost/api/webhooks/resend", {
    method: "POST",
    headers: {
      "svix-id": svixId,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
    },
    body,
  });
}

describe("Resend webhook order message tracking", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", WEBHOOK_SECRET);
    harness.states.email_log = { status: "sent" };
    harness.states.order_messages = { status: "sent" };
    harness.eqCalls = [];
    harness.rpcCalls = [];
    harness.rpcErrors = {};
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("replays a signed event idempotently and blocks a late sent regression", async () => {
    const bounced = {
      type: "email.bounced",
      created_at: "2026-07-22T12:00:00.000Z",
      data: {
        email_id: "provider-1",
        tags: { order_message_id: "ledger-1" },
        bounce: { type: "hard", message: "rejected" },
      },
    };

    const first = await POST(signedRequest(bounced, "evt-1"));
    const replay = await POST(signedRequest(bounced, "evt-1"));
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(harness.states.email_log.status).toBe("bounced");
    expect(harness.states.order_messages.status).toBe("bounced");
    expect(harness.eqCalls).toContainEqual({
      table: "order_messages",
      column: "id",
      value: "ledger-1",
    });

    await POST(
      signedRequest(
        {
          type: "email.sent",
          created_at: "2026-07-22T11:59:00.000Z",
          data: { email_id: "provider-1" },
        },
        "evt-2"
      )
    );

    expect(harness.states.email_log.status).toBe("bounced");
    expect(harness.states.order_messages.status).toBe("bounced");
  });

  it("maps failed and suppressed events to the ledger's failed state", () => {
    for (const type of ["email.failed", "email.suppressed"]) {
      const updates = mapEventUpdates(type, "2026-07-22T12:00:00.000Z", type);
      expect(updates?.emailLog.status).toBe("failed");
      expect(updates?.orderMessage.status).toBe("failed");
      expect(updates?.orderMessage.last_event_detail).toBe(type);
    }
  });

  it("links a tagged pending message to the provider before marking it sent", async () => {
    harness.states.order_messages = { status: "pending_confirmation" };

    const response = await POST(
      signedRequest(
        {
          type: "email.sent",
          created_at: "2026-07-22T12:00:00.000Z",
          data: {
            email_id: "provider-pending",
            tags: { order_message_id: "ledger-pending" },
          },
        },
        "evt-pending"
      )
    );

    expect(response.status).toBe(200);
    expect(harness.states.order_messages).toEqual(
      expect.objectContaining({
        status: "sent",
        provider_message_id: "provider-pending",
      })
    );
  });

  it("does not let a late sent event overwrite a definitive failure", async () => {
    harness.states.order_messages = { status: "failed" };

    await POST(
      signedRequest(
        {
          type: "email.sent",
          created_at: "2026-07-22T11:59:00.000Z",
          data: { email_id: "provider-failed" },
        },
        "evt-late-sent"
      )
    );

    expect(harness.states.order_messages.status).toBe("failed");
  });

  it("completes a payable quote delivery from array tags and replays idempotently", async () => {
    const event = {
      type: "email.sent",
      created_at: "2026-07-22T12:00:00.000Z",
      data: {
        email_id: "provider-quote-1",
        tags: [{ name: "quote_send_id", value: "delivery-quote-1" }],
      },
    };

    const first = await POST(signedRequest(event, "evt-quote-1"));
    const replay = await POST(signedRequest(event, "evt-quote-1-replay"));

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(harness.rpcCalls).toEqual([
      {
        name: "complete_structured_quote_send",
        args: {
          p_delivery_id: "delivery-quote-1",
          p_provider_message_id: "provider-quote-1",
        },
      },
      {
        name: "complete_structured_quote_send",
        args: {
          p_delivery_id: "delivery-quote-1",
          p_provider_message_id: "provider-quote-1",
        },
      },
    ]);
  });

  it("completes an initial quote notification from object tags", async () => {
    const response = await POST(
      signedRequest(
        {
          type: "email.delivered",
          created_at: "2026-07-22T12:01:00.000Z",
          data: {
            email_id: "provider-request-1",
            tags: { quote_request_delivery_id: "delivery-request-1" },
          },
        },
        "evt-request-1",
      ),
    );

    expect(response.status).toBe(200);
    expect(harness.rpcCalls).toEqual([
      {
        name: "complete_quote_request_delivery",
        args: {
          p_delivery_id: "delivery-request-1",
          p_provider_message_id: "provider-request-1",
        },
      },
    ]);
  });

  it("records terminal quote delivery failures with sanitized provider detail", async () => {
    const response = await POST(
      signedRequest(
        {
          type: "email.bounced",
          created_at: "2026-07-22T12:02:00.000Z",
          data: {
            email_id: "provider-quote-failed",
            tags: [{ name: "quote_send_id", value: "delivery-quote-failed" }],
            bounce: {
              type: "hard",
              message: "mailbox\nrejected\u0000 by provider",
            },
          },
        },
        "evt-quote-failed",
      ),
    );

    expect(response.status).toBe(200);
    expect(harness.rpcCalls).toEqual([
      {
        name: "record_structured_quote_send_failure",
        args: {
          p_delivery_id: "delivery-quote-failed",
          p_outcome: "rejected",
          p_error: "hard: mailbox rejected by provider",
        },
      },
    ]);
  });

  it.each(["email.complained", "email.failed", "email.suppressed"])(
    "records %s as a terminal initial-quote delivery failure",
    async (type) => {
      const response = await POST(
        signedRequest(
          {
            type,
            created_at: "2026-07-22T12:03:00.000Z",
            data: {
              email_id: `provider-${type}`,
              tags: {
                quote_request_delivery_id: `delivery-${type}`,
              },
              failed: { reason: "provider rejected recipient" },
              suppressed: { type: "blocked", message: "provider blocked recipient" },
            },
          },
          `evt-${type}`,
        ),
      );

      expect(response.status).toBe(200);
      expect(harness.rpcCalls).toEqual([
        {
          name: "record_quote_request_delivery_failure",
          args: {
            p_delivery_id: `delivery-${type}`,
            p_outcome: "rejected",
            p_error:
              type === "email.failed"
                ? "failed: provider rejected recipient"
                : type === "email.suppressed"
                  ? "blocked: provider blocked recipient"
                  : "email.complained",
          },
        },
      ]);
      harness.rpcCalls = [];
    },
  );

  it("returns 500 so Resend retries when durable quote reconciliation fails", async () => {
    harness.rpcErrors.complete_quote_request_delivery = "database unavailable";

    const response = await POST(
      signedRequest(
        {
          type: "email.sent",
          created_at: "2026-07-22T12:04:00.000Z",
          data: {
            email_id: "provider-retry",
            tags: { quote_request_delivery_id: "delivery-retry" },
          },
        },
        "evt-retry",
      ),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Failed to reconcile quote delivery",
    });
    expect(harness.states.email_log.status).toBe("sent");
    expect(harness.states.order_messages.status).toBe("sent");
  });

  it("rejects an invalid signature before any database write or RPC", async () => {
    const request = signedRequest(
      {
        type: "email.sent",
        data: {
          email_id: "provider-forged",
          tags: { quote_send_id: "delivery-forged" },
        },
      },
      "evt-forged",
    );
    request.headers.set("svix-signature", "v1,Zm9yZ2Vk");

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(harness.eqCalls).toHaveLength(0);
    expect(harness.rpcCalls).toHaveLength(0);
  });
});
