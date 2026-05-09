/**
 * Google Search Console client — server-side only.
 *
 * Auth: service-account JSON in env var GOOGLE_SERVICE_ACCOUNT_JSON.
 * The service-account email must be added as a User on the GSC property
 * (https://search.google.com/search-console → Settings → Users and permissions).
 *
 * Property URL: read from env var GSC_SITE_URL (e.g. "sc-domain:truecolorprinting.ca"
 * for domain properties, or "https://truecolorprinting.ca/" for URL-prefix properties).
 */

import { google } from "googleapis";
import type { searchconsole_v1 } from "googleapis";

let cachedClient: searchconsole_v1.Searchconsole | null = null;

function getServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is not set");
  }
  try {
    return JSON.parse(raw) as { client_email: string; private_key: string };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

export function getGscClient(): searchconsole_v1.Searchconsole {
  if (cachedClient) return cachedClient;

  const key = getServiceAccountKey();
  const jwt = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  cachedClient = google.searchconsole({ version: "v1", auth: jwt });
  return cachedClient;
}

export function getSiteUrl(): string {
  const url = process.env.GSC_SITE_URL;
  if (!url) throw new Error("GSC_SITE_URL env var is not set");
  return url;
}

export type GscRow = {
  query: string;
  page: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

/**
 * Pull all rows for a date range with dimensions [query, page].
 * Auto-paginates. GSC max rowLimit per call is 25,000.
 */
export async function pullGscRows(params: {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  maxRows?: number;
}): Promise<GscRow[]> {
  const client = getGscClient();
  const siteUrl = getSiteUrl();
  const maxRows = params.maxRows ?? 25000;

  const out: GscRow[] = [];
  let startRow = 0;
  const pageSize = Math.min(25000, maxRows);

  while (out.length < maxRows) {
    const res = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: params.dateFrom,
        endDate: params.dateTo,
        dimensions: ["query", "page"],
        rowLimit: pageSize,
        startRow,
        type: "web",
      },
    });

    const rows = res.data.rows ?? [];
    if (rows.length === 0) break;

    for (const r of rows) {
      const [query, page] = r.keys ?? ["", ""];
      out.push({
        query: query ?? "",
        page: page ?? "",
        country: "all",
        device: "all",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }

    if (rows.length < pageSize) break;
    startRow += pageSize;
  }

  return out;
}
