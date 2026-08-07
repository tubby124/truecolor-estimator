import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildDataManagerRequest,
  buildUserIdentifiers,
  classifyPaidConversionDiagnostics,
  formatDataManagerTimestamp,
  hashForDataManager,
  normalizeEmailForHashing,
  normalizePhoneForHashing,
  retrievePaidConversionDiagnostics,
  uploadPaidConversion,
  type PaidConversionJob,
} from "../conversion-upload";

const env = {
  GOOGLE_ADS_CLIENT_ID: "client",
  GOOGLE_ADS_CLIENT_SECRET: "secret",
  GOOGLE_DATA_MANAGER_REFRESH_TOKEN: "refresh",
  GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID: "111",
  GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID: "222",
  GOOGLE_DATA_MANAGER_PROJECT_ID: "true-color-ads-data",
};

const job: PaidConversionJob = {
  id: "job-1",
  order_number: "TC-1001",
  conversion_type: "purchase_online",
  gclid: "click-1",
  gbraid: null,
  wbraid: null,
  conversion_value: "100.25",
  conversion_time: "2026-07-20T18:30:45.000Z",
  attempt_count: 1,
};

describe("enhanced conversions — hashed user-provided data", () => {
  const sha256Hex = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

  it("hashes NORMALIZED text, not raw input — the silent zero-match trap", () => {
    // Google hashes the normalized form. Hashing raw input yields a valid-looking
    // digest that matches nothing, with a 200 OK and no error anywhere.
    expect(normalizeEmailForHashing("  Buyer@Example.COM ")).toBe("buyer@example.com");
    expect(hashForDataManager("buyer@example.com")).toBe(sha256Hex("buyer@example.com"));
    expect(hashForDataManager("buyer@example.com")).not.toBe(sha256Hex("  Buyer@Example.COM "));
  });

  it("canonicalizes gmail dots and plus-tags so aliases still match", () => {
    expect(normalizeEmailForHashing("First.Last+ads@gmail.com")).toBe("firstlast@gmail.com");
    expect(normalizeEmailForHashing("first.last@googlemail.com")).toBe("firstlast@gmail.com");
    // Non-gmail domains treat dots as significant — do NOT strip them.
    expect(normalizeEmailForHashing("first.last@true-color.ca")).toBe("first.last@true-color.ca");
  });

  it("normalizes Saskatchewan phone formats to E.164", () => {
    expect(normalizePhoneForHashing("(306) 954-8688")).toBe("+13069548688");
    expect(normalizePhoneForHashing("1-306-954-8688")).toBe("+13069548688");
    expect(normalizePhoneForHashing("306.954.8688")).toBe("+13069548688");
    expect(normalizePhoneForHashing("12345")).toBeNull();
  });

  it("rejects malformed contact details instead of hashing garbage", () => {
    expect(normalizeEmailForHashing("not-an-email")).toBeNull();
    expect(normalizeEmailForHashing("")).toBeNull();
    expect(buildUserIdentifiers({ ...job, customer_email: "nope", customer_phone: "x" })).toEqual([]);
  });

  it("attaches hashed identifiers AND the HEX encoding declaration alongside the click ID", () => {
    const request = buildDataManagerRequest(
      { ...job, customer_email: "Buyer@Example.com", customer_phone: "(306) 954-8688" },
      env,
    ) as Record<string, unknown>;
    // encoding is request-level and required with userData; without it Google reads
    // hex digests as Base64 and matches nothing.
    expect(request.encoding).toBe("HEX");
    const event = (request.events as Array<Record<string, unknown>>)[0];
    expect(event.adIdentifiers).toEqual({ gclid: "click-1" });
    expect(event.userData).toEqual({
      userIdentifiers: [
        { emailAddress: sha256Hex("buyer@example.com") },
        { phoneNumber: sha256Hex("+13069548688") },
      ],
    });
  });

  it("omits userData and encoding entirely when no contact details resolve", () => {
    const request = buildDataManagerRequest(job, env) as Record<string, unknown>;
    expect(request.encoding).toBeUndefined();
    expect((request.events as Array<Record<string, unknown>>)[0].userData).toBeUndefined();
  });

  it("falls back to click-ID-only when the account has not signed EC terms", async () => {
    // Verified live 2026-08-07: Google rejects the ENTIRE request, not just userData.
    // Without this fallback a real sale would fail to upload instead of degrading.
    const termsError = {
      error: {
        message: "terms",
        details: [{ "@type": "type.googleapis.com/google.rpc.BadRequest", fieldViolations: [
          { field: "events.events[0].destination_references[0]",
            reason: "DESTINATION_ACCOUNT_ENHANCED_CONVERSIONS_TERMS_NOT_SIGNED" },
        ] }],
      },
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "t" }) })
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => termsError })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ requestId: "req-fallback" }) });

    const result = await uploadPaidConversion(
      { ...job, customer_email: "buyer@example.com" },
      { fetchImpl: fetchImpl as unknown as typeof fetch, env },
    );

    expect(result).toEqual({ requestId: "req-fallback", enhancedConversionsApplied: false });
    const retryBody = JSON.parse((fetchImpl.mock.calls[2][1] as { body: string }).body);
    expect(retryBody.events[0].userData).toBeUndefined();
    expect(retryBody.encoding).toBeUndefined();
    expect(retryBody.events[0].adIdentifiers).toEqual({ gclid: "click-1" });
  });

  it("does not retry when the failure is unrelated to EC terms", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "t" }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: { message: "boom" } }) });
    await expect(uploadPaidConversion(
      { ...job, customer_email: "buyer@example.com" },
      { fetchImpl: fetchImpl as unknown as typeof fetch, env },
    )).rejects.toThrow(/HTTP 500/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("never sends raw contact details in the request body", () => {
    const body = JSON.stringify(buildDataManagerRequest(
      { ...job, customer_email: "buyer@example.com", customer_phone: "(306) 954-8688" },
      env,
    ));
    expect(body).not.toContain("buyer@example.com");
    expect(body).not.toContain("9548688");
  });
});

describe("server-side Google Data Manager paid conversion upload", () => {
  it("uses RFC 3339 time, CAD pretax value, transaction ID, and owned accounts/action", () => {
    expect(formatDataManagerTimestamp(job.conversion_time)).toBe("2026-07-20T18:30:45.000Z");
    expect(buildDataManagerRequest(job, env)).toEqual({
      destinations: [{
        operatingAccount: { accountType: "GOOGLE_ADS", accountId: "1072816342" },
        loginAccount: { accountType: "GOOGLE_ADS", accountId: "1125402990" },
        productDestinationId: "111",
      }],
      events: [{
        adIdentifiers: { gclid: "click-1" },
        conversionValue: 100.25,
        currency: "CAD",
        eventTimestamp: "2026-07-20T18:30:45.000Z",
        transactionId: "TC-1001",
        eventSource: "WEB",
      }],
    });
  });

  it("selects the distinct quote-won destination", () => {
    expect(buildDataManagerRequest({ ...job, conversion_type: "quote_won" }, env).destinations[0].productDestinationId)
      .toBe("222");
  });

  it.each([
    [{ gclid: null, gbraid: "gbraid-1", wbraid: null }, { gbraid: "gbraid-1" }],
    [{ gclid: null, gbraid: null, wbraid: "wbraid-1" }, { wbraid: "wbraid-1" }],
  ])("maps braid click identifiers", (ids, expected) => {
    const request = buildDataManagerRequest({ ...job, ...ids }, env);
    expect(request.events[0].adIdentifiers).toEqual(expected);
  });

  it("rejects ambiguous click IDs, non-positive revenue, and invalid timestamps", () => {
    expect(() => buildDataManagerRequest({ ...job, gbraid: "braid" }, env)).toThrow("exactly one");
    expect(() => buildDataManagerRequest({ ...job, conversion_value: 0 }, env)).toThrow("positive");
    expect(() => buildDataManagerRequest({ ...job, conversion_time: "not-a-date" }, env)).toThrow("invalid");
  });

  it("uploads through Data Manager and returns its request ID", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ requestId: "request-9001" }), { status: 200 }));
    await expect(uploadPaidConversion(job, { fetchImpl, env })).resolves.toEqual({
      requestId: "request-9001",
      // This fixture job carries no contact details, so enhanced conversions cannot apply.
      enhancedConversionsApplied: false,
    });
    const upload = fetchImpl.mock.calls[1];
    expect(upload[0]).toBe("https://datamanager.googleapis.com/v1/events:ingest");
    expect(upload[1].headers).toMatchObject({
      authorization: "Bearer access",
      "x-goog-user-project": "true-color-ads-data",
    });
    expect(JSON.parse(upload[1].body).events[0].transactionId).toBe(job.order_number);
    expect(JSON.parse(upload[1].body)).not.toHaveProperty("validateOnly");
  });

  it("supports a non-executing validate-only capability test", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    await expect(uploadPaidConversion(job, { fetchImpl, env, validateOnly: true })).resolves.toEqual({
      requestId: null,
      enhancedConversionsApplied: false,
    });
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toMatchObject({ validateOnly: true });
  });

  it("fails closed on Data Manager request errors or missing acknowledgements", async () => {
    const denied = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "PERMISSION_DENIED", message: "scope missing" } }), { status: 403 }));
    await expect(uploadPaidConversion(job, { fetchImpl: denied, env })).rejects.toThrow("scope missing");

    const missingRequestId = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    await expect(uploadPaidConversion(job, { fetchImpl: missingRequestId, env })).rejects.toThrow("no request ID");
  });

  it("requires a valid Google Cloud quota project", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }));
    await expect(uploadPaidConversion(job, {
      fetchImpl,
      env: { ...env, GOOGLE_DATA_MANAGER_PROJECT_ID: "bad project" },
    })).rejects.toThrow("project ID or number");
  });

  it("classifies successful diagnostics only for the exact owned destination and record", () => {
    expect(classifyPaidConversionDiagnostics({
      requestStatusPerDestination: [{
        destination: {
          operatingAccount: { accountType: "GOOGLE_ADS", accountId: "1072816342" },
          productDestinationId: "111",
        },
        requestStatus: "SUCCESS",
        eventsIngestionStatus: { recordCount: "1" },
        warningInfo: { warningCounts: [{ recordCount: "1", reason: "PROCESSING_WARNING_REASON_UNUSED_FIELD" }] },
      }],
    }, "purchase_online", env)).toEqual({
      requestStatus: "SUCCESS",
      recordCount: 1,
      warnings: ["PROCESSING_WARNING_REASON_UNUSED_FIELD"],
      errors: [],
      delivered: true,
      processing: false,
      duplicateTransactionOnly: false,
    });
  });

  it("keeps processing diagnostics pending and treats only transaction-ID duplicates as delivered", () => {
    const destination = {
      operatingAccount: { accountType: "GOOGLE_ADS", accountId: "1072816342" },
      productDestinationId: "111",
    };
    expect(classifyPaidConversionDiagnostics({
      requestStatusPerDestination: [{ destination, requestStatus: "PROCESSING" }],
    }, "purchase_online", env)).toMatchObject({ processing: true, delivered: false });
    expect(classifyPaidConversionDiagnostics({
      requestStatusPerDestination: [{
        destination,
        requestStatus: "FAILED",
        eventsIngestionStatus: { recordCount: "1" },
        errorInfo: { errorCounts: [{ recordCount: "1", reason: "PROCESSING_ERROR_REASON_DUPLICATE_TRANSACTION_ID" }] },
      }],
    }, "purchase_online", env)).toMatchObject({ delivered: true, duplicateTransactionOnly: true });
    expect(classifyPaidConversionDiagnostics({
      requestStatusPerDestination: [{
        destination,
        requestStatus: "FAILED",
        eventsIngestionStatus: { recordCount: "1" },
        errorInfo: { errorCounts: [{ recordCount: "1", reason: "PROCESSING_ERROR_REASON_DUPLICATE_GCLID" }] },
      }],
    }, "purchase_online", env)).toMatchObject({ delivered: false, duplicateTransactionOnly: false });
  });

  it("retrieves diagnostics with the Data Manager token and quota project", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        requestStatusPerDestination: [{
          destination: {
            operatingAccount: { accountType: "GOOGLE_ADS", accountId: "1072816342" },
            productDestinationId: "111",
          },
          requestStatus: "SUCCESS",
          eventsIngestionStatus: { recordCount: "1" },
        }],
      }), { status: 200 }));
    await expect(retrievePaidConversionDiagnostics("request 1", "purchase_online", { fetchImpl, env }))
      .resolves.toMatchObject({ delivered: true });
    expect(fetchImpl.mock.calls[1][0]).toContain("requestId=request%201");
    expect(fetchImpl.mock.calls[1][1].headers).toMatchObject({ "x-goog-user-project": "true-color-ads-data" });
  });

  it("rejects mismatched diagnostics destinations", () => {
    expect(() => classifyPaidConversionDiagnostics({
      requestStatusPerDestination: [{
        destination: {
          operatingAccount: { accountType: "GOOGLE_ADS", accountId: "999" },
          productDestinationId: "111",
        },
        requestStatus: "SUCCESS",
        eventsIngestionStatus: { recordCount: "1" },
      }],
    }, "purchase_online", env)).toThrow("does not match");
  });
});
