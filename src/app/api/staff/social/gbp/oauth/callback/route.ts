import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSocialBusiness, socialBusinessScopingEnabled } from "@/lib/social/business";
import { encryptRefreshToken, getGbpOAuthClient, GBP_SCOPE, oauthStateCookie, readOAuthState } from "@/lib/gbp/oauth";
import { createGbpRequest } from "@/lib/gbp/client";
import { discoverGbpLocation, expectedGbpIdentity } from "@/lib/gbp/discovery";
export const dynamic = "force-dynamic";
function redirect(req: NextRequest, outcome: string) {
  const response = NextResponse.redirect(new URL(`/staff/social/settings?gbp=${outcome}`, req.url));
  response.cookies.set(oauthStateCookie(), "", { httpOnly: true, secure: true, sameSite: "lax", path: "/api/staff/social/gbp/oauth", maxAge: 0 });
  return response;
}
export async function GET(req: NextRequest) {
  try {
    if (!socialBusinessScopingEnabled()) return redirect(req, "migration-required");
    const state = readOAuthState(req.nextUrl.searchParams.get("state"), req.cookies.get(oauthStateCookie())?.value);
    const code = req.nextUrl.searchParams.get("code");
    if (!state || !code) return redirect(req, "invalid-state");
    // The signed state restores business context after Google's redirect; membership is rechecked.
    const headers = new Headers(req.headers);
    headers.set("X-Social-Business-Id", state.businessId);
    const auth = await requireSocialBusiness(new Request(req.url, { headers }));
    if (auth instanceof NextResponse) return auth;
    if (state.userId !== auth.user.id) return redirect(req, "invalid-state");
    const db = createServiceClient();
    const identity = await expectedGbpIdentity(db, auth.businessId);
    const client = getGbpOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token || !tokens.access_token) return redirect(req, "no-refresh-token");
    if (!tokens.scope?.split(" ").includes(GBP_SCOPE)) return redirect(req, "missing-scope");
    const location = await discoverGbpLocation(createGbpRequest(tokens.access_token), identity);
    if (!location) return redirect(req, "location-not-found");
    const encrypted = encryptRefreshToken(tokens.refresh_token, auth.businessId);
    const now = new Date().toISOString();
    const { error } = await db.from("social_gbp_connections").upsert({
      business_id: auth.businessId, owner_user_id: auth.user.id, google_account_name: location.accountName,
      location_name: location.locationName, location_title: location.locationTitle, location_address: location.address,
      refresh_token_ciphertext: encrypted.ciphertext, refresh_token_iv: encrypted.iv, refresh_token_auth_tag: encrypted.authTag,
      token_key_version: 2, scopes: tokens.scope.split(" "), connected_at: now, updated_at: now, last_verified_at: now,
      last_error: null, history_next_page_token: null, history_complete: false,
    }, { onConflict: "business_id" });
    return redirect(req, error ? "storage-failed" : "connected");
  } catch { return redirect(req, "connection-failed"); }
}
