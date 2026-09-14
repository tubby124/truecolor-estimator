import { NextRequest, NextResponse } from "next/server";
import { estimate } from "@/lib/engine";
import { parseEstimateBody } from "@/lib/engine/parse-request";
import { requireStaffUser } from "@/lib/supabase/server";

function badRequest(message: string) {
  return NextResponse.json(
    { status: "BLOCKED", clarification_notes: [message] },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

/** Staff-only full engine response for margin, cost, and rule review. */
export async function POST(req: NextRequest) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) {
    auth.headers.set("Cache-Control", "no-store");
    return auth;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const parsed = parseEstimateBody(raw);
  if (!parsed.ok) return badRequest(parsed.message);

  try {
    return NextResponse.json(
      { ...estimate(parsed.value), estimate_request: parsed.value },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Staff estimate error:", err);
    return badRequest("Server error — check input format");
  }
}
