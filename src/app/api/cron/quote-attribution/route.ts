/**
 * GET /api/cron/quote-attribution
 *
 * Attributes newly paid orders to the quote request that produced them, by
 * customer email inside a 60-day window. Complements the structured Pay Now
 * path, which sets orders.quote_request_id directly.
 *
 * Writes only to quote_requests — never to orders — so the Google Ads
 * conversion outbox trigger (ON public.orders) is unaffected.
 *
 * Schedule: hourly via .github/workflows/cron-quote-attribution.yml
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordCronRun } from "@/lib/cron/heartbeat";

// The matcher is greedy: one order per quote and one quote per order per pass.
// A customer with several quotes and several orders needs one pass per pair.
const MAX_PASSES = 10;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    let attributed = 0;
    let passes = 0;

    for (let i = 0; i < MAX_PASSES; i++) {
      const { data, error } = await supabase.rpc("attribute_quote_conversions", {
        p_window_days: 60,
        p_dry_run: false,
      });

      if (error) {
        await recordCronRun("quote-attribution", false, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      passes = i + 1;
      const matched = Array.isArray(data) ? data.length : 0;
      attributed += matched;
      if (matched === 0) break;
    }

    await recordCronRun("quote-attribution", true, `attributed=${attributed} passes=${passes}`);
    return NextResponse.json({ ok: true, attributed, passes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await recordCronRun("quote-attribution", false, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
