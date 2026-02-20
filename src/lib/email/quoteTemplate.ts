import type { EstimateResponse } from "@/lib/engine/types";
import { logoAbsoluteUrl } from "@/lib/config";

export interface QuoteEmailData {
  customerName?: string;
  customerEmail: string;
  note?: string;
  quoteData: EstimateResponse;
  jobDetails: {
    category: string;
    categoryLabel: string;
    widthIn?: number;
    heightIn?: number;
    qty: number;
    sides?: 1 | 2;
    materialName?: string;
    isRush: boolean;
  };
  siteUrl: string;
}

export function buildQuoteEmailHtml(data: QuoteEmailData): string {
  const { customerName, note, quoteData, jobDetails, siteUrl } = data;
  const sellPrice = quoteData.sell_price ?? 0;
  const gst = Math.round(sellPrice * 0.05 * 100) / 100;
  const total = Math.round((sellPrice + gst) * 100) / 100;

  const greeting = customerName ? `Hi ${customerName},` : "Hello,";
  const logoUrl = logoAbsoluteUrl(siteUrl);

  // Dimensions row (only for sqft products)
  const hasDimensions = jobDetails.widthIn && jobDetails.heightIn;
  const widthFt = hasDimensions ? (jobDetails.widthIn! / 12).toFixed(2) : null;
  const heightFt = hasDimensions ? (jobDetails.heightIn! / 12).toFixed(2) : null;
  const sqft = hasDimensions
    ? ((jobDetails.widthIn! / 12) * (jobDetails.heightIn! / 12)).toFixed(2)
    : null;

  // Build line items rows
  const lineItemRows = quoteData.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; line-height: 1.5;">
          ${escHtml(item.description)}
        </td>
        <td style="padding: 12px 16px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6; white-space: nowrap; font-variant-numeric: tabular-nums;">
          $${item.line_total.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  // Job detail pills
  const detailItems: string[] = [
    jobDetails.categoryLabel,
    hasDimensions ? `${widthFt} × ${heightFt} ft (${sqft} sq ft)` : "",
    jobDetails.qty > 1 ? `Qty: ${jobDetails.qty}` : "",
    jobDetails.sides === 2 ? "Double-sided" : "",
    jobDetails.materialName || "",
    jobDetails.isRush ? "⚡ Rush order" : "",
  ].filter(Boolean);

  const detailPills = detailItems
    .map(
      (d) =>
        `<span style="display: inline-block; background: #f3f4f6; color: #374151; font-size: 12px; padding: 4px 10px; border-radius: 999px; margin: 3px 3px 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(d)}</span>`
    )
    .join("");

  const rushBanner = jobDetails.isRush
    ? `<tr>
        <td colspan="2" style="padding: 10px 16px; background: #fffbeb; border-top: 1px solid #fde68a; border-bottom: 1px solid #fde68a;">
          <p style="margin: 0; font-size: 12px; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            ⚡ <strong>Rush order</strong> — priority turnaround included
          </p>
        </td>
      </tr>`
    : "";

  const noteBlock = note
    ? `<div style="background: #f9fafb; border-left: 3px solid #e52222; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 28px;">
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${escHtml(note)}</p>
      </div>`
    : "";

  const sqftLine =
    quoteData.sqft_calculated && quoteData.price_per_sqft
      ? `<tr>
          <td style="padding: 6px 16px 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;" colspan="2">
            ${quoteData.sqft_calculated.toFixed(2)} sq ft × $${quoteData.price_per_sqft.toFixed(2)}/sq ft
          </td>
        </tr>`
      : "";

  const minChargeNote = quoteData.min_charge_applied
    ? `<tr>
        <td colspan="2" style="padding: 4px 16px 8px; font-size: 12px; color: #d97706; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Minimum order charge applied
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Quote from True Color Display Printing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">

          <!-- HEADER -->
          <tr>
            <td style="background: #e52222; border-radius: 12px 12px 0 0; padding: 28px 32px; text-align: center;">
              <img src="${logoUrl}" alt="True Color Display Printing" width="200" style="display: block; margin: 0 auto; max-width: 200px; height: auto; border: 0;" />
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background: #ffffff; padding: 32px 32px 24px;">

              <!-- Greeting -->
              <p style="margin: 0 0 6px; font-size: 18px; font-weight: 600; color: #111827;">${greeting}</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Thanks for reaching out! Here is your quote from True Color Display Printing.
              </p>

              <!-- Note from staff (if any) -->
              ${noteBlock}

              <!-- Job details -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em;">Job Details</p>
                <div>${detailPills}</div>
              </div>

              <!-- Quote table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 28px;">

                <!-- Column header -->
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; border-bottom: 1px solid #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Description</th>
                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; text-align: right; border-bottom: 1px solid #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  ${rushBanner}
                  ${lineItemRows}
                  ${sqftLine}
                  ${minChargeNote}

                  <!-- Subtotal -->
                  <tr style="background: #fafafa;">
                    <td style="padding: 10px 16px; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Subtotal</td>
                    <td style="padding: 10px 16px; font-size: 13px; color: #374151; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${sellPrice.toFixed(2)}</td>
                  </tr>

                  <!-- GST -->
                  <tr style="background: #fafafa;">
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">GST (5%)</td>
                    <td style="padding: 4px 16px 10px; font-size: 13px; color: #374151; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">$${gst.toFixed(2)}</td>
                  </tr>

                  <!-- TOTAL -->
                  <tr style="background: #e52222;">
                    <td style="padding: 16px; font-size: 15px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      Total (CAD)
                    </td>
                    <td style="padding: 16px; font-size: 20px; font-weight: 700; color: #ffffff; text-align: right; font-variant-numeric: tabular-nums; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      $${total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Validity -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #166534; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  ✓ &nbsp;This quote is valid for <strong>30 days</strong> from today. Prices are in Canadian dollars and include GST.
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin-bottom: 8px;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Ready to proceed? Reply to this email or give us a call — we&apos;ll get your order started right away.
                </p>
                <a href="mailto:info@true-color.ca"
                  style="display: inline-block; background: #e52222; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Reply to Approve →
                </a>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #1f2937; border-radius: 0 0 12px 12px; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                True Color Display Printing
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                Saskatoon, Saskatchewan · Canada
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <a href="mailto:info@true-color.ca" style="color: #f87171; text-decoration: none;">info@true-color.ca</a>
                &nbsp;·&nbsp;
                <a href="https://truecolorprinting.ca" style="color: #f87171; text-decoration: none;">truecolorprinting.ca</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                All prices in CAD · Pricing v1_2026-02-19
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
