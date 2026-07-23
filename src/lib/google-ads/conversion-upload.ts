const DATA_MANAGER_ENDPOINT = "https://datamanager.googleapis.com/v1/events:ingest";
const TRUE_COLOR_CUSTOMER_ID = "1072816342";
const TRUE_COLOR_LOGIN_CUSTOMER_ID = "1125402990";

export type PaidConversionType = "purchase_online" | "quote_won";

export interface PaidConversionJob {
  id: string;
  order_number: string;
  conversion_type: PaidConversionType;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  conversion_value: number | string;
  conversion_time: string;
  attempt_count: number;
}

interface GoogleDataManagerEnv {
  readonly [key: string]: string | undefined;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_DATA_MANAGER_REFRESH_TOKEN?: string;
  GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID?: string;
  GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID?: string;
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
  const value = Number(job.conversion_value);
  if (!Number.isFinite(value) || value <= 0) throw new Error("conversion_value must be positive");
  const transactionId = job.order_number.trim();
  if (!transactionId) throw new Error("order_number is required");

  return {
    destinations: [{
      operatingAccount: { accountType: "GOOGLE_ADS", accountId: TRUE_COLOR_CUSTOMER_ID },
      loginAccount: { accountType: "GOOGLE_ADS", accountId: TRUE_COLOR_LOGIN_CUSTOMER_ID },
      productDestinationId: conversionActionId(job.conversion_type, env),
    }],
    events: [{
      adIdentifiers: {
        ...(job.gclid ? { gclid: job.gclid } : {}),
        ...(job.gbraid ? { gbraid: job.gbraid } : {}),
        ...(job.wbraid ? { wbraid: job.wbraid } : {}),
      },
      conversionValue: Number(value.toFixed(2)),
      currency: "CAD",
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

export async function uploadPaidConversion(
  job: PaidConversionJob,
  options: { fetchImpl?: typeof fetch; env?: GoogleDataManagerEnv; validateOnly?: boolean } = {},
): Promise<{ requestId: string | null }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? process.env;
  const token = await accessToken(fetchImpl, env);
  const response = await fetchImpl(DATA_MANAGER_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "x-goog-user-project": dataManagerProjectId(env),
      "content-type": "application/json",
    },
    body: JSON.stringify(buildDataManagerRequest(job, env, options.validateOnly === true)),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({})) as {
    requestId?: string;
    error?: { message?: string; status?: string; details?: unknown[] };
  };
  if (!response.ok) {
    const detail = body.error?.message ?? body.error?.status ?? "unknown error";
    throw new Error(`Google Data Manager conversion upload failed with HTTP ${response.status}: ${detail}`);
  }
  if (options.validateOnly === true) return { requestId: body.requestId ?? null };
  if (!body.requestId) throw new Error("Google Data Manager rejected conversion: no request ID");
  return { requestId: body.requestId };
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
