import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SOCIAL_BUSINESS_ID } from "@/lib/social/business";
import { type GbpIdentity, type GbpRequest, locationParent, TRUE_COLOR_GBP_IDENTITY } from "./client";

export type GoogleLocation = { name?: string; title?: string; storefrontAddress?: Omit<GbpIdentity, "title">; metadata?: { canOperateLocalPost?: boolean } };
function normalized(value: string | undefined) { return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
export function matchesIdentity(location: GoogleLocation, expected: GbpIdentity): boolean {
  const address = location.storefrontAddress;
  if (!address) return false;
  return normalized(location.title) === normalized(expected.title)
    && ["locality", "administrativeArea", "postalCode", "regionCode"].every((key) => normalized(address[key as keyof typeof address] as string) === normalized(expected[key as keyof GbpIdentity] as string))
    && address.addressLines?.length === expected.addressLines.length
    && address.addressLines.every((line, i) => normalized(line) === normalized(expected.addressLines[i]));
}

export async function expectedGbpIdentity(db: SupabaseClient, businessId: string): Promise<GbpIdentity> {
  const { data, error } = await db.from("social_businesses").select("gbp_expected_identity").eq("id", businessId).maybeSingle();
  if (error || !data) throw new Error("Unable to resolve business listing identity");
  const identity = data.gbp_expected_identity ?? (businessId === DEFAULT_SOCIAL_BUSINESS_ID ? TRUE_COLOR_GBP_IDENTITY : null);
  if (!identity || typeof identity.title !== "string" || !identity.title.trim() || !Array.isArray(identity.addressLines) || !identity.addressLines.length || !identity.addressLines.every((v: unknown) => typeof v === "string" && v.trim()) || !["locality", "administrativeArea", "postalCode", "regionCode"].every(key => typeof identity[key] === "string" && identity[key].trim())) throw new Error("Business listing identity must be configured before connecting Google");
  return identity as GbpIdentity;
}

/** Exhaust every account/location page; ambiguous matches fail closed. */
export async function discoverGbpLocation(request: GbpRequest, expected: GbpIdentity) {
  const matches = new Map<string, { accountName: string; locationName: string; locationTitle: string; address: GbpIdentity }>();
  let accountPage: string | undefined;
  const accountTokens = new Set<string>();
  do {
    const url = new URL("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
    url.searchParams.set("pageSize", "20");
    if (accountPage) url.searchParams.set("pageToken", accountPage);
    const accounts = await request<{ accounts?: { name?: string }[]; nextPageToken?: string }>(url.toString());
    for (const account of accounts.accounts ?? []) {
      if (!account.name || !/^accounts\/[A-Za-z0-9_-]+$/.test(account.name)) continue;
      let locationPage: string | undefined;
      const locationTokens = new Set<string>();
      do {
        const locationUrl = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
        locationUrl.searchParams.set("readMask", "name,title,storefrontAddress,metadata");
        locationUrl.searchParams.set("pageSize", "100");
        if (locationPage) locationUrl.searchParams.set("pageToken", locationPage);
        const page = await request<{ locations?: GoogleLocation[]; nextPageToken?: string }>(locationUrl.toString());
        for (const location of page.locations ?? []) {
          if (!location.name || !matchesIdentity(location, expected)) continue;
          const fullName = locationParent(account.name, location.name);
          // A location may be visible under multiple accounts; retain one provider location ID.
          matches.set(location.name.split("/").at(-1)!, { accountName: account.name, locationName: fullName, locationTitle: location.title!, address: { title: location.title!, ...location.storefrontAddress! } });
        }
        locationPage = page.nextPageToken;
        if (locationPage && locationTokens.has(locationPage)) throw new Error("Google repeated a location pagination cursor");
        if (locationPage) locationTokens.add(locationPage);
      } while (locationPage);
    }
    accountPage = accounts.nextPageToken;
    if (accountPage && accountTokens.has(accountPage)) throw new Error("Google repeated an account pagination cursor");
    if (accountPage) accountTokens.add(accountPage);
  } while (accountPage);
  if (matches.size > 1) throw new Error("Multiple listings match this address; explicit target resolution is required");
  return [...matches.values()][0] ?? null;
}

export async function verifyGbpLocation(request: GbpRequest, parent: string, expected: GbpIdentity) {
  const name = parent.split("/").slice(-2).join("/");
  if (!/^locations\/[A-Za-z0-9_-]+$/.test(name)) throw new Error("Invalid Google location name");
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${name}`);
  url.searchParams.set("readMask", "name,title,storefrontAddress,metadata");
  const location = await request<GoogleLocation>(url.toString());
  if (location.name !== name || !matchesIdentity(location, expected)) throw new Error("Google listing identity changed; verify its title and full address before reconnecting");
  if (location.metadata?.canOperateLocalPost === false) throw new Error("Google reports this location cannot publish local posts");
  return location;
}
