import { NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await createServiceClient()
    .from("gbp_connections")
    .select("location_title, connected_at, last_verified_at, last_error")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to read GBP connection status" }, { status: 500 });
  return NextResponse.json({ connected: !!data, connection: data ?? null });
}
