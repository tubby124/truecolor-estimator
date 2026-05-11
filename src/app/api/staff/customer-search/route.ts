/**
 * GET /api/staff/customer-search?q=foo
 *
 * Staff-only endpoint. Returns up to 20 customers matching name, email, or company.
 * Used by the Custom Quote modal "Browse customers" picker so staff can quote any
 * past customer in 2 clicks instead of remembering their email.
 *
 * Empty query returns the 20 most-recently-active customers (sorted by last order time).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const ip = getClientIp(req);
  if (!rateLimit(`customer-search:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("customers")
      .select("id, email, name, company, phone, order_count, total_spent, updated_at")
      .limit(20);

    if (q) {
      // Match against email OR name OR company (case-insensitive)
      // Supabase doesn't support OR across columns elegantly without `.or()` syntax
      const safe = q.replace(/[%_]/g, "\\$&");
      query = query.or(`email.ilike.%${safe}%,name.ilike.%${safe}%,company.ilike.%${safe}%`);
    }
    query = query.order("updated_at", { ascending: false, nullsFirst: false });

    const { data, error } = await query;
    if (error) {
      console.error("[customer-search]", error.message);
      return NextResponse.json({ customers: [] });
    }

    return NextResponse.json({
      customers: (data ?? []).map((c) => ({
        id: c.id as string,
        email: c.email as string,
        name: (c.name as string | null) ?? "",
        company: (c.company as string | null) ?? null,
        phone: (c.phone as string | null) ?? null,
        order_count: (c.order_count as number | null) ?? 0,
      })),
    });
  } catch (err) {
    console.error("[customer-search]", err instanceof Error ? err.message : err);
    return NextResponse.json({ customers: [] });
  }
}
