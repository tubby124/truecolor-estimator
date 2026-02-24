/**
 * GET /api/cron/keepalive
 *
 * Daily Vercel Cron job that pings Supabase to prevent free-tier project pausing.
 * Supabase free tier pauses projects after 7 days of inactivity — this prevents that.
 *
 * Schedule: 0 12 * * *  (noon UTC / 6 AM Saskatchewan time, daily)
 * Configured in: vercel.json → crons
 *
 * Auth: Vercel automatically sends Authorization: Bearer ${CRON_SECRET} header.
 * Set CRON_SECRET in Vercel Dashboard → Project → Settings → Environment Variables.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // Verify request is from Vercel Cron (or a trusted caller with the secret)
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Lightweight ping — just count orders (HEAD request to avoid row data)
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[keepalive] Supabase ping failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const timestamp = new Date().toISOString();
    console.log(`[keepalive] Supabase ping OK | orders: ${count ?? 0} | ${timestamp}`);
    return NextResponse.json({ ok: true, orderCount: count ?? 0, timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Keepalive failed";
    console.error("[keepalive] unexpected error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
