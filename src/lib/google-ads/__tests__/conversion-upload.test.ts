import { describe, expect, it, vi } from "vitest";
import {
  buildDataManagerRequest,
  classifyPaidConversionDiagnostics,
  formatDataManagerTimestamp,
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
    await expect(uploadPaidConversion(job, { fetchImpl, env })).resolves.toEqual({ requestId: "request-9001" });
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
    await expect(uploadPaidConversion(job, { fetchImpl, env, validateOnly: true })).resolves.toEqual({ requestId: null });
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
