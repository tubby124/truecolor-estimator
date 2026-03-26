/**
 * GET /api/account/quotes
 * Returns the logged-in customer's quote requests (by email match).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

async function getAuthenticatedEmail(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

export async function GET(req: NextRequest) {
  const email = await getAuthenticatedEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY ?? "");
  const { data, error } = await admin
    .from("quote_requests")
    .select("id, created_at, items, replied_at, staff_note, reply_body")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[account/quotes]", error.message);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }

  return NextResponse.json({ quotes: data ?? [] });
}
