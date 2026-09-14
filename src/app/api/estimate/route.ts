import { NextRequest, NextResponse } from "next/server";
import { estimate } from "@/lib/engine";
import { isPstExemptCategory } from "@/lib/pricing/tax";
import { parseEstimateBody } from "@/lib/engine/parse-request";
import { toPublicEstimateResponse } from "@/lib/engine/public-estimate";
import { claimPublicEstimateRateLimit } from "@/lib/estimate/rate-limit";

function badRequest(message: string) {
  return NextResponse.json(
    { status: "BLOCKED", clarification_notes: [message] },
    { status: 400, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  if (!await claimPublicEstimateRateLimit(req)) {
    return NextResponse.json(
      { status: "BLOCKED", clarification_notes: ["Too many estimate requests. Please wait a moment and try again."] },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const parsed = parseEstimateBody(raw);
  if (!parsed.ok) {
    return badRequest(parsed.message);
  }

  try {
    // skip_min_charge is a staff-only pricing control. Ignore it at the public
    // boundary even when an untrusted caller sends it.
    const publicInput = { ...parsed.value };
    delete publicInput.skip_min_charge;
    const result = estimate(publicInput);
    return NextResponse.json(
      { ...toPublicEstimateResponse(result), pst_exempt: isPstExemptCategory(publicInput.category, publicInput.material_code) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Estimate error:", err);
    return NextResponse.json(
      { status: "BLOCKED", clarification_notes: ["Server error — check input format"] },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
