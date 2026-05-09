/**
 * Google Search Console client — server-side only.
 *
 * Auth: OAuth2 refresh token (owner-account identity).
 * Service-account auth was tried first but Google Search Console rejects
 * service accounts on personal Gmail-owned properties ("email not found").
 * OAuth refresh-token auth uses the property owner's identity directly.
 *
 * Required env vars:
 *   - GSC_OAUTH_CLIENT_ID
 *   - GSC_OAUTH_CLIENT_SECRET
 *   - GSC_OAUTH_REFRESH_TOKEN
 *   - GSC_SITE_URL (e.g. "sc-domain:truecolorprinting.ca" for domain properties,
 *                  or "https://truecolorprinting.ca/" for URL-prefix properties)
 *
 * To generate a refresh token, run:
 *   node scripts/gsc-oauth-init.mjs
 */

import { google } from "googleapis";
import type { searchconsole_v1 } from "googleapis";

let cachedClient: searchconsole_v1.Searchconsole | null = null;

function getOAuthCreds() {
  const clientId = process.env.GSC_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GSC_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GSC_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GSC OAuth env vars missing — need GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET, GSC_OAUTH_REFRESH_TOKEN",
    );
  }
  return { clientId, clientSecret, refreshToken };
}

export function getGscClient(): searchconsole_v1.Searchconsole {
  if (cachedClient) return cachedClient;

  const { clientId, clientSecret, refreshToken } = getOAuthCreds();
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  cachedClient = google.searchconsole({ version: "v1", auth });
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
