import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/staff/social/accounts
 * Returns connected Blotato social accounts from social_accounts table.
 * If BLOTATO_API_KEY is set, also fetches fresh data from Blotato and syncs.
 */
export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();
  const blotatoKey = process.env.BLOTATO_API_KEY;

  // If Blotato key is set, sync fresh account list
  if (blotatoKey) {
    try {
      const resp = await fetch("https://backend.blotato.com/v2/users/me/accounts", {
        headers: { "blotato-api-key": blotatoKey },
      });

      if (resp.ok) {
        const blotatoAccounts = await resp.json() as Array<{
          id: string;
          platform: string;
          name?: string;
          pageId?: string;
        }>;

        // Upsert each account
        for (const acct of blotatoAccounts) {
          await supabase.from("social_accounts").upsert(
            {
              platform: acct.platform,
              account_name: acct.name ?? null,
              blotato_account_id: acct.id,
              blotato_page_id: acct.pageId ?? null,
              is_active: true,
            },
            { onConflict: "blotato_account_id" }
          );
        }
      }
    } catch {
      // Sync failed — return cached accounts from DB
    }
  }

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .order("platform");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    accounts: data ?? [],
    blotato_connected: !!blotatoKey,
  });
}
