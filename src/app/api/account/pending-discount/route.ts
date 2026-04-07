/**
 * GET /api/account/pending-discount
 *
 * Returns the staff-assigned pending discount code for the logged-in customer.
 * Used by /checkout to auto-apply the code on page load.
 *
 * Returns: { code: string | null }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

async function getAuthenticatedEmail(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  return user.email.toLowerCase();
}

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? "";
  return createClient(SUPABASE_URL, serviceKey);
}

export async function GET(req: NextRequest) {
  const email = await getAuthenticatedEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  try {
    const { data } = await admin
      .from("customers")
      .select("pending_discount_code")
      .eq("email", email)
      .maybeSingle();

    return NextResponse.json({ code: (data as { pending_discount_code?: string | null } | null)?.pending_discount_code ?? null });
  } catch (err) {
    console.error("[pending-discount] GET error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ code: null });
  }
}
