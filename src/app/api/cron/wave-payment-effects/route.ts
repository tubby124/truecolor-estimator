import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { processWavePaymentEffects } from "@/lib/payment/wave-payment-effects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest, secret: string): boolean {
  const supplied =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(secret);
  return (
    suppliedBytes.length === expectedBytes.length &&
    timingSafeEqual(suppliedBytes, expectedBytes)
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processWavePaymentEffects({ maxJobs: 10 });
    const ok = result.retried === 0 && result.dead === 0;
    const detail =
      `claimed=${result.claimed} sent=${result.sent} ` +
      `retry=${result.retried} dead=${result.dead}`;
    await recordCronRun("wave-payment-effects", ok, detail);
    return NextResponse.json({ ok, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Wave payment effect worker failed";
    console.error("[wave-payment-effects]", message);
    await recordCronRun("wave-payment-effects", false, message.slice(0, 200));
    return NextResponse.json(
      { ok: false, error: "Wave payment effect worker failed" },
      { status: 503 },
    );
  }
}
