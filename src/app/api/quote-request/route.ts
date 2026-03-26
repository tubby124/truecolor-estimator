/**
 * POST /api/quote-request
 *
 * Sends a multi-item custom quote request email to info@true-color.ca
 * and a confirmation to the customer.
 *
 * Accepts: multipart/form-data
 * Fields:
 *   name, email, phone
 *   items: JSON array of { product, qty, material, dimensions, sides, notes }
 *   file_0, file_1, ... : optional artwork per item (4 MB max each)
 *
 * Note: This route replaced the original single-item JSON route (2026-03-10).
 * The original sent JSON with base64 file but the API expected formData — file
 * uploads were silently broken. This version fixes that and adds multi-item support.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/postscript", // AI / EPS
];
const ALLOWED_EXTENSIONS = /\.(pdf|ai|eps|jpg|jpeg|png|webp)$/i;

interface ItemMeta {
  product: string;
  qty: string;
  material: string;
  dimensions: string;
  sides: string;
  notes: string;
}

/** Escape HTML special characters to prevent injection in email templates */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  // Rate limit: 3 quote requests per IP per minute
  const ip = getClientIp(req);
  if (!rateLimit(`quote:${ip}`, 3, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const form = await req.formData();

    // Cloudflare Turnstile validation (when secret key is configured)
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const turnstileToken = (form.get("cf-turnstile-response") as string) ?? "";
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "Bot check failed. Please refresh and try again." },
          { status: 400 }
        );
      }
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: turnstileSecret, response: turnstileToken }),
      });
      const verifyData = (await verifyRes.json()) as { success: boolean };
      if (!verifyData.success) {
        return NextResponse.json(
          { error: "Bot check failed. Please refresh and try again." },
          { status: 400 }
        );
      }
    }

    const name = ((form.get("name") as string) ?? "").trim();
    const email = ((form.get("email") as string) ?? "").trim();
    const phone = ((form.get("phone") as string) ?? "").trim() || undefined;
    const itemsRaw = (form.get("items") as string) ?? "[]";

    // Contact validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name is too long (max 100 characters)" },
        { status: 400 }
      );
    }
    if (email.length > 254) {
      return NextResponse.json(
        { error: "Email address is too long" },
        { status: 400 }
      );
    }
    if ((phone ?? "").length > 20) {
      return NextResponse.json(
        { error: "Phone number is too long" },
        { status: 400 }
      );
    }

    // Parse items
    let items: ItemMeta[];
    try {
      items = JSON.parse(itemsRaw) as ItemMeta[];
    } catch {
      return NextResponse.json({ error: "Invalid items data" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }
    if (items.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 items per request" },
        { status: 400 }
      );
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.qty?.trim()) {
        return NextResponse.json(
          { error: `Item ${i + 1}: quantity is required` },
          { status: 400 }
        );
      }
      if (item.qty.length > 20) {
        return NextResponse.json(
          { error: `Item ${i + 1}: quantity value is too long` },
          { status: 400 }
        );
      }
      if ((item.material ?? "").length > 200) {
        return NextResponse.json(
          {
            error: `Item ${i + 1}: material description is too long (max 200 characters)`,
          },
          { status: 400 }
        );
      }
      if ((item.dimensions ?? "").length > 100) {
        return NextResponse.json(
          { error: `Item ${i + 1}: dimensions field is too long` },
          { status: 400 }
        );
      }
      if ((item.notes ?? "").length > 500) {
        return NextResponse.json(
          { error: `Item ${i + 1}: notes are too long (max 500 characters)` },
          { status: 400 }
        );
      }
    }

    // Upload files per item (non-fatal per item — we continue even if one upload fails)
    const fileLinks: Array<string | null> = [];
    const supabase = createServiceClient();

    for (let i = 0; i < items.length; i++) {
      const file = form.get(`file_${i}`) as File | null;

      if (!file || file.size === 0) {
        fileLinks.push(null);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `Item ${i + 1}: file too large — max 4 MB (received ${(
              file.size /
              1024 /
              1024
            ).toFixed(1)} MB)`,
          },
          { status: 400 }
        );
      }

      const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
      const isAllowedExt = ALLOWED_EXTENSIONS.test(file.name);
      if (!isAllowedMime && !isAllowedExt) {
        return NextResponse.json(
          {
            error: `Item ${
              i + 1
            }: file type not allowed — use PDF, AI, EPS, JPG, PNG, or WebP`,
          },
          { status: 400 }
        );
      }

      try {
        const uuid = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `quote-requests/${uuid}/${safeName}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("print-files")
          .upload(path, bytes, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error(
            `[quote-request] item ${i} upload failed:`,
            uploadError.message
          );
          fileLinks.push(null);
        } else {
          const { data: signed } = await supabase.storage
            .from("print-files")
            .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
          fileLinks.push(signed?.signedUrl ?? null);
        }
      } catch (storageErr) {
        console.error(`[quote-request] item ${i} storage error:`, storageErr);
        fileLinks.push(null);
      }
    }

    // Save to DB before sending emails (non-fatal — email continues even if DB fails)
    try {
      await supabase
        .from("quote_requests")
        .insert({
          name,
          email,
          phone: phone ?? null,
          items,
          file_links: fileLinks.filter(Boolean),
          raw_ip: ip ?? null,
        });
    } catch (dbErr) {
      console.error("[quote-request] DB save failed:", dbErr);
    }

    // Upsert customer record — create if new, skip if already exists
    try {
      await supabase
        .from("customers")
        .upsert(
          { email, name, phone: phone ?? null },
          { onConflict: "email", ignoreDuplicates: true }
        );
    } catch (customerErr) {
      console.error("[quote-request] customer upsert failed:", customerErr);
    }

    // Staff notification uses outreach sender to avoid Brevo loop-detection block
    // (FROM info@true-color.ca → TO info@true-color.ca was being silently dropped)
    const staffFrom =
      process.env.QUOTE_FROM_EMAIL ??
      "True Color Display Printing <hello@outreach.true-color.ca>";
    const from =
      process.env.SMTP_FROM ?? "True Color Display Printing <info@true-color.ca>";
    const isMulti = items.length > 1;

    const subject = isMulti
      ? `Multi-Item Quote (${items.length} items) — ${name}`
      : `Quote Request — ${items[0].product} — ${name}`;

    // Build per-item HTML sections for the staff notification email
    const itemSections = items
      .map((item, i) => {
        const fileLink = fileLinks[i];
        const sidesLabel = item.sides === "2" ? "Double-sided" : "Single-sided";
        const rowStyle = "padding: 5px 0; font-size: 13px;";
        const labelStyle = "color: #6b7280; width: 130px;";
        const valueStyle = "color: #111827;";

        return `
        <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p style="font-weight: 700; font-size: 14px; color: #1c1712; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
            Item ${i + 1}: ${esc(item.product)}
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="${rowStyle}">
              <td style="${labelStyle}">Quantity</td>
              <td style="${valueStyle} font-weight: 600;">${esc(item.qty)}</td>
            </tr>
            <tr style="${rowStyle}">
              <td style="${labelStyle}">Material / Stock</td>
              <td style="${valueStyle}">${
          item.material
            ? esc(item.material)
            : "<em style='color:#9ca3af'>Not specified</em>"
        }</td>
            </tr>
            ${
              item.dimensions
                ? `<tr style="${rowStyle}">
              <td style="${labelStyle}">Dimensions</td>
              <td style="${valueStyle}">${esc(item.dimensions)}</td>
            </tr>`
                : ""
            }
            <tr style="${rowStyle}">
              <td style="${labelStyle}">Sides</td>
              <td style="${valueStyle}">${sidesLabel}</td>
            </tr>
            ${
              item.notes
                ? `<tr style="${rowStyle}">
              <td style="${labelStyle} vertical-align: top;">Notes</td>
              <td style="${valueStyle} white-space: pre-wrap;">${esc(item.notes)}</td>
            </tr>`
                : ""
            }
          </table>
          ${
            fileLink
              ? `<p style="margin: 10px 0 0; font-size: 13px;"><a href="${fileLink}" style="color: #16C2F3; font-weight: 600;">Download artwork →</a></p>`
              : ""
          }
        </div>`;
      })
      .join("");

    const staffHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background-color: #1c1712; padding: 20px 30px;">
          <h1 style="color: #16C2F3; font-size: 20px; margin: 0;">
            ${
              isMulti
                ? `New Multi-Item Quote Request (${items.length} items)`
                : "New Quote Request"
            }
          </h1>
        </div>
        <div style="padding: 24px 30px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #1c1712; width: 80px; font-size: 13px;">From</td>
              <td style="padding: 6px 0; font-size: 13px;">${esc(name)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #1c1712; font-size: 13px;">Email</td>
              <td style="padding: 6px 0; font-size: 13px;">
                <a href="mailto:${esc(email)}" style="color: #16C2F3;">${esc(email)}</a>
              </td>
            </tr>
            ${
              phone
                ? `<tr>
              <td style="padding: 6px 0; font-weight: bold; color: #1c1712; font-size: 13px;">Phone</td>
              <td style="padding: 6px 0; font-size: 13px;">${esc(phone)}</td>
            </tr>`
                : ""
            }
          </table>

          <p style="font-weight: 700; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
            ${isMulti ? `Items (${items.length})` : "Item Details"}
          </p>
          ${itemSections}
        </div>
        <div style="background: #f4efe9; padding: 16px 30px; font-size: 12px; color: #888;">
          Reply directly to this email to respond to ${esc(name)}.
        </div>
      </div>
    `;

    // Send staff notification
    const staffRecipients = [
      process.env.STAFF_EMAIL ?? "info@true-color.ca",
      process.env.STAFF_EMAIL_CC,
      process.env.STAFF_EMAIL_BCC,
    ].filter(Boolean) as string[];

    await sendEmail({
      from: staffFrom,
      to: staffRecipients,
      replyTo: email,
      subject,
      html: staffHtml,
    });

    // Customer confirmation — summarize submitted items so they can verify their request
    const itemCountText =
      items.length > 1
        ? `your ${items.length}-item quote request`
        : "your quote request";

    const confirmItemRows = items
      .map((item, i) => {
        const label = items.length > 1 ? `Item ${i + 1}: ` : "";
        const details = [
          item.qty ? `Qty: ${esc(item.qty)}` : null,
          item.material ? `Material: ${esc(item.material)}` : null,
          item.dimensions ? `Size: ${esc(item.dimensions)}` : null,
          item.sides ? `Sides: ${item.sides === "2" ? "Double-sided" : "Single-sided"}` : null,
          item.notes ? `Notes: ${esc(item.notes)}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #1c1712; vertical-align: top;">
              <strong>${label}${item.product ? esc(item.product) : "Print product"}</strong>
              ${details ? `<br><span style="color: #6b7280;">${details}</span>` : ""}
            </td>
          </tr>`;
      })
      .join("");

    await sendEmail({
      from,
      to: email,
      subject: "Got your quote request — True Color Display Printing",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1c1712; padding: 20px 30px;">
            <p style="color: #16C2F3; font-size: 18px; font-weight: bold; margin: 0;">
              True Color Display Printing
            </p>
          </div>
          <div style="padding: 24px 30px; background: #fff;">
            <p style="font-size: 16px; color: #1c1712;">Hi ${esc(name)},</p>
            <p style="color: #444;">
              Got it! We received ${itemCountText} and will get back to you within 1 business day.
            </p>

            <p style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 8px;">
              What you submitted
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              ${confirmItemRows}
            </table>

            <p style="color: #444; margin-top: 20px;">
              Questions? Call us at
              <a href="tel:+13069548688" style="color: #16C2F3;">(306) 954-8688</a>
              or visit us at 216 33rd St W, Saskatoon.
            </p>

            <div style="background: #f4efe9; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
              <p style="color: #1c1712; font-size: 13px; font-weight: 700; margin: 0 0 4px;">
                Order faster next time
              </p>
              <p style="color: #555; font-size: 13px; margin: 0;">
                Create a free account at
                <a href="https://truecolorprinting.ca/account" style="color: #16C2F3;">truecolorprinting.ca/account</a>
                to track your orders, reorder past jobs, and get quoted faster.
              </p>
            </div>

            <p style="color: #444; margin-top: 16px;">— The True Color Team</p>
          </div>
          <div style="background: #f4efe9; padding: 14px 30px; font-size: 12px; color: #888;">
            truecolorprinting.ca · 216 33rd St W, Saskatoon · (306) 954-8688
          </div>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send";
    console.error("[quote-request]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
