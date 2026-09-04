const GA4_MEASUREMENT_ID = "G-6HMQT7MNLL";
const GA_CLIENT_ID_RE = /^\d{1,20}\.\d{1,20}$/;
const GA_SESSION_VALUE_RE = /^\d{1,20}$/;
const GA_CONTEXT_TIMEOUT_MS = 500;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Pseudonymous identifiers issued by the site's existing GA4 tag. They are
 * captured only at a form/checkout submission and let a later server-confirmed
 * purchase join the visitor's actual GA4 session. They are not customer PII.
 */
export interface Ga4ClientContext {
  ga_client_id: string;
  ga_session_id?: string;
  ga_session_number?: string;
}

function normalizeSessionValue(value: unknown): string | undefined {
  const normalized = typeof value === "number" ? String(Math.trunc(value)) : typeof value === "string" ? value.trim() : "";
  return GA_SESSION_VALUE_RE.test(normalized) ? normalized : undefined;
}

export function parseGa4ClientContext(input: {
  ga_client_id?: unknown;
  ga_session_id?: unknown;
  ga_session_number?: unknown;
}): Ga4ClientContext | null {
  const clientId = typeof input.ga_client_id === "string" ? input.ga_client_id.trim() : "";
  if (!GA_CLIENT_ID_RE.test(clientId)) return null;

  const sessionId = normalizeSessionValue(input.ga_session_id);
  const sessionNumber = normalizeSessionValue(input.ga_session_number);
  return {
    ga_client_id: clientId,
    ...(sessionId ? { ga_session_id: sessionId } : {}),
    ...(sessionNumber ? { ga_session_number: sessionNumber } : {}),
  };
}

function getGtagValue(field: "client_id" | "session_id" | "session_number"): Promise<unknown> {
  const gtag = typeof window === "undefined" ? undefined : window.gtag;
  if (typeof gtag !== "function") {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(undefined), GA_CONTEXT_TIMEOUT_MS);
    try {
      gtag("get", GA4_MEASUREMENT_ID, field, finish);
    } catch {
      finish(undefined);
    }
  });
}

/**
 * Uses Google's supported gtag `get` API instead of parsing GA cookies. The
 * half-second cap keeps a slow or blocked analytics tag from materially
 * delaying checkout.
 */
export async function captureGa4ClientContext(): Promise<Ga4ClientContext | null> {
  const [ga_client_id, ga_session_id, ga_session_number] = await Promise.all([
    getGtagValue("client_id"),
    getGtagValue("session_id"),
    getGtagValue("session_number"),
  ]);
  return parseGa4ClientContext({ ga_client_id, ga_session_id, ga_session_number });
}

export async function appendGa4ClientContextToFormData(form: FormData): Promise<void> {
  const context = await captureGa4ClientContext();
  if (!context) return;
  form.set("ga_client_id", context.ga_client_id);
  if (context.ga_session_id) form.set("ga_session_id", context.ga_session_id);
  if (context.ga_session_number) form.set("ga_session_number", context.ga_session_number);
}
