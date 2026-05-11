/**
 * POST /api/staff/quotes/[id]/send-reply
 *
 * Sends a reply email to a quote customer (FROM SMTP_FROM, Reply-To
 * SMTP_REPLY_TO via shared smtp.ts), then marks the quote as replied_at.
 *
 * Body:
 *   to                 string — customer email
 *   subject            string
 *   body               string — plain-text reply (rendered into HTML wrapper)
 *   quote_total_cents? number — if set + > 0, embeds a Pay Now button backed
 *                               by /pay/[token] (HMAC-signed payment token,
 *                               same gateway as order payments).
 *   description?       string — short label shown on the Clover checkout
 *                               (default: "Quote #<short-id> — <customer name>")
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { encodePaymentToken } from "@/lib/payment/token";

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
      to,
      subject,
      body,
      quote_total_cents,
      description,
    } = (await req.json()) as {
      to: string;
      subject: string;
      body: string;
      quote_total_cents?: number;
      description?: string;
    };

    if (!to || !subject || !body?.trim()) {
      return NextResponse.json(
        { error: "to, subject, and body are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Look up customer name + brokerage for a helpful Clover description if
    // the caller didn't provide one.
    const { data: quoteRow } = await supabase
      .from("quote_requests")
      .select("name, email")
      .eq("id", id)
      .maybeSingle();
    const customerName = quoteRow?.name ?? "Customer";

    // Build Pay Now block if a quote total was provided.
    let payNowHtml = "";
    let payNowText = "";
    let totalCentsForDb: number | null = null;
    if (typeof quote_total_cents === "number" && quote_total_cents > 0) {
      totalCentsForDb = Math.round(quote_total_cents);
      const totalDollars = totalCentsForDb / 100;
      const shortId = id.slice(0, 8);
      const cloverDescription =
        (description?.trim() || `Quote #${shortId} — ${customerName}`).slice(0, 90);
      const token = encodePaymentToken(totalDollars, cloverDescription, to);
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca").replace(/\/$/, "");
      const payUrl = `${siteUrl}/pay/${encodeURIComponent(token)}`;
      const totalLabel = totalDollars.toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
      });

      payNowHtml = `
        <div style="margin: 20px 30px 0; padding: 18px 20px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 10px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em;">
            Total: ${escHtml(totalLabel)} CAD
          </p>
          <p style="margin: 0 0 14px; font-size: 13px; color: #047857; line-height: 1.5;">
            Pay securely by credit card to confirm this order. We start production once payment clears (typically same day).
          </p>
          <a href="${escHtml(payUrl)}" style="display: inline-block; background: #059669; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
            Pay ${escHtml(totalLabel)} now →
          </a>
          <p style="margin: 12px 0 0; font-size: 11px; color: #6b7280;">
            Link valid 30 days. Powered by Clover.
          </p>
        </div>`;
      payNowText = `\n\n— Total: ${totalLabel} CAD —\nPay securely by credit card: ${payUrl}\n(Link valid 30 days.)\n`;
    }

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
          ${payNowHtml}
          <div style="background: #f4efe9; padding: 14px 30px; font-size: 12px; color: #888;">
            True Color Display Printing · 216 33rd St W, Saskatoon · (306) 954-8688 · truecolorprinting.ca
          </div>
        </div>
      `,
      text: body + payNowText,
    });

    // Mark quote as replied + persist the quote total if set.
    const update: Record<string, unknown> = {
      replied_at: new Date().toISOString(),
      reply_body: body,
    };
    if (totalCentsForDb !== null) {
      update.quote_total_cents = totalCentsForDb;
      update.quote_total_description = description?.trim() || null;
    }
    await supabase
      .from("quote_requests")
      .update(update)
      .eq("id", id);

    console.log(
      `[staff/quotes/send-reply] replied to quote ${id} → ${to}` +
      (totalCentsForDb !== null ? ` (with Pay Now $${(totalCentsForDb / 100).toFixed(2)})` : "")
    );
    return NextResponse.json({ ok: true, total_cents: totalCentsForDb });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reply";
    console.error("[staff/quotes/send-reply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
