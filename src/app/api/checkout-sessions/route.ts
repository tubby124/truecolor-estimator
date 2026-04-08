/**
 * POST /api/checkout-sessions
 *
 * TC-9: Captures a checkout session when a customer enters a valid email
 * on the checkout page but hasn't yet placed an order.
 *
 * Called from checkout page onBlur after email validation passes.
 * Non-authenticated — intentionally open, protected by rate limit only.
 * Upserts by email within a 4-hour window to avoid duplicate rows per session.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`checkout-session:${ip}`, 10, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { email?: string; name?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createServiceClient();

    // If a session already exists for this email in the last 4 hours, skip insert
    // (avoids a new row every time they tab through the field)
    const windowStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("checkout_sessions")
      .select("id")
      .eq("email", email)
      .gt("created_at", windowStart)
      .maybeSingle();

    if (!existing) {
      await supabase.from("checkout_sessions").insert({
        email,
        name: body.name?.trim() || null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
