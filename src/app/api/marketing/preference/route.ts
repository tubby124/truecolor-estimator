import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** One-time historical customer preference action. The database RPC claims the
 * token and records the preference in one transaction, so a partial write
 * cannot consume a customer's only choice link. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { token?: unknown; choice?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const choice = body?.choice === "accept" || body?.choice === "decline" ? body.choice : null;
  if (!token || !choice) return NextResponse.json({ error: "Invalid preference link" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: redeemed, error } = await supabase.rpc(
    "redeem_marketing_preference_token",
    { p_token: token, p_choice: choice },
  );
  if (error) {
    console.error("[marketing-preference] redemption failed:", error.message);
    return NextResponse.json({ error: "Could not save preference" }, { status: 500 });
  }
  if (!redeemed) {
    return NextResponse.json({ error: "This preference link is expired or already used" }, { status: 410 });
  }
  return NextResponse.json({ ok: true, subscribed: choice === "accept" });
}
