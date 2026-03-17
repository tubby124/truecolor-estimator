/**
 * GET /api/staff/customer-lookup?email=customer@example.com
 *
 * Staff-only endpoint. Looks up a customer by email and returns profile info
 * + order count. Used by the manual-order form to show "returning customer"
 * badges and auto-fill name/company/phone fields.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  // Rate limit: 30 lookups per minute per staff session
  const ip = getClientIp(req);
  if (!rateLimit(`customer-lookup:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ exists: false });
  }

  try {
    const supabase = createServiceClient();

    // Look up customer row + order count in one query
    const { data: customer } = await supabase
      .from("customers")
      .select("id, name, company, phone")
      .eq("email", email)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ exists: false });
    }

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customer.id);

    return NextResponse.json({
      exists: true,
      name: customer.name ?? "",
      company: customer.company ?? null,
      phone: customer.phone ?? null,
      orderCount: count ?? 0,
    });
  } catch (err) {
    console.error("[customer-lookup]", err instanceof Error ? err.message : err);
    return NextResponse.json({ exists: false });
  }
}
