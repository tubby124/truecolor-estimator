/**
 * GET /api/cron/gsc-backfill?days=480
 *
 * One-time historical backfill of Google Search Console data.
 * GSC retains at most 16 months (~480 days) of data.
 *
 * Auth: Bearer ${CRON_SECRET}.
 *
 * Manual run:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        "https://truecolorprinting.ca/api/cron/gsc-backfill?days=480"
 *
 * This calls the same per-day pull as gsc-sync but over a long range.
 * Expect 5-10 minutes for a full 480-day backfill on a busy property.
 * Run AFTER the daily gsc-sync has been verified working at least once.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { pullGscRows } from "@/lib/seo/gsc-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600; // Railway/Next allow up to 600s for this route

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(490, parseInt(url.searchParams.get("days") ?? "480", 10)));
  const lag = parseInt(url.searchParams.get("lag") ?? "3", 10);

  const today = new Date();
  const dateTo = new Date(today);
  dateTo.setUTCDate(today.getUTCDate() - lag);
  const dateFrom = new Date(dateTo);
  dateFrom.setUTCDate(dateTo.getUTCDate() - (days - 1));

  const dateFromStr = ymd(dateFrom);
  const dateToStr = ymd(dateTo);

  const supabase = createServiceClient();
  const startedAt = Date.now();

  let totalRows = 0;
  let totalUpserts = 0;
  let daysProcessed = 0;
  let lastError: string | null = null;

  for (
    let cursor = new Date(dateFrom);
    cursor <= dateTo;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const day = ymd(cursor);

    try {
      const rows = await pullGscRows({ dateFrom: day, dateTo: day });
      totalRows += rows.length;
      daysProcessed += 1;

      if (rows.length === 0) continue;

      const payload = rows.map((r) => ({
        snapshot_date: day,
        query: r.query,
        page: r.page,
        country: r.country,
        device: r.device,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));

      const chunkSize = 1000;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("seo_gsc_snapshots")
          .upsert(chunk, { onConflict: "snapshot_date,query,page,country,device" });
        if (error) throw new Error(`Supabase upsert failed for ${day}: ${error.message}`);
        totalUpserts += chunk.length;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : `Failed on day ${day}`;
      console.error(`[gsc-backfill] ${day} failed:`, lastError);
    }
  }

  await supabase.from("seo_gsc_sync_log").insert({
    date_from: dateFromStr,
    date_to: dateToStr,
    rows_inserted: totalUpserts,
    rows_updated: 0,
    status: lastError ? "partial" : "ok",
    error_message: lastError ? lastError.slice(0, 500) : null,
  });

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[gsc-backfill] DONE | range ${dateFromStr}..${dateToStr} | days ${daysProcessed}/${days} | rows ${totalRows} | upserts ${totalUpserts} | ${elapsedMs}ms`,
  );

  return NextResponse.json({
    ok: !lastError,
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    daysRequested: days,
    daysProcessed,
    rowsPulled: totalRows,
    rowsUpserted: totalUpserts,
    elapsedMs,
    lastError,
  });
}
