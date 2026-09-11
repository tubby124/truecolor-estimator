import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodePaymentToken } from "@/lib/payment/token";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  recordCronRun: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}));

vi.mock("@/lib/cron/heartbeat", () => ({
  recordCronRun: mocks.recordCronRun,
}));

vi.mock("@/lib/email/smtp", () => ({
  sendEmail: mocks.sendEmail,
}));

import { GET } from "../route";

type QueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

function query(result: QueryResult | Promise<never>) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    lt: vi.fn(),
    not: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.lt.mockReturnValue(builder);
  builder.not.mockReturnValue(builder);
  builder.or.mockReturnValue(builder);
  builder.order.mockImplementation(() => Promise.resolve(result));
  // The payment-ledger query is awaited straight off .in()
  builder.in.mockImplementation(() => Promise.resolve(result));
  return builder;
}

function request(secret = "cron-test-secret") {
  return new NextRequest(
    "https://truecolorprinting.ca/api/cron/aging-orders",
    {
      headers: { authorization: `Bearer ${secret}` },
    },
  );
}

describe("aging-orders cron required query boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    mocks.recordCronRun.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed on the pending-payment query without reading or emailing partial data", async () => {
    const pendingQuery = query({
      data: null,
      error: { message: "private pending database detail" },
    });
    const from = vi.fn().mockReturnValue(pendingQuery);
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Aging orders query failed",
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.recordCronRun).toHaveBeenCalledOnce();
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "aging-orders",
      false,
      "required_query_failed=stale-pending",
    );
    expect(JSON.stringify(mocks.recordCronRun.mock.calls))
      .not.toContain("private pending database detail");
  });

  it("fails closed on the production query without sending a pending-only digest", async () => {
    const pendingQuery = query({
      data: [{
        id: "22222222-2222-4222-8222-222222222222",
        order_number: "TC-1",
        total: 25,
        created_at: "2026-07-20T00:00:00.000Z",
        customers: { name: "Customer", email: "customer@example.com" },
      }],
      error: null,
    });
    const productionQuery = query({
      data: null,
      error: { message: "private production database detail" },
    });
    const from = vi.fn()
      .mockReturnValueOnce(pendingQuery)
      .mockReturnValueOnce(productionQuery);
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Aging orders query failed",
    });
    expect(from).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.recordCronRun).toHaveBeenCalledOnce();
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "aging-orders",
      false,
      "required_query_failed=stale-production",
    );
    expect(JSON.stringify(mocks.recordCronRun.mock.calls))
      .not.toContain("private production database detail");
  });

  it("records a healthy heartbeat only after both required queries succeed", async () => {
    const from = vi.fn()
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: [], error: null }));
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      stalePending: 0,
      staleProduction: 0,
    });
    expect(from).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "aging-orders",
      true,
      "no aging orders",
    );
  });

  it("offers the remaining balance, not the full total, for a partially-paid order", async () => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET", "test-payment-secret-that-is-long-enough");
    const from = vi.fn()
      .mockReturnValueOnce(query({
        data: [{
          id: "22222222-2222-4222-8222-222222222222",
          order_number: "TC-1",
          total: 245.55,
          created_at: "2026-07-20T00:00:00.000Z",
          is_rush: false,
          followup_count: 1,
          followup_paused_at: null,
          followup_paused_reason: null,
          customers: { name: "Dana Smith", email: "dana@example.com" },
        }],
        error: null,
      }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({
        data: [{ order_id: "22222222-2222-4222-8222-222222222222", amount: 100, method: "clover", status: "recorded" }],
        error: null,
      }));
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledOnce();

    const html = String((mocks.sendEmail.mock.calls[0][0] as { html?: string }).html ?? "");
    const token = html.match(/\/pay\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/)?.[1];
    expect(token).toBeTruthy();
    expect(decodePaymentToken(token as string).amountCents).toBe(14555);
  });

  it("fails closed when the payment ledger cannot be read", async () => {
    const from = vi.fn()
      .mockReturnValueOnce(query({
        data: [{
          id: "22222222-2222-4222-8222-222222222222",
          order_number: "TC-1",
          total: 245.55,
          created_at: "2026-07-20T00:00:00.000Z",
          customers: { name: "Customer", email: "customer@example.com" },
        }],
        error: null,
      }))
      .mockReturnValueOnce(query({ data: [], error: null }))
      .mockReturnValueOnce(query({ data: null, error: { message: "private ledger detail" } }));
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "aging-orders",
      false,
      "required_query_failed=payment-ledger",
    );
    expect(JSON.stringify(mocks.recordCronRun.mock.calls)).not.toContain("private ledger detail");
  });
});
