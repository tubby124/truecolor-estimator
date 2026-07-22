/**
 * POST /api/staff/quotes/[id]/send-quote
 *
 * Sends a branded HTML quote email to a customer, then marks the quote as replied_at.
 *
 * Body: {
 *   subject?: string
 *   lineItems: { description: string; qty: string; unitPrice: string; taxClass: string }[]
 *   note?: string
 * }
 * Recipient identity is always loaded from the stored quote request.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { encodePaymentToken } from "@/lib/payment/token";
import { recordAuditEvent } from "@/lib/audit/record";
import { getQuoteTaxRates, markQuoteSent, setStructuredQuotePricing, type QuoteTaxRates } from "@/lib/payment/quote-order";

export interface LineItem {
  description: string;
  qty: string;
  unitPrice: string;
  taxClass: "printed_good" | "design_service" | "rush_service" | "installation_service";
}

interface Params {
  params: Promise<{ id: string }>;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Subtotal + configured GST/PST, rounded the same way the modal preview and
// the email body compute it — so the Pay Now amount never drifts from the
// total the customer sees in the quote.
// Saskatchewan PST-20 applies PST to the full customer charge for taxable
// printed material, including its design, rush, and installation service lines.
// GST also applies to the full subtotal.
export function computeQuoteTotals(lineItems: LineItem[], rates: QuoteTaxRates): {
  subtotal: number;
  gst: number;
  pst: number;
  grandTotal: number;
} {
  const lineTotal = (li: LineItem) => (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0);
  const subtotal = Math.round(lineItems.reduce((sum, li) => sum + lineTotal(li), 0) * 100) / 100;
  const gst = Math.round(subtotal * rates.gstRate * 100) / 100;
  const pst = Math.round(subtotal * rates.pstRate * 100) / 100;
  const grandTotal = Math.round((subtotal + gst + pst) * 100) / 100;
  return { subtotal, gst, pst, grandTotal };
}

export function buildQuoteHtml(opts: {
  customerName: string;
  lineItems: LineItem[];
  note?: string;
  payUrl: string;
  payLabel: string;
  rates: QuoteTaxRates;
}): string {
  const { customerName, lineItems, note, payUrl, payLabel, rates } = opts;
  const firstName = customerName.split(/[\s,]/)[0];

  const { subtotal, gst, pst, grandTotal } = computeQuoteTotals(lineItems, rates);

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
    <div style="margin-top:18px;padding:14px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);border-radius:6px;">
      <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.55);font-weight:700;margin-bottom:3px;">Quote subtotal · before tax</div>
      <div style="font-size:24px;font-weight:800;color:#ffffff;">$${subtotal.toFixed(2)} CAD</div>
    </div>
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
        <span style="font-weight:700;color:#1a1a2e;">Quote subtotal (before tax)</span><span style="font-weight:700;color:#1a1a2e;">$${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#999;margin-bottom:4px;">
        <span>GST (${(rates.gstRate * 100).toFixed(2).replace(/\.00$/, "")}%)</span><span>$${gst.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#999;margin-bottom:12px;">
        <span>PST (${(rates.pstRate * 100).toFixed(2).replace(/\.00$/, "")}%)</span><span>$${pst.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1a1a2e;border-top:2px solid #dee2e6;padding-top:12px;">
        <span>Payment total (tax included)</span><span>$${grandTotal.toFixed(2)} CAD</span>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${esc(payUrl)}" style="display:inline-block;background:#059669;color:white;text-decoration:none;font-size:15px;font-weight:700;padding:15px 36px;border-radius:6px;">
        Pay ${esc(payLabel)} now &rarr;
      </a>
      <p style="font-size:12px;color:#666;margin-top:12px;">Pay securely by credit card to confirm your order — we start production once payment clears (typically same day).</p>
      <p style="font-size:11px;color:#aaa;margin-top:6px;">Link valid 30 days · Powered by Clover · Questions? Reply to this email or call <strong>(306) 954-8688</strong></p>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#f8f9fa;border-top:1px solid #e9ecef;padding:24px 40px;">
    <div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:4px;">True Color Display Printing Ltd.</div>
    <div style="font-size:12px;color:#888;line-height:1.7;">
      216 33rd St W (Upstairs), Saskatoon, SK S7L 0V1<br>
      <a href="mailto:info@true-color.ca" style="color:#e85d04;text-decoration:none;">info@true-color.ca</a> · (306) 954-8688<br>
      <a href="https://truecolorprinting.ca" style="color:#e85d04;text-decoration:none;">truecolorprinting.ca</a> · GST# ${process.env.NEXT_PUBLIC_GST_NUMBER ?? "731454914RT0001"}
    </div>
  </div>

</div>
</body>
</html>`;
}

export function buildQuotePlainText(opts: {
  customerName: string;
  lineItems: LineItem[];
  note?: string;
  payUrl: string;
  rates: QuoteTaxRates;
}): string {
  const { customerName, lineItems, note, payUrl, rates } = opts;
  const firstName = customerName.split(/[\s,]/)[0];
  const { subtotal, gst, pst, grandTotal: total } = computeQuoteTotals(lineItems, rates);
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
    `QUOTE SUBTOTAL (BEFORE TAX): $${subtotal.toFixed(2)} CAD`,
    `GST (${rates.gstRate * 100}%): $${gst.toFixed(2)}`,
    `PST (${rates.pstRate * 100}%): $${pst.toFixed(2)}`,
    `Payment total (tax included): $${total.toFixed(2)} CAD`,
    "",
    `Pay securely by credit card to confirm your order: ${payUrl}`,
    "(Link valid 30 days. Powered by Clover.)",
    "",
    "Questions? Reply to this email or call (306) 954-8688.",
    "",
    "— True Color Display Printing Ltd.",
    "216 33rd St W (Upstairs), Saskatoon, SK S7L 0V1 | GST# 731454914RT0001 | truecolorprinting.ca",
  ];
  return lines.join("\n");
}

export async function POST(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const { subject, lineItems, note } = (await req.json()) as {
      subject?: string;
      lineItems: LineItem[];
      note?: string;
    };

    if (!lineItems?.length) {
      return NextResponse.json(
        { error: "lineItems are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: storedQuote, error: quoteError } = await supabase
      .from("quote_requests")
      .select("email, name")
      .eq("id", id)
      .maybeSingle();
    if (quoteError || !storedQuote?.email || !storedQuote?.name) {
      return NextResponse.json({ error: quoteError ? "Could not load quote recipient" : "Quote not found" }, { status: quoteError ? 500 : 404 });
    }
    const to = storedQuote.email;
    const customerName = storedQuote.name;

    const emailSubject =
      subject?.trim() || "Your Custom Print Quote — True Color Display Printing";

    // Mint a Pay Now link for the tax-included grand total. The signed quote
    // revision is materialized only after customer POST; active Clover sessions
    // are resumed and expired reservations can be safely replaced.
    const rates = await getQuoteTaxRates(supabase);
    const { subtotal, gst, pst, grandTotal } = computeQuoteTotals(lineItems, rates);
    const totalCents = Math.round(grandTotal * 100);
    const shortId = id.slice(0, 8);
    const cloverDescription = `Quote #${shortId} — ${customerName}`.slice(0, 90);
    const pricingRevision = await setStructuredQuotePricing(supabase, {
      quoteId: id,
      totalCents,
      subtotalCents: Math.round(subtotal * 100),
      gstCents: Math.round(gst * 100),
      pstCents: Math.round(pst * 100),
      description: cloverDescription,
      lineItems,
    });

    const token = encodePaymentToken(grandTotal, cloverDescription, to, undefined, {
      quoteId: id,
      quoteRevision: pricingRevision.quoteRevision,
    });
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca").replace(/\/$/, "");
    const payUrl = `${siteUrl}/pay/${encodeURIComponent(token)}`;
    const payLabel = grandTotal.toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    });

    await sendEmail({
      to,
      subject: emailSubject,
      html: buildQuoteHtml({ customerName, lineItems, note, payUrl, payLabel, rates }),
      text: buildQuotePlainText({ customerName, lineItems, note, payUrl, rates }),
    });

    const quoteSummary = lineItems
      .map((li) => `${li.description} × ${li.qty} @ $${parseFloat(li.unitPrice).toFixed(2)}`)
      .join(", ");
    await markQuoteSent(
      supabase,
      id,
      `[Price quote sent · Pay Now ${payLabel}] ${quoteSummary}`,
      true,
    );

    console.log(`[staff/quotes/send-quote] sent branded quote to ${to} for quote ${id}`);

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "quote.priced_quote_sent",
      entity_type: "quote",
      entity_id: id,
      detail: {
        recipient: to,
        customer_name: customerName,
        line_items_count: lineItems.length,
        total_cents: totalCents,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send quote";
    console.error("[staff/quotes/send-quote]", message);
    const immutable = /PAID_QUOTE_IMMUTABLE/.test(message);
    const checkoutOpened = /QUOTE_CHECKOUT_ALREADY_OPENED/.test(message);
    return NextResponse.json(
      {
        error: immutable
          ? "Paid quotes cannot be repriced"
          : checkoutOpened
            ? "This quote already has an open checkout and cannot be repriced. Contact the customer before replacing it."
            : message,
      },
      { status: immutable || checkoutOpened ? 409 : 500 },
    );
  }
}
