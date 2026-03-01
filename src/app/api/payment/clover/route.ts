import { createCloverCheckout } from "@/lib/payment/clover";
import { requireStaffUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface CloverPaymentRequest {
  amount_cents: number;
  description: string;
  customer_email?: string;
}

export async function POST(req: Request) {
  // Staff-only endpoint — only the owner can create payment links from the quote tool
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const body: CloverPaymentRequest = await req.json();
    const { amount_cents, description, customer_email } = body;

    if (!amount_cents || amount_cents <= 0) {
      return Response.json({ error: "Valid amount required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return Response.json({ error: "Description required" }, { status: 400 });
    }

    const result = await createCloverCheckout(
      amount_cents,
      description.trim(),
      customer_email
    );

    return Response.json({
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Payment link creation failed";
    console.error("[payment/clover]", message);
    return Response.json({ error: "Payment link creation failed" }, { status: 500 });
  }
}
