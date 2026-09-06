import { estimate } from "@/lib/engine";
import { parseEstimateBody } from "@/lib/engine/parse-request";
import type { EstimateRequest, EstimateResponse } from "@/lib/engine/types";
import { isPstExemptCategory } from "@/lib/pricing/tax";
import type { WaveLineItem } from "@/lib/wave/invoice";

/** Catalogue inputs are recalculated. Negotiated pricing must be explicit. */
export interface StaffEstimateInput {
  estimateRequest: EstimateRequest;
  expectedSubtotal?: number;
  manualOverride?: { subtotal: number; reason: string };
}

export class StaffEstimateError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
const cents = (value: number) => Math.round(value * 100);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function resolveStaffEstimate(raw: unknown): {
  quoteData: EstimateResponse;
  request: EstimateRequest;
  provenance: { kind: "catalogue" | "staff_override"; reason?: string; catalogueSubtotal: number };
  waveItems: WaveLineItem[];
} {
  if (!record(raw)) throw new StaffEstimateError("An estimate request is required. Refresh the estimator.");
  const parsed = parseEstimateBody(raw.estimateRequest);
  if (!parsed.ok) throw new StaffEstimateError(`Estimate inputs required: ${parsed.message}. Refresh the estimator.`);
  // Use the current catalogue; a version label supplied by a client cannot freeze prices.
  const request = { ...parsed.value, pricing_version: undefined };
  const result = estimate(request);
  if (result.status !== "QUOTED" || result.sell_price === null || !Number.isFinite(result.sell_price) || result.sell_price <= 0) {
    throw new StaffEstimateError("This configuration cannot currently be quoted. Review it in the estimator.");
  }
  const catalogueSubtotal = result.sell_price;
  let provenance: ReturnType<typeof resolveStaffEstimate>["provenance"] = { kind: "catalogue", catalogueSubtotal };
  if (raw.manualOverride !== undefined) {
    const override = raw.manualOverride;
    if (!record(override) || typeof override.subtotal !== "number" || !Number.isFinite(override.subtotal)
      || override.subtotal <= 0 || override.subtotal > 100_000 || cents(override.subtotal) / 100 !== override.subtotal
      || typeof override.reason !== "string" || !override.reason.trim() || override.reason.trim().length > 500) {
      throw new StaffEstimateError("Manual pricing requires a positive cents-precision subtotal and a reason (up to 500 characters).");
    }
    provenance = { kind: "staff_override", reason: override.reason.trim(), catalogueSubtotal };
    result.sell_price = override.subtotal;
    result.line_items = [{ description: `${result.wave_line_name} — agreed customer price`, qty: 1, unit_price: override.subtotal, line_total: override.subtotal, rule_id: "STAFF_OVERRIDE" }];
  } else if (raw.expectedSubtotal !== undefined && (typeof raw.expectedSubtotal !== "number"
    || !Number.isFinite(raw.expectedSubtotal) || cents(raw.expectedSubtotal) !== cents(catalogueSubtotal))) {
    throw new StaffEstimateError("Catalogue price changed. Refresh and review the quote before creating or sending it.", 409);
  }
  const pstExempt = isPstExemptCategory(request.category, request.material_code);
  const quoteData = { ...result, pst_exempt: pstExempt, estimate_request: request };
  // Engine lines may contain rounded unit rates and discount adjustments. Sending
  // one exact job subtotal avoids quantity rounding and accounts for rush once.
  const waveItems = [{ description: `${result.wave_line_name}${provenance.kind === "staff_override" ? " — agreed customer price" : ""}`, qty: 1, unitPrice: result.sell_price!, applyGst: true, applyPst: !pstExempt }];
  return { quoteData, request, provenance, waveItems };
}
