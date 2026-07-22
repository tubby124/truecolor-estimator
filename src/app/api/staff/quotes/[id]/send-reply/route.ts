/**
 * POST /api/staff/quotes/[id]/send-reply
 *
 * Sends a reply email to a quote customer (FROM SMTP_FROM, Reply-To
 * SMTP_REPLY_TO via shared smtp.ts), then marks the quote as replied_at.
 *
 * Body:
 *   subject            string
 *   body               string — plain-text reply (rendered into HTML wrapper)
 * Recipient identity is always loaded from the stored quote request.
 * Pay Now is intentionally unsupported here because a free-form total has no
 * verifiable subtotal/GST/PST structure. Use send-quote for payable quotes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { recordAuditEvent } from "@/lib/audit/record";
import { markQuoteSent } from "@/lib/payment/quote-order";

interface Params {
  params: Promise<{ id: string }>;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const {
      subject,
      body,
      quote_total_cents,
    } = (await req.json()) as {
      subject: string;
      body: string;
      quote_total_cents?: number;
    };

    if (!subject || !body?.trim()) {
      return NextResponse.json(
        { error: "subject and body are required" },
        { status: 400 }
      );
    }

    // Free-form totals do not contain a verifiable subtotal/GST/PST breakdown.
    // Payable links must be created through the structured branded quote builder.
    if (quote_total_cents !== undefined) {
      return NextResponse.json(
        { error: "Use the branded quote builder to send Pay Now with structured subtotal, GST, and PST." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: storedQuote, error: quoteError } = await supabase
      .from("quote_requests")
      .select("email")
      .eq("id", id)
      .maybeSingle();
    if (quoteError || !storedQuote?.email) {
      return NextResponse.json({ error: quoteError ? "Could not load quote recipient" : "Quote not found" }, { status: quoteError ? 500 : 404 });
    }
    const to = storedQuote.email;

    // Send email to customer
    await sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1c1712; padding: 20px 30px;">
            <p style="color: #16C2F3; font-size: 18px; font-weight: bold; margin: 0;">
              True Color Display Printing
            </p>
          </div>
          <div style="padding: 24px 30px; background: #fff; white-space: pre-wrap; font-size: 14px; color: #333; line-height: 1.6;">
${escHtml(body)}
          </div>
          <div style="background: #f4efe9; padding: 14px 30px; font-size: 12px; color: #888;">
            True Color Display Printing · 216 33rd St W, Saskatoon · (306) 954-8688 · truecolorprinting.ca
          </div>
        </div>
      `,
      text: body,
    });

    await markQuoteSent(supabase, id, body, false);

    console.log(`[staff/quotes/send-reply] replied to quote ${id} → ${to}`);

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "quote.reply_sent",
      entity_type: "quote",
      entity_id: id,
      detail: {
        recipient: to,
        subject: subject.slice(0, 200),
        has_pay_now: false,
        quote_total_cents: null,
        body_chars: body.length,
      },
    });

    return NextResponse.json({ ok: true, total_cents: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reply";
    console.error("[staff/quotes/send-reply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
