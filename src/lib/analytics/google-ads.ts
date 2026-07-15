export interface GoogleAdsPurchaseInput {
  conversionLabel?: string;
  transactionId: string;
  value: number;
}

export interface GoogleAdsPurchasePayload {
  send_to: string;
  transaction_id: string;
  value: number;
  currency: "CAD";
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface SendDependencies {
  storage?: StorageLike;
  gtag?: ((...args: unknown[]) => void) | undefined;
}

const CONVERSION_LABEL_RE = /^AW-\d+\/[A-Za-z0-9_-]+$/;
const SENT_KEY_PREFIX = "tc_google_ads_purchase_sent:";

export function prepareGoogleAdsPurchase(input: GoogleAdsPurchaseInput): GoogleAdsPurchasePayload | null {
  const label = input.conversionLabel?.trim();
  const transactionId = input.transactionId.trim();
  if (!label || !CONVERSION_LABEL_RE.test(label) || !transactionId || transactionId.length > 100) return null;
  if (!Number.isFinite(input.value) || input.value <= 0) return null;
  return { send_to: label, transaction_id: transactionId, value: input.value, currency: "CAD" };
}

function browserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }
}

export function sendGoogleAdsPurchase(input: GoogleAdsPurchaseInput, dependencies: SendDependencies = {}): boolean {
  const payload = prepareGoogleAdsPurchase(input);
  const gtag = dependencies.gtag ?? (typeof window !== "undefined" ? window.gtag : undefined);
  if (!payload || typeof gtag !== "function") return false;

  const storage = dependencies.storage ?? browserStorage();
  const sentKey = `${SENT_KEY_PREFIX}${payload.transaction_id}`;
  try {
    if (storage?.getItem(sentKey) === "1") return false;
  } catch {
    // Storage privacy settings must not block the conversion.
  }

  gtag("event", "conversion", payload);
  try {
    storage?.setItem(sentKey, "1");
  } catch {
    // The conversion was sent; storage dedup is best-effort.
  }
  return true;
}

export async function prepareEnhancedConversionEmail(input: {
  enabled?: string;
  marketingConsent: boolean;
  email?: string;
}): Promise<string | null> {
  if (input.enabled !== "true" || input.marketingConsent !== true || !input.email) return null;
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
