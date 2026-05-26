/**
 * POST /api/staff/orders/[id]/reprice
 *
 * Staff repriced an order. Body:
 *   { new_total: number, reason: string, explanation?: string }
 *
 * Flow:
 *   1. Auth-gate (staff only).
 *   2. Load order + customer.
 *   3. Validate new_total within bounds (must be > 0 and < 5× original — guards typo bombs).
 *   4. Compute delta = new - original.
 *   5. If delta > 0, mint a Clover Pay Now token for the delta amount.
 *      The token's description encodes the order number so staff can trace
 *      the followup payment back to this reprice in Clover.
 *   6. Send the customer the reprice email (INCREASE / DECREASE / NO_CHANGE).
 *   7. Update orders.total + orders.staff_notes (audit log on the row).
 *   8. Write an audit_events row for the reprice itself.
 *
 * Does NOT yet handle the refund leg (Clover refund API + Wave adjustment).
 * That's tracked separately — for DECREASE we email the customer informing
 * them the refund will arrive in 3-5 days; staff manually processes the
 * refund in Clover until the refund route ships.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { encodePaymentToken } from "@/lib/payment/token";
import { sendOrderRepriceEmail } from "@/lib/email/orderReprice";
import { recordAuditEvent, extractRequestContext } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";

interface Params {
  params: Promise<{ id: string }>;
}

const VALID_REASONS = new Set([
  "DESIGN_COMPLEXITY",
  "LARGER_THAN_QUOTED",
  "MATERIAL_UPGRADE",
  "ADD_ON",
  "OTHER",
]);

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      new_total?: number;
      reason?: string;
      explanation?: string;
    };

    const newTotal = Number(body.new_total);
    const reason = String(body.reason ?? "OTHER").toUpperCase();
    const explanation = (body.explanation ?? "").toString().trim().slice(0, 500) || null;

    if (!Number.isFinite(newTotal) || newTotal <= 0) {
      return NextResponse.json({ error: "Invalid new_total" }, { status: 400 });
    }
    if (!VALID_REASONS.has(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }
    if (reason === "OTHER" && !explanation) {
      return NextResponse.json({ error: "Explanation required for 'Other'" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, order_number, total, status, customer_id, staff_notes, customers ( name, email )")
      .eq("id", id)
      .maybeSingle();

    if (oErr || !order) {
      return NextResponse.json({ error: oErr?.message ?? "Order not found" }, { status: 404 });
    }

    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!customer?.email) {
      return NextResponse.json({ error: "Order has no customer email" }, { status: 400 });
    }

    const originalTotal = Number(order.total ?? 0);
    const delta = Math.round((newTotal - originalTotal) * 100) / 100;

    // Sanity gate — block typo bombs (e.g. accidentally entered $5500 instead of $55).
    // 5x original is the threshold from the vault spec.
    if (newTotal > originalTotal * 5 && originalTotal > 0) {
      return NextResponse.json(
        { error: `Reprice exceeds 5× original ($${originalTotal.toFixed(2)} → $${newTotal.toFixed(2)}). Confirm with owner first.` },
        { status: 400 }
      );
    }

    // Mint a delta Pay Now link when customer owes more
    let payLinkUrl: string | null = null;
    if (delta > 0.01) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
        const description = `Reprice delta for order ${order.order_number}`;
        const redirectUrl = `${siteUrl}/order-confirmed?oid=${order.id}`;
        const token = encodePaymentToken(delta, description, customer.email.toLowerCase().trim(), redirectUrl);
        payLinkUrl = `${siteUrl}/pay/${token}`;
      } catch (tokenErr) {
        console.error("[reprice] token encode failed:", tokenErr);
        return NextResponse.json({ error: "Failed to generate delta payment link" }, { status: 500 });
      }
    }

    // Send the customer email
    try {
      await sendOrderRepriceEmail({
        orderNumber: order.order_number ?? "",
        customerName: customer.name ?? customer.email,
        customerEmail: customer.email,
        originalTotal,
        newTotal,
        reason,
        explanation,
        payLinkUrl,
        staffEmail: staffCheck.email,
        orderId: order.id,
        customerId: order.customer_id ?? undefined,
      });
    } catch (emailErr) {
      console.error("[reprice] email send failed:", emailErr);
      return NextResponse.json({ error: "Failed to send reprice email" }, { status: 500 });
    }

    // Update the order — new total + staff_notes append
    const repriceLog = `[${new Date().toISOString().slice(0,10)}] REPRICE by ${staffCheck.email}: $${originalTotal.toFixed(2)} → $${newTotal.toFixed(2)} (${reason}${explanation ? `: ${explanation}` : ""})`;
    const newStaffNotes = order.staff_notes
      ? `${order.staff_notes}\n${repriceLog}`
      : repriceLog;
    const { error: upErr } = await supabase
      .from("orders")
      .update({ total: newTotal, staff_notes: newStaffNotes } as Record<string, unknown>)
      .eq("id", order.id);
    if (upErr) console.error("[reprice] order update failed (non-fatal — email already sent):", upErr.message);

    // Audit event
    const reqCtx = extractRequestContext(req);
    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email,
      event_type: "order.repriced",
      entity_type: "order",
      entity_id: order.id,
      detail: {
        order_number: order.order_number,
        original_total: originalTotal,
        new_total: newTotal,
        delta,
        reason,
        explanation,
        pay_link_minted: !!payLinkUrl,
      },
      ip: reqCtx.ip,
      user_agent: reqCtx.user_agent,
    });

    return NextResponse.json({
      ok: true,
      order_number: order.order_number,
      original_total: originalTotal,
      new_total: newTotal,
      delta,
      mode: delta > 0.01 ? "INCREASE" : delta < -0.01 ? "DECREASE" : "NO_CHANGE",
      pay_link_url: payLinkUrl,
    });
  } catch (err) {
    console.error("[reprice]", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
