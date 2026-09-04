export interface PstExemptionInput {
  enabled?: boolean;
  vendorNumber?: string;
  resaleConfirmed?: boolean;
  rememberVendorNumber?: boolean;
  clearRememberedVendorNumber?: boolean;
}

export interface PstExemptionDecision {
  enabled: boolean;
  vendorNumber: string | null;
  resaleConfirmed: boolean;
  rememberVendorNumber: boolean;
  clearRememberedVendorNumber: boolean;
}

const MAX_VENDOR_NUMBER_LENGTH = 64;

export function normalizePstVendorNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized : null;
}

export function parsePstExemption(input: unknown): PstExemptionDecision {
  const value = input && typeof input === "object"
    ? input as PstExemptionInput
    : {};
  const enabled = value.enabled === true;
  const vendorNumber = normalizePstVendorNumber(value.vendorNumber);
  const resaleConfirmed = value.resaleConfirmed === true;

  if (vendorNumber && vendorNumber.length > MAX_VENDOR_NUMBER_LENGTH) {
    throw new Error("PST vendor licence number is too long");
  }
  if (enabled && !vendorNumber) {
    throw new Error("A PST vendor licence number is required to remove PST");
  }
  if (enabled && !resaleConfirmed) {
    throw new Error("Confirm that this purchase is for resale before removing PST");
  }

  return {
    enabled,
    // Retain this separately when staff is editing the saved customer value;
    // callers must snapshot it onto a document only when enabled is true.
    vendorNumber,
    resaleConfirmed: enabled && resaleConfirmed,
    rememberVendorNumber: !!vendorNumber && value.rememberVendorNumber !== false,
    clearRememberedVendorNumber: value.clearRememberedVendorNumber === true,
  };
}

export function pstExemptionInvoiceNote(decision: Pick<PstExemptionDecision, "enabled" | "vendorNumber">): string | null {
  if (!decision.enabled || !decision.vendorNumber) return null;
  return `PST exempt for resale — customer PST vendor licence #${decision.vendorNumber}`;
}
