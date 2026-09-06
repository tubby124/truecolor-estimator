import { describe, expect, it } from "vitest";
import { resolveStaffEstimate, StaffEstimateError } from "../wave-quote";
import { estimate } from "@/lib/engine";
import type { EstimateRequest } from "@/lib/engine/types";

const configurations: EstimateRequest[] = [
  { category: "SIGN", material_code: "MPHCC020", width_in: 24, height_in: 36, qty: 7, sides: 1, is_rush: true, design_status: "FULL_DESIGN" },
  { category: "FLYER", material_code: "PLACEHOLDER_80LB", width_in: 8.5, height_in: 11, qty: 100, sides: 2 },
  { category: "STICKER", width_in: 4, height_in: 4, qty: 500, shape: "circle" },
  { category: "SIGN", material_code: "MPHCC020", width_in: 48, height_in: 96, qty: 1, sides: 1 },
];
describe("staff catalogue and Wave consistency", () => {
  it.each(configurations)("resolves exact engine subtotal, quantity rounding, discount and rush for %j", (estimateRequest) => {
    const expected = estimate(estimateRequest);
    const resolved = resolveStaffEstimate({ estimateRequest, expectedSubtotal: expected.sell_price });
    expect(resolved.quoteData.sell_price).toBe(expected.sell_price);
    expect(resolved.waveItems.reduce((sum, row) => sum + row.qty * row.unitPrice, 0)).toBe(expected.sell_price);
    expect(resolved.provenance.kind).toBe("catalogue");
  });
  it("keeps standalone services PST exempt while printed bundles include design and rush", () => {
    const service = resolveStaffEstimate({ estimateRequest: { category: "SERVICE", material_code: "SVC-UPSCALE", qty: 1 } });
    expect(service.waveItems[0].applyPst).toBe(false);
    expect(service.quoteData.pst_exempt).toBe(true);
    expect(resolveStaffEstimate({ estimateRequest: configurations[0] }).waveItems[0].applyPst).toBe(true);
  });
  it("rejects result-only old clients, arbitrary status and prices", () => {
    expect(() => resolveStaffEstimate({ quoteData: { status: "QUOTED", sell_price: 1 } })).toThrow(StaffEstimateError);
    expect(() => resolveStaffEstimate({ estimateRequest: { category: "SIGN", qty: -3 } })).toThrow();
  });
  it("rejects stale expected prices rather than silently sending changed money", () => {
    expect(() => resolveStaffEstimate({ estimateRequest: configurations[0], expectedSubtotal: 1 })).toThrow(/price changed/);
  });
  it("preserves explicit negotiated prices and their reason independently from current catalogue", () => {
    const result = resolveStaffEstimate({ estimateRequest: configurations[0], expectedSubtotal: 1, manualOverride: { subtotal: 80.25, reason: "Agreed repeat-customer price" } });
    expect(result.quoteData.sell_price).toBe(80.25);
    expect(result.provenance).toMatchObject({ kind: "staff_override", reason: "Agreed repeat-customer price" });
    expect(result.quoteData.line_items[0].line_total).toBe(80.25);
    expect(result.waveItems[0].unitPrice).toBe(80.25);
  });
  it.each([{ subtotal: 1, reason: "" }, { subtotal: 1.001, reason: "manual" }, { subtotal: -1, reason: "manual" }])("requires valid override provenance %j", (manualOverride) => {
    expect(() => resolveStaffEstimate({ estimateRequest: configurations[0], manualOverride })).toThrow();
  });
});
