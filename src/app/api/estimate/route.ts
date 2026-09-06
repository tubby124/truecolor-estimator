import { NextRequest, NextResponse } from "next/server";
import { estimate } from "@/lib/engine";
import { isPstExemptCategory } from "@/lib/pricing/tax";
import { parseEstimateBody } from "@/lib/engine/parse-request";

function badRequest(message: string) {
  return NextResponse.json(
    { status: "BLOCKED", clarification_notes: [message] },
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
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
    const result = estimate(parsed.value);
    return NextResponse.json({ ...result, estimate_request: parsed.value, pst_exempt: isPstExemptCategory(parsed.value.category, parsed.value.material_code) });
  } catch (err) {
    console.error("Estimate error:", err);
    return NextResponse.json(
      { status: "BLOCKED", clarification_notes: ["Server error — check input format"] },
      { status: 400 }
    );
  }
}
