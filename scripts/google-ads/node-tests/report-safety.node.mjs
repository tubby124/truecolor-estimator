import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReportPath, formatEnhancedConversionStatus, summarizeConversionDelivery } from "../report-safety.mjs";

test("click IDs alone do not mean a conversion was uploaded", () => {
  assert.deepEqual(summarizeConversionDelivery([
    {gclid:"g",status:"dead"}, {gbraid:"b",status:"submitted"},
    {wbraid:"w",status:"sent"}, {gclid:" ",status:"sent"},
  ]), {candidates:3,markedSent:1});
});

test("historical payment URLs never expose tokens in reports", () => {
  for (const input of ["/pay/private-token?email=secret@example.com", "https://truecolorprinting.ca/pay/private-token", "/%70ay/private-token"]) {
    assert.equal(safeReportPath(input), "/pay/[redacted]");
  }
  assert.equal(safeReportPath("/products/stickers?gclid=private-click"), "/products/stickers");
  assert.equal(safeReportPath("(not set)"), "(not set)");
  assert.equal(safeReportPath(null), "(path unknown)");
  assert.equal(safeReportPath("/%invalid"), "(path unknown)");
});

test("accepted readiness never overrides disabled uploader or claims delivery", () => {
  const disabled = formatEnhancedConversionStatus({ enabled: false, probe: "ACCEPTED" }).join("\n");
  assert.match(disabled, /DISABLED/);
  assert.doesNotMatch(disabled, /LIVE|uploaded with every/);
  const accepted = formatEnhancedConversionStatus({ enabled: true, probe: "ACCEPTED" }).join("\n");
  assert.match(accepted, /does not prove/);
  assert.match(accepted, /event-level consent/);
  const rejected = formatEnhancedConversionStatus({ enabled: true, probe: "DESTINATION_ACCOUNT_ENHANCED_CONVERSIONS_TERMS_NOT_SIGNED" }).join("\n");
  assert.match(rejected, /ACCOUNT BLOCKED/);
});
