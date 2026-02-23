/**
 * GET /account/callback
 * Exchanges Supabase magic-link ?code= for a session, then redirects to /account
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/account", req.url));
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabase = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false } });
  await supabase.auth.exchangeCodeForSession(code).catch(() => null);
  return NextResponse.redirect(new URL("/account", req.url));
}
