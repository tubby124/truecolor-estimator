/**
 * POST /api/staff/quotes/[id]/send-quote
 *
 * Sends a branded HTML quote email to a customer, then marks the quote as replied_at.
 *
 * Body: {
 *   to: string
 *   customerName: string
 *   subject?: string
 *   lineItems: { description: string; qty: string; unitPrice: string }[]
 *   note?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";

interface LineItem {
  description: string;
  qty: string;
  unitPrice: string;
}

interface Params {
  params: Promise<{ id: string }>;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildQuoteHtml(opts: {
  customerName: string;
  lineItems: LineItem[];
  note?: string;
}): string {
  const { customerName, lineItems, note } = opts;
  const firstName = customerName.split(/[\s,]/)[0];

  const subtotal = lineItems.reduce(
    (sum, li) => sum + (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0),
    0
  );
  const gst = subtotal * 0.05;
  const pst = subtotal * 0.06;
  const grandTotal = subtotal + gst + pst;

  const rows = lineItems
    .map((li) => {
      const qty = parseFloat(li.qty) || 0;
      const unit = parseFloat(li.unitPrice) || 0;
      const total = qty * unit;
      return `
      <tr>
        <td style="padding:10px 12px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #f0f2f5;">${esc(li.description)}</td>
        <td style="padding:10px 12px;font-size:14px;color:#555;text-align:center;border-bottom:1px solid #f0f2f5;">${qty}</td>
        <td style="padding:10px 12px;font-size:14px;color:#555;text-align:right;border-bottom:1px solid #f0f2f5;">$${unit.toFixed(2)}</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#1a1a2e;text-align:right;border-bottom:1px solid #f0f2f5;">$${total.toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Inter',-apple-system,sans-serif;">
<div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.12);">

  <!-- HEADER -->
  <div style="background:#1a1a2e;padding:36px 40px 30px;position:relative;">
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#e85d04;margin-bottom:6px;">True Color Display Printing</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:20px;">Custom Quote · Saskatoon, SK</div>
    <h1 style="font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;margin:0 0 6px;">Your Print Quote</h1>
    <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;">Prepared for ${esc(customerName)}</p>
    <div style="margin-top:20px;display:flex;gap:28px;">
      <div>
        <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:600;margin-bottom:2px;">Date</div>
        <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);">${new Date().toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}</div>
      </div>
      <div>
        <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:600;margin-bottom:2px;">Valid For</div>
        <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);">30 Days</div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:36px 40px;">
    ${note ? `<p style="font-size:15px;color:#1a1a2e;margin-bottom:24px;font-weight:500;">Hi ${esc(firstName)},</p><p style="font-size:14px;color:#444;line-height:1.7;margin-bottom:28px;">${esc(note)}</p>` : `<p style="font-size:15px;color:#1a1a2e;margin-bottom:24px;font-weight:500;">Hi ${esc(firstName)},</p><p style="font-size:14px;color:#444;line-height:1.7;margin-bottom:28px;">Thanks for reaching out to True Color Display Printing. Here&apos;s your custom quote based on your request:</p>`}

    <!-- LINE ITEMS -->
    <div style="margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#e85d04;margin-bottom:12px;">Quote Details</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e9ecef;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;text-align:left;border-bottom:1px solid #e9ecef;">Description</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;text-align:center;border-bottom:1px solid #e9ecef;">Qty</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;text-align:right;border-bottom:1px solid #e9ecef;">Unit Price</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;text-align:right;border-bottom:1px solid #e9ecef;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:6px;">
        <span>Subtotal</span><span style="font-weight:600;color:#1a1a2e;">$${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#999;margin-bottom:4px;">
        <span>GST (5%)</span><span>$${gst.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#999;margin-bottom:12px;">
        <span>PST (6%)</span><span>$${pst.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1a1a2e;border-top:2px solid #dee2e6;padding-top:12px;">
        <span>Total</span><span>$${grandTotal.toFixed(2)} CAD</span>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="mailto:info@true-color.ca?subject=${encodeURIComponent(`Re: Quote — ${customerName}`)}" style="display:inline-block;background:#e85d04;color:white;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;">
        Reply to Confirm Your Order
      </a>
      <p style="font-size:12px;color:#888;margin-top:10px;">Or call us directly: <strong>(306) 244-7701</strong></p>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#f8f9fa;border-top:1px solid #e9ecef;padding:24px 40px;">
    <div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:4px;">True Color Display Printing Ltd.</div>
    <div style="font-size:12px;color:#888;line-height:1.7;">
      211–220 20th St W, Saskatoon, SK S7M 0W9<br>
      <a href="mailto:info@true-color.ca" style="color:#e85d04;text-decoration:none;">info@true-color.ca</a> · (306) 244-7701<br>
      <a href="https://truecolorprinting.ca" style="color:#e85d04;text-decoration:none;">truecolorprinting.ca</a>
    </div>
  </div>

</div>
</body>
</html>`;
}

function buildQuotePlainText(opts: {
  customerName: string;
  lineItems: LineItem[];
  note?: string;
}): string {
  const { customerName, lineItems, note } = opts;
  const firstName = customerName.split(/[\s,]/)[0];
  const subtotal = lineItems.reduce(
    (sum, li) => sum + (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0),
    0
  );
  const lines = [
    `Hi ${firstName},`,
    "",
    note || "Thanks for reaching out. Here's your custom print quote:",
    "",
    "QUOTE DETAILS",
    "─────────────",
    ...lineItems.map((li) => {
      const qty = parseFloat(li.qty) || 0;
      const unit = parseFloat(li.unitPrice) || 0;
      return `${li.description} · Qty: ${qty} · $${unit.toFixed(2)}/unit = $${(qty * unit).toFixed(2)}`;
    }),
    "",
    `Subtotal: $${subtotal.toFixed(2)}`,
    `GST (5%): $${(subtotal * 0.05).toFixed(2)}`,
    `PST (6%): $${(subtotal * 0.06).toFixed(2)}`,
    `Total: $${(subtotal * 1.11).toFixed(2)} CAD`,
    "",
    "Reply to this email or call (306) 244-7701 to confirm your order.",
    "",
    "— True Color Display Printing",
    "211–220 20th St W, Saskatoon, SK | truecolorprinting.ca",
  ];
  return lines.join("\n");
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const { to, customerName, subject, lineItems, note } = (await req.json()) as {
      to: string;
      customerName: string;
      subject?: string;
      lineItems: LineItem[];
      note?: string;
    };

    if (!to || !customerName || !lineItems?.length) {
      return NextResponse.json(
        { error: "to, customerName, and lineItems are required" },
        { status: 400 }
      );
    }

    const emailSubject =
      subject?.trim() || "Your Custom Print Quote — True Color Display Printing";

    await sendEmail({
      to,
      subject: emailSubject,
      html: buildQuoteHtml({ customerName, lineItems, note }),
      text: buildQuotePlainText({ customerName, lineItems, note }),
    });

    const supabase = createServiceClient();
    const quoteSummary = lineItems
      .map((li) => `${li.description} × ${li.qty} @ $${parseFloat(li.unitPrice).toFixed(2)}`)
      .join(", ");
    await supabase
      .from("quote_requests")
      .update({ replied_at: new Date().toISOString(), reply_body: `[Price quote sent] ${quoteSummary}` } as Record<string, unknown>)
      .eq("id", id);

    console.log(`[staff/quotes/send-quote] sent branded quote to ${to} for quote ${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send quote";
    console.error("[staff/quotes/send-quote]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
