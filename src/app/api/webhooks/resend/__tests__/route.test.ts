import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  states: {
    email_log: { status: "sent" } as Record<string, unknown>,
    order_messages: { status: "sent" } as Record<string, unknown>,
  },
  eqCalls: [] as Array<{ table: string; column: string; value: string }>,
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
});
