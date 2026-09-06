import { NextResponse } from "next/server";
import { requireSocialBusiness, socialBusinessScopingEnabled } from "@/lib/social/business";
import { createOAuthState, getGbpOAuthClient, GBP_SCOPE, oauthStateCookie } from "@/lib/gbp/oauth";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const headers = new Headers(req.headers);
  const businessId = new URL(req.url).searchParams.get("businessId");
  if (businessId) headers.set("X-Social-Business-Id", businessId);
  const auth = await requireSocialBusiness(new Request(req.url, { headers }));
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: "Business-scoped Google setup awaits migration activation" }, { status: 503 });
  try {
    const { value, cookieValue } = createOAuthState({ businessId: auth.businessId, userId: auth.user.id });
    const url = getGbpOAuthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", scope: [GBP_SCOPE], state: value });
    const response = NextResponse.redirect(url);
    response.cookies.set(oauthStateCookie(), cookieValue, { httpOnly: true, sameSite: "lax", secure: true, path: "/api/staff/social/gbp/oauth", maxAge: 600 });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/staff/social/settings?gbp=misconfigured", req.url));
  }
}
