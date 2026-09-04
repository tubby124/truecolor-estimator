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
  localStorage?: StorageLike;
  sessionStorage?: StorageLike;
  gtag?: ((...args: unknown[]) => void) | undefined;
}

const CONVERSION_LABEL_RE = /^AW-\d+\/[A-Za-z0-9_-]+$/;
const GA4_MEASUREMENT_ID = "G-6HMQT7MNLL";
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

/**
 * The account-level Google Ads tag ID (e.g. "AW-18330693756"), independent of any
 * per-conversion-action label.
 *
 * This exists because the tag and the label answer different questions. The label
 * belongs to ONE conversion action; the tag ID is what puts Google Ads on the page at
 * all — which is the prerequisite for enhanced conversions for leads and remarketing,
 * neither of which involves a purchase label. Deriving the tag from the label meant no
 * label, no tag, so the site ran with GA4 only.
 *
 * Validated with the same strictness as the label: this value is interpolated into an
 * inline <script>, so anything but AW-digits is rejected rather than escaped.
 */
const TAG_ID_RE = /^AW-\d+$/;

export function normalizeGoogleAdsTagId(tagId: string | undefined): string | null {
  const trimmed = tagId?.trim();
  if (!trimmed || !TAG_ID_RE.test(trimmed)) return null;
  return trimmed;
}

/**
 * A conversion label ("AW-<digits>/<label>") normalized for use as a gtag
 * destination. Same reject-don't-escape posture as the tag ID: these values are
 * interpolated into an inline <script>, so anything off-shape is dropped rather
 * than escaped.
 */
export function normalizeGoogleAdsConversionLabel(label: string | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed || !CONVERSION_LABEL_RE.test(trimmed)) return null;
  return trimmed;
}

// ─── Website call conversions (number swap) ────────────────────────────────
// Google Ads swaps the displayed number on elements carrying
// WEBSITE_CALL_SWAP_CSS_CLASS for a forwarding number, then attributes calls to
// that forwarding number back to the ad click.
export const WEBSITE_CALL_SWAP_CSS_CLASS = "tc-phone";
export const WEBSITE_CALL_SWAP_GLOBAL = "__tcPhoneSwap";
export const WEBSITE_CALL_SWAP_EVENT = "tc:phone-swap";

/**
 * Mirrors BUSINESS_INFO.phone.display. Kept as a literal rather than imported
 * because it is interpolated into an inline <script> and this module must stay a
 * dependency-free leaf; website-call-swap.test.ts asserts the two never drift.
 */
export const WEBSITE_CALL_DISPLAY_NUMBER = "(306) 954-8688";
const DISPLAY_NUMBER_RE = /^\(\d{3}\) \d{3}-\d{4}$/;

export interface WebsiteCallSwapNumbers {
  /** Display form Google wants shown, e.g. "(306) 555-0134". */
  formatted: string;
  /** Dial form for tel: hrefs, e.g. "+13065550134". */
  mobile: string;
}

/**
 * The gtag config payload for the number swap, as an object — used by the
 * consent-deferred client path. The inline bootstrap below emits the same four
 * keys as a string; buildWebsiteCallSwapScript is tested against this shape.
 */
export function websiteCallSwapParams(
  callback: (formattedNumber: string, mobileNumber: string) => void,
): Record<string, unknown> {
  return {
    phone_conversion_number: WEBSITE_CALL_DISPLAY_NUMBER,
    phone_conversion_css_class: WEBSITE_CALL_SWAP_CSS_CLASS,
    phone_conversion_options: { cache: true },
    phone_conversion_callback: callback,
  };
}

/**
 * Inline-script form of the swap config.
 *
 * Registered inside the beforeInteractive bootstrap rather than from a hydrated
 * client component on purpose. gtag.js drains window.dataLayer in push order, and
 * phone_conversion_callback fires once, when the forwarding number resolves. A
 * `config` pushed after hydration can therefore land after that single
 * invocation and never be called at all.
 *
 * TIMING CAVEAT: a second gtag('config', <same label>, {...}) IS accepted by
 * gtag.js and is the documented way to re-register against an existing
 * destination, but it only re-delivers the numbers if the swap has not already
 * resolved for this page view. That path is used only when the marketing consent
 * banner is enabled (registration cannot precede consent by definition), and
 * WebsiteCallSwap.tsx additionally reads the parked value on mount so a late
 * mount still gets the numbers.
 *
 * The callback body is deliberately a shim: it parks Google's two numbers on
 * window[WEBSITE_CALL_SWAP_GLOBAL] and fires a DOM event. Every DOM rewrite lives
 * in WebsiteCallSwap.tsx, where it is real TypeScript instead of a script string.
 */
export function buildWebsiteCallSwapScript(websiteCallLabel: string | undefined): string {
  const label = normalizeGoogleAdsConversionLabel(websiteCallLabel);
  // Nothing dynamic reaches the script but the label. The number is a literal,
  // re-validated so an edit to the constant can never emit malformed config.
  if (!label || !DISPLAY_NUMBER_RE.test(WEBSITE_CALL_DISPLAY_NUMBER)) return "";
  return (
    `window.gtag('config','${label}',{` +
    `phone_conversion_number:'${WEBSITE_CALL_DISPLAY_NUMBER}',` +
    `phone_conversion_css_class:'${WEBSITE_CALL_SWAP_CSS_CLASS}',` +
    `phone_conversion_options:{cache:true},` +
    `phone_conversion_callback:function(f,m){` +
    `window.${WEBSITE_CALL_SWAP_GLOBAL}={formatted:f,mobile:m};` +
    `try{window.dispatchEvent(new CustomEvent('${WEBSITE_CALL_SWAP_EVENT}'))}catch(e){}` +
    `}});`
  );
}

export function buildGoogleTagBootstrapScript(
  conversionLabel: string | undefined,
  tagId?: string | undefined,
  websiteCallLabel?: string | undefined,
): string {
  // Either source can supply the tag. Prefer the explicit tag ID; fall back to the one
  // implied by a conversion label so existing deployments keep working unchanged.
  const explicitTagId = normalizeGoogleAdsTagId(tagId);
  const labelTagId = deriveGoogleAdsTagId(conversionLabel);
  // A Set keeps this correct when both are set to the same account — configuring the
  // same destination twice is harmless but noisy in tag diagnostics.
  const adsTagIds = [...new Set([explicitTagId, labelTagId].filter((id): id is string => id !== null))];
  const adsConfig = adsTagIds.map((id) => `window.gtag('config','${id}');`).join("");
  // Appended last so the account-level tag is configured before the call-swap
  // destination; an invalid or absent label yields "" and the tag is untouched.
  const websiteCallConfig = buildWebsiteCallSwapScript(websiteCallLabel);
  return `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config','${GA4_MEASUREMENT_ID}');${adsConfig}${websiteCallConfig}`;
}

/**
 * Keeps the Google tag completely out of payment-link documents. Those URLs
 * carry a signed bearer token, so even tag bootstrap or attribution storage is
 * inappropriate there. Public documents keep the same queue-before-library
 * ordering as the standard Google tag snippet.
 */
export function buildGoogleTagDocumentScript(bootstrapScript: string): string {
  return `if(!/^\\/pay(?:\\/|$)/.test(window.location.pathname)){${bootstrapScript}var tcGoogleTag=document.createElement('script');tcGoogleTag.async=true;tcGoogleTag.src='https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}';document.head.appendChild(tcGoogleTag);}`;
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
  let localReadable = false;
  let sessionReadable = false;
  let sent = false;
  if (localStorage) {
    try {
      localReadable = true;
      sent = localStorage.getItem(key) === "1";
    } catch { /* unavailable */ }
  }
  if (sessionStorage) {
    try {
      sessionReadable = true;
      sent = sessionStorage.getItem(key) === "1" || sent;
    } catch { /* unavailable */ }
  }
  return {
    storage: localReadable ? localStorage : sessionReadable ? sessionStorage : undefined,
    sent,
  };
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

// ─── Click-to-call intent conversion ──────────────────────────────────────
const CLICK_TO_CALL_SENT_KEY_PREFIX = "tc_google_ads_click_to_call_sent:";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
// Backstop for the case where sessionStorage is blocked: a double tap inside one
// page life must still count once.
const sentClickToCallLabels = new Set<string>();

export interface ClickToCallDependencies {
  label?: string;
  gtag?: ((...args: unknown[]) => void) | undefined;
  sessionStorage?: StorageLike;
  matchMedia?: (query: string) => { matches: boolean };
}

/**
 * Reports a tel: tap to the `click_to_call_intent` Google Ads action.
 *
 * Inert unless NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL holds a well-formed
 * "AW-<digits>/<label>" value, so an unset or malformed env var can never emit a
 * conversion against a wrong destination.
 */
export function sendGoogleAdsClickToCall(dependencies: ClickToCallDependencies = {}): boolean {
  const label = normalizeGoogleAdsConversionLabel(
    dependencies.label ?? process.env.NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL,
  );
  if (!label) return false;

  // A tel: click is only call intent on a device that can dial. Desktop browsers
  // fire the identical click on a link that does nothing, which would pad the
  // action with non-calls and poison bidding.
  const matchMedia = dependencies.matchMedia
    ?? (typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? (query: string) => window.matchMedia(query)
      : undefined);
  if (!matchMedia) return false;
  try {
    if (!matchMedia(COARSE_POINTER_QUERY).matches) return false;
  } catch {
    return false;
  }

  const gtag = dependencies.gtag ?? (typeof window !== "undefined" ? window.gtag : undefined);
  if (typeof gtag !== "function") return false;

  const sentKey = `${CLICK_TO_CALL_SENT_KEY_PREFIX}${label}`;
  if (sentClickToCallLabels.has(sentKey)) return false;

  // Session-scoped on purpose: one call intent per visit. localStorage is
  // deliberately not consulted — a return visit is a genuinely new intent.
  const sessionStorage = dependencies.sessionStorage ?? browserStorages().sessionStorage;
  const dedup = selectDedupStorage(undefined, sessionStorage, sentKey);
  if (dedup.sent) return false;

  // No value and no transaction_id: this is an intent signal, not revenue.
  gtag("event", "conversion", { send_to: label });
  sentClickToCallLabels.add(sentKey);
  try {
    dedup.storage?.setItem(sentKey, "1");
  } catch {
    /* best-effort; the in-memory guard above still holds for this page life */
  }
  return true;
}

/** Test-only: clears the in-memory double-tap guard. */
export function resetClickToCallDedupeForTests(): void {
  sentClickToCallLabels.clear();
}

export async function prepareEnhancedConversionEmail(input: string | undefined): Promise<string | null> {
  if (!input) return null;
  const email = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
