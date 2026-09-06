import { requireSocialBusiness, DEFAULT_SOCIAL_BUSINESS_ID } from "@/lib/social/business";
import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL = process.env.N8N_BLITZ_WEBHOOK_URL;

let lastTriggeredAt = 0;
const COOLDOWN_MS = 30_000;

export async function POST(req?: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.businessId !== DEFAULT_SOCIAL_BUSINESS_ID) return NextResponse.json({ error: "Blitz is only available for True Color" }, { status: 403 });

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
