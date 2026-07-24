/**
 * POST /api/staff/quotes/[id]/send-quote
 *
 * Durably prepares one quote revision, sends its branded Pay Now email with
 * provider idempotency, then atomically records acceptance and qualification.
 *
 * Body: {
 *   subject?: string
 *   lineItems: { description: string; qty: string; unitPrice: string; taxClass: string }[]
 *   note?: string
 * }
 * Recipient identity is always loaded from the stored quote request.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServiceClient, requireStaffUser } from "@/lib/supabase/server";
import { EmailSendError, sendEmail } from "@/lib/email/smtp";
import { encodePaymentToken } from "@/lib/payment/token";
import { recordAuditEvent } from "@/lib/audit/record";
import { sanitizeError } from "@/lib/errors/sanitize";
import {
  getQuoteTaxRates,
  validateStructuredQuotePricing,
  type QuoteTaxRates,
} from "@/lib/payment/quote-order";

export interface LineItem {
  description: string;
  qty: string;
  unitPrice: string;
  taxClass: "printed_good" | "design_service" | "rush_service" | "installation_service";
}

interface Params {
  params: Promise<{ id: string }>;
}

interface PreparedQuoteSend {
  delivery_id: string;
  quote_revision: number;
  delivery_status:
    | "prepared"
    | "sending"
    | "pending_confirmation"
    | "sent"
    | "failed"
    | "delivery_failed";
  provider_message_id: string | null;
  delivery_created_at: string;
  provider_window_started_at: string | null;
  pay_url: string | null;
  rendered_html: string | null;
  rendered_text: string | null;
}

interface ArmedQuoteSend {
  delivery_status: PreparedQuoteSend["delivery_status"];
  provider_message_id: string | null;
  pay_url: string;
  rendered_html: string;
  rendered_text: string;
  provider_window_started_at: string;
}

const PROVIDER_IDEMPOTENCY_WINDOW_MS = 23 * 60 * 60 * 1000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function singleRpcRow<T>(data: unknown, errorMessage: string): T {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new Error(errorMessage);
  return row as T;
}

export function buildQuoteSendFingerprint(input: {
  quoteId: string;
  recipient: string;
  customerName: string;
  subject: string;
  note?: string;
  lineItems: LineItem[];
  subtotalCents: number;
  gstCents: number;
  pstCents: number;
  totalCents: number;
  rates: QuoteTaxRates;
}): string {
  // The property order is intentionally constructed here and never sourced
  // from user-provided objects. This gives exact HTTP retries one durable
  // logical-send key without conflating a changed price, recipient, or note.
  const intent = {
    version: 1,
    quoteId: input.quoteId,
    recipient: input.recipient.trim().toLowerCase(),
    customerName: input.customerName,
    subject: input.subject,
    note: input.note || "",
    lineItems: input.lineItems.map((item) => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      taxClass: item.taxClass,
    })),
    subtotalCents: input.subtotalCents,
    gstCents: input.gstCents,
    pstCents: input.pstCents,
    totalCents: input.totalCents,
    gstRate: input.rates.gstRate,
    pstRate: input.rates.pstRate,
  };
  return createHash("sha256").update(JSON.stringify(intent)).digest("hex");
}

// Subtotal + configured GST/PST, rounded the same way the modal preview and
// the email body compute it — so the Pay Now amount never drifts from the
// total the customer sees in the quote.
// GST applies to the full subtotal. PST excludes separately itemized design
// and rush services; printed goods and installation remain in the PST base.
export function computeQuoteTotals(lineItems: LineItem[], rates: QuoteTaxRates): {
  subtotal: number;
  gst: number;
  pst: number;
  grandTotal: number;
} {
  const lineTotal = (li: LineItem) => (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0);
  const subtotal = Math.round(lineItems.reduce((sum, li) => sum + lineTotal(li), 0) * 100) / 100;
  const gst = Math.round(subtotal * rates.gstRate * 100) / 100;
  const pstBase = lineItems
    .filter((li) => !["design_service", "rush_service"].includes(li.taxClass))
    .reduce((sum, li) => sum + lineTotal(li), 0);
  const pst = Math.round(pstBase * rates.pstRate * 100) / 100;
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

    // Pricing and the delivery claim commit before any customer email can
    // leave. Qualification is intentionally deferred until provider acceptance.
    const rates = await getQuoteTaxRates(supabase);
    const { subtotal, gst, pst, grandTotal } = computeQuoteTotals(lineItems, rates);
    const totalCents = Math.round(grandTotal * 100);
    const subtotalCents = Math.round(subtotal * 100);
    const gstCents = Math.round(gst * 100);
    const pstCents = Math.round(pst * 100);
    const shortId = id.slice(0, 8);
    const cloverDescription = `Quote #${shortId} — ${customerName}`.slice(0, 90);
    validateStructuredQuotePricing({
      quoteId: id,
      totalCents,
      subtotalCents,
      gstCents,
      pstCents,
      description: cloverDescription,
      lineItems,
    });
    const quoteSummary = lineItems
      .map((li) => `${li.description} × ${li.qty} @ $${parseFloat(li.unitPrice).toFixed(2)}`)
      .join(", ");
    const payLabel = grandTotal.toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    });
    const replyBody = `[Price quote sent · Pay Now ${payLabel}] ${quoteSummary}`;
    const requestFingerprint = buildQuoteSendFingerprint({
      quoteId: id,
      recipient: to,
      customerName,
      subject: emailSubject,
      note,
      lineItems,
      subtotalCents,
      gstCents,
      pstCents,
      totalCents,
      rates,
    });

    const { data: preparedData, error: prepareError } = await supabase.rpc(
      "prepare_structured_quote_send",
      {
        p_quote_id: id,
        p_total_cents: totalCents,
        p_subtotal_cents: subtotalCents,
        p_gst_cents: gstCents,
        p_pst_cents: pstCents,
        p_description: cloverDescription,
        p_line_items: lineItems,
        p_request_fingerprint: requestFingerprint,
        p_recipient: to,
        p_subject: emailSubject,
        p_reply_body: replyBody,
      },
    );
    if (prepareError) throw new Error(prepareError.message || "Could not prepare quote delivery");
    const delivery = singleRpcRow<PreparedQuoteSend>(
      preparedData,
      "Quote delivery preparation returned an invalid result",
    );
    if (
      typeof delivery.delivery_id !== "string" ||
      !Number.isSafeInteger(Number(delivery.quote_revision)) ||
      Number(delivery.quote_revision) <= 0 ||
      typeof delivery.delivery_created_at !== "string"
    ) {
      throw new Error("Quote delivery preparation returned an invalid result");
    }

    if (delivery.delivery_status === "delivery_failed") {
      return NextResponse.json(
        {
          error:
            "The provider accepted this quote but later reported delivery failure. Verify the customer address before sending a changed quote.",
        },
        { status: 409 },
      );
    }
    if (delivery.provider_message_id || delivery.delivery_status === "sent") {
      return NextResponse.json({
        ok: true,
        reused: true,
        deliveryId: delivery.delivery_id,
      });
    }
    if (delivery.delivery_status === "failed") {
      return NextResponse.json(
        { error: "This quote email was rejected. Change the quote or subject before trying again." },
        { status: 409 },
      );
    }
    const providerWindowAgeMs = delivery.provider_window_started_at
      ? Date.now() - Date.parse(delivery.provider_window_started_at)
      : Number.NaN;
    if (
      ["sending", "pending_confirmation"].includes(delivery.delivery_status) &&
      (
        !Number.isFinite(providerWindowAgeMs) ||
        providerWindowAgeMs > PROVIDER_IDEMPOTENCY_WINDOW_MS
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This quote delivery is too old to retry safely. Check Resend before sending a replacement.",
        },
        { status: 409 },
      );
    }

    let rendered: ArmedQuoteSend;
    if (delivery.pay_url && delivery.rendered_html && delivery.rendered_text) {
      if (!delivery.provider_window_started_at) {
        throw new Error("Rendered quote delivery has no provider idempotency window");
      }
      rendered = {
        delivery_status: delivery.delivery_status,
        provider_message_id: delivery.provider_message_id,
        pay_url: delivery.pay_url,
        rendered_html: delivery.rendered_html,
        rendered_text: delivery.rendered_text,
        provider_window_started_at: delivery.provider_window_started_at,
      };
    } else {
      // Materialize the exact signed token and rendered bodies once. A worker
      // crash or ambiguous provider timeout therefore retries byte-for-byte
      // with the same Resend idempotency key.
      const token = encodePaymentToken(grandTotal, cloverDescription, to, undefined, {
        quoteId: id,
        quoteRevision: Number(delivery.quote_revision),
      });
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca").replace(/\/$/, "");
      const payUrl = `${siteUrl}/pay/${encodeURIComponent(token)}`;
      const renderedHtml = buildQuoteHtml({
        customerName,
        lineItems,
        note,
        payUrl,
        payLabel,
        rates,
      });
      const renderedText = buildQuotePlainText({
        customerName,
        lineItems,
        note,
        payUrl,
        rates,
      });
      const { data: armedData, error: armError } = await supabase.rpc(
        "arm_structured_quote_send",
        {
          p_delivery_id: delivery.delivery_id,
          p_pay_url: payUrl,
          p_rendered_html: renderedHtml,
          p_rendered_text: renderedText,
        },
      );
      if (armError) throw new Error(armError.message || "Could not arm quote delivery");
      rendered = singleRpcRow<ArmedQuoteSend>(
        armedData,
        "Quote delivery arm returned an invalid result",
      );
      if (!rendered.provider_window_started_at) {
        throw new Error("Quote delivery arm returned no provider idempotency window");
      }
    }

    if (rendered.provider_message_id || rendered.delivery_status === "sent") {
      return NextResponse.json({
        ok: true,
        reused: true,
        deliveryId: delivery.delivery_id,
      });
    }

    let providerMessageId: string;
    try {
      const result = await sendEmail({
        to,
        subject: emailSubject,
        html: rendered.rendered_html,
        text: rendered.rendered_text,
        idempotencyKey: `quote-send/${delivery.delivery_id}`,
        tags: [{ name: "quote_send_id", value: delivery.delivery_id }],
      });
      providerMessageId = result.providerMessageId;
    } catch (sendError) {
      const outcome =
        sendError instanceof EmailSendError ? sendError.outcome : "unknown";
      try {
        const { error: failureError } = await supabase.rpc(
          "record_structured_quote_send_failure",
          {
            p_delivery_id: delivery.delivery_id,
            p_outcome: outcome,
            p_error: sanitizeError(sendError),
          },
        );
        if (failureError) {
          console.error("[staff/quotes/send-quote] failure ledger update:", failureError.message);
        }
      } catch (failureError) {
        console.error("[staff/quotes/send-quote] failure ledger update:", failureError);
      }
      console.error("[staff/quotes/send-quote] provider send failed:", sendError);
      return NextResponse.json(
        {
          error:
            outcome === "rejected"
              ? "The email provider rejected this quote. Review it and try again."
              : "Delivery confirmation is pending. Retry this exact quote within 23 hours; do not create a replacement.",
          outcome,
        },
        { status: 502 },
      );
    }

    const { data: completeData, error: completeError } = await supabase.rpc(
      "complete_structured_quote_send",
      {
        p_delivery_id: delivery.delivery_id,
        p_provider_message_id: providerMessageId,
      },
    );
    if (completeError) {
      throw new Error(completeError.message || "Could not finalize quote delivery");
    }
    const completion = singleRpcRow<{
      delivery_status: string;
      completion_created: boolean;
      qualification_created: boolean;
    }>(
      completeData,
      "Quote delivery completion returned an invalid result",
    );

    console.log(`[staff/quotes/send-quote] sent branded quote to ${to} for quote ${id}`);

    if (completion.completion_created) {
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
          quote_revision: Number(delivery.quote_revision),
          delivery_id: delivery.delivery_id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      deliveryId: delivery.delivery_id,
      providerMessageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send quote";
    console.error("[staff/quotes/send-quote]", message);
    const immutable = /PAID_QUOTE_IMMUTABLE/.test(message);
    const checkoutOpened = /QUOTE_CHECKOUT_ALREADY_OPENED/.test(message);
    const sendInFlight = /QUOTE_SEND_IN_FLIGHT/.test(message);
    return NextResponse.json(
      {
        error: immutable
          ? "Paid quotes cannot be repriced"
          : checkoutOpened
            ? "This quote already has an open checkout and cannot be repriced. Contact the customer before replacing it."
            : sendInFlight
              ? "Another version of this quote is awaiting delivery confirmation. Retry that version or check Resend before replacing it."
              : sanitizeError(err),
      },
      { status: immutable || checkoutOpened || sendInFlight ? 409 : 500 },
    );
  }
}

/**
 * Staff-only delivery visibility for reconciliation. The customer-facing quote
 * API never exposes this ledger.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid quote id" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("quote_send_deliveries")
      .select(
        "id,quote_revision,recipient,subject,status,provider_window_started_at,provider_message_id,last_error,sent_at,resolution,resolved_at,resolved_by,created_at,updated_at",
      )
      .eq("quote_id", id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json({ deliveries: data ?? [] });
  } catch (err) {
    console.error("[staff/quotes/send-quote/get]", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

/**
 * Staff-only manual resolution after checking Resend:
 * - confirm_sent requires the provider message id and finalizes qualification.
 * - confirm_not_sent is accepted only after the safe retry window has elapsed.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const staffCheck = await requireStaffUser();
  if (staffCheck instanceof NextResponse) return staffCheck;

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      deliveryId?: unknown;
      resolution?: unknown;
      providerMessageId?: unknown;
    };
    const deliveryId =
      typeof body.deliveryId === "string" ? body.deliveryId : "";
    const resolution =
      body.resolution === "confirm_sent" || body.resolution === "confirm_not_sent"
        ? body.resolution
        : "";
    const providerMessageId =
      typeof body.providerMessageId === "string"
        ? body.providerMessageId.trim()
        : "";

    if (
      !UUID_RE.test(id) ||
      !UUID_RE.test(deliveryId) ||
      !resolution ||
      (resolution === "confirm_sent" && !providerMessageId)
    ) {
      return NextResponse.json(
        { error: "A valid delivery and resolution are required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc(
      "resolve_stale_structured_quote_send",
      {
        p_quote_id: id,
        p_delivery_id: deliveryId,
        p_resolution: resolution,
        p_provider_message_id: providerMessageId || null,
        p_actor: staffCheck.email ?? staffCheck.id ?? "staff",
      },
    );
    if (error) throw new Error(error.message || "Could not resolve quote delivery");
    const resolved = singleRpcRow<{
      delivery_status: string;
      qualification_created: boolean;
    }>(data, "Quote delivery resolution returned an invalid result");

    void recordAuditEvent({
      actor_type: "staff",
      actor_id: staffCheck.email ?? "staff",
      event_type: "quote.delivery_resolved",
      entity_type: "quote",
      entity_id: id,
      detail: {
        delivery_id: deliveryId,
        resolution,
        delivery_status: resolved.delivery_status,
        qualification_created: resolved.qualification_created,
      },
    });

    return NextResponse.json({
      ok: true,
      deliveryId,
      status: resolved.delivery_status,
      qualificationCreated: resolved.qualification_created,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    console.error("[staff/quotes/send-quote/resolve]", message);
    const notStale = /QUOTE_SEND_RESOLUTION_NOT_STALE/.test(message);
    const notFound = /QUOTE_SEND_NOT_FOUND/.test(message);
    const invalid = /QUOTE_SEND_INVALID_RESOLUTION/.test(message);
    return NextResponse.json(
      {
        error: notStale
          ? "This delivery is still inside its safe retry window. Retry the exact quote or wait before resolving it."
          : notFound
            ? "Quote delivery not found"
            : invalid
              ? "This delivery cannot be resolved in its current state"
              : sanitizeError(err),
      },
      { status: notFound ? 404 : notStale ? 409 : invalid ? 400 : 500 },
    );
  }
}
