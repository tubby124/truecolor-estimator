import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { encryptRefreshToken, findTrueColorLocation, getGbpOAuthClient, oauthStateCookie, verifyOAuthState } from "@/lib/gbp/oauth";

export const dynamic = "force-dynamic";

function redirect(req: NextRequest, outcome: string) {
  const response = NextResponse.redirect(new URL(`/staff/social/settings?gbp=${outcome}`, req.url));
  response.cookies.set(oauthStateCookie(), "", {
    httpOnly: true,
    secure: true,
    path: "/api/staff/social/gbp/oauth",
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  if (!code || !verifyOAuthState(state, req.cookies.get(oauthStateCookie())?.value)) {
    return redirect(req, "invalid-state");
  }

  try {
    const client = getGbpOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) return redirect(req, "no-refresh-token");
    client.setCredentials(tokens);
    const location = await findTrueColorLocation(client);
    if (!location) return redirect(req, "location-not-found");

    const encrypted = encryptRefreshToken(tokens.refresh_token);
    const supabase = createServiceClient();
    const { error } = await supabase.from("gbp_connections").upsert({
      id: 1,
      owner_user_id: auth.id,
      google_account_name: location.accountName,
      location_name: location.locationName,
      location_title: location.locationTitle,
      refresh_token_ciphertext: encrypted.ciphertext,
      refresh_token_iv: encrypted.iv,
      refresh_token_auth_tag: encrypted.authTag,
      token_key_version: 1,
      scopes: ["https://www.googleapis.com/auth/business.manage"],
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      last_error: null,
    }, { onConflict: "id" });
    if (error) return redirect(req, "storage-failed");

    return redirect(req, "connected");
  } catch {
    return redirect(req, "connection-failed");
  }
}
