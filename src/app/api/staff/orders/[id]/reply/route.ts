/**
 * POST /api/staff/orders/[id]/reply
 *
 * Sends a custom message from the owner to a customer about their order.
 * Uses Resend with a durable order_messages claim and provider idempotency.
 * Body: { subject: string, message: string, clientRequestId: UUID }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { recordAuditEvent } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

interface Params {
  params: Promise<{ id: string }>;
}

interface ReplyBody {
  subject?: unknown;
  message?: unknown;
  clientRequestId?: unknown;
}

interface ClaimedMessage {
  id: string;
  order_id: string;
  customer_id: string | null;
  subject: string;
  body_text: string;
  status: string;
  provider_message_id: string | null;
  created_at: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  const clientIp = getClientIp(req);
  if (!rateLimit(`order-reply:${staffCheck.id}:${clientIp}`, 20, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please wait and try again." },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as ReplyBody;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const clientRequestId =
      typeof body.clientRequestId === "string" ? body.clientRequestId : "";

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }
    if (subject.length > 200 || message.length > 20_000) {
      return NextResponse.json(
        { error: "Subject or message is too long" },
        { status: 400 }
      );
    }
    if (!UUID_RE.test(clientRequestId)) {
      return NextResponse.json(
        { error: "A valid clientRequestId is required" },
        { status: 400 }
      );
    }

    // Fetch order + customer email from Supabase
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, customers ( name, email )")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customerRaw = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;
    const customer = customerRaw as { name: string; email: string } | null;

    if (!order.customer_id || !customer?.email) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 }
      );
    }

    const from =
      process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
    let replyTo = "info@true-color.ca";
    if (process.env.ORDER_REPLY_TOKEN_ENABLED === "true") {
      const { data: tokenRow, error: tokenError } = await supabase
        .from("order_reply_tokens")
        .select("reply_token")
        .eq("order_id", order.id)
        .single();
      if (tokenError || !tokenRow?.reply_token) {
        throw new Error("Order reply token unavailable");
      }
      replyTo = `info+o_${tokenRow.reply_token}@true-color.ca`;
    }

    const claim = {
      order_id: order.id,
      customer_id: order.customer_id,
      direction: "outbound",
      status: "sending",
      from_address: extractEmail(from),
      to_address: customer.email,
      subject,
      body_text: message,
      staff_actor: staffCheck.email ?? "staff",
      client_request_id: clientRequestId,
      last_event_detail: "Claimed for delivery",
    };

    let ledger: ClaimedMessage;
    const { data: inserted, error: insertError } = await supabase
      .from("order_messages")
      .insert(claim)
      .select("id,order_id,customer_id,subject,body_text,status,provider_message_id,created_at")
      .single();

    if (!insertError && inserted) {
      ledger = inserted as ClaimedMessage;
    } else if (insertError?.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("order_messages")
        .select("id,order_id,customer_id,subject,body_text,status,provider_message_id,created_at")
        .eq("client_request_id", clientRequestId)
        .single();
      if (existingError || !existing) throw existingError ?? insertError;
      ledger = existing as ClaimedMessage;
    } else {
      throw insertError ?? new Error("Could not claim order message");
    }

    if (
      ledger.order_id !== order.id ||
      ledger.customer_id !== order.customer_id ||
      ledger.subject !== subject ||
      ledger.body_text !== message
    ) {
      return NextResponse.json(
        { error: "clientRequestId was already used for a different message" },
        { status: 409 }
      );
    }

    if (ledger.provider_message_id) {
      if (ledger.status === "failed") {
        return NextResponse.json(
          {
            error: "This message could not be delivered. Edit it before trying again.",
            messageId: ledger.id,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({
        ok: true,
        messageId: ledger.id,
        providerMessageId: ledger.provider_message_id,
        status: ledger.status,
        reused: true,
      });
    }

    if (["sent", "delivered", "delivery_delayed"].includes(ledger.status)) {
      return NextResponse.json({
        ok: true,
        messageId: ledger.id,
        status: ledger.status,
        reused: true,
      });
    }

    if (["bounced", "complained"].includes(ledger.status)) {
      return NextResponse.json(
        {
          error: "This message reached a terminal delivery state and will not be resent.",
          messageId: ledger.id,
          status: ledger.status,
        },
        { status: 409 }
      );
    }

    const idempotencyAgeMs = Date.now() - Date.parse(ledger.created_at);
    if (
      ["sending", "pending_confirmation"].includes(ledger.status) &&
      idempotencyAgeMs > 23 * 60 * 60 * 1000
    ) {
      return NextResponse.json(
        {
          error:
            "This send is too old to retry safely. Check the message timeline and Resend before sending again.",
        },
        { status: 409 }
      );
    }

    if (ledger.status === "failed") {
      const { error: retryUpdateError } = await supabase
        .from("order_messages")
        .update({
          status: "sending",
          last_event_detail: "Retrying delivery",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ledger.id);
      if (retryUpdateError) throw retryUpdateError;
      ledger.status = "sending";
    }

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

    let providerMessageId: string;
    try {
      const result = await sendEmail({
        from,
        to: customer.email,
        replyTo,
        subject,
        html,
        text,
        orderId: order.id,
        customerId: order.customer_id,
        idempotencyKey: `order-message/${clientRequestId}`,
        tags: [{ name: "order_message_id", value: ledger.id }],
      });
      providerMessageId = result.providerMessageId;
    } catch (sendError) {
      const safeDetail = sanitizeError(sendError);
      const rejected =
        sendError instanceof Error &&
        "outcome" in sendError &&
        sendError.outcome === "rejected";
      const failureStatus = rejected ? "failed" : "pending_confirmation";
      const { error: failureUpdateError } = await supabase
        .from("order_messages")
        .update({
          status: failureStatus,
          last_event_detail: safeDetail,
          updated_at: new Date().toISOString(),
        })
        .in("status", ["sending"])
        .eq("id", ledger.id);
      if (failureUpdateError) {
        console.error("[staff/orders/reply] failure ledger update:", failureUpdateError.message);
      }
      console.error("[staff/orders/reply] send failed:", sendError);
      return NextResponse.json(
        {
          error: rejected
            ? "The email provider rejected this message. Please review it and try again."
            : "Delivery confirmation is pending. Retry this exact message within 23 hours; do not create a new copy.",
          outcome: rejected ? "rejected" : "unknown",
        },
        { status: 502 }
      );
    }

    const sentAt = new Date().toISOString();
    const { error: linkUpdateError } = await supabase
      .from("order_messages")
      .update({
        provider_message_id: providerMessageId,
        sent_at: sentAt,
        updated_at: sentAt,
      })
      .eq("id", ledger.id);
    if (linkUpdateError) throw linkUpdateError;

    const { error: sentUpdateError } = await supabase
      .from("order_messages")
      .update({
        status: "sent",
        last_event_detail: "email.sent",
        updated_at: sentAt,
      })
      .in("status", ["sending", "pending_confirmation", "sent"])
      .eq("id", ledger.id);
    if (sentUpdateError) throw sentUpdateError;

    console.log(
      `[staff/orders/reply] sent → ${customer.email} | order ${order.order_number} | subject "${subject}"`
    );

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "order.customer_email_sent",
      entity_type: "order",
      entity_id: id,
      detail: {
        order_number: order.order_number,
        recipient: customer.email,
        message_id: ledger.id,
        subject: subject.slice(0, 200),
        body_chars: message.length,
      },
    });

    return NextResponse.json({ ok: true, messageId: ledger.id, providerMessageId });
  } catch (err) {
    console.error("[staff/orders/reply]", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractEmail(address: string): string {
  const match = address.match(/<([^>]+)>/);
  return (match?.[1] ?? address).trim();
}
