import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptRefreshToken, getGbpOAuthClient } from "./oauth";

export type GbpRequest = <T>(url: string, options?: { method?: "GET" | "POST"; body?: unknown }) => Promise<T>;
export class GbpApiError extends Error {
  constructor(public status: number | null) {
    super(status === null ? "Google request outcome unavailable" : `Google API returned HTTP ${status}`);
  }
}

/** One attempt only. Never log provider response bodies or bearer credentials. */
export function createGbpRequest(token: string, fetcher: typeof fetch = fetch): GbpRequest {
  return async <T>(url: string, options: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> => {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !["mybusiness.googleapis.com", "mybusinessaccountmanagement.googleapis.com", "mybusinessbusinessinformation.googleapis.com"].includes(parsed.hostname)) throw new Error("Invalid Google API destination");
    let response: Response;
    try {
      response = await fetcher(url, { method: options.method ?? "GET", redirect: "error", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(options.body ? { body: JSON.stringify(options.body) } : {}), signal: AbortSignal.timeout(30_000), cache: "no-store" });
    } catch { throw new GbpApiError(null); }
    if (!response.ok) throw new GbpApiError(response.status);
    try { return await response.json() as T; } catch { throw new GbpApiError(null); }
  };
}

export interface GbpConnection {
  business_id: string;
  google_account_name: string;
  location_name: string;
  location_title: string;
  location_address: GbpIdentity;
  refresh_token_ciphertext: string;
  refresh_token_iv: string;
  refresh_token_auth_tag: string;
  token_key_version: number;
  scopes: string[];
  connected_at: string;
  last_verified_at: string | null;
  last_error: string | null;
}
export interface GbpIdentity {
  title: string;
  addressLines: string[];
  locality: string;
  administrativeArea: string;
  postalCode: string;
  regionCode: string;
}
export const TRUE_COLOR_GBP_IDENTITY: GbpIdentity = {
  title: "True Color Display Printing Ltd.", addressLines: ["216 33rd St W"], locality: "Saskatoon", administrativeArea: "SK", postalCode: "S7L 0V1", regionCode: "CA",
};

export async function readGbpConnection(db: SupabaseClient, businessId: string): Promise<GbpConnection | null> {
  const { data, error } = await db.from("social_gbp_connections").select("*").eq("business_id", businessId).maybeSingle();
  if (error) throw new Error("Unable to read Google connection");
  return data as GbpConnection | null;
}

export async function connectionRequest(connection: GbpConnection): Promise<GbpRequest> {
  const client = getGbpOAuthClient();
  client.setCredentials({ refresh_token: decryptRefreshToken(connection) });
  try {
    const { token } = await client.getAccessToken();
    if (!token) throw new Error("Missing token");
    return createGbpRequest(token);
  } catch { throw new Error("Google authorization needs attention; reconnect this business"); }
}

export function locationParent(account: string, location: string) {
  if (!/^accounts\/[A-Za-z0-9_-]+$/.test(account)) throw new Error("Invalid Google account name");
  if (/^locations\/[A-Za-z0-9_-]+$/.test(location)) return `${account}/${location}`;
  if (new RegExp(`^${account}/locations/[A-Za-z0-9_-]+$`).test(location)) return location;
  throw new Error("Invalid Google location name");
}

export function localPostName(parent: string, name: string) {
  if (!name.startsWith(`${parent}/localPosts/`) || !/^[A-Za-z0-9_-]+$/.test(name.slice(`${parent}/localPosts/`.length))) throw new Error("Invalid Google post name");
  return name;
}
