import { describe, expect, it } from "vitest";
import {
  classifyPaidConversionDiagnostics,
  nextDiagnosticAt,
  nextDiagnosticDelayMinutes,
} from "@/app/api/cron/google-ads-conversions/route";

const submittedAt = "2026-07-23T12:00:00.000Z";
const job = {
  attempt_count: 1,
  diagnostic_attempt_count: 1,
  submitted_at: submittedAt,
};

describe("Google Data Manager asynchronous outbox lifecycle", () => {
  it("uses 30-minute exponential diagnostic backoff capped at 60 minutes", () => {
    expect(nextDiagnosticDelayMinutes(0)).toBe(30);
    expect(nextDiagnosticDelayMinutes(1)).toBe(39);
    expect(nextDiagnosticDelayMinutes(2)).toBeCloseTo(50.7);
    expect(nextDiagnosticDelayMinutes(20)).toBe(60);
  });

  it("marks only an exact successful single-record result delivered", () => {
    expect(classifyPaidConversionDiagnostics(job, {
      requestStatus: "SUCCESS",
      recordCount: 1,
      warnings: [],
      errors: [],
      delivered: true,
      processing: false,
      duplicateTransactionOnly: false,
    }, Date.parse("2026-07-23T12:31:00.000Z"))).toEqual({
      status: "sent",
      detail: "SUCCESS recordCount=1",
    });

    expect(classifyPaidConversionDiagnostics(job, {
      requestStatus: "SUCCESS",
      recordCount: 2,
      warnings: [],
      errors: [],
      delivered: false,
      processing: false,
      duplicateTransactionOnly: false,
    }, Date.parse("2026-07-23T12:31:00.000Z")).status).toBe("retry");
  });

  it("accepts a transaction-ID duplicate only when diagnostics classify it as the sole error", () => {
    expect(classifyPaidConversionDiagnostics(job, {
      requestStatus: "FAILED",
      recordCount: 0,
      warnings: [],
      errors: ["TRANSACTION_ID_ALREADY_EXISTS"],
      delivered: false,
      processing: false,
      duplicateTransactionOnly: true,
    }, Date.parse("2026-07-23T12:31:00.000Z")).status).toBe("sent");
  });

  it("keeps processing requests submitted and applies the next backoff", () => {
    expect(classifyPaidConversionDiagnostics(job, {
      requestStatus: "PROCESSING",
      recordCount: 0,
      warnings: [],
      errors: [],
      delivered: false,
      processing: true,
      duplicateTransactionOnly: false,
    }, Date.parse("2026-07-23T12:31:00.000Z"))).toEqual({
      status: "submitted",
      delayMinutes: 39,
      detail: "PROCESSING recordCount=0",
    });
  });

  it("keeps REQUEST_STATUS_UNKNOWN in diagnostics instead of re-uploading", () => {
    expect(classifyPaidConversionDiagnostics(job, {
      requestStatus: "REQUEST_STATUS_UNKNOWN",
      recordCount: 0,
      warnings: [],
      errors: [],
      delivered: false,
      processing: false,
      duplicateTransactionOnly: false,
    }, Date.parse("2026-07-23T12:31:00.000Z")).status).toBe("submitted");
  });

  it("never schedules a diagnostic after the 24-hour terminal boundary", () => {
    expect(nextDiagnosticAt(
      submittedAt,
      Date.parse("2026-07-24T11:45:00.000Z"),
      60,
    )).toBe("2026-07-24T12:00:00.000Z");
  });

  it("terminates processing after the 24-hour diagnostic window", () => {
    const disposition = classifyPaidConversionDiagnostics(job, {
      requestStatus: "PROCESSING",
      recordCount: 0,
      warnings: [],
      errors: [],
      delivered: false,
      processing: true,
      duplicateTransactionOnly: false,
    }, Date.parse("2026-07-24T12:00:00.000Z"));

    expect(disposition.status).toBe("dead");
    expect(disposition.detail).toContain("exceeded 24h");
  });

  it("retries partial failures and dead-letters exhausted uploads", () => {
    const partial = {
      requestStatus: "PARTIAL_SUCCESS",
      recordCount: 0,
      warnings: [],
      errors: ["CLICK_NOT_FOUND"],
      delivered: false,
      processing: false,
      duplicateTransactionOnly: false,
    };
    expect(classifyPaidConversionDiagnostics(job, partial, Date.parse("2026-07-23T12:31:00.000Z")).status)
      .toBe("retry");
    expect(classifyPaidConversionDiagnostics(
      { ...job, attempt_count: 8 },
      partial,
      Date.parse("2026-07-23T12:31:00.000Z"),
    ).status).toBe("dead");
  });
});
