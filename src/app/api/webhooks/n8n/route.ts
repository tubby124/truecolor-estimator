import { NextResponse } from "next/server";
import { constantTimeSecretEqual } from "@/lib/webhooks/shared-secret";

export const dynamic = "force-dynamic";

/** Legacy callbacks cannot write receipts for the directly published approval pilot. */
export async function POST(req: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  if (!constantTimeSecretEqual(req.headers.get("x-n8n-secret"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // No lookup/write split: a delayed callback must never race a new approval.
  return NextResponse.json({ error: "Legacy social callbacks are retired; review delivery in Social Studio" }, { status: 410 });
}
