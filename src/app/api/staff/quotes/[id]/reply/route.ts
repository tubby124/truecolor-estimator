/**
 * PATCH /api/staff/quotes/[id]/reply
 *
 * Marks a quote request as replied (sets replied_at timestamp).
 * Optionally saves a staff note.
 * Toggle: call again to undo (clear replied_at).
 *
 * Requires migration: supabase/migrations/20260325_quote_requests_status.sql
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as { replied: boolean; staff_note?: string };

    const supabase = createServiceClient();

    const update: Record<string, unknown> = {
      replied_at: body.replied ? new Date().toISOString() : null,
    };
    if (typeof body.staff_note === "string") {
      update.staff_note = body.staff_note.trim() || null;
    }

    const { error } = await supabase
      .from("quote_requests")
      .update(update)
      .eq("id", id);

    if (error) {
      console.error("[staff/quotes/reply]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, replied: body.replied });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update quote";
    console.error("[staff/quotes/reply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
