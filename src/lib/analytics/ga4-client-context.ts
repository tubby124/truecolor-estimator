import { getMarketingConsent } from "./metaConsent";
import { isSensitiveAnalyticsPath } from "./path";

const GA4_MEASUREMENT_ID = "G-6HMQT7MNLL";
const GA_CLIENT_ID_RE = /^\d{1,20}\.\d{1,20}$/;
const GA_SESSION_VALUE_RE = /^\d{1,20}$/;
export const GA4_CONTEXT_CACHE_KEY = `tc_ga4_context:v1:${GA4_MEASUREMENT_ID}`;
const CACHE_TTL_MS = 60_000;
let generation = 0;
let submissionsInFlight = 0;

export function clearGa4ClientContext(): void {
  generation++;
  try { window.sessionStorage.removeItem(GA4_CONTEXT_CACHE_KEY); } catch { /* Optional storage. */ }
}

function eligible(): boolean {
  if (typeof window === "undefined") return false;
  const consent = getMarketingConsent();
  return !isSensitiveAnalyticsPath(window.location.pathname)
    && !/^\/(staff|account)(\/|$)/.test(window.location.pathname)
    && consent !== "denied"
    && (process.env.NEXT_PUBLIC_MARKETING_CONSENT_BANNER !== "true" || consent === "granted");
}

function readCache(): { context: Ga4ClientContext; capturedAt: number } | null {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(GA4_CONTEXT_CACHE_KEY) ?? "null");
    if (!raw || typeof raw !== "object" || typeof raw.capturedAt !== "number"
      || !Number.isFinite(raw.capturedAt) || raw.capturedAt > Date.now()
      || Date.now() - raw.capturedAt >= CACHE_TTL_MS || !raw.context || typeof raw.context !== "object") return null;
    const context = parseGa4ClientContext(raw.context);
    return context?.ga_session_id ? { context, capturedAt: raw.capturedAt } : null;
  } catch { return null; }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Pseudonymous identifiers issued by the site's existing GA4 tag. They are
 * read on public routes and refreshed at form/checkout submission and let a later server-confirmed
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

function getGtagValue(field: "client_id" | "session_id" | "session_number", timeoutMs: number): Promise<unknown> {
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
    const timeout = window.setTimeout(() => finish(undefined), timeoutMs);
    try {
      gtag("get", GA4_MEASUREMENT_ID, field, finish);
    } catch {
      finish(undefined);
    }
  });
}

/** Supported gtag reads only. Priming gets 3s; a submission always makes a fresh 500ms read. */
async function readContext(timeoutMs: number): Promise<Ga4ClientContext | null> {
  if (!eligible()) { clearGa4ClientContext(); return null; }
  const token = ++generation;
  const capturedAt = Date.now();
  const [ga_client_id, ga_session_id, ga_session_number] = await Promise.all([
    getGtagValue("client_id", timeoutMs),
    getGtagValue("session_id", timeoutMs),
    getGtagValue("session_number", timeoutMs),
  ]);
  if (!eligible()) { clearGa4ClientContext(); return null; }
  // A later read or privacy boundary invalidates earlier asynchronous work.
  if (token !== generation) return null;
  const live = parseGa4ClientContext({ ga_client_id, ga_session_id, ga_session_number });
  const cached = readCache();
  if (!live) { clearGa4ClientContext(); return null; }
  let result = live;
  if (!live.ga_session_id && cached?.context.ga_client_id === live.ga_client_id
    && (!live.ga_session_number || live.ga_session_number === cached.context.ga_session_number)) {
    result = { ...cached.context, ...live };
  }
  try {
    // Store only independently observed live sessions. Fallback never extends TTL.
    if (live.ga_session_id) {
      window.sessionStorage.setItem(GA4_CONTEXT_CACHE_KEY, JSON.stringify({ context: live, capturedAt }));
    } else if (result === live) {
      window.sessionStorage.removeItem(GA4_CONTEXT_CACHE_KEY);
    }
  } catch { /* Analytics must not block checkout when storage is unavailable. */ }
  return result;
}

export async function captureGa4ClientContext(): Promise<Ga4ClientContext | null> {
  submissionsInFlight++;
  try { return await readContext(500); } finally { submissionsInFlight--; }
}

export function primeGa4ClientContext(): Promise<Ga4ClientContext | null> {
  if (!eligible()) { clearGa4ClientContext(); return Promise.resolve(null); }
  // Background focus/navigation work must not invalidate a pending submission.
  if (submissionsInFlight > 0) return Promise.resolve(null);
  return readContext(3000);
}

export async function appendGa4ClientContextToFormData(form: FormData): Promise<void> {
  form.delete("ga_client_id");
  form.delete("ga_session_id");
  form.delete("ga_session_number");
  const context = await captureGa4ClientContext();
  if (!context) return;
  form.set("ga_client_id", context.ga_client_id);
  if (context.ga_session_id) form.set("ga_session_id", context.ga_session_id);
  if (context.ga_session_number) form.set("ga_session_number", context.ga_session_number);
}
