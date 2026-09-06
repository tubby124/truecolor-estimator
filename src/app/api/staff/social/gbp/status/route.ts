import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSocialBusiness, socialBusinessScopingEnabled } from "@/lib/social/business";
import { gbpConfigured } from "@/lib/gbp/oauth";
import { connectionRequest, locationParent, readGbpConnection } from "@/lib/gbp/client";
import { expectedGbpIdentity, verifyGbpLocation } from "@/lib/gbp/discovery";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  const enabled = socialBusinessScopingEnabled(), configured = gbpConfigured();
  if (!enabled || !configured) return NextResponse.json({ connected: false, configured, enabled, error: !enabled ? "Business-scoped Google setup awaits migration activation" : "Complete the Google OAuth configuration before connecting" });
  try {
    const db = createServiceClient();
    const connection = await readGbpConnection(db, auth.businessId);
    if (!connection) return NextResponse.json({ connected: false, configured, enabled, connection: null });
    const safe = { location_title: connection.location_title, location_name: connection.location_name, location_address: connection.location_address, connected_at: connection.connected_at, last_verified_at: connection.last_verified_at };
    try {
      const request = await connectionRequest(connection);
      const parent = locationParent(connection.google_account_name, connection.location_name);
      const location = await verifyGbpLocation(request, parent, await expectedGbpIdentity(db, auth.businessId));
      await request(`https://mybusiness.googleapis.com/v4/${parent}/localPosts?pageSize=1`);
      const now = new Date().toISOString();
      const { error } = await db.from("social_gbp_connections").update({ last_verified_at: now, last_error: null }).eq("business_id", auth.businessId).eq("location_name", parent);
      return NextResponse.json({ connected: true, configured, enabled, checkedAt: now, readAccess: true, publishCapability: location.metadata?.canOperateLocalPost === true ? "reported_available" : "unverified", connection: { ...safe, last_verified_at: error ? safe.last_verified_at : now }, ...(error ? { warning: "Live read succeeded but verification timestamp could not be saved" } : {}) });
    } catch {
      const error = "Live Google access could not be verified. Check API approval/quota, credentials, and the listing address; reconnect if needed.";
      await db.from("social_gbp_connections").update({ last_error: error }).eq("business_id", auth.businessId);
      return NextResponse.json({ connected: false, configured, enabled, connection: safe, error });
    }
  } catch { return NextResponse.json({ error: "Unable to read Google connection status" }, { status: 500 }); }
}
