/**
 * GET /api/cron/process-blitz-replies
 *
 * Scans info@true-color.ca for replies to the industry-blitz cold drip and
 * suppresses the matched leads so the n8n drip stops emailing anyone who
 * replied. Opt-outs are unsubscribed + Brevo-blacklisted; any other reply
 * pauses the cold drip and pings Telegram for a human follow-up.
 *
 * Auth: Bearer ${CRON_SECRET}.
 *
 * Query params:
 *   ?hours=N   — lookback window (default 72; overlap is safe — idempotent)
 *   ?dryRun=1  — classify + match only, no writes/blacklist/alerts
 *
 * Manual run:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        "https://truecolorprinting.ca/api/cron/process-blitz-replies?dryRun=1"
 */

import { NextRequest, NextResponse } from "next/server";
import { processBlitzReplies } from "@/lib/blitz/process-replies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const hours = Math.min(720, Math.max(1, parseInt(url.searchParams.get("hours") ?? "72", 10)));
  const dryRun = url.searchParams.get("dryRun") === "1";

  const startedAt = Date.now();
  try {
    const result = await processBlitzReplies({ hours, dryRun });
    return NextResponse.json({ ok: true, ms: Date.now() - startedAt, ...result });
  } catch (err) {
    console.error("[process-blitz-replies] failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
