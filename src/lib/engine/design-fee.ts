/**
 * Shared design-fee resolution.
 *
 * STEP 7 of the main engine (`index.ts`) and the STICKER V2 bridge
 * (`sticker-v2-bridge.ts`) both need to turn a DesignStatus into a fee + rule id.
 * They previously carried byte-identical copies of the switch, so any repricing
 * had to be applied twice — and the sticker path is easy to forget because
 * `index.ts` short-circuits to the bridge before STEP 2 when the V2 flag is on.
 *
 * Lives in its own module rather than being exported from `index.ts` because
 * `index.ts` already imports the bridge; exporting from there would create a cycle.
 *
 * Prices come from config.v1.csv via getConfigNum() — never hardcode here.
 */

import { getConfigNum } from "@/lib/data/loader";
import type { DesignStatus } from "@/lib/data/types";

export type DesignFeeResult = {
  fee: number;
  ruleId: string | null;
  /** True only for UNKNOWN — caller decides whether to raise a clarification. */
  isUnknown: boolean;
};

export function computeDesignFee(designStatus: DesignStatus): DesignFeeResult {
  switch (designStatus) {
    case "MINOR_EDIT":
      return { fee: getConfigNum("design_minor_edit_fee"), ruleId: "PR-DESIGN-BASIC", isUnknown: false };
    case "FULL_DESIGN":
      return { fee: getConfigNum("design_full_design_fee"), ruleId: "PR-DESIGN-FULL", isUnknown: false };
    case "LOGO_RECREATION":
      return { fee: getConfigNum("design_logo_recreation_fee"), ruleId: "PR-DESIGN-LOGO", isUnknown: false };
    case "UNKNOWN":
      return { fee: 0, ruleId: null, isUnknown: true };
    default:
      // PRINT_READY | INCLUDED — no charge.
      return { fee: 0, ruleId: null, isUnknown: false };
  }
}
