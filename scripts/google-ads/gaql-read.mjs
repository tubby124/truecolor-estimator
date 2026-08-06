// Shared READ-ONLY Google Ads client.
//
// There is no mutate path here and there must never be one. Mutation authority is deliberately
// split three ways and each holder is a single named file:
//   ENABLE a campaign  -> enable-stage-one.mjs
//   PAUSE a campaign   -> hard-stop-monitor.mjs
//   CREATE children    -> apply-sync.mjs
// Reporting scripts import this module so adding a new report can never add a fourth writer.

export const CUSTOMER = "1072816342";
export const LOGIN = "1125402990";
export const API_VERSION = "v24";

const REQUIRED_ENV = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
];

async function accessToken() {
  for (const name of REQUIRED_ENV) {
    if (!process.env[name]) throw new Error(`${name} is required — run through "railway run" so the credentials are present`);
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`token exchange failed: HTTP ${response.status}`);
  return (await response.json()).access_token;
}

/**
 * Returns a `search(query, label)` function bound to the True Color account.
 * Fails closed if the credentials resolve to any account other than the approved one —
 * reporting against the wrong account is how you end up making decisions on someone else's data.
 */
export async function createReader() {
  const token = await accessToken();
  const headers = {
    authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    "login-customer-id": LOGIN,
    "content-type": "application/json",
  };

  const search = async (query, label) => {
    const response = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER}/googleAds:search`,
      { method: "POST", headers, body: JSON.stringify({ query }) },
    );
    if (!response.ok) throw new Error(`${label} failed: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
    return (await response.json()).results ?? [];
  };

  const account = (await search(
    "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
    "account identity",
  ))[0]?.customer ?? {};
  if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
    throw new Error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
  }

  return { search, account };
}

export const microsToCad = (micros) => Number(micros ?? 0) / 1_000_000;
