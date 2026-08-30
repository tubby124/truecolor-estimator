import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildPayLink: vi.fn(),
  createServiceClient: vi.fn(),
  recordCronRun: vi.fn(),
  sendEmail: vi.fn(),
  sendTelegramNotification: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}));
vi.mock("@/lib/cron/heartbeat", () => ({ recordCronRun: mocks.recordCronRun }));
vi.mock("@/lib/email/smtp", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/notifications/telegram", () => ({
  sendTelegramNotification: mocks.sendTelegramNotification,
}));
vi.mock("@/lib/orders/payLink", () => ({ buildPayLink: mocks.buildPayLink }));

import { GET } from "../route";

type Result = { data: unknown[] | null; error: { message: string } | null };

function builder(result: Result) {
  const query = {
    eq: vi.fn(),
    gte: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    limit: vi.fn(),
    lt: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    then: undefined as unknown,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.lt.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.then = (onfulfilled: (value: Result) => unknown, onrejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onfulfilled, onrejected);
  return query;
}

function request() {
  return new NextRequest("https://truecolorprinting.ca/api/cron/payment-followup", {
    headers: { authorization: "Bearer cron-test-secret" },
  });
}

describe("payment-followup human-touch deferral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    mocks.recordCronRun.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses audit_events.at and defers a recently human-touched due order without emailing", async () => {
    const staleOrders = builder({
      data: [{
        id: "order-id",
        order_number: "TC-TEST-1",
        total: 68.82,
        payment_method: "card",
        created_at: "2026-01-01T00:00:00.000Z",
        followup_count: 0,
        followup_paused_at: null,
        paid_at: null,
        wave_payment_recorded_at: null,
        is_archived: false,
        order_items: [{ product_name: "Test print", qty: 1 }],
        customers: { name: "Test Customer", email: "test@example.com" },
      }],
      error: null,
    });
    const attempts = builder({ data: [], error: null });
    const ledger = builder({ data: [], error: null });
    const auditEvents = builder({
      data: [{ entity_id: "order-id", event_type: "order.reply_sent", at: "2026-01-01T01:00:00.000Z" }],
      error: null,
    });
    const checkoutSessions = builder({ data: [], error: null });
    const stuckOrders = builder({ data: [], error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce(staleOrders)
      .mockReturnValueOnce(attempts)
      .mockReturnValueOnce(ledger)
      .mockReturnValueOnce(auditEvents)
      .mockReturnValueOnce(checkoutSessions)
      .mockReturnValueOnce(stuckOrders);
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      tc9: 0,
      tc10: 0,
      skipped: { humanTouch: 1 },
    });
    expect(auditEvents.select).toHaveBeenCalledWith("entity_id, event_type, at");
    expect(auditEvents.gte).toHaveBeenCalledWith("at", expect.any(String));
    expect(mocks.buildPayLink).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "payment-followup",
      true,
      expect.stringContaining("human=1"),
    );
  });
});
