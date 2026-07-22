const API_VERSION = "v24";
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

interface GoogleAdsEnv {
  readonly [key: string]: string | undefined;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_ADS_DEVELOPER_TOKEN?: string;
  GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID?: string;
  GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID?: string;
}

const IDEMPOTENT_DUPLICATE_CODES = new Set([
  "DUPLICATE_ORDER_ID",
  "ORDER_ID_ALREADY_IN_USE",
]);

interface GoogleAdsPartialFailure {
  code?: number;
  message?: string;
  details?: unknown[];
}

function collectEnumCodes(value: unknown, codes: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectEnumCodes(item, codes);
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const nested of Object.values(value)) {
    if (typeof nested === "string" && /^[A-Z][A-Z0-9_]+$/.test(nested)) {
      codes.add(nested);
    } else {
      collectEnumCodes(nested, codes);
    }
  }
}

function partialFailureCodes(failure: GoogleAdsPartialFailure): string[] {
  const codes = new Set<string>();
  collectEnumCodes(failure, codes);
  return [...codes];
}

function requireEnv(env: GoogleAdsEnv, name: keyof GoogleAdsEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function conversionActionId(type: PaidConversionType, env: GoogleAdsEnv = process.env): string {
  const name = type === "quote_won"
    ? "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID"
    : "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID";
  const id = requireEnv(env, name);
  if (!/^\d+$/.test(id)) throw new Error(`${name} must be a numeric Google Ads conversion action ID`);
  return id;
}

export function formatGoogleAdsDateTime(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) throw new Error("conversion_time is invalid");
  // Saskatchewan stays at UTC-06:00 year-round.
  const local = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 10)} ${local.toISOString().slice(11, 19)}-06:00`;
}

export function buildClickConversion(job: PaidConversionJob, env: GoogleAdsEnv = process.env) {
  const clickIds = [job.gclid, job.gbraid, job.wbraid].filter((value) => Boolean(value?.trim()));
  if (clickIds.length !== 1) throw new Error("exactly one Google click identifier is required");
  const value = Number(job.conversion_value);
  if (!Number.isFinite(value) || value <= 0) throw new Error("conversion_value must be positive");
  const orderId = job.order_number.trim();
  if (!orderId) throw new Error("order_number is required");

  return {
    conversionAction: `customers/${TRUE_COLOR_CUSTOMER_ID}/conversionActions/${conversionActionId(job.conversion_type, env)}`,
    conversionDateTime: formatGoogleAdsDateTime(job.conversion_time),
    conversionValue: Number(value.toFixed(2)),
    currencyCode: "CAD",
    orderId,
    conversionEnvironment: "WEB",
    ...(job.gclid ? { gclid: job.gclid } : {}),
    ...(job.gbraid ? { gbraid: job.gbraid } : {}),
    ...(job.wbraid ? { wbraid: job.wbraid } : {}),
  };
}

async function accessToken(fetchImpl: typeof fetch, env: GoogleAdsEnv): Promise<string> {
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv(env, "GOOGLE_ADS_CLIENT_ID"),
      client_secret: requireEnv(env, "GOOGLE_ADS_CLIENT_SECRET"),
      refresh_token: requireEnv(env, "GOOGLE_ADS_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json() as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error(`Google Ads OAuth exchange failed with HTTP ${response.status}`);
  return body.access_token;
}

export async function uploadPaidConversion(
  job: PaidConversionJob,
  options: { fetchImpl?: typeof fetch; env?: GoogleAdsEnv } = {},
): Promise<{ jobId: string | null }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? process.env;
  const token = await accessToken(fetchImpl, env);
  const response = await fetchImpl(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${TRUE_COLOR_CUSTOMER_ID}:uploadClickConversions`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "developer-token": requireEnv(env, "GOOGLE_ADS_DEVELOPER_TOKEN"),
        "login-customer-id": TRUE_COLOR_LOGIN_CUSTOMER_ID,
        "content-type": "application/json",
      },
      body: JSON.stringify({ conversions: [buildClickConversion(job, env)], partialFailure: true }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  const body = await response.json().catch(() => ({})) as {
    jobId?: string;
    results?: unknown[];
    partialFailureError?: GoogleAdsPartialFailure;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(`Google Ads conversion upload failed with HTTP ${response.status}: ${body.error?.message ?? "unknown error"}`);
  const partialFailure = body.partialFailureError;
  const hasPartialFailure = Boolean(
    partialFailure &&
    (partialFailure.code !== undefined && partialFailure.code !== 0 ||
      partialFailure.message ||
      partialFailure.details?.length),
  );
  if (hasPartialFailure && partialFailure) {
    const codes = partialFailureCodes(partialFailure);
    if (codes.length > 0 && codes.every((code) => IDEMPOTENT_DUPLICATE_CODES.has(code))) {
      return { jobId: body.jobId ?? null };
    }
    const detail = codes.length > 0 ? codes.join(", ") : partialFailure.message ?? "unknown partial failure";
    throw new Error(`Google Ads rejected conversion: ${detail}`);
  }
  if (!body.results?.length) {
    throw new Error("Google Ads rejected conversion: no accepted result");
  }
  return { jobId: body.jobId ?? null };
}
