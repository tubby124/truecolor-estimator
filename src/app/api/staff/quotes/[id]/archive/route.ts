/**
 * POST /api/staff/quotes/[id]/archive
 *
 * Soft-deletes a quote_requests row by setting is_archived=true + archived_at=NOW().
 * Toggles back to active when body.archived === false.
 *
 * Requires migration: supabase/migrations/20260511_quote_requests_archive_and_total.sql
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as { archived: boolean };

    if (typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "Missing 'archived' boolean" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("quote_requests")
      .update({
        is_archived: body.archived,
        archived_at: body.archived ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, archived: body.archived });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Archive failed" },
      { status: 500 }
    );
  }
}
