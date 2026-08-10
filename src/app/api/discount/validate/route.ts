/**
 * POST /api/discount/validate
 *
 * Validates a discount code for the checkout preview.
 *
 * Auth is OPTIONAL. A Bearer token identifies the customer when present;
 * otherwise the optional `email` in the body is used for the per-account
 * usage check. Guests are allowed on purpose: POST /api/orders is the
 * authoritative re-validation and it already accepts guest-submitted codes
 * (the customer row is keyed on email, not on an auth account), so gating
 * this preview behind a session only stopped guests from entering a code
 * they were legitimately given — while still charging the discounted total.
 *
 * Returns: { valid: true, discount_amount, description, code }
 * Errors: 400 (invalid/expired/already used), 404 (not found), 429 (too many attempts)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // Public route — rate limit per IP so codes can't be enumerated.
    if (!rateLimit(`discount-validate:${getClientIp(req)}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a minute." },
        { status: 429 }
      );
    }

    const { code: rawCode, email: rawEmail } = (await req.json()) as {
      code?: string;
      email?: string;
    };
    if (!rawCode?.trim()) {
      return NextResponse.json({ error: "Enter a discount code." }, { status: 400 });
    }
    const code = rawCode.trim().toUpperCase();

    const supabaseService = createServiceClient();

    // 1. Identify the customer — session token wins, guest email is the fallback.
    //    Either may be absent; the per-account check is skipped when unknown and
    //    POST /api/orders re-runs it against the real customer row before charging.
    let customerEmail: string | null = null;
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data: { user } } = await supabaseService.auth.getUser(token);
      customerEmail = user?.email?.toLowerCase().trim() ?? null;
    }
    if (!customerEmail && rawEmail?.trim()) {
      customerEmail = rawEmail.trim().toLowerCase();
    }

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

    // 5. Check per-account usage — only possible once we know who is ordering.
    if (customerEmail) {
      const { data: customer } = await supabaseService
        .from("customers")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      if (customer) {
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
      }
    }

    // 6. Check global max_uses
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
