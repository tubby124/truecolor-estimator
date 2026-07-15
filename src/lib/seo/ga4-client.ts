/**
 * Google Analytics 4 Data API client — server-side only.
 *
 * Defense-in-depth alongside the GSC pull: if GSC OAuth dies again, we still
 * see organic traffic in GA4. Cross-checked by the gscVsGa4Divergence rollup
 * signal — >50% divergence between GSC clicks and GA4 organic sessions over
 * 7 days = one of the two pipes is silently broken.
 *
 * Auth: service account (JWT). Unlike GSC, GA4 accepts service-account auth
 * cleanly. Service account email must be added as Viewer/Analyst on the GA4
 * property before this works.
 *
 * Required env vars:
 *   - GA4_PROPERTY_ID            (numeric, e.g. "390000000")
 *   - GA4_SERVICE_ACCOUNT_JSON   (full service-account JSON as a single
 *                                  string — Railway env vars handle the
 *                                  embedded newlines in the private_key fine)
 */

import { google } from "googleapis";

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;

function getServiceAccountCreds() {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GA4 env var missing — GA4_SERVICE_ACCOUNT_JSON");
  }
  let parsed: { client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON missing client_email or private_key");
  }
  return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
}

function getAuth(): InstanceType<typeof google.auth.JWT> {
  if (cachedAuth) return cachedAuth;
  const { clientEmail, privateKey } = getServiceAccountCreds();
  cachedAuth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  return cachedAuth;
}

export function getPropertyId(): string {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) throw new Error("GA4_PROPERTY_ID env var is not set");
  return id;
}

export type Ga4Row = {
  page_path: string;
  sessions: number;
  engaged_sessions: number;
  conversions: number;
};

const PRIVATE_OR_NOINDEX_ROOTS = [
  "/staff",
  "/api",
  "/pay",
  "/cart",
  "/checkout",
  "/order-confirmed",
  "/account",
  "/payment",
] as const;

const PRIVATE_DESCENDANTS_ONLY = ["/quote", "/products"] as const;

function isPathOrDescendant(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

/** Keep the GA4 organic rollup comparable to GSC's public, indexable URLs. */
export function isPublicOrganicPath(pagePath: string): boolean {
  if (!pagePath.startsWith("/")) return false;
  return (
    !PRIVATE_OR_NOINDEX_ROOTS.some((root) => isPathOrDescendant(pagePath, root)) &&
    !PRIVATE_DESCENDANTS_ONLY.some((root) => pagePath.startsWith(`${root}/`))
  );
}

/**
 * Pull one row per pagePath for a date range, filtered to organic-search
 * sessions only. The GSC-vs-GA4 divergence signal compares GSC clicks to
 * GA4 organic sessions, so we restrict the dimension filter here.
 *
 * The GA4 Data API caps rowLimit at 250,000 per request; we ask for 100k
 * which is far more than this site produces in any single day.
 */
export async function pullGa4OrganicRows(params: {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
}): Promise<Ga4Row[]> {
  const auth = getAuth();
  const propertyId = getPropertyId();
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const res = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: params.dateFrom, endDate: params.dateTo }],
      // Landing pages keep sessions unique and attribute key events to the
      // organic entry page instead of a later checkout/confirmation page.
      dimensions: [{ name: "landingPage" }],
      metrics: [
        { name: "sessions" },
        { name: "engagedSessions" },
        // `conversions` was deprecated by GA4 in favour of `keyEvents`.
        { name: "keyEvents" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: { matchType: "EXACT", value: "Organic Search" },
        },
      },
      limit: "100000",
      keepEmptyRows: false,
    },
  });

  const rows = res.data.rows ?? [];
  const out: Ga4Row[] = [];
  for (const r of rows) {
    const pagePath = r.dimensionValues?.[0]?.value ?? "";
    if (!isPublicOrganicPath(pagePath)) continue;
    const sessions = Number(r.metricValues?.[0]?.value ?? 0);
    const engaged = Number(r.metricValues?.[1]?.value ?? 0);
    const conversions = Number(r.metricValues?.[2]?.value ?? 0);
    out.push({
      page_path: pagePath,
      sessions,
      engaged_sessions: engaged,
      conversions,
    });
  }
  return out;
}
