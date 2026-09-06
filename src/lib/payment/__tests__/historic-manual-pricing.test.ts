import { expect, it } from "vitest";
import { historicManualPricing } from "../historic-manual-pricing";
import { manualBreakdownCents } from "../manual-pricing";
it("copies a negotiated non-divisible lot without a contradictory rounded per-unit claim", () => {
  expect(historicManualPricing({ qty: 3, line_total: 10, category: "MANUAL" })).toMatchObject({ unitPrice: "", taxClass: "printed_good" });
});
it("retains standalone service exemption even when copied alongside print", () => {
  const copied = historicManualPricing({ qty: 1, line_total: 40, category: "DESIGN", material_code: "SVC-DESIGN-FULL" });
  expect(copied).toMatchObject({ taxClass: "design_service", standaloneService: true });
  expect(manualBreakdownCents([{ amount: 40, ...copied, unitPrice: undefined }, { amount: 100 }], { gstRate: .05, pstRate: .06 }).pstCents).toBe(600);
});
it("requires explicit review when old service lines lack deterministic tax classification", () => {
  expect(historicManualPricing({ qty: 1, line_total: 40, category: "SERVICE" })).toMatchObject({ taxClassificationRequired: true, kind: "fee" });
});
