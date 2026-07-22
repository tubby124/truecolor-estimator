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
import { recordAuditEvent } from "@/lib/audit/record";

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
    const { data: updated, error } = await supabase
      .from("quote_requests")
      .update({
        is_archived: body.archived,
        archived_at: body.archived ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id, lifecycle_status")
      .maybeSingle();

    if (error || !updated) {
      console.error("[staff/quotes/archive] lifecycle update failed:", error?.message ?? "quote not found");
      return NextResponse.json({ error: "Could not update quote lifecycle" }, { status: error ? 500 : 404 });
    }

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: body.archived ? "quote.archived" : "quote.unarchived",
      entity_type: "quote",
      entity_id: id,
      detail: { archived: body.archived },
    });

    return NextResponse.json({ ok: true, archived: body.archived, lifecycle_status: updated.lifecycle_status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Archive failed" },
      { status: 500 }
    );
  }
}
