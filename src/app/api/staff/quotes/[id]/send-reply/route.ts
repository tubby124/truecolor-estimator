/**
 * POST /api/staff/quotes/[id]/send-reply
 *
 * Sends a reply email to a quote customer from info@true-color.ca,
 * then marks the quote as replied_at.
 *
 * Body: { to: string, subject: string, body: string }
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
    const { to, subject, body } = (await req.json()) as {
      to: string;
      subject: string;
      body: string;
    };

    if (!to || !subject || !body?.trim()) {
      return NextResponse.json(
        { error: "to, subject, and body are required" },
        { status: 400 }
      );
    }

    // Send email to customer
    await sendEmail({
      from:
        process.env.SMTP_FROM ??
        "True Color Display Printing <info@true-color.ca>",
      to,
      replyTo:
        process.env.SMTP_FROM ??
        "True Color Display Printing <info@true-color.ca>",
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1c1712; padding: 20px 30px;">
            <p style="color: #16C2F3; font-size: 18px; font-weight: bold; margin: 0;">
              True Color Display Printing
            </p>
          </div>
          <div style="padding: 24px 30px; background: #fff; white-space: pre-wrap; font-size: 14px; color: #333; line-height: 1.6;">
${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
          <div style="background: #f4efe9; padding: 14px 30px; font-size: 12px; color: #888;">
            True Color Display Printing · 216 33rd St W, Saskatoon · (306) 954-8688 · truecolorprinting.ca
          </div>
        </div>
      `,
      text: body,
    });

    // Mark quote as replied and save reply body
    const supabase = createServiceClient();
    await supabase
      .from("quote_requests")
      .update({ replied_at: new Date().toISOString(), reply_body: body } as Record<string, unknown>)
      .eq("id", id);

    console.log(`[staff/quotes/send-reply] replied to quote ${id} → ${to}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reply";
    console.error("[staff/quotes/send-reply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
