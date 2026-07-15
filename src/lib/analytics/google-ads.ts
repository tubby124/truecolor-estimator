export interface GoogleAdsPurchaseInput {
  conversionLabel?: string;
  transactionId: string;
  value: number;
  enhancedConversion?: {
    enabled?: string;
    marketingConsent: boolean;
    email?: string;
  };
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
  localStorage?: StorageLike;
  sessionStorage?: StorageLike;
  gtag?: ((...args: unknown[]) => void) | undefined;
}

const CONVERSION_LABEL_RE = /^AW-\d+\/[A-Za-z0-9_-]+$/;
const SENT_KEY_PREFIX = "tc_google_ads_purchase_sent:";
const inFlightTransactions = new Set<string>();

export function prepareGoogleAdsPurchase(input: GoogleAdsPurchaseInput): GoogleAdsPurchasePayload | null {
  const label = input.conversionLabel?.trim();
  const transactionId = input.transactionId.trim();
  if (!label || !CONVERSION_LABEL_RE.test(label) || !transactionId || transactionId.length > 100) return null;
  if (!Number.isFinite(input.value) || input.value <= 0) return null;
  return { send_to: label, transaction_id: transactionId, value: input.value, currency: "CAD" };
}

export function deriveGoogleAdsTagId(conversionLabel: string | undefined): string | null {
  const label = conversionLabel?.trim();
  if (!label || !CONVERSION_LABEL_RE.test(label)) return null;
  return label.slice(0, label.indexOf("/"));
}

function browserStorages(): Pick<SendDependencies, "localStorage" | "sessionStorage"> {
  if (typeof window === "undefined") return {};
  let localStorage: StorageLike | undefined;
  let sessionStorage: StorageLike | undefined;
  try { localStorage = window.localStorage; } catch { /* unavailable */ }
  try { sessionStorage = window.sessionStorage; } catch { /* unavailable */ }
  return { localStorage, sessionStorage };
}

function selectDedupStorage(
  localStorage: StorageLike | undefined,
  sessionStorage: StorageLike | undefined,
  key: string,
): { storage?: StorageLike; sent: boolean } {
  for (const storage of [localStorage, sessionStorage]) {
    if (!storage) continue;
    try {
      return { storage, sent: storage.getItem(key) === "1" };
    } catch {
      // Try the next storage implementation.
    }
  }
  return { sent: false };
}

export async function sendGoogleAdsPurchase(
  input: GoogleAdsPurchaseInput,
  dependencies: SendDependencies = {},
): Promise<boolean> {
  const payload = prepareGoogleAdsPurchase(input);
  const gtag = dependencies.gtag ?? (typeof window !== "undefined" ? window.gtag : undefined);
  if (!payload || typeof gtag !== "function") return false;

  const browser = browserStorages();
  const localStorage = dependencies.localStorage ?? browser.localStorage;
  const sessionStorage = dependencies.sessionStorage ?? browser.sessionStorage;
  const sentKey = `${SENT_KEY_PREFIX}${payload.transaction_id}`;
  const dedup = selectDedupStorage(localStorage, sessionStorage, sentKey);
  if (dedup.sent) return false;
  if (inFlightTransactions.has(sentKey)) return false;
  inFlightTransactions.add(sentKey);

  try {
    if (input.enhancedConversion) {
      const emailHash = await prepareEnhancedConversionEmail(input.enhancedConversion);
      if (emailHash) {
        gtag("set", "user_data", { sha256_email_address: emailHash });
      }
    }

    gtag("event", "conversion", payload);
    try {
      dedup.storage?.setItem(sentKey, "1");
    } catch {
      if (dedup.storage === localStorage) {
        try { sessionStorage?.setItem(sentKey, "1"); } catch { /* best-effort */ }
      }
    }
    return true;
  } finally {
    inFlightTransactions.delete(sentKey);
  }
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
