/**
 * POST /api/staff/orders/[id]/reply
 *
 * Sends a custom message from the owner to a customer about their order.
 * Uses Hostinger SMTP (same config as orderConfirmation.ts).
 * Body: { subject: string, message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const { subject, message } = (await req.json()) as {
      subject: string;
      message: string;
    };

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Fetch order + customer email from Supabase
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("order_number, customers ( name, email )")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customerRaw = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    if (!customer?.email) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 }
      );
    }

    const from =
      process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";

    // Simple HTML email — no inline SVG (Gmail strips it)
    const bodyHtml = message
      .split("\n")
      .map((line) => `<p style="margin:0 0 12px;font-size:15px;color:#1c1712;line-height:1.65;">${escHtml(line) || "&nbsp;"}</p>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

      <!-- Header -->
      <tr><td style="background:#1c1712;border-radius:12px 12px 0 0;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#d6cfc7;letter-spacing:.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          True Color Display Printing
        </p>
        <p style="margin:4px 0 0;font-size:11px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          Saskatoon, Saskatchewan · Canada
        </p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#fff;padding:36px 32px 32px;border-top:3px solid #16C2F3;">
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          Hi ${escHtml(customer.name)},
        </p>
        ${bodyHtml}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f0ebe4;padding-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          Reference: <strong style="color:#4b5563;">${escHtml(order.order_number)}</strong>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#1c1712;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          True Color Display Printing
        </p>
        <p style="margin:0 0 4px;font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          216 33rd St W · Saskatoon, SK · Canada
        </p>
        <p style="margin:0;font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <a href="tel:+13069548688" style="color:#f08080;text-decoration:none;">(306) 954-8688</a>
          &nbsp;·&nbsp;
          <a href="mailto:info@true-color.ca" style="color:#f08080;text-decoration:none;">info@true-color.ca</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

    const text = `Hi ${customer.name},\n\n${message}\n\nRef: ${order.order_number}\n\n—\nTrue Color Display Printing\n216 33rd St W, Saskatoon, SK\n(306) 954-8688\ninfo@true-color.ca`;

    await sendEmail({
      from,
      to: customer.email,
      subject: subject.trim(),
      html,
      text,
    });

    console.log(
      `[staff/orders/reply] sent → ${customer.email} | order ${order.order_number} | subject "${subject.trim()}"`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    console.error("[staff/orders/reply]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
