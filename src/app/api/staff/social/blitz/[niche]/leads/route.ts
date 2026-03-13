import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ niche: string }> }
) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const { niche } = await params;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const search = url.searchParams.get("q") ?? "";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createServiceClient();

  let query = supabase
    .from("tc_leads")
    .select("id, business_name, email, phone, city, score, drip_status, drip_step, drip_niche, next_email_at, last_brevo_message_id, emails_sent, emails_opened, rating, review_count", { count: "exact" })
    .contains("industry_tags", [niche])
    .order("score", { ascending: false })
    .range(from, to);

  if (status && status !== "all") {
    query = query.eq("drip_status", status);
  }

  if (search.trim()) {
    query = query.ilike("business_name", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    leads: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
