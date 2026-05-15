/**
 * POST /api/email/unsubscribe-one-click
 *
 * RFC 8058 (Gmail Feb 2024 bulk-sender requirement) one-click unsubscribe endpoint.
 *
 * Gmail's unsubscribe button hits this URL with:
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: List-Unsubscribe=One-Click
 *
 * The recipient email is identified via the ?email= URL parameter (placed by
 * smtp.ts when it builds the per-recipient List-Unsubscribe header).
 *
 * Behaviour:
 *   - Flips customers.marketing_consent → false and stamps consent_at
 *   - Idempotent (re-clicks return 200 silently)
 *   - Returns 200 even when the email isn't in our table (don't leak membership)
 *   - GET also accepted as a fallback for clients that don't honour POST One-Click
 *
 * Missing this endpoint is what causes Gmail to junk transactional emails wholesale
 * (same bug fixed on hasansharif.ca commit e1f10d9 / 2026-05-14).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function unsubscribe(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return;

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Update existing customer record. If no row exists, we still 200 the caller
  // (don't leak whether the email is in our DB).
  const { error } = await supabase
    .from("customers")
    .update({
      marketing_consent: false,
      consent_at: now,
    })
    .eq("email", normalized);

  if (error) {
    console.error("[unsubscribe-one-click] supabase update failed:", error.message);
  } else {
    console.log(`[unsubscribe-one-click] ${normalized} opted out`);
  }
}

export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  await unsubscribe(email);
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  await unsubscribe(email);
  // Redirect to the human-friendly confirmation page so the customer sees a result
  const url = new URL("/unsubscribe", req.url);
  if (email) url.searchParams.set("email", email);
  url.searchParams.set("done", "1");
  return NextResponse.redirect(url);
}
