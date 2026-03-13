import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";

const N8N_WEBHOOK_URL = "https://n8n.srv728397.hstgr.cloud/webhook/tc-blitz-drip-test";

export async function POST() {
  try {
    await requireStaffUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "blitz-dashboard", triggered_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "n8n webhook failed", detail: text }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: "Engine triggered" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach n8n", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 502 },
    );
  }
}
