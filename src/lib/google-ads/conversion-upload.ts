import { createHash } from "node:crypto";

const DATA_MANAGER_ENDPOINT = "https://datamanager.googleapis.com/v1/events:ingest";
const TRUE_COLOR_CUSTOMER_ID = "1072816342";
const TRUE_COLOR_LOGIN_CUSTOMER_ID = "1125402990";

export type PaidConversionType = "purchase_online" | "quote_won" | "quote_submit_qualified";

export interface PaidConversionJob {
  id: string;
  order_number: string;
  conversion_type: PaidConversionType;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  conversion_value?: number | string;
  conversion_time: string;
  attempt_count: number;
  // Enhanced conversions (enabled in the Google Ads UI 2026-08-07, method = Google Ads API).
  // RAW contact details, resolved at upload time from orders -> customers. They are hashed
  // here and never persisted anywhere in hashed OR raw form beyond the request body, so the
  // outbox never becomes a second PII store. Absent values simply omit the identifier —
  // enhanced conversions degrade to click-ID-only attribution, never fail the upload.
  customer_email?: string | null;
  customer_phone?: string | null;
}

/**
 * Google requires SHA-256 over NORMALIZED text. Normalization rules per
 * developers.google.com/data-manager/api/devguides/events/send-events:
 * trim, lowercase, and for phones reduce to E.164 digits.
 *
 * Hashing an unnormalized string produces a valid-looking hash that silently never
 * matches — the failure mode is zero match rate with a 200 OK, which is exactly the
 * class of silent break this project keeps paying for. Normalize first, always.
 */
export function normalizeEmailForHashing(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  // Gmail ignores dots in the local part and everything after a "+". Google's own
  // normalization expects the canonical address, so a dotted alias matches too.
  const [local, domain] = trimmed.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const canonical = local.split("+")[0].replace(/\./g, "");
    if (!canonical) return null;
    return `${canonical}@gmail.com`;
  }
  return trimmed;
}

/** E.164: leading "+", country code, digits only. Assumes NANP (+1) for 10-digit input. */
export function normalizePhoneForHashing(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function hashForDataManager(normalized: string): string {
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/** Builds the hashed identifier list. Returns [] when nothing usable is present. */
export function buildUserIdentifiers(job: PaidConversionJob): Array<Record<string, string>> {
  const identifiers: Array<Record<string, string>> = [];
  const email = job.customer_email ? normalizeEmailForHashing(job.customer_email) : null;
  if (email) identifiers.push({ emailAddress: hashForDataManager(email) });
  const phone = job.customer_phone ? normalizePhoneForHashing(job.customer_phone) : null;
  if (phone) identifiers.push({ phoneNumber: hashForDataManager(phone) });
  return identifiers;
}

interface GoogleDataManagerEnv {
  readonly [key: string]: string | undefined;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_DATA_MANAGER_REFRESH_TOKEN?: string;
  GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID?: string;
  GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID?: string;
  GOOGLE_ADS_QUOTE_LEAD_CONVERSION_ACTION_ID?: string;
  GOOGLE_DATA_MANAGER_PROJECT_ID?: string;
}

function requireEnv(env: GoogleDataManagerEnv, name: keyof GoogleDataManagerEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function conversionActionId(type: PaidConversionType, env: GoogleDataManagerEnv = process.env): string {
  const name = type === "quote_won"
    ? "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID"
    : type === "quote_submit_qualified"
      ? "GOOGLE_ADS_QUOTE_LEAD_CONVERSION_ACTION_ID"
      : "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID";
  const id = requireEnv(env, name);
  if (!/^\d+$/.test(id)) throw new Error(`${name} must be a numeric Google Ads conversion action ID`);
  return id;
}

export function dataManagerProjectId(env: GoogleDataManagerEnv = process.env): string {
  const projectId = requireEnv(env, "GOOGLE_DATA_MANAGER_PROJECT_ID");
  if (!/^\d+$/.test(projectId) && !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) {
    throw new Error("GOOGLE_DATA_MANAGER_PROJECT_ID must be a Google Cloud project ID or number");
  }
  return projectId;
}

export function formatDataManagerTimestamp(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) throw new Error("conversion_time is invalid");
  return date.toISOString();
}

export function buildDataManagerRequest(
  job: PaidConversionJob,
  env: GoogleDataManagerEnv = process.env,
  validateOnly = false,
) {
  const clickIds = [job.gclid, job.gbraid, job.wbraid].filter((value) => Boolean(value?.trim()));
  if (clickIds.length !== 1) throw new Error("exactly one Google click identifier is required");
  const hasRevenueValue = job.conversion_type !== "quote_submit_qualified";
  const value = Number(job.conversion_value);
  if (hasRevenueValue && (!Number.isFinite(value) || value <= 0)) {
    throw new Error("conversion_value must be positive");
  }
  const transactionId = job.order_number.trim();
  if (!transactionId) throw new Error("order_number is required");

  const userIdentifiers = buildUserIdentifiers(job);

  return {
    destinations: [{
      operatingAccount: { accountType: "GOOGLE_ADS", accountId: TRUE_COLOR_CUSTOMER_ID },
      loginAccount: { accountType: "GOOGLE_ADS", accountId: TRUE_COLOR_LOGIN_CUSTOMER_ID },
      productDestinationId: conversionActionId(job.conversion_type, env),
    }],
    // Request-level and REQUIRED whenever userData is present. Our hashes are hex.
    // Sending userData without this makes Google read the digests as Base64 — a silent
    // zero-match, not an error.
    ...(userIdentifiers.length > 0 ? { encoding: "HEX" } : {}),
    events: [{
      adIdentifiers: {
        ...(job.gclid ? { gclid: job.gclid } : {}),
        ...(job.gbraid ? { gbraid: job.gbraid } : {}),
        ...(job.wbraid ? { wbraid: job.wbraid } : {}),
      },
      ...(userIdentifiers.length > 0 ? { userData: { userIdentifiers } } : {}),
      ...(hasRevenueValue ? {
        conversionValue: Number(value.toFixed(2)),
        currency: "CAD",
      } : {}),
      eventTimestamp: formatDataManagerTimestamp(job.conversion_time),
      transactionId,
      eventSource: "WEB",
    }],
    ...(validateOnly ? { validateOnly: true } : {}),
  };
}

async function accessToken(fetchImpl: typeof fetch, env: GoogleDataManagerEnv): Promise<string> {
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv(env, "GOOGLE_ADS_CLIENT_ID"),
      client_secret: requireEnv(env, "GOOGLE_ADS_CLIENT_SECRET"),
      refresh_token: requireEnv(env, "GOOGLE_DATA_MANAGER_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json() as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error(`Google OAuth exchange failed with HTTP ${response.status}`);
  return body.access_token;
}

/**
 * Google rejects the WHOLE request — not just the userData block — when the destination
 * account has not signed the enhanced-conversions terms. Verified live 2026-08-07:
 * identical payload returned HTTP 400 with userData and HTTP 200 without it.
 *
 * So attaching userData unconditionally would convert a measurement upgrade into a
 * conversion-upload outage, discovered only after a real sale failed to land.
 */
const ENHANCED_CONVERSIONS_TERMS_VIOLATION = "DESTINATION_ACCOUNT_ENHANCED_CONVERSIONS_TERMS_NOT_SIGNED";

interface DataManagerErrorBody {
  requestId?: string;
  error?: { message?: string; status?: string; details?: unknown[] };
}

function isEnhancedConversionsTermsError(body: DataManagerErrorBody): boolean {
  const details = body.error?.details;
  if (!Array.isArray(details)) return false;
  return details.some((detail) => {
    const violations = (detail as { fieldViolations?: Array<{ reason?: string }> })?.fieldViolations;
    return Array.isArray(violations)
      && violations.some((violation) => violation?.reason === ENHANCED_CONVERSIONS_TERMS_VIOLATION);
  });
}

export async function uploadPaidConversion(
  job: PaidConversionJob,
  options: { fetchImpl?: typeof fetch; env?: GoogleDataManagerEnv; validateOnly?: boolean } = {},
): Promise<{ requestId: string | null; enhancedConversionsApplied: boolean }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? process.env;
  const token = await accessToken(fetchImpl, env);

  const send = async (payload: unknown) => {
    const response = await fetchImpl(DATA_MANAGER_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "x-goog-user-project": dataManagerProjectId(env),
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.json().catch(() => ({})) as DataManagerErrorBody;
    return { response, body };
  };

  const hasUserData = buildUserIdentifiers(job).length > 0;
  let enhancedConversionsApplied = hasUserData;
  let { response, body } = await send(buildDataManagerRequest(job, env, options.validateOnly === true));

  // Self-healing: the moment the owner accepts the terms in the Google Ads UI, the first
  // path succeeds and enhanced conversions start working with no redeploy and no config
  // flip. Until then every conversion still lands on the click ID alone.
  if (!response.ok && hasUserData && isEnhancedConversionsTermsError(body)) {
    const withoutUserData: PaidConversionJob = { ...job, customer_email: null, customer_phone: null };
    enhancedConversionsApplied = false;
    ({ response, body } = await send(
      buildDataManagerRequest(withoutUserData, env, options.validateOnly === true),
    ));
  }

  if (!response.ok) {
    const detail = body.error?.message ?? body.error?.status ?? "unknown error";
    throw new Error(`Google Data Manager conversion upload failed with HTTP ${response.status}: ${detail}`);
  }
  if (options.validateOnly === true) return { requestId: body.requestId ?? null, enhancedConversionsApplied };
  if (!body.requestId) throw new Error("Google Data Manager rejected conversion: no request ID");
  return { requestId: body.requestId, enhancedConversionsApplied };
}

interface DataManagerStatusResponse {
  requestStatusPerDestination?: Array<{
    destination?: {
      operatingAccount?: { accountType?: string; accountId?: string };
      productDestinationId?: string;
    };
    requestStatus?: string;
    eventsIngestionStatus?: { recordCount?: string };
    errorInfo?: { errorCounts?: Array<{ recordCount?: string; reason?: string }> };
    warningInfo?: { warningCounts?: Array<{ recordCount?: string; reason?: string }> };
  }>;
  error?: { message?: string; status?: string };
}

export interface PaidConversionDiagnostics {
  requestStatus: string;
  recordCount: number;
  warnings: string[];
  errors: string[];
  delivered: boolean;
  processing: boolean;
  duplicateTransactionOnly: boolean;
}

export function classifyPaidConversionDiagnostics(
  body: DataManagerStatusResponse,
  type: PaidConversionType,
  env: GoogleDataManagerEnv = process.env,
): PaidConversionDiagnostics {
  const statuses = body.requestStatusPerDestination ?? [];
  if (statuses.length !== 1) throw new Error(`Google Data Manager returned ${statuses.length} destination statuses; expected exactly one`);
  const status = statuses[0];
  if (status.destination?.operatingAccount?.accountType !== "GOOGLE_ADS"
    || status.destination?.operatingAccount?.accountId !== TRUE_COLOR_CUSTOMER_ID
    || status.destination?.productDestinationId !== conversionActionId(type, env)) {
    throw new Error("Google Data Manager diagnostics destination does not match the True Color conversion action");
  }
  const requestStatus = status.requestStatus ?? "REQUEST_STATUS_UNKNOWN";
  const recordCount = Number(status.eventsIngestionStatus?.recordCount ?? 0);
  const errors = (status.errorInfo?.errorCounts ?? [])
    .filter((item) => Number(item.recordCount ?? 0) > 0)
    .map((item) => item.reason ?? "PROCESSING_ERROR_REASON_UNSPECIFIED");
  const warnings = (status.warningInfo?.warningCounts ?? [])
    .filter((item) => Number(item.recordCount ?? 0) > 0)
    .map((item) => item.reason ?? "PROCESSING_WARNING_REASON_UNSPECIFIED");
  const duplicateTransactionOnly = errors.length > 0
    && errors.every((reason) => reason === "PROCESSING_ERROR_REASON_DUPLICATE_TRANSACTION_ID");
  const delivered = (requestStatus === "SUCCESS" && recordCount === 1 && errors.length === 0)
    || duplicateTransactionOnly;
  return {
    requestStatus,
    recordCount,
    warnings,
    errors,
    delivered,
    processing: requestStatus === "PROCESSING",
    duplicateTransactionOnly,
  };
}

export async function retrievePaidConversionDiagnostics(
  requestId: string,
  type: PaidConversionType,
  options: { fetchImpl?: typeof fetch; env?: GoogleDataManagerEnv } = {},
): Promise<PaidConversionDiagnostics> {
  const normalizedRequestId = requestId.trim();
  if (!normalizedRequestId) throw new Error("Data Manager request ID is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? process.env;
  const token = await accessToken(fetchImpl, env);
  const response = await fetchImpl(
    `https://datamanager.googleapis.com/v1/requestStatus:retrieve?requestId=${encodeURIComponent(normalizedRequestId)}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        "x-goog-user-project": dataManagerProjectId(env),
      },
      signal: AbortSignal.timeout(20_000),
    },
  );
  const body = await response.json().catch(() => ({})) as DataManagerStatusResponse;
  if (!response.ok) {
    const detail = body.error?.message ?? body.error?.status ?? "unknown error";
    throw new Error(`Google Data Manager diagnostics failed with HTTP ${response.status}: ${detail}`);
  }
  return classifyPaidConversionDiagnostics(body, type, env);
}
