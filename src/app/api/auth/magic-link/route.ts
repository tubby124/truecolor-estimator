/**
 * POST /api/auth/magic-link
 *
 * Sends a Supabase magic link (OTP email) to the given address.
 * The customer clicks the link → lands on /account/callback → Supabase sets session.
 *
 * Body: { email: string }
 * Returns: { sent: true } or { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!anonKey) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, anonKey, {
      auth: { persistSession: false },
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://truecolor-estimator-o2q38cgso-tubby124s-projects.vercel.app";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${siteUrl}/account/callback`,
      },
    });

    if (error) {
      console.error("[magic-link]", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send link";
    console.error("[magic-link]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
