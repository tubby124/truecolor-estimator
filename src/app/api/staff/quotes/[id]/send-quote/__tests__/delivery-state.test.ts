import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  class MockEmailSendError extends Error {
    constructor(
      message: string,
      public readonly outcome: "rejected" | "unknown",
    ) {
      super(message);
    }
  }

  return {
    EmailSendError: MockEmailSendError,
    sendEmail: vi.fn(),
    audit: vi.fn(),
    events: [] as string[],
    revision: 0,
    qualificationCount: 0,
    prepareError: null as string | null,
    resolveError: null as string | null,
    failCompleteOnce: false,
    delivery: null as Record<string, unknown> | null,
  };
});

const QUOTE_ID = "11111111-1111-4111-8111-111111111111";
const DELIVERY_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("@/lib/email/smtp", () => ({
  EmailSendError: harness.EmailSendError,
  sendEmail: harness.sendEmail,
}));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: harness.audit }));
vi.mock("@/lib/payment/token", () => ({
  encodePaymentToken: (
    _total: number,
    _description: string,
    _email: string,
    _redirect: undefined,
    context: { quoteRevision: number },
  ) => `signed-revision-${context.quoteRevision}`,
}));
vi.mock("@/lib/payment/quote-order", () => ({
  getQuoteTaxRates: async () => ({ gstRate: 0.05, pstRate: 0.06 }),
  validateStructuredQuotePricing: () => undefined,
}));
vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: async () => ({ id: "staff-1", email: "info@true-color.ca" }),
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "quote_requests") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { email: "buyer@example.com", name: "Jamie Buyer" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "quote_send_deliveries") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({
                  data: harness.delivery ? [harness.delivery] : [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === "prepare_structured_quote_send") {
        harness.events.push("prepare");
        if (harness.prepareError) {
          return { data: null, error: { message: harness.prepareError } };
        }
        const fingerprint = String(args.p_request_fingerprint);
        if (!harness.delivery) {
          harness.revision += 1;
          harness.delivery = {
            delivery_id: DELIVERY_ID,
            id: DELIVERY_ID,
            quote_revision: harness.revision,
            delivery_status: "prepared",
            status: "prepared",
            provider_message_id: null,
            delivery_created_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            provider_window_started_at: null,
            pay_url: null,
            rendered_html: null,
            rendered_text: null,
            request_fingerprint: fingerprint,
          };
        } else if (
          harness.delivery.request_fingerprint !== fingerprint &&
          ["prepared", "sending", "pending_confirmation"].includes(
            String(harness.delivery.delivery_status),
          )
        ) {
          return { data: null, error: { message: "QUOTE_SEND_IN_FLIGHT" } };
        }
        return { data: [{ ...harness.delivery }], error: null };
      }

      if (name === "arm_structured_quote_send") {
        harness.events.push("arm");
        if (!harness.delivery) throw new Error("delivery not prepared");
        if (!harness.delivery.pay_url) {
          Object.assign(harness.delivery, {
            delivery_status: "sending",
            status: "sending",
            pay_url: args.p_pay_url,
            rendered_html: args.p_rendered_html,
            rendered_text: args.p_rendered_text,
            provider_window_started_at: new Date().toISOString(),
          });
        }
        return {
          data: [{
            delivery_status: harness.delivery.delivery_status,
            provider_message_id: harness.delivery.provider_message_id,
            pay_url: harness.delivery.pay_url,
            rendered_html: harness.delivery.rendered_html,
            rendered_text: harness.delivery.rendered_text,
            provider_window_started_at: harness.delivery.provider_window_started_at,
          }],
          error: null,
        };
      }

      if (name === "record_structured_quote_send_failure") {
        harness.events.push("record-failure");
        if (!harness.delivery) throw new Error("delivery not prepared");
        const status =
          args.p_outcome === "rejected" ? "failed" : "pending_confirmation";
        harness.delivery.delivery_status = status;
        harness.delivery.status = status;
        return { data: status, error: null };
      }

      if (name === "complete_structured_quote_send") {
        harness.events.push("complete");
        if (harness.failCompleteOnce) {
          harness.failCompleteOnce = false;
          return { data: null, error: { message: "database unavailable" } };
        }
        if (!harness.delivery) throw new Error("delivery not prepared");
        const completionCreated = harness.delivery.delivery_status !== "sent";
        const qualificationCreated = harness.qualificationCount === 0;
        if (qualificationCreated) harness.qualificationCount += 1;
        Object.assign(harness.delivery, {
          delivery_status: "sent",
          status: "sent",
          provider_message_id: args.p_provider_message_id,
        });
        return {
          data: [{
            delivery_status: "sent",
            completion_created: completionCreated,
            qualification_created: qualificationCreated,
          }],
          error: null,
        };
      }

      if (name === "resolve_stale_structured_quote_send") {
        harness.events.push("resolve");
        if (harness.resolveError) {
          return { data: null, error: { message: harness.resolveError } };
        }
        if (!harness.delivery) {
          return { data: null, error: { message: "QUOTE_SEND_NOT_FOUND" } };
        }
        if (args.p_resolution === "confirm_sent") {
          const qualificationCreated = harness.qualificationCount === 0;
          if (qualificationCreated) harness.qualificationCount += 1;
          Object.assign(harness.delivery, {
            delivery_status: "sent",
            status: "sent",
            provider_message_id: args.p_provider_message_id,
          });
          return {
            data: [{
              delivery_status: "sent",
              qualification_created: qualificationCreated,
            }],
            error: null,
          };
        }
        Object.assign(harness.delivery, {
          delivery_status: "failed",
          status: "failed",
          resolution: "manual_confirmed_not_sent",
        });
        return {
          data: [{ delivery_status: "failed", qualification_created: false }],
          error: null,
        };
      }

      throw new Error(`Unexpected RPC ${name}`);
    },
  }),
}));

import {
  GET,
  PATCH,
  POST,
  buildQuoteSendFingerprint,
} from "../route";

function request(overrides: Record<string, unknown> = {}): NextRequest {
  return new NextRequest(`http://localhost/api/staff/quotes/${QUOTE_ID}/send-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: "Your quote",
      lineItems: [
        {
          description: "Coroplast signs",
          qty: "1",
          unitPrice: "100.00",
          taxClass: "printed_good",
        },
      ],
      note: "Thanks for the opportunity.",
      ...overrides,
    }),
  });
}

function resolutionRequest(
  resolution: "confirm_sent" | "confirm_not_sent",
  providerMessageId?: string,
): NextRequest {
  return new NextRequest(`http://localhost/api/staff/quotes/${QUOTE_ID}/send-quote`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deliveryId: DELIVERY_ID,
      resolution,
      providerMessageId,
    }),
  });
}

function params() {
  return { params: Promise.resolve({ id: QUOTE_ID }) };
}

function post(req = request()) {
  return POST(req, params());
}

describe("payable quote delivery state", () => {
  beforeEach(() => {
    harness.sendEmail.mockReset();
    harness.audit.mockReset();
    harness.events.length = 0;
    harness.revision = 0;
    harness.qualificationCount = 0;
    harness.prepareError = null;
    harness.resolveError = null;
    harness.failCompleteOnce = false;
    harness.delivery = null;
    harness.sendEmail.mockImplementation(async () => {
      harness.events.push("send-email");
      return { providerMessageId: "provider-1" };
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("qualifies only after provider acceptance is durably completed", async () => {
    const response = await post();

    expect(response.status).toBe(200);
    expect(harness.events).toEqual(["prepare", "arm", "send-email", "complete"]);
    expect(harness.qualificationCount).toBe(1);
    expect(harness.delivery).toEqual(
      expect.objectContaining({
        quote_revision: 1,
        delivery_status: "sent",
        provider_message_id: "provider-1",
      }),
    );
    expect(harness.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: `quote-send/${DELIVERY_ID}`,
        tags: [{ name: "quote_send_id", value: DELIVERY_ID }],
      }),
    );
  });

  it("never calls the provider when durable preparation fails", async () => {
    harness.prepareError = "pricing transaction failed";

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).not.toContain("pricing transaction failed");
    expect(harness.sendEmail).not.toHaveBeenCalled();
    expect(harness.qualificationCount).toBe(0);
  });

  it("keeps rejected and unsent quotes unqualified", async () => {
    harness.sendEmail.mockImplementationOnce(async () => {
      harness.events.push("send-email");
      expect(harness.qualificationCount).toBe(0);
      throw new harness.EmailSendError("bad request", "rejected");
    });

    expect((await post()).status).toBe(502);
    expect(harness.qualificationCount).toBe(0);
    expect(harness.delivery?.delivery_status).toBe("failed");
    expect((await post()).status).toBe(409);
    expect(harness.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("retries an ambiguous send with one revision, payload, provider key, and qualification", async () => {
    harness.sendEmail
      .mockImplementationOnce(async () => {
        harness.events.push("send-email");
        throw new harness.EmailSendError("request timed out", "unknown");
      })
      .mockImplementationOnce(async () => {
        harness.events.push("send-email");
        return { providerMessageId: "provider-1" };
      });

    const first = await post();
    const second = await post();

    expect(first.status).toBe(502);
    expect(second.status).toBe(200);
    expect(harness.revision).toBe(1);
    expect(harness.qualificationCount).toBe(1);
    expect(harness.sendEmail).toHaveBeenCalledTimes(2);
    expect(harness.sendEmail.mock.calls[0][0].idempotencyKey).toBe(
      harness.sendEmail.mock.calls[1][0].idempotencyKey,
    );
    expect(harness.sendEmail.mock.calls[0][0].html).toBe(
      harness.sendEmail.mock.calls[1][0].html,
    );
    expect(harness.sendEmail.mock.calls[0][0].text).toBe(
      harness.sendEmail.mock.calls[1][0].text,
    );
  });

  it("does not qualify when completion rolls back, then recovers idempotently", async () => {
    harness.failCompleteOnce = true;

    expect((await post()).status).toBe(500);
    expect(harness.qualificationCount).toBe(0);
    expect((await post()).status).toBe(200);

    expect(harness.revision).toBe(1);
    expect(harness.qualificationCount).toBe(1);
    expect(harness.sendEmail).toHaveBeenCalledTimes(2);
    expect(harness.sendEmail.mock.calls[0][0].idempotencyKey).toBe(
      harness.sendEmail.mock.calls[1][0].idempotencyKey,
    );
  });

  it("returns a completed exact retry without another provider request", async () => {
    expect((await post()).status).toBe(200);
    const duplicate = await post();
    const body = await duplicate.json();

    expect(duplicate.status).toBe(200);
    expect(body.reused).toBe(true);
    expect(harness.sendEmail).toHaveBeenCalledTimes(1);
    expect(harness.revision).toBe(1);
    expect(harness.qualificationCount).toBe(1);
  });

  it("never re-sends an exact quote after a post-acceptance delivery failure", async () => {
    harness.delivery = {
      id: DELIVERY_ID,
      delivery_id: DELIVERY_ID,
      quote_revision: 1,
      delivery_status: "delivery_failed",
      status: "delivery_failed",
      provider_message_id: "provider-bounced",
      delivery_created_at: new Date().toISOString(),
      provider_window_started_at: new Date().toISOString(),
      request_fingerprint: buildQuoteSendFingerprint({
        quoteId: QUOTE_ID,
        recipient: "buyer@example.com",
        customerName: "Jamie Buyer",
        subject: "Your quote",
        note: "Thanks for the opportunity.",
        lineItems: [{
          description: "Coroplast signs",
          qty: "1",
          unitPrice: "100.00",
          taxClass: "printed_good",
        }],
        subtotalCents: 10000,
        gstCents: 500,
        pstCents: 600,
        totalCents: 11100,
        rates: { gstRate: 0.05, pstRate: 0.06 },
      }),
    };

    const response = await post();

    expect(response.status).toBe(409);
    expect(harness.sendEmail).not.toHaveBeenCalled();
  });

  it("concurrent exact requests share the provider key and qualify once", async () => {
    const [first, second] = await Promise.all([post(), post()]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(harness.revision).toBe(1);
    expect(harness.qualificationCount).toBe(1);
    expect(harness.sendEmail.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(new Set(
      harness.sendEmail.mock.calls.map((call) => call[0].idempotencyKey),
    )).toEqual(new Set([`quote-send/${DELIVERY_ID}`]));
  });

  it("blocks stale ambiguous retry and exposes staff resolution without qualification", async () => {
    harness.sendEmail.mockImplementationOnce(async () => {
      harness.events.push("send-email");
      throw new harness.EmailSendError("request timed out", "unknown");
    });
    expect((await post()).status).toBe(502);
    if (harness.delivery) {
      harness.delivery.provider_window_started_at =
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    expect((await post()).status).toBe(409);
    const resolved = await PATCH(
      resolutionRequest("confirm_not_sent"),
      params(),
    );
    expect(resolved.status).toBe(200);
    expect(harness.delivery?.delivery_status).toBe("failed");
    expect(harness.qualificationCount).toBe(0);
  });

  it("lets authenticated staff confirm a provider-accepted stale send", async () => {
    harness.delivery = {
      id: DELIVERY_ID,
      delivery_id: DELIVERY_ID,
      quote_revision: 1,
      delivery_status: "pending_confirmation",
      status: "pending_confirmation",
      provider_window_started_at:
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };

    const resolved = await PATCH(
      resolutionRequest("confirm_sent", "provider-manual"),
      params(),
    );
    const body = await resolved.json();

    expect(resolved.status).toBe(200);
    expect(body.qualificationCreated).toBe(true);
    expect(harness.qualificationCount).toBe(1);
  });

  it("provides authenticated lifecycle visibility", async () => {
    harness.delivery = {
      id: DELIVERY_ID,
      status: "pending_confirmation",
      quote_revision: 1,
    };
    const response = await GET(
      new NextRequest(`http://localhost/api/staff/quotes/${QUOTE_ID}/send-quote`),
      params(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deliveries).toEqual([harness.delivery]);
  });
});

describe("quote send fingerprint", () => {
  const base = {
    quoteId: QUOTE_ID,
    recipient: "Buyer@Example.com ",
    customerName: "Jamie Buyer",
    subject: "Your quote",
    note: "Thanks",
    lineItems: [
      {
        description: "Banner",
        qty: "1",
        unitPrice: "100.00",
        taxClass: "printed_good" as const,
      },
    ],
    subtotalCents: 10000,
    gstCents: 500,
    pstCents: 600,
    totalCents: 11100,
    rates: { gstRate: 0.05, pstRate: 0.06 },
  };

  it("normalizes recipient casing but changes for a material quote edit", () => {
    const first = buildQuoteSendFingerprint(base);
    const sameRecipient = buildQuoteSendFingerprint({
      ...base,
      recipient: "buyer@example.com",
    });
    const changedPrice = buildQuoteSendFingerprint({
      ...base,
      lineItems: [{ ...base.lineItems[0], unitPrice: "101.00" }],
      subtotalCents: 10100,
      gstCents: 505,
      pstCents: 606,
      totalCents: 11211,
    });

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(sameRecipient).toBe(first);
    expect(changedPrice).not.toBe(first);
  });
});

describe("quote send migration contract", () => {
  const migration = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20260724130000_quote_send_delivery_state.sql",
    ),
    "utf8",
  );

  it("uses an explicit v2 PST path while preserving the unmarked legacy contract", () => {
    expect(migration).toContain(
      "item->>'taxClass' NOT IN ('design_service', 'rush_service')",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents_v2",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.set_structured_quote_pricing_v2",
    );
    expect(migration).toContain(
      "taxFormulaVersion', 'sk_print_only_v2",
    );
    expect(migration).toContain(
      "IS DISTINCT FROM 'sk_print_only_v2'",
    );
    expect(migration).toContain("quote_tax_formula_version");
    expect(migration).toContain("'legacy_full_pst'");
    expect(migration).toContain("'sk_print_only_v2'");
    expect(migration).toContain(
      "ALTER COLUMN quote_tax_formula_version SET DEFAULT 'legacy_full_pst'",
    );
  });

  it("prepares pricing without qualification and qualifies atomically on completion", () => {
    const prepareStart = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.prepare_structured_quote_send",
    );
    const armStart = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.arm_structured_quote_send",
    );
    const prepare = migration.slice(prepareStart, armStart);
    expect(prepare).toContain("public.set_structured_quote_pricing_v2");
    expect(prepare).not.toContain("qualified_at");
    expect(prepare).not.toContain("quote_measurement_event_outbox");

    const completeStart = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.complete_structured_quote_send",
    );
    const failureStart = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.record_structured_quote_send_failure",
    );
    const complete = migration.slice(completeStart, failureStart);
    expect(complete).toContain("qualified_at");
    expect(complete).toContain("quote_measurement_event_outbox");
    expect(complete).toContain("ON CONFLICT (quote_id, event_name) DO NOTHING");
    expect(complete).toContain("replied_at = v_delivery.sent_at");
  });

  it("guards every direct quote revision mutation while delivery is in flight", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.guard_quote_revision_delivery",
    );
    expect(migration).toContain("BEFORE UPDATE OF quote_revision");
    expect(migration).toContain("QUOTE_SEND_IN_FLIGHT");
    expect(migration).toContain(
      "WHEN (OLD.quote_revision IS DISTINCT FROM NEW.quote_revision)",
    );
  });

  it("provides stale recovery without weakening the provider idempotency window", () => {
    expect(migration).toContain("provider_window_started_at");
    expect(migration).toContain("interval '15 minutes'");
    expect(migration).toContain("interval '23 hours'");
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.resolve_stale_structured_quote_send",
    );
    expect(migration).toContain("'manual_confirmed_not_sent'");
    expect(migration).toContain("'manual_confirmed_sent'");
  });

  it("persists post-acceptance delivery failures instead of remaining sent/green", () => {
    expect(migration).toContain("'delivery_failed'");
    expect(migration).toContain("'post_acceptance_failed'");
    expect(migration).toContain(
      "THEN 'delivery_failed'",
    );
    expect(migration).toContain(
      "THEN 'post_acceptance_failed'",
    );
  });

  it("deduplicates sends/revisions and keeps the ledger service-role-only", () => {
    expect(migration).toContain(
      "CONSTRAINT quote_send_deliveries_quote_revision_uidx UNIQUE (quote_id, quote_revision)",
    );
    expect(migration).toContain(
      "CONSTRAINT quote_send_deliveries_fingerprint_uidx UNIQUE (quote_id, request_fingerprint)",
    );
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("FROM public, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
