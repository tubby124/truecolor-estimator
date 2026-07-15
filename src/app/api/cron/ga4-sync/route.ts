/**
 * GET /api/cron/ga4-sync
 *
 * Daily pull of GA4 organic-traffic data into Supabase. Mirrors the
 * gsc-sync route pattern (per-day snapshots, recordCronRun heartbeat,
 * sync-log table for forensic audit).
 *
 * GA4 has near-zero ingestion lag (data lands within 24-48h) compared to
 * GSC's 2-3 day lag. We pull a 7-day window ending 2 days ago so the data
 * is stable.
 *
 * Auth: Bearer ${CRON_SECRET}.
 *
 * Manual run (after Railway env vars are set):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://truecolorprinting.ca/api/cron/ga4-sync
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { pullGa4OrganicRows } from "@/lib/seo/ga4-client";
import { recordCronRun } from "@/lib/cron/heartbeat";

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
  const lagParam = parseInt(url.searchParams.get("lag") ?? "2", 10);
  if (!Number.isInteger(daysParam) || daysParam < 1 || daysParam > 31) {
    return NextResponse.json({ error: "days must be an integer from 1 to 31" }, { status: 400 });
  }
  if (!Number.isInteger(lagParam) || lagParam < 0 || lagParam > 14) {
    return NextResponse.json({ error: "lag must be an integer from 0 to 14" }, { status: 400 });
  }

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
    let totalRows = 0;
    let totalUpserts = 0;
    const rowsByDay: Array<{ day: string; rows: Awaited<ReturnType<typeof pullGa4OrganicRows>> }> = [];

    // Finish every GA4 read before replacing stored rows. An upstream failure
    // therefore leaves the existing reporting window intact.
    for (
      let cursor = new Date(dateFrom);
      cursor <= dateTo;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const day = ymd(cursor);
      const rows = await pullGa4OrganicRows({ dateFrom: day, dateTo: day });
      totalRows += rows.length;
      rowsByDay.push({ day, rows });
    }

    for (const { day, rows } of rowsByDay) {
      const { error: deleteError } = await supabase
        .from("analytics_ga4_snapshots")
        .delete()
        .eq("snapshot_date", day)
        .eq("source_medium", "organic");
      if (deleteError) throw new Error(`Supabase daily replacement failed: ${deleteError.message}`);

      if (rows.length === 0) continue;

      const payload = rows.map((r) => ({
        snapshot_date: day,
        page_path: r.page_path,
        sessions: r.sessions,
        engaged_sessions: r.engaged_sessions,
        conversions: r.conversions,
        source_medium: "organic",
      }));

      const chunkSize = 1000;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("analytics_ga4_snapshots")
          .upsert(chunk, { onConflict: "snapshot_date,page_path,source_medium" });
        if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
        totalUpserts += chunk.length;
      }
    }

    await supabase.from("analytics_ga4_sync_log").insert({
      date_from: dateFromStr,
      date_to: dateToStr,
      rows_inserted: totalUpserts,
      rows_updated: 0,
      status: "ok",
    });

    const elapsedMs = Date.now() - startedAt;
    console.log(
      `[ga4-sync] OK | range ${dateFromStr}..${dateToStr} | rows ${totalRows} | upserts ${totalUpserts} | ${elapsedMs}ms`,
    );

    await recordCronRun("ga4-sync", true, `rows=${totalRows} upserts=${totalUpserts} ${elapsedMs}ms`);
    return NextResponse.json({
      ok: true,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      rowsPulled: totalRows,
      rowsUpserted: totalUpserts,
      elapsedMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "GA4 sync failed";
    console.error("[ga4-sync] ERROR:", message);

    await supabase.from("analytics_ga4_sync_log").insert({
      date_from: dateFromStr,
      date_to: dateToStr,
      rows_inserted: 0,
      rows_updated: 0,
      status: "error",
      error_message: message.slice(0, 500),
    });

    await recordCronRun("ga4-sync", false, message.slice(0, 200));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
