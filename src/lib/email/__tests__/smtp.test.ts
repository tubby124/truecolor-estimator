import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "../smtp";

const fetchMock = vi.fn<typeof fetch>();

describe("sendEmail", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_KEY", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends provider idempotency as an HTTP header and returns the provider id", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "resend-123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      sendEmail({
        to: "customer@example.com",
        subject: "Order update",
        html: "<p>Hello</p>",
        idempotencyKey: "order-message/request-123",
        tags: [{ name: "order_message_id", value: "message-123" }],
      })
    ).resolves.toEqual({ providerMessageId: "resend-123" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toMatchObject({
      "Idempotency-Key": "order-message/request-123",
    });
    const body = JSON.parse(String(init?.body));
    expect(body).not.toHaveProperty("idempotency_key");
    expect(body.tags).toEqual([{ name: "order_message_id", value: "message-123" }]);
  });

  it("keeps a successful delivery successful when secondary email_log fails", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_KEY", "service-key");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "resend-456" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response("no", { status: 500 }));

    const result = await sendEmail({
      to: "customer@example.com",
      subject: "Order update",
      html: "<p>Hello</p>",
      orderId: "order-1",
      customerId: "customer-1",
    });

    expect(result).toEqual({ providerMessageId: "resend-456" });
    const loggedRows = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(loggedRows).toEqual([
      expect.objectContaining({
        provider_message_id: "resend-456",
        order_id: "order-1",
        customer_id: "customer-1",
      }),
    ]);
  });

  it("surfaces an uncertain outcome when a required durable log write fails", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_KEY", "service-key");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "resend-review" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response("no", { status: 500 }));

    await expect(
      sendEmail({
        to: "customer@example.com",
        subject: "How did your signs turn out?",
        html: "<p>Hello</p>",
        orderId: "order-1",
        idempotencyKey: "review-request/order-1",
        requireEmailLog: true,
      })
    ).rejects.toMatchObject({ outcome: "unknown" });
  });

  it("passes a future delivery time to Resend and durably logs the accepted request", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_KEY", "service-key");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "resend-scheduled" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    const scheduledAt = "2026-07-22T18:00:00.000Z";
    await sendEmail({
      to: "customer@example.com",
      subject: "How did your signs turn out?",
      html: "<p>Hello</p>",
      orderId: "order-1",
      scheduledAt,
    });

    const providerBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(providerBody.scheduled_at).toBe(scheduledAt);

    const loggedRows = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(loggedRows).toEqual([
      expect.objectContaining({
        order_id: "order-1",
        provider_message_id: "resend-scheduled",
        status: "sent",
      }),
    ]);
  });

  it("distinguishes definite provider rejection from ambiguous provider errors", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("invalid recipient", { status: 400 }))
      .mockResolvedValueOnce(new Response("upstream timeout", { status: 503 }));

    await expect(
      sendEmail({ to: "bad@example.com", subject: "Bad", html: "<p>Bad</p>" })
    ).rejects.toMatchObject({ outcome: "rejected" });
    await expect(
      sendEmail({ to: "customer@example.com", subject: "Retry", html: "<p>Retry</p>" })
    ).rejects.toMatchObject({ outcome: "unknown" });
  });
});
