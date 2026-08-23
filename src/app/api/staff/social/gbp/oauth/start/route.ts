import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { createOAuthState, getGbpOAuthClient, GBP_SCOPE, oauthStateCookie } from "@/lib/gbp/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { value, cookieValue } = createOAuthState();
    const url = getGbpOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [GBP_SCOPE],
      state: value,
    });
    const response = NextResponse.redirect(url);
    response.cookies.set(oauthStateCookie(), cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/api/staff/social/gbp/oauth",
      maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/staff/social/settings?gbp=misconfigured", process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca"));
  }
}
