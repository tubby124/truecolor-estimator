/**
 * GET /api/cron/gsc-sync
 *
 * Daily pull of Google Search Console data into Supabase.
 *
 * GSC data has a ~2-3 day lag. We pull a 7-day window ending 3 days ago
 * so the latest snapshot is always finalized.
 *
 * Auth: Bearer ${CRON_SECRET}.
 *
 * Manual run (after Railway env vars are set):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://truecolorprinting.ca/api/cron/gsc-sync
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { pullGscRows } from "@/lib/seo/gsc-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const daysParam = parseInt(url.searchParams.get("days") ?? "7", 10);
  const lagParam = parseInt(url.searchParams.get("lag") ?? "3", 10);

  const today = new Date();
  const dateTo = new Date(today);
  dateTo.setUTCDate(today.getUTCDate() - lagParam);
  const dateFrom = new Date(dateTo);
  dateFrom.setUTCDate(dateTo.getUTCDate() - (daysParam - 1));

  const dateFromStr = ymd(dateFrom);
  const dateToStr = ymd(dateTo);

  const supabase = createServiceClient();
  const startedAt = Date.now();

  try {
    // Pull one row per (date, query, page). We loop the date range ourselves
    // so each row gets its actual snapshot_date instead of an aggregated range.
    let totalRows = 0;
    let totalUpserts = 0;

    for (
      let cursor = new Date(dateFrom);
      cursor <= dateTo;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const day = ymd(cursor);
      const rows = await pullGscRows({ dateFrom: day, dateTo: day });
      totalRows += rows.length;

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

      // Upsert in chunks of 1000 to stay under Supabase request limits.
      const chunkSize = 1000;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("seo_gsc_snapshots")
          .upsert(chunk, { onConflict: "snapshot_date,query,page,country,device" });
        if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
        totalUpserts += chunk.length;
      }
    }

    await supabase.from("seo_gsc_sync_log").insert({
      date_from: dateFromStr,
      date_to: dateToStr,
      rows_inserted: totalUpserts,
      rows_updated: 0,
      status: "ok",
    });

    const elapsedMs = Date.now() - startedAt;
    console.log(
      `[gsc-sync] OK | range ${dateFromStr}..${dateToStr} | rows ${totalRows} | upserts ${totalUpserts} | ${elapsedMs}ms`,
    );

    return NextResponse.json({
      ok: true,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      rowsPulled: totalRows,
      rowsUpserted: totalUpserts,
      elapsedMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "GSC sync failed";
    console.error("[gsc-sync] ERROR:", message);

    await supabase.from("seo_gsc_sync_log").insert({
      date_from: dateFromStr,
      date_to: dateToStr,
      rows_inserted: 0,
      rows_updated: 0,
      status: "error",
      error_message: message.slice(0, 500),
    });

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
