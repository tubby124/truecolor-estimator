// Reporting must not expose historical payment tokens or confuse configuration
// and API validation with delivery evidence.
export function summarizeConversionDelivery(rows = []) {
  const candidates = rows.filter(row => [row.gclid, row.gbraid, row.wbraid]
    .some(value => typeof value === "string" && value.trim().length > 0));
  return {
    candidates: candidates.length,
    markedSent: candidates.filter(row => row.status === "sent").length,
  };
}

export function safeReportPath(value) {
  if (typeof value !== "string" || !value.trim()) return "(path unknown)";
  if (value.startsWith("(")) return value;
  try {
    const path = new URL(value, "https://truecolorprinting.ca").pathname;
    const decoded = decodeURIComponent(path);
    if (/^\/pay(?:\/|$)/i.test(decoded)) return "/pay/[redacted]";
    if (/^\/(?:quote|order-confirmed|account)(?:\/|$)/i.test(decoded)) {
      return `/${decoded.split("/")[1]}/[redacted]`;
    }
    return path;
  } catch {
    return "(path unknown)";
  }
}

export function formatEnhancedConversionStatus({ enabled, probe }) {
  if (!enabled) return [
    "  DISABLED — production uploader omits hashed email/phone; click-ID conversions remain available.",
    "  Readiness probe skipped. Account acceptance does not enable the production uploader.",
  ];
  if (probe === "ACCEPTED") return [
    "  ENABLED IN CONFIG — Google accepted a validate-only readiness probe.",
    "  This does not prove actual identifier upload, event-level consent, or conversion delivery.",
  ];
  if (probe === "DESTINATION_ACCOUNT_ENHANCED_CONVERSIONS_TERMS_NOT_SIGNED") return [
    "  ENABLED IN CONFIG, ACCOUNT BLOCKED — enhanced-conversions terms are not accepted.",
    "  The uploader may fall back to click identifiers; verify actual delivery diagnostics.",
  ];
  return [`  ENABLED IN CONFIG, READINESS UNVERIFIED — ${probe ?? "no result"}`];
}
