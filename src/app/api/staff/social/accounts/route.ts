import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSocialBusiness, scopeSocialQuery, DEFAULT_SOCIAL_BUSINESS_ID } from "@/lib/social/business";
import { getMetaConfig } from "@/lib/social/meta";

export const dynamic = "force-dynamic";

/** Read-only status. Fetching settings never syncs accounts or changes destinations. */
export async function GET(req?: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await scopeSocialQuery(createServiceClient().from("social_accounts")
    .select("id,platform,account_name,blotato_account_id,blotato_page_id,is_active,connected_at")
    .order("platform"), auth.businessId);
  if (error) return NextResponse.json({ error: "Account status unavailable" }, { status: 503 });
  const meta = auth.businessId === DEFAULT_SOCIAL_BUSINESS_ID ? getMetaConfig() : null;
  return NextResponse.json({
    accounts: data ?? [],
    blotato_connected: auth.businessId === DEFAULT_SOCIAL_BUSINESS_ID && !!process.env.BLOTATO_API_KEY,
    meta: {
      configured: !!meta,
      facebook: meta ? { accountId: meta.pageId } : null,
      instagram: meta ? { accountId: meta.igUserId, pageId: meta.pageId } : null,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
