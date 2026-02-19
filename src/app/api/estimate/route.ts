import { NextRequest, NextResponse } from "next/server";
import { estimate } from "@/lib/engine";
import type { EstimateRequest } from "@/lib/engine/types";

export async function POST(req: NextRequest) {
  try {
    const body: EstimateRequest = await req.json();
    const result = estimate(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Estimate error:", err);
    return NextResponse.json(
      { status: "BLOCKED", clarification_notes: ["Server error — check input format"] },
      { status: 400 }
    );
  }
}
