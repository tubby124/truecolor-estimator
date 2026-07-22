import { describe, expect, it, vi } from "vitest";
import {
  buildClickConversion,
  formatGoogleAdsDateTime,
  uploadPaidConversion,
  type PaidConversionJob,
} from "../conversion-upload";

const env = {
  GOOGLE_ADS_CLIENT_ID: "client",
  GOOGLE_ADS_CLIENT_SECRET: "secret",
  GOOGLE_ADS_REFRESH_TOKEN: "refresh",
  GOOGLE_ADS_DEVELOPER_TOKEN: "developer",
  GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID: "111",
  GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID: "222",
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

describe("server-side Google Ads paid conversion upload", () => {
  it("uses Saskatoon time, CAD pretax value, order ID, and the owned action", () => {
    expect(formatGoogleAdsDateTime(job.conversion_time)).toBe("2026-07-20 12:30:45-06:00");
    expect(buildClickConversion(job, env)).toEqual({
      conversionAction: "customers/1072816342/conversionActions/111",
      conversionDateTime: "2026-07-20 12:30:45-06:00",
      conversionValue: 100.25,
      currencyCode: "CAD",
      orderId: "TC-1001",
      conversionEnvironment: "WEB",
      gclid: "click-1",
    });
  });

  it("selects the distinct quote-won action", () => {
    expect(buildClickConversion({ ...job, conversion_type: "quote_won" }, env).conversionAction)
      .toBe("customers/1072816342/conversionActions/222");
  });

  it("rejects ambiguous click IDs and non-positive revenue", () => {
    expect(() => buildClickConversion({ ...job, gbraid: "braid" }, env)).toThrow("exactly one");
    expect(() => buildClickConversion({ ...job, conversion_value: 0 }, env)).toThrow("positive");
  });

  it("uploads once with partial-failure handling and returns the Google job ID", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ jobId: "9001", results: [{ gclid: "click-1" }] }), { status: 200 }));
    await expect(uploadPaidConversion(job, { fetchImpl, env })).resolves.toEqual({ jobId: "9001" });
    const upload = fetchImpl.mock.calls[1];
    expect(upload[0]).toContain("/v24/customers/1072816342:uploadClickConversions");
    expect(JSON.parse(upload[1].body)).toMatchObject({ partialFailure: true });
    expect(JSON.parse(upload[1].body).conversions[0].orderId).toBe(job.order_number);
  });

  it.each([
    "ORDER_ID_ALREADY_IN_USE",
    "DUPLICATE_ORDER_ID",
  ])(
    "treats nested %s as an idempotent delivered acknowledgement",
    async (duplicateCode) => {
      const fetchImpl = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          jobId: "9002",
          results: [{}],
          partialFailureError: {
            code: 3,
            message: "Request contains an invalid argument.",
            details: [{
              "@type": "type.googleapis.com/google.ads.googleads.v24.errors.GoogleAdsFailure",
              errors: [{
                errorCode: { conversionUploadError: duplicateCode },
                message: "The order ID was already recorded.",
              }],
            }],
          },
        }), { status: 200 }));

      await expect(uploadPaidConversion(job, { fetchImpl, env })).resolves.toEqual({ jobId: "9002" });
    },
  );

  it.each(["CLICK_NOT_FOUND", "CLICK_CONVERSION_ALREADY_EXISTS"])(
    "rejects non-order-id partial failure %s",
    async (errorCode) => {
      const fetchImpl = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          partialFailureError: {
            code: 3,
            message: "Request contains an invalid argument.",
            details: [{ errors: [{ errorCode: { conversionUploadError: errorCode } }] }],
          },
          results: [{}],
        }), { status: 200 }));
      await expect(uploadPaidConversion(job, { fetchImpl, env })).rejects.toThrow(errorCode);
    },
  );

  it("rejects mixed duplicate and non-duplicate partial failures", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        partialFailureError: {
          code: 3,
          details: [{
            errors: [
              { errorCode: { conversionUploadError: "ORDER_ID_ALREADY_IN_USE" } },
              { errorCode: { conversionUploadError: "EXPIRED_EVENT" } },
            ],
          }],
        },
        results: [],
      }), { status: 200 }));
    await expect(uploadPaidConversion(job, { fetchImpl, env })).rejects.toThrow("EXPIRED_EVENT");
  });
});
