/**
 * GET /api/staff/flyer-pricing
 *
 * Staff-only. Returns the full flyer catalog priced through the SAME engine the
 * website uses (see src/lib/data/flyer-catalog.ts). The staff manual-order modal
 * fetches this once so its flyer prices are guaranteed to match the live site.
 */

import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/supabase/server";
import { getFlyerCatalog } from "@/lib/data/flyer-catalog";

export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ skus: getFlyerCatalog() });
}
