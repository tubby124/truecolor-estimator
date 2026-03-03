/**
 * POST /api/discount/validate
 *
 * Validates a discount code for the currently logged-in customer.
 * Requires a valid Supabase session (Authorization: Bearer <access_token>).
 *
 * Returns: { valid: true, discount_amount, description, code }
 * Errors: 401 (not logged in), 400 (invalid/expired/already used), 404 (not found)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract and verify session
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json(
        { error: "Sign in to use a discount code." },
        { status: 401 }
      );
    }

    // Verify the access token by calling Supabase auth
    const supabaseService = createServiceClient();
    const { data: { user }, error: authErr } = await supabaseService.auth.getUser(token);
    if (authErr || !user?.email) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const { code: rawCode } = (await req.json()) as { code?: string };
    if (!rawCode?.trim()) {
      return NextResponse.json({ error: "Enter a discount code." }, { status: 400 });
    }
    const code = rawCode.trim().toUpperCase();

    // 2. Look up the code (case-insensitive)
    const { data: discountCode, error: codeErr } = await supabaseService
      .from("discount_codes")
      .select("id, code, discount_amount, description, is_active, requires_account, per_account_limit, max_uses, expires_at")
      .ilike("code", code)
      .maybeSingle();

    if (codeErr || !discountCode) {
      return NextResponse.json({ error: "Invalid discount code." }, { status: 404 });
    }

    // 3. Check active
    if (!discountCode.is_active) {
      return NextResponse.json({ error: "This discount code is no longer active." }, { status: 400 });
    }

    // 4. Check expiry
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({ error: "This discount code has expired." }, { status: 400 });
    }

    // 5. Find customer by email
    const { data: customer } = await supabaseService
      .from("customers")
      .select("id")
      .eq("email", user.email.toLowerCase().trim())
      .maybeSingle();

    if (!customer) {
      // Customer hasn't placed an order yet — code is valid (they're logged in, account exists)
      // Allow it through; redemption will create the customer row if needed during order
      return NextResponse.json({
        valid: true,
        code: discountCode.code,
        discount_amount: Number(discountCode.discount_amount),
        description: discountCode.description ?? `${discountCode.code} discount`,
      });
    }

    // 6. Check per-account usage
    const { count: usedCount } = await supabaseService
      .from("discount_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("code_id", discountCode.id)
      .eq("customer_id", customer.id);

    if ((usedCount ?? 0) >= discountCode.per_account_limit) {
      return NextResponse.json(
        { error: "You've already used this discount code." },
        { status: 400 }
      );
    }

    // 7. Check global max_uses
    if (discountCode.max_uses !== null) {
      const { count: totalUsed } = await supabaseService
        .from("discount_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("code_id", discountCode.id);

      if ((totalUsed ?? 0) >= discountCode.max_uses) {
        return NextResponse.json(
          { error: "This discount code has reached its usage limit." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      discount_amount: Number(discountCode.discount_amount),
      description: discountCode.description ?? `${discountCode.code} discount`,
    });
  } catch (err) {
    console.error("[discount/validate]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not validate code. Try again." }, { status: 500 });
  }
}

