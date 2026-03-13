import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";

const N8N_WEBHOOK_URL = process.env.N8N_BLITZ_WEBHOOK_URL;

let lastTriggeredAt = 0;
const COOLDOWN_MS = 30_000;

export async function POST() {
  try {
    await requireStaffUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const now = Date.now();
  if (now - lastTriggeredAt < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastTriggeredAt)) / 1000);
    return NextResponse.json({ error: `Cooldown active — try again in ${wait}s` }, { status: 429 });
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "blitz-dashboard", triggered_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "n8n webhook failed" }, { status: 502 });
    }

    lastTriggeredAt = now;
    return NextResponse.json({ ok: true, message: "Engine triggered" });
  } catch {
    return NextResponse.json({ error: "Failed to reach n8n" }, { status: 502 });
  }
}
