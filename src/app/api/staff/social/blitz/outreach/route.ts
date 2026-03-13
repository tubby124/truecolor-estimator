import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest) {
  try {
    await requireStaffUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await req.json();
  if (!leadId || typeof leadId !== "string" || !UUID_RE.test(leadId)) {
    return NextResponse.json({ error: "Invalid leadId" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("tc_leads")
    .update({ manual_outreach_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
