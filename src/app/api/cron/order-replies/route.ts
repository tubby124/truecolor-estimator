/**
 * GET /api/cron/order-replies
 *
 * Polls the info@ Workspace inbox for exact tokenized order reply addresses.
 * The scan deliberately overlaps previous runs; the Gmail mailbox/message ID
 * unique key makes those overlaps idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { syncOrderReplies } from "@/lib/email/orderReplySync";
import { sanitizeError } from "@/lib/errors/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretsMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!secretsMatch(req.headers.get("Authorization") ?? "", `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const hours = Number(url.searchParams.get("hours") ?? "72");
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
    return NextResponse.json({ error: "hours must be an integer from 1 to 720" }, { status: 400 });
  }
  const dryRun = url.searchParams.get("dryRun") === "1";
  if (process.env.ORDER_REPLY_SYNC_ENABLED !== "true" && !dryRun) {
    return NextResponse.json({ ok: true, enabled: false, writeEnabled: false });
  }
  const writeEnabled = process.env.ORDER_REPLY_SYNC_ENABLED === "true" && !dryRun;
  const startedAt = Date.now();

  try {
    const result = await syncOrderReplies({ hours, dryRun });
    const elapsedMs = Date.now() - startedAt;
    if (result.pageLimitReached) {
      if (result.writeEnabled) {
        await recordCronRun(
          "order-replies",
          false,
          `Incomplete mailbox scan: reached ${result.pages}-page safety limit`
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: "Mailbox scan reached its safety limit; staff review is required.",
          elapsedMs,
          ...result,
        },
        { status: 503 }
      );
    }
    if (result.writeEnabled) {
      await recordCronRun(
        "order-replies",
        true,
        `scanned=${result.scanned} inserted=${result.inserted} duplicates=${result.duplicates} ${elapsedMs}ms`
      );
    }
    return NextResponse.json({ ok: true, elapsedMs, ...result });
  } catch (error) {
    console.error("[order-replies] sync failed", error);
    if (writeEnabled) {
      await recordCronRun("order-replies", false, "Order reply sync failed");
    }
    return NextResponse.json({ ok: false, error: sanitizeError(error) }, { status: 500 });
  }
}
