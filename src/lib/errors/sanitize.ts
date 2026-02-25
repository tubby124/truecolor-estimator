/**
 * Sanitizes error messages before displaying to users.
 * Never expose raw API errors, database errors, or stack traces.
 * Always show a user-friendly message with a support action.
 */

const ERROR_MAP: Record<string, string> = {
  INSUFFICIENT_FUNDS: "Payment declined. Please check your card details or choose a different payment method.",
  CARD_DECLINED: "Your card was declined. Please try a different card or use eTransfer.",
  NETWORK_ERROR: "Connection issue. Please check your internet and try again.",
  FILE_TOO_LARGE: "File is too large (max 10MB). Please compress it and try again.",
  FILE_TYPE_NOT_SUPPORTED: "File type not supported. Please upload a PDF, PNG, JPG, or AI file.",
  UPLOAD_FAILED: "File upload failed. Please try again or call us at 954-8688.",
  ORDER_NOT_FOUND: "Order not found. Please contact us at 954-8688.",
  SESSION_EXPIRED: "Your session has expired. Please refresh the page and try again.",
  DUPLICATE_ORDER: "It looks like this order was already submitted. Check your email for confirmation.",
};

const FALLBACK_MESSAGE =
  "Something went wrong on our end. Please try again or call us at 954-8688.";

/**
 * Returns a safe, user-friendly error message.
 * Logs the original error server-side (caller's responsibility).
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Check for known error codes embedded in message
    for (const [code, message] of Object.entries(ERROR_MAP)) {
      if (error.message.toUpperCase().includes(code)) {
        return message;
      }
    }
    // Never expose raw error messages (could contain DB details, paths, etc.)
    return FALLBACK_MESSAGE;
  }

  if (typeof error === "string") {
    for (const [code, message] of Object.entries(ERROR_MAP)) {
      if (error.toUpperCase().includes(code)) {
        return message;
      }
    }
    return FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}
